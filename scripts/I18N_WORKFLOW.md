# Help Center i18n workflow

## Adding or updating pages

1. Author in **en-US** (and **zh-Hans** for CN parity).
2. Run `npm run locales:zh-hant` after zh-Hans changes.
3. Re-translate affected files in `de-DE`, `fr-FR`, `es-MX`, `ja-JP`, `ko-KR`:
   - Bootstrap: `node scripts/bootstrap-locale-from-en.mjs de-DE`
   - Machine translate: `pip install deep-translator translators` then `HC_TRANSLATE_PYTHON=python3 npm run locales:translate` (Yandex/Caiyun/Reverso; Google blocked when rate-limited)
   - Accordion / Steps pages after script changes: `HC_TRANSLATE_PYTHON=python3 node scripts/retranslate-ui-heavy.mjs`
   - **zh-Hant:** `npm run locales:zh-hant` after zh-Hans edits
4. `npm run locales:sync` then `npm run locales:check`.
5. `mintlify broken-links` before merge.

## Changelog + prod SYSTEM notices

| Asset | Locales |
|-------|---------|
| Changelog MDX | 8 Help locales (en-US + zh-Hans required first) |
| SYSTEM notice | `en` and/or `zh` only — CTA uses `help.partgenie.ai/en-US/...` or `zh-Hans/...` |

See [help-center-harness.md](../.cursor/rules/help-center-harness.md).

## Web App links

Use `helpCenterUrl()` from `YuanQiWeb/src/util/helpCenter.ts` — never hardcode locale segments.
