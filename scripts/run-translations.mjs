#!/usr/bin/env node
/**
 * Run machine translation for de/fr/es/ja/ko locale dirs (from en-US).
 * Requires: python3 + pip install deep-translator
 */
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const py = path.join(__dirname, 'translate-locale-fast.py')

const jobs = [
  ['de-DE', 'de'],
  ['fr-FR', 'fr'],
  ['es-MX', 'es'],
  ['ja-JP', 'ja'],
  ['ko-KR', 'ko'],
]

const pyBin = process.env.HC_TRANSLATE_PYTHON || 'python3'

for (const [dir, lang] of jobs) {
  console.log(`\n=== ${dir} (${lang}) ===`)
  const r = spawnSync(pyBin, [py, dir, lang], { stdio: 'inherit' })
  if (r.status !== 0) {
    process.exit(r.status ?? 1)
  }
}
