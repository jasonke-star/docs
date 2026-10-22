# Help Center URL harness

Use this when linking to PartGenie documentation from **Help Center MDX**, **prod SYSTEM notices** (Updates / modal CTA), emails, or ops scripts.

## Canonical public origin

| Use | URL |
|-----|-----|
| **Help Center (this repo)** | `https://help.partgenie.ai` |
| **Wrong — do not use for Help Center** | `https://docs.partgenie.ai` (not our Mintlify deployment) |

## Path pattern

Mintlify locales match repo folders:

- English: `https://help.partgenie.ai/en-US/<page>`
- 简体中文: `https://help.partgenie.ai/zh-Hans/<page>`

Examples:

- Changelog: `https://help.partgenie.ai/en-US/changelog`
- Changelog entry anchor (Update `label`): `https://help.partgenie.ai/en-US/changelog#2026-10-22`
- ECAD guide: `https://help.partgenie.ai/en-US/ecad-models`

## Internal MDX links

Prefer **relative** paths in this repo (no hostname):

- `/en-US/ecad-models`
- `/zh-Hans/changelog`

## Prod webapp SYSTEM notices

When setting `content.actionUrl` on Admin / `publish_system_notice` presets:

- **Always** `https://help.partgenie.ai/...` for Help Center CTAs.
- Static notice images: `https://web-static.partgenie.ai/notices/...`
- In-app deep links (Settings, chat): `/app/setting?tab=team` etc. — not Help Center.

## Checklist before shipping notice + docs

1. CTA hostname is `help.partgenie.ai`, not `docs.partgenie.ai`.
2. Locale segment matches notice `content.locale` (`en` → `/en-US/`, `zh` → `/zh-Hans/`).
3. Changelog notice links include `#` + `<Update label>` when pointing at a specific release.

## Ops reference

- Notice presets: `YuanQiService/scripts/ops/publish_system_notice/main.go` (`helpCenterBase`)
- Shell example: `YuanQiService/scripts/ops/publish_footprintku_system_notice.sh` (`HELP_EN` / `HELP_ZH`)
