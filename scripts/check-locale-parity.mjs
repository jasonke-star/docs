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

function collectPageRefs(langBlock) {
  const refs = []
  const groups = []
  if (Array.isArray(langBlock.tabs)) {
    for (const tab of langBlock.tabs) {
      if (tab.groups) groups.push(...tab.groups)
    }
  } else if (Array.isArray(langBlock.groups)) {
    groups.push(...langBlock.groups)
  }
  for (const g of groups) {
    for (const pageRef of g.pages || []) {
      refs.push(pageRef)
    }
  }
  return refs
}

for (const langBlock of docs.navigation.languages) {
  for (const pageRef of collectPageRefs(langBlock)) {
    const mdx = path.join(root, `${pageRef}.mdx`)
    if (!fs.existsSync(mdx)) {
      console.error(`MISSING: ${pageRef}.mdx (language ${langBlock.language})`)
      failed = true
    }
  }
}

function walkMdx(dir, base = dir) {
  const out = []
  if (!fs.existsSync(dir)) return out
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name)
    if (ent.isDirectory()) out.push(...walkMdx(full, base))
    else if (ent.name.endsWith('.mdx')) {
      out.push(path.relative(base, full).replace(/\.mdx$/, '').split(path.sep).join('/'))
    }
  }
  return out
}

for (const loc of manifest.locales.filter((l) => l.published)) {
  const dir = path.join(root, loc.contentDir)
  if (!fs.existsSync(dir)) {
    console.error(`MISSING DIR: ${loc.contentDir}`)
    failed = true
    continue
  }
  const expected = new Set(langBlockPages(docs, loc.mintlifyLanguage))
  for (const slug of walkMdx(dir)) {
    const ref = `${loc.contentDir}/${slug}`
    if (!expected.has(ref)) {
      console.warn(`ORPHAN (not in nav): ${ref}.mdx`)
    }
  }
}

function langBlockPages(docsJson, mintlifyLanguage) {
  const block = docsJson.navigation.languages.find((l) => l.language === mintlifyLanguage)
  return block ? collectPageRefs(block) : []
}

if (failed) {
  process.exit(1)
}
console.log('Locale parity OK')
