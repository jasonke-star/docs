#!/usr/bin/env python3
"""
Machine-translate en-US MDX into a target locale directory.
Preserves YAML frontmatter keys; translates title/description and body.
Skips code fences and inline code. Rewrites /en-US/ links to target prefix.

  python3 scripts/translate-locale.py de-DE de
  python3 scripts/translate-locale.py fr-FR fr
  python3 scripts/translate-locale.py es-MX es
  python3 scripts/translate-locale.py ja-JP ja
  python3 scripts/translate-locale.py ko-KR ko

Requires: pip install deep-translator
"""
from __future__ import annotations

import re
import sys
import time
from pathlib import Path

from deep_translator import GoogleTranslator

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "en-US"


def split_frontmatter(text: str) -> tuple[str | None, str]:
    if not text.startswith("---"):
        return None, text
    parts = text.split("---", 2)
    if len(parts) < 3:
        return None, text
    return parts[1], parts[2]


def translate_chunk(translator: GoogleTranslator, s: str) -> str:
    s = s.strip()
    if not s or s.startswith("http") or s.startswith("/") or s.startswith("{"):
        return s
    if len(s) > 4500:
        out = []
        for i in range(0, len(s), 4500):
            out.append(translator.translate(s[i : i + 4500]))
            time.sleep(0.15)
        return "".join(out)
    return translator.translate(s)


def protect_code(text: str) -> tuple[str, list[str]]:
    store: list[str] = []

    def repl(m: re.Match) -> str:
        store.append(m.group(0))
        return f"__CODEBLOCK_{len(store) - 1}__"

    text = re.sub(r"```[\s\S]*?```", repl, text)
    text = re.sub(r"`[^`\n]+`", repl, text)
    return text, store


def restore_code(text: str, store: list[str]) -> str:
    for i, block in enumerate(store):
        text = text.replace(f"__CODEBLOCK_{i}__", block)
    return text


def translate_body(translator: GoogleTranslator, body: str) -> str:
    body, store = protect_code(body)
    # line-by-line for MDX components
    lines = body.split("\n")
    out_lines = []
    for line in lines:
        if line.strip().startswith("<") and ">" in line:
            out_lines.append(line)
            continue
        if not line.strip():
            out_lines.append(line)
            continue
        try:
            out_lines.append(translate_chunk(translator, line))
        except Exception:
            out_lines.append(line)
        time.sleep(0.08)
    body = "\n".join(out_lines)
    return restore_code(body, store)


def translate_fm(translator: GoogleTranslator, fm: str) -> str:
    lines = []
    for line in fm.split("\n"):
        m = re.match(r'^(title|description):\s*(".*?"|.*)$', line)
        if m:
            key, val = m.group(1), m.group(2).strip().strip('"')
            if val:
                try:
                    val = translate_chunk(translator, val)
                except Exception:
                    pass
                lines.append(f'{key}: "{val}"')
                continue
        lines.append(line)
    return "\n".join(lines)


def main() -> None:
    if len(sys.argv) != 3:
        print("usage: translate-locale.py <destDir> <googleLangCode>", file=sys.stderr)
        sys.exit(2)
    dest_name, lang = sys.argv[1], sys.argv[2]
    dest = ROOT / dest_name
    dest.mkdir(parents=True, exist_ok=True)
    translator = GoogleTranslator(source="en", target=lang)

    for src in sorted(SRC.glob("*.mdx")):
        raw = src.read_text(encoding="utf-8")
        fm, body = split_frontmatter(raw)
        if fm is None:
            out = raw.replace("/en-US/", f"/{dest_name}/")
            (dest / src.name).write_text(out, encoding="utf-8")
            continue
        fm_t = translate_fm(translator, fm)
        body_t = translate_body(translator, body)
        body_t = body_t.replace("/en-US/", f"/{dest_name}/")
        out = f"---\n{fm_t}\n---\n{body_t}"
        (dest / src.name).write_text(out, encoding="utf-8")
        print(src.name)


if __name__ == "__main__":
    main()
