#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const py = process.env.HC_TRANSLATE_PYTHON || path.join(__dirname, '..', '.venv', 'bin', 'python3')
const script = path.join(__dirname, 'translate-changelog-update.py')
const label = process.argv[2] || '2026-10-27'

const jobs = [
  ['de-DE', 'de'],
  ['fr-FR', 'fr'],
  ['es-MX', 'es'],
  ['ja-JP', 'ja'],
  ['ko-KR', 'ko'],
]

for (const [dir, lang] of jobs) {
  const r = spawnSync(py, [script, label, dir, lang], { stdio: 'inherit' })
  if (r.status !== 0) process.exit(r.status ?? 1)
}
