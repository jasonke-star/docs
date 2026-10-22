#!/usr/bin/env node
/** Re-translate pages with Accordion / Steps after protect-regex fixes. */
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

const files = [
  'faq.mdx',
  'index.mdx',
  'membership-pricing.mdx',
  'getting-started.mdx',
]

for (const [dir, lang] of jobs) {
  for (const file of files) {
    console.log(`${dir} ${file}`)
    const r = spawnSync(py, [fast, dir, lang, file], { stdio: 'inherit' })
    if (r.status !== 0) process.exit(r.status ?? 1)
  }
}
