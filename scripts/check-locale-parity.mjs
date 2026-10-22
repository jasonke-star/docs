#!/usr/bin/env node
/**
 * Verify each published locale has MDX files referenced in docs.json.
 *
 *   node scripts/check-locale-parity.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'locales.json'), 'utf8'))
const docs = JSON.parse(fs.readFileSync(path.join(root, 'docs.json'), 'utf8'))

let failed = false

for (const langBlock of docs.navigation.languages) {
  const pages = langBlock.groups.flatMap((g) => g.pages)
  for (const pageRef of pages) {
    const mdx = path.join(root, `${pageRef}.mdx`)
    if (!fs.existsSync(mdx)) {
      console.error(`MISSING: ${pageRef}.mdx (language ${langBlock.language})`)
      failed = true
    }
  }
}

// Orphan MDX in published dirs
for (const loc of manifest.locales.filter((l) => l.published)) {
  const dir = path.join(root, loc.contentDir)
  if (!fs.existsSync(dir)) {
    console.error(`MISSING DIR: ${loc.contentDir}`)
    failed = true
    continue
  }
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.mdx'))
  const expected = new Set(
    langBlockPages(docs, loc.mintlifyLanguage),
  )
  for (const f of files) {
    const slug = f.replace(/\.mdx$/, '')
    const ref = `${loc.contentDir}/${slug}`
    if (!expected.has(ref)) {
      console.warn(`ORPHAN (not in nav): ${ref}.mdx`)
    }
  }
}

function langBlockPages(docsJson, mintlifyLanguage) {
  const block = docsJson.navigation.languages.find((l) => l.language === mintlifyLanguage)
  return block ? block.groups.flatMap((g) => g.pages) : []
}

if (failed) {
  process.exit(1)
}
console.log('Locale parity OK')
