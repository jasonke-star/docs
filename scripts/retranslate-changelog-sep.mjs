#!/usr/bin/env node
/** Re-run changelog.mdx for Sep+Oct 2026 tier (5 MT locales). */
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const py = process.env.HC_TRANSLATE_PYTHON || 'python3'
const fast = path.join(__dirname, 'translate-locale-fast.py')

const jobs = [
  ['de-DE', 'de'],
  ['fr-FR', 'fr'],
  ['es-MX', 'es'],
  ['ja-JP', 'ja'],
  ['ko-KR', 'ko'],
]

for (const [dir, lang] of jobs) {
  console.log(`\n=== ${dir} changelog.mdx ===`)
  const r = spawnSync(py, [fast, dir, lang, 'changelog.mdx'], { stdio: 'inherit' })
  if (r.status !== 0) process.exit(r.status ?? 1)
}
