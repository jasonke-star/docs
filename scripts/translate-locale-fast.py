#!/usr/bin/env python3
"""Translate en-US MDX to target locale (whole-file chunks)."""
from __future__ import annotations

import html
import os
import re
import sys
import time
from pathlib import Path

os.environ.setdefault("translators_default_region", "EN")

import translators as ts

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "en-US"

BACKENDS = ("yandex", "caiyun", "reverso", "alibaba")

# HTML comments survive machine translation.
def _ph(i: int) -> str:
    return f"ZZQ920{i}ZZQ"


STEPS_OPEN = "ZZQ9001ZZQ"
STEPS_CLOSE = "ZZQ9002ZZQ"
STEP_CLOSE = "ZZQ9003ZZQ"


def split_frontmatter(text: str):
    if not text.startswith("---"):
        return None, text
    parts = text.split("---", 2)
    if len(parts) < 3:
        return None, text
    return parts[1], parts[2]


def protect(text: str) -> tuple[str, list[str]]:
    store: list[str] = []

    def repl(m: re.Match) -> str:
        store.append(m.group(0))
        return _ph(len(store) - 1)

    # Order matters: inner structures before outer wrappers.
    text = re.sub(r"```[\s\S]*?```", repl, text)
    text = re.sub(r"`[^`\n]+`", repl, text)
    text = re.sub(r"<Frame[^>]*>[\s\S]*?</Frame>", repl, text)
    text = re.sub(r"<(?:Tip|Warning|Card)[^>]*>[\s\S]*?</(?:Tip|Warning|Card)>", repl, text)
    text = re.sub(r"<(?:img|Card)[^>]*/>", repl, text)
    text = re.sub(r"<Update[^>]*>[\s\S]*?</Update>", repl, text)
    text = re.sub(r"<AccordionGroup>[\s\S]*?</AccordionGroup>", repl, text)
    return text, store


def extract_steps_sections(body: str) -> tuple[str, list[str]]:
    blocks: list[str] = []

    def repl(m: re.Match) -> str:
        blocks.append(m.group(0))
        return f"ZZQ930{len(blocks) - 1}ZZQ"

    body = re.sub(r"<Steps>[\s\S]*?</Steps>", repl, body)
    return body, blocks


def translate_steps_section(block: str, lang: str, dest_name: str) -> str:
    """Translate Steps blocks line-by-line so JSX tags stay intact."""
    block = block.replace("/en-US/", f"/{dest_name}/")

    def title_repl(m: re.Match) -> str:
        title_t = translate_text(lang, m.group(1))
        return f'<Step title="{title_t}">'

    block = re.sub(r'<Step title="([^"]*)">', title_repl, block)

    out_lines: list[str] = []
    in_fence = False
    for line in block.splitlines():
        stripped = line.strip()
        if stripped.startswith("```"):
            in_fence = not in_fence
            out_lines.append(line)
            continue
        if (
            in_fence
            or not stripped
            or stripped.startswith("<")
            or stripped.startswith("|")
        ):
            out_lines.append(line)
            continue
        out_lines.append(translate_text(lang, line))
    return fix_mdx_component_tags("\n".join(out_lines))


def restore(text: str, store: list[str]) -> str:
    for i, block in enumerate(store):
        text = text.replace(_ph(i), block)
        # Legacy placeholders from older runs
        text = text.replace(f"\n__P{i}__\n", block)
        text = text.replace(f"__P{i}__", block)

    def pgp_repl(m: re.Match) -> str:
        idx = int(m.group(1))
        return store[idx] if idx < len(store) else m.group(0)

    text = re.sub(r"<!--\s*PGP\s*(\d+)\s*-->", pgp_repl, text)
    return text


def restore_steps_markers(body: str, steps_blocks: list[str]) -> str:
    for i, block in enumerate(steps_blocks):
        marker = f"<!--PGSB{i:03d}-->"

        def repl(_: re.Match) -> str:
            return block

        body = re.sub(rf"<!--\s*PGSB\s*{i}\s*-->", repl, body, count=1)
        body = body.replace(marker, block)
    return body


def _translate_chunk(text: str, lang: str) -> str:
    text = text.strip()
    if not text:
        return text
    last_err: Exception | None = None
    for backend in BACKENDS:
        for attempt in range(4):
            try:
                out = ts.translate_text(
                    text,
                    translator=backend,
                    from_language="en",
                    to_language=lang,
                )
                if not out:
                    raise RuntimeError(f"{backend} returned empty")
                return html.unescape(str(out))
            except Exception as e:
                last_err = e
                time.sleep(min(2**attempt, 12))
        time.sleep(0.5)
    raise last_err or RuntimeError("translation failed")


def translate_step_titles(body: str, lang: str) -> str:
    def repl(m: re.Match) -> str:
        title_t = translate_text(lang, m.group(1))
        return f'<Step title="{title_t}">'

    return re.sub(r'<Step title="([^"]*)">', repl, body)


def translate_frontmatter(fm: str, lang: str) -> str:
    out: list[str] = []
    for line in fm.split("\n"):
        m = re.match(r'^(title|description):\s*"(.*)"\s*$', line.strip())
        if m:
            key, val = m.group(1), m.group(2)
            val_t = translate_text(lang, val)
            out.append(f'{key}: "{val_t}"')
        else:
            out.append(line)
    return "\n".join(out)


def translate_text(lang: str, text: str) -> str:
    text = text.strip()
    if not text:
        return text
    chunk = 4500
    if len(text) <= chunk:
        return _translate_chunk(text, lang)
    out = []
    for i in range(0, len(text), chunk):
        out.append(_translate_chunk(text[i : i + chunk], lang))
        time.sleep(0.35)
    return "".join(out)


def translate_one_update_block(block: str, lang: str) -> str:
    inner_store: list[str] = []

    def inner_repl(im: re.Match) -> str:
        inner_store.append(im.group(0))
        return f"ZZQ940{len(inner_store) - 1}ZZQ"

    tmp = re.sub(r"<Frame[^>]*>[\s\S]*?</Frame>", inner_repl, block)
    desc = re.search(r'(description=")([^"]*)(")', tmp)
    if desc:
        desc_t = translate_text(lang, desc.group(2))
        tmp = tmp[: desc.start(2)] + desc_t + tmp[desc.end(2) :]
    open_m = re.match(r"(<Update[^>]*>)([\s\S]*)(</Update>)", tmp)
    if not open_m:
        return block
    head, mid, tail = open_m.group(1), open_m.group(2), open_m.group(3)
    mid_t = translate_text(lang, mid.strip()) if mid.strip() else mid
    out = head + mid_t + tail
    for i, frag in enumerate(inner_store):
            out = out.replace(f"ZZQ940{i}ZZQ", frag)
    return out


def translate_changelog(body: str, lang: str, dest_name: str) -> str:
    """Rebuild from EN structure; translate 2026 entries (Tier 1), keep older EN."""
    body = body.replace("/en-US/", f"/{dest_name}/")
    # Tier 1–2: Sep–Oct 2026 release notes; older blocks stay EN with locale link prefixes.
    pattern = re.compile(
        r'(<Update label="2026-(?:09|10)-[^"]*"[\s\S]*?</Update>)'
    )

    def repl(m: re.Match) -> str:
        return translate_one_update_block(m.group(1), lang)

    return pattern.sub(repl, body)


def has_broken_placeholders(text: str) -> bool:
    return bool(
        re.search(
            r"__P\d+__|<!--PGP\d+-->|<![-]-PGU\d+-+->|XPGPH|XPGSTEPS|⟦PG",
            text,
        )
    )


def fix_mdx_component_tags(text: str) -> str:
    """Restore Mintlify JSX tag names if the MT engine translated them."""
    replacements = [
        (r"</更新>", "</Update>"),
        (r"<更新\b", "<Update"),
        (r"</Schritt>", "</Step>"),
        (r"<Schritt\b", "<Step"),
        (r"</Schritte>", "</Steps>"),
        (r"<Schritte\b", "<Steps"),
        (r"⟦FOLGENDERMAßEN⟧", "<Steps>"),
        (r"⟦/SCHRITT⟧", "</Step>"),
        (r"<Folgendermaßen>", "<Steps>"),
        (r"</Folgendermaßen>", "</Steps>"),
        (r"</Étape>", "</Step>"),
        (r"<Étape\b", "<Step"),
        (r"</Pas>", "</Step>"),
        (r"<Pas\b", "<Step"),
        (r"</ステップ>", "</Step>"),
        (r"<ステップ\b", "<Step"),
        (r"</단계>", "</Step>"),
        (r"<단계\b", "<Step"),
        (r"<Tipp\b", "<Tip"),
        (r"</Tipp>", "</Tip>"),
        (r"<Warnung\b", "<Warning>"),
        (r"</Warnung>", "</Warning>"),
        (r"<Consejo\b", "<Tip"),
        (r"<Avertissement\b", "<Warning>"),
        (r"<\s*Infos\s*>", "<Info>"),
        (r"<\s*/\s*Infos\s*>", "</Info>"),
        (r"<\s*INFO\s*>", "<Info>"),
        (r"<\s*/\s*INFO\s*>", "</Info>"),
        (r"<情報>", "<Info>"),
        (r"</情報>", "</Info>"),
        (r"<정보>", "<Info>"),
        (r"</정보>", "</Info>"),
    ]
    for pat, rep in replacements:
        text = re.sub(pat, rep, text, flags=re.IGNORECASE)
    text = re.sub(
        r"^(Numéro de pièce|Modèle:|Modelo:)\s*(<)",
        r"\2",
        text,
        flags=re.MULTILINE,
    )
    text = re.sub(r"\bMODELL:\s*(<Frame\b)", r"\1", text, flags=re.IGNORECASE)
    return text


def main() -> None:
    dest_name, lang = sys.argv[1], sys.argv[2]
    only = sys.argv[3] if len(sys.argv) > 3 else None
    dest = ROOT / dest_name
    dest.mkdir(parents=True, exist_ok=True)

    files = sorted(SRC.glob("*.mdx"))
    if only:
        files = [SRC / only]

    for src in files:
        raw = src.read_text(encoding="utf-8")
        fm, body = split_frontmatter(raw)
        if fm is None:
            (dest / src.name).write_text(
                raw.replace("/en-US/", f"/{dest_name}/"), encoding="utf-8"
            )
            print(src.name)
            continue
        try:
            fm_t = translate_frontmatter(fm, lang).strip()
            if src.name == "changelog.mdx":
                body_t = translate_changelog(body, lang, dest_name)
            else:
                body, steps_blocks = extract_steps_sections(body)
                body_p, store = protect(body)
                body_t = restore(translate_text(lang, body_p), store)
                for i, sb in enumerate(steps_blocks):
                    translated = translate_steps_section(sb, lang, dest_name)
                    body_t, n = re.subn(
                        rf"ZZQ930{i}ZZQ",
                        lambda _m, t=translated: t,
                        body_t,
                        count=1,
                    )
                    if n == 0:
                        pat = rf"<!--[^>]*PGSB[^0-9]*0*{i}[^>]*-->"
                        body_t, _ = re.subn(
                            pat, lambda _m, t=translated: t, body_t, count=1
                        )
                if has_broken_placeholders(body_t):
                    raise RuntimeError("placeholders remain after restore")
        except Exception as e:
            print(f"fail {src.name}: {e}", file=sys.stderr)
            fm_t, body_t = fm, body
        body_t = body_t.replace("/en-US/", f"/{dest_name}/")
        body_t = fix_mdx_component_tags(body_t)
        out = f"---\n{fm_t}\n---\n{body_t}"
        (dest / src.name).write_text(out, encoding="utf-8")
        print(src.name, flush=True)
        time.sleep(0.4)


if __name__ == "__main__":
    main()
