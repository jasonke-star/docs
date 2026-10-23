#!/usr/bin/env node
/**
 * Replace corrupted integrations table with en-US structure (locale-prefixed links).
 * Keeps each locale's frontmatter, intro blurb, and sections after Typical flows.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

const enText = fs.readFileSync(path.join(root, 'en-US/integrations.mdx'), 'utf8')
const enBody = enText.replace(/^---[\s\S]*?---\n/, '')
const coreMatch = enBody.match(
  /(## Choose the right integration[\s\S]*?<\/Info>\n\n)/
)
if (!coreMatch) {
  console.error('en-US integrations core block missing')
  process.exit(1)
}
const coreEn = coreMatch[1]

const TAIL_HEADERS = [
  '## Typical flows',
  '## Flux typiques',
  '## Typische Abläufe',
  '## Flujos típicos',
  '## Flujos tipicos',
  '##典型的な流れ',
  '## Typical flows',
  '## Account and credits',
  '## Compte et crédits',
  '## Konto und Credits',
  '## Cuenta y créditos',
]

function splitFrontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!m) return { fm: '', body: text }
  return { fm: m[1], body: m[2] }
}

function extractTail(body) {
  for (const h of TAIL_HEADERS) {
    const i = body.indexOf(h)
    if (i >= 0) return body.slice(i)
  }
  const account = body.search(/\n## .*(Account|Compte|Konto|Cuenta|アカウント|계정)/)
  if (account >= 0) return body.slice(account + 1)
  return null
}

function extractIntro(body) {
  const idx = body.search(/\n## /)
  if (idx < 0) return body.trim()
  return body.slice(0, idx).trim()
}

const locales = ['de-DE', 'fr-FR', 'es-MX', 'ja-JP']

for (const locale of locales) {
  const filePath = path.join(root, locale, 'integrations.mdx')
  const { fm, body } = splitFrontmatter(fs.readFileSync(filePath, 'utf8'))
  const intro = extractIntro(body)
  let tail = extractTail(body)
  if (!tail) {
    tail = enBody.slice(enBody.indexOf('## Typical flows')).replaceAll('/en-US/', `/${locale}/`)
    console.warn(`${locale}: using EN tail fallback`)
  }
  const core = coreEn.replaceAll('/en-US/', `/${locale}/`)
  const out = `---\n${fm}\n---\n\n${intro}\n\n${core}${tail}`
  fs.writeFileSync(filePath, out)
  console.log(`grafted ${locale}/integrations.mdx`)
}

// ko-KR: table OK — normalize Info JSX only
const koPath = path.join(root, 'ko-KR/integrations.mdx')
let ko = fs.readFileSync(koPath, 'utf8')
ko = ko
  .replace(/<정보>/gi, '<Info>')
  .replace(/<\/정보>/gi, '</Info>')
  .replace(/kicad-Plugin#install/gi, 'kicad-plugin#install')
fs.writeFileSync(koPath, ko)
console.log('patched ko-KR/integrations.mdx Info + anchors')
