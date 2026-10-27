#!/usr/bin/env python3
"""Translate one <Update> block in an existing locale changelog (by label)."""
from __future__ import annotations

import importlib.util
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

if len(sys.argv) != 4:
    print("usage: translate-changelog-update.py <label> <destDir> <lang>", file=sys.stderr)
    sys.exit(2)

label, dest_name, lang = sys.argv[1], sys.argv[2], sys.argv[3]

spec = importlib.util.spec_from_file_location(
    "tlf", ROOT / "scripts" / "translate-locale-fast.py"
)
tlf = importlib.util.module_from_spec(spec)
assert spec.loader
spec.loader.exec_module(tlf)

path = ROOT / dest_name / "changelog.mdx"
text = path.read_text(encoding="utf-8")
pattern = re.compile(rf'(<Update label="{re.escape(label)}"[\s\S]*?</Update>)')


def repl(m: re.Match) -> str:
    block = m.group(1).replace("/en-US/", f"/{dest_name}/")
    out = tlf.translate_one_update_block(block, lang)
    return tlf.fix_mdx_component_tags(out)


new_text, n = pattern.subn(repl, text, count=1)
if n != 1:
    print(f"Update {label} not found in {dest_name}/changelog.mdx", file=sys.stderr)
    sys.exit(1)
path.write_text(new_text, encoding="utf-8")
print(f"{dest_name} {label} OK")
