#!/usr/bin/env node
/** Rebuild ko-KR changelog from en-US (fixes __P corruption). */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const en = fs.readFileSync(path.join(root, 'en-US/changelog.mdx'), 'utf8')
fs.writeFileSync(
  path.join(root, 'ko-KR/changelog.mdx'),
  en.replaceAll('/en-US/', '/ko-KR/'),
  'utf8'
)

const py = process.env.HC_TRANSLATE_PYTHON || 'python3'
const r = spawnSync(
  py,
  [path.join(root, 'scripts/translate-locale-fast.py'), 'ko-KR', 'ko', 'changelog.mdx'],
  { stdio: 'inherit', cwd: root }
)
process.exit(r.status ?? 1)
