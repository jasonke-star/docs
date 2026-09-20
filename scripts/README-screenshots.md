# Help Center screenshots

## Goal

Stop pasting one-off screenshots for every doc/changelog. Prefer **reuse**, capture only when UI truly changed.

## Workflow

### 1. Reuse first (default)

When a feature already has a changelog image under `images/`, point help pages at that file. Register it in `scripts/screenshot-assets.json` with `"source": "reuse"`.

```bash
node scripts/capture-screenshots.mjs --audit
```

### 2. Fresh capture (when needed)

One-time: save a logged-in Playwright session (do not commit `.auth.json`):

```bash
cd "Help Center"
npm i -D playwright
npx playwright install chromium
npx playwright codegen https://app.partgenie.ai --save-storage=scripts/.auth.json
```

Then capture:

```bash
STORAGE_STATE=scripts/.auth.json node scripts/capture-screenshots.mjs --ids=homepage-public
# or
STORAGE_STATE=scripts/.auth.json node scripts/capture-screenshots.mjs --all-capture
```

### 3. Agent / chat usage

Ask: “截 Work 首页” or “刷新 live sourcing 设置图”. The agent should:

1. Check `screenshot-assets.json` for an existing reuse candidate
2. If missing/stale, run capture with your `STORAGE_STATE`
3. Commit the PNG + MDX update

## Notes

- Keep `scripts/.auth.json` out of git (see `.gitignore`)
- Prefer 1440×900 viewport for consistency
- Cropping can be done later with `sips` / `ffmpeg` if needed
