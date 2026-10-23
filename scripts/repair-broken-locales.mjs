#!/usr/bin/env node
/** Re-translate MDX files known to have __P placeholder corruption. */
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

const files = ['changelog.mdx', 'eda-integration.mdx', 'kicad-library.mdx']

for (const [dir, lang] of jobs) {
  for (const file of files) {
    console.log(`\n${dir} ${file}`)
    const r = spawnSync(py, [fast, dir, lang, file], { stdio: 'inherit' })
    if (r.status !== 0) process.exit(r.status ?? 1)
  }
}
