#!/usr/bin/env python3
"""Translate en-US MDX to target locale (whole-file chunks)."""
from __future__ import annotations

import html
import re
import sys
import time
from pathlib import Path

import translators as ts

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "en-US"

BACKENDS = ("yandex", "caiyun", "reverso", "alibaba")


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
        return f"\n__P{len(store)-1}__\n"

    text = re.sub(r"```[\s\S]*?```", repl, text)
    text = re.sub(r"`[^`\n]+`", repl, text)
    text = re.sub(
        r"<(?:Frame|Update|Card)[^>]*>[\s\S]*?</(?:Frame|Update|Card)>|<(?:Frame|Update|img|Card)[^>]*/>",
        repl,
        text,
    )
    return text, store


def restore(text: str, store: list[str]) -> str:
    for i, block in enumerate(store):
        text = text.replace(f"\n__P{i}__\n", block)
    return text


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
        body_p, store = protect(body)
        try:
            fm_t = translate_frontmatter(fm, lang).strip()
            body_t = restore(translate_text(lang, body_p), store)
        except Exception as e:
            print(f"fail {src.name}: {e}", file=sys.stderr)
            fm_t, body_t = fm, body
        body_t = body_t.replace("/en-US/", f"/{dest_name}/")
        out = f"---\n{fm_t}\n---\n{body_t}"
        (dest / src.name).write_text(out, encoding="utf-8")
        print(src.name, flush=True)
        time.sleep(0.4)


if __name__ == "__main__":
    main()
