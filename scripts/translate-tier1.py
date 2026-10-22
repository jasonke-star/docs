#!/usr/bin/env python3
"""Translate Tier-1 pages only (see locales.json nav)."""
import subprocess
import sys
from pathlib import Path

TIER1 = [
    "index.mdx",
    "getting-started.mdx",
    "faq.mdx",
    "contact-us.mdx",
    "account-management.mdx",
    "membership-pricing.mdx",
    "integrations.mdx",
    "ecad-models.mdx",
    "kicad-plugin.mdx",
]

JOBS = [
    ("de-DE", "de"),
    ("fr-FR", "fr"),
    ("es-MX", "es"),
    ("ja-JP", "ja"),
    ("ko-KR", "ko"),
]

ROOT = Path(__file__).resolve().parent.parent
FAST = ROOT / "scripts" / "translate-locale-fast.py"


def main():
    py = sys.executable
    for dest, lang in JOBS:
        for name in TIER1:
            src = ROOT / "en-US" / name
            if not src.exists() and name == "index.mdx":
                continue
            subprocess.run(
                [py, str(FAST), dest, lang, name],
                check=False,
            )


if __name__ == "__main__":
    main()
