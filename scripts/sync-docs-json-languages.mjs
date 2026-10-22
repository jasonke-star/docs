#!/usr/bin/env node
/**
 * Regenerate docs.json navigation.languages from scripts/locales.json.
 * Preserves theme, logo, footer, contextual.
 *
 *   node scripts/sync-docs-json-languages.mjs
 *   node scripts/sync-docs-json-languages.mjs --write
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const localesPath = path.join(__dirname, 'locales.json')
const docsPath = path.join(root, 'docs.json')

const write = process.argv.includes('--write')

const manifest = JSON.parse(fs.readFileSync(localesPath, 'utf8'))
const docs = JSON.parse(fs.readFileSync(docsPath, 'utf8'))

function buildLanguageBlock(locale) {
  const navKey = locale.mintlifyLanguage === 'zh-Hans' ? 'zh-Hans' : locale.mintlifyLanguage
  const groups = manifest.navGroups[navKey] || manifest.navGroups.en
  const dir = locale.contentDir

  const mappedGroups = groups.map((g) => ({
    group: g.group,
    pages: g.pages.map((slug) => `${dir}/${slug}`),
  }))

  const navLabels = manifest.navbar[navKey] || manifest.navbar.en
  const anchors =
    manifest.globalAnchors[navKey] || manifest.globalAnchors.default

  return {
    language: locale.mintlifyLanguage,
    groups: mappedGroups,
    global: { anchors },
    navbar: {
      links: [{ label: navLabels.support, href: 'mailto:support@partgenie.ai' }],
      primary: {
        type: 'button',
        label: navLabels.login,
        href: 'https://partgenie.ai/',
      },
    },
  }
}

const published = manifest.locales.filter((l) => l.published)
docs.navigation.languages = published.map(buildLanguageBlock)

const out = `${JSON.stringify(docs, null, 2)}\n`

if (write) {
  fs.writeFileSync(docsPath, out)
  console.log(`Wrote ${docsPath} (${published.length} languages)`)
} else {
  console.log(out)
}
