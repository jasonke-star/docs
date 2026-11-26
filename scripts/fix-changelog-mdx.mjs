#!/usr/bin/env node
/**
 * Fix Mintlify-breaking patterns in locale changelog.mdx files.
 *   node scripts/fix-changelog-mdx.mjs [--write]
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const write = process.argv.includes('--write')

const LOCALES = ['zh-Hans', 'zh-Hant', 'de-DE', 'fr-FR', 'es-MX', 'ja-JP', 'ko-KR']

function fixChangelog(text) {
  let out = text

  out = out.replace(/\/changelog-\#/g, '/changelog#')
  out = out.replace(/\/changelog\s+#\s*/g, '/changelog#')
  out = out.replace(/changelog#\s+(\d{4}-\d{2}-\d{2})/g, 'changelog#$1')

  out = out.replace(/([.!?…·])([ \t]*)(<\/Update>)/g, '$1\n$3')

  out = out.replace(/^(\s{2})\|(\s*---)/gm, '|$2')
  out = out.replace(/^(\s{2})\|(\s*\*\*)/gm, '|$2')

  out = out.replace(
    /\[\s*angemeldet haben\]app\.partgenie\.ai\s*\]\(https:\/\/app\.partgenie\.ai\s*\)/gi,
    '[app.partgenie.ai](https://app.partgenie.ai)',
  )
  out = out.replace(
    /\[\s*PartGenie\s+for\s+Chrome\s*\*\*\s+recognize/gi,
    '**PartGenie for Chrome** recognize',
  )

  out = out.replace(/\*\s+\*([^*\n]+?)\*\s+\*/g, '**$1**')
  out = out.replace(/\*\s+\*([^*\n]+?)\*\*/g, '**$1**')

  out = out.replace(/(\n\s+<img[\s\S]*?\n)(\s+)\/>/g, '$1$2  />\n')
  out = out.replace(/(\n\s+<img[\s\S]*?\n)(\s+)\|\>/g, '$1$2  />\n')

  return out
}

let n = 0
for (const loc of LOCALES) {
  const fp = path.join(root, loc, 'changelog.mdx')
  if (!fs.existsSync(fp)) continue
  const before = fs.readFileSync(fp, 'utf8')
  const after = fixChangelog(before)
  if (after !== before) {
    n++
    if (write) fs.writeFileSync(fp, after)
    else console.log('would fix', loc)
  }
}
console.log(write ? `fixed ${n} changelogs` : `dry-run: ${n}`)