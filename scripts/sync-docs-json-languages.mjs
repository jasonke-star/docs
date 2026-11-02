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

function mapGroups(groups, dir) {
  return (groups || []).map((g) => {
    const out = { group: g.group }
    if (g.openapi) out.openapi = g.openapi
    if (g.pages) out.pages = g.pages.map((slug) => `${dir}/${slug}`)
    return out
  })
}

function buildLanguageBlock(locale) {
  const navKey = locale.mintlifyLanguage === 'zh-Hans' ? 'zh-Hans' : locale.mintlifyLanguage
  const dir = locale.contentDir
  const helpGroups = mapGroups(manifest.navGroups[navKey] || manifest.navGroups.en, dir)
  const apiGroups = mapGroups(manifest.apiNavGroups?.[navKey] || manifest.apiNavGroups?.en || [], dir)
  const tabLabels = manifest.tabLabels?.[navKey] || manifest.tabLabels?.en || {
    help: 'Help',
    api: 'API',
  }
  const openapi = manifest.apiOpenapi || 'openapi.json'
  const apiRefLabel =
    manifest.apiReferenceGroup?.[navKey] ||
    manifest.apiReferenceGroup?.en ||
    'API reference'

  const navLabels = manifest.navbar[navKey] || manifest.navbar.en
  const anchors =
    manifest.globalAnchors[navKey] || manifest.globalAnchors.default

  const tabs = [{ tab: tabLabels.help, groups: helpGroups }]
  if (apiGroups.length) {
    // Single API tab: guides/concepts + OpenAPI endpoints in one sidebar
    tabs.push({
      tab: tabLabels.api,
      groups: [...apiGroups, { group: apiRefLabel, openapi }],
    })
  }

  return {
    language: locale.mintlifyLanguage,
    tabs,
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
  console.log(`Wrote ${docsPath} (${published.length} languages, tabs=help+api)`)
} else {
  console.log(out)
}
