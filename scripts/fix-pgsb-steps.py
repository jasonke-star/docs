#!/usr/bin/env python3
"""Insert translated <Steps> blocks into locale MDX (fixes PGSB markers)."""
from __future__ import annotations

import importlib.util
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EN = ROOT / "en-US"

spec = importlib.util.spec_from_file_location(
    "tlf", ROOT / "scripts" / "translate-locale-fast.py"
)
tlf = importlib.util.module_from_spec(spec)
spec.loader.exec_module(tlf)

JOBS = [
    ("de-DE", "de"),
    ("fr-FR", "fr"),
    ("es-MX", "es"),
    ("ja-JP", "ja"),
    ("ko-KR", "ko"),
]
FILES = ("eda-integration.mdx", "kicad-library.mdx")


def main() -> None:
    for dest_name, lang in JOBS:
        for name in FILES:
            en_raw = (EN / name).read_text(encoding="utf-8")
            _, en_body = tlf.split_frontmatter(en_raw)
            steps = re.findall(r"<Steps>[\s\S]*?</Steps>", en_body)
            path = ROOT / dest_name / name
            text = path.read_text(encoding="utf-8")
            step_i = 0
            out_lines: list[str] = []
            for line in text.splitlines():
                stripped = line.strip()
                if "ZZZPGSB" in line and line.strip().endswith("ZZZ"):
                    if step_i < len(steps):
                        block = tlf.translate_steps_section(
                            steps[step_i], lang, dest_name
                        )
                        out_lines.append(block)
                        step_i += 1
                    continue
                if stripped.startswith("<!--") and "PGSB" in stripped:
                    if step_i < len(steps):
                        block = tlf.translate_steps_section(
                            steps[step_i], lang, dest_name
                        )
                        out_lines.append(block)
                        step_i += 1
                    continue
                if stripped.startswith("<!--") and (
                    "PGP" in stripped
                    or "PGSB" in stripped
                    or "SXS" in stripped
                    or "SXE" in stripped
                    or "ST0" in stripped
                    or "ST1" in stripped
                    or "ST2" in stripped
                    or "ST3" in stripped
                    or "VOIR" in stripped
                    or stripped.startswith("<!-- SE")
                ):
                    continue
                out_lines.append(line)
            text = "\n".join(out_lines) + ("\n" if text.endswith("\n") else "")
            while step_i < len(steps):
                text += "\n" + tlf.translate_steps_section(
                    steps[step_i], lang, dest_name
                )
                step_i += 1
            text = tlf.fix_mdx_component_tags(text)

            if name == "eda-integration.mdx" and len(steps) >= 2:

                def graft_after_kicad_heading(body: str, block: str) -> str:
                    tr = tlf.translate_steps_section(block, lang, dest_name)
                    pat = r"(##[^\n]*KiCad[^\n]*\n\n)([\s\S]*?)(\n(?:##|<!-- PGP|<Frame|<Warning|<Tip))"
                    m = re.search(pat, body, re.I)
                    if not m:
                        return body
                    return body[: m.start(2)] + tr + body[m.start(3) :]

                def graft_catalog_steps(body: str, block: str) -> str:
                    tr = tlf.translate_steps_section(block, lang, dest_name)
                    pat = r"(##[^\n]*\n\n)([\s\S]*?)(\n### )"
                    m = re.search(pat, body)
                    if not m:
                        return body
                    return body[: m.start(2)] + tr + body[m.start(3) :]

                text = graft_catalog_steps(text, steps[0])
                text = graft_after_kicad_heading(text, steps[1])

            text = tlf.fix_mdx_component_tags(text)
            path.write_text(text, encoding="utf-8")
            print(f"{dest_name}/{name} ({len(steps)} steps blocks)")


if __name__ == "__main__":
    main()
