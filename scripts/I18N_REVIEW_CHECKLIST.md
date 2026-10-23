# Help Center i18n — review checklist (by priority)

Use after machine translation or bulk repairs. Run `npm run locales:check` and `node scripts/fix-mdx-locale-links.mjs --write` before manual review.

## P0 — Ship blockers (automated + spot-check)

| Item | Locales | Action |
|------|---------|--------|
| File parity vs en-US | all 8 | `npm run locales:check` |
| Broken internal links `](/locale / …)` | de, fr, es (+ spot de) | `node scripts/fix-mdx-locale-links.mjs --write` |
| MDX placeholders / translated JSX tags | de, fr, es, ja, ko | grep `__P`, `ZZQ`, `<Schritt` |
| Changelog `<Update>` structure | all | Mintlify preview; no unclosed tags |

## P1 — User-facing entry pages (human ~15 min/locale)

| Page | Why |
|------|-----|
| `getting-started.mdx` | First run path, many cross-links |
| `faq.mdx` | Accordion labels + link density |
| `index.mdx` | Card titles (zh-Hant still EN on index — intentional nav) |
| `membership-pricing.mdx` | Plan names, credits, trial |
| `integrations.mdx` | Table + anchor links |

## P2 — Product workflows

| Page | Why |
|------|-----|
| `ai-search.mdx`, `partgenie-work.mdx`, `bom-management.mdx` | Core loops |
| `eda-integration.mdx`, `kicad-library.mdx`, `ecad-models.mdx`, `kicad-plugin.mdx` | ECAD accuracy |
| `chrome-extension.mdx`, `live-sourcing.mdx` | Sourcing + extension |
| `engineering-calculator.mdx` | Formulas / JSX must stay literal |

## P3 — Changelog tiers

| Tier | Dates | Status |
|------|-------|--------|
| Tier 1–2 | `2026-09-*`, `2026-10-*` | MT via `translate_changelog` |
| Tier 3 | `2026-08` and earlier | English body OK; links use locale prefix |
| Images | `/images/{locale}/` | zh-Hans/zh-Hant only for some entries |

Re-run September tier only:

```bash
HC_TRANSLATE_PYTHON=python3 python3 scripts/translate-locale-fast.py de-DE de changelog.mdx
# repeat fr-FR/fr, es-MX/es, ja-JP/ja, ko-KR/ko
```

## P4 — zh-Hant (Taiwan)

| Item | Action |
|------|--------|
| Regenerate from zh-Hans | `npm run locales:zh-hant` |
| Terminology pass | `scripts/zh-hant-terms.mjs` (登入、帳戶、設定、連結、軟體…) |
| Keep product English | Search, Work, BOM, Credits, MPN, KiCad, Chrome |
| index cards | Optional: localize Card titles to match zh-Hans nav |

## P5 — Locale polish (optional)

- **de-DE / ja-JP / ko-KR**: formal tone, avoid Denglish / カタカナ overload
- **fr-FR**: typography (espaces insécables before `:`, `?`)
- **es-MX**: Latin-American vs Spain — stay MX-neutral

## Pre-merge commands

```bash
npm run locales:check
node scripts/fix-mdx-locale-links.mjs --write
mintlify broken-links   # if Mintlify CLI installed
```
