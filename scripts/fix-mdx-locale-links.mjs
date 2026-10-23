#!/usr/bin/env node
/**
 * Repair broken internal MDX links from machine translation, e.g.
 *   [text](/en-US / gestion de nomenclature)  →  [text](/fr-FR/bom-management)
 *
 *   node scripts/fix-mdx-locale-links.mjs [--write]
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const enDir = path.join(root, 'en-US')
const write = process.argv.includes('--write')

const LOCALES = ['zh-Hans', 'zh-Hant', 'de-DE', 'fr-FR', 'es-MX', 'ja-JP', 'ko-KR']

function normalizeKey(s) {
  return s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
}

const slugs = fs.readdirSync(enDir).filter((f) => f.endsWith('.mdx')).map((f) => f.replace(/\.mdx$/, ''))

const slugByKey = new Map()
for (const slug of slugs) {
  slugByKey.set(normalizeKey(slug), slug)
  const fm = fs.readFileSync(path.join(enDir, `${slug}.mdx`), 'utf8').match(/^title:\s*"([^"]+)"/m)
  if (fm) slugByKey.set(normalizeKey(fm[1]), slug)
}

/** MT often emits these pseudo-slugs instead of English basename. */
const ALIASES = {
  modelescadelectronique: 'ecad-models',
  modelescaoelectronique: 'ecad-models',
  modelesecad: 'ecad-models',
  ecadundfootprints: 'ecad-models',
  ecadyhuellas: 'ecad-models',
  ecadmodels: 'ecad-models',
  gestiondenomenclature: 'bom-management',
  gestiondelanomenclature: 'bom-management',
  gestiondelistademateriales: 'bom-management',
  bommanagement: 'bom-management',
  rechercheia: 'ai-search',
  aisearch: 'ai-search',
  busquedadeia: 'ai-search',
  citationsdelafichettechnique: 'datasheet-citations',
  citationsdelahojadedatos: 'datasheet-citations',
  datasheetcitations: 'datasheet-citations',
  modedeconception: 'design-mode',
  mododediseno: 'design-mode',
  designmode: 'design-mode',
  prixdadhesion: 'membership-pricing',
  tarificaciondelamembresia: 'membership-pricing',
  membershippricing: 'membership-pricing',
  tarificationdeladhesion: 'membership-pricing',
  contactus: 'contact-us',
  contactenos: 'contact-us',
  contáctenos: 'contact-us',
  contáctanos: 'contact-us',
  partager: 'share',
  compartir: 'share',
  applicationmobile: 'mobile-app',
  aplicacionmovil: 'mobile-app',
  mobileapp: 'mobile-app',
  exemplesdefonctionnalites: 'feature-examples',
  ejemplosdefunciones: 'feature-examples',
  featureexamples: 'feature-examples',
  approvisionnementendirect: 'live-sourcing',
  abastecimientoenvivo: 'live-sourcing',
  livesourcing: 'live-sourcing',
  alternatives: 'alternatives',
  alternativas: 'alternatives',
  comparaisondeproduits: 'product-comparison',
  comparaciondeproductos: 'product-comparison',
  productcomparison: 'product-comparison',
  extensionchrome: 'chrome-extension',
  gestionducompte: 'account-management',
  gestiondelacuenta: 'account-management',
  accountmanagement: 'account-management',
  depannageducompte: 'account-troubleshooting',
  soluciondeproblemasdelacuenta: 'account-troubleshooting',
  accounttroubleshooting: 'account-troubleshooting',
  generationdelabibliothequekicad: 'kicad-library',
  generaciondelabibliotecakicad: 'kicad-library',
  kicadlibrary: 'kicad-library',
  pluginkicad: 'kicad-plugin',
  kicadplugin: 'kicad-plugin',
  integrationeda: 'eda-integration',
  integraciones: 'integrations',
  integrations: 'integrations',
  knowledge: 'knowledge',
  openelabmodules: 'openelab-modules',
  partgeniework: 'partgenie-work',
  gettingstarted: 'getting-started',
  commentdemarrer: 'getting-started',
  empezar: 'getting-started',
  primerospasos: 'getting-started',
  membresíaprecios: 'membership-pricing',
  membresiaprecios: 'membership-pricing',
  conocimiento: 'knowledge',
  faq: 'faq',
  frequentlyaskedquestions: 'faq',
  preguntasfrecuentes: 'faq',
  aiquerywriting: 'ai-query-writing',
  fuzzytoprecise: 'fuzzy-to-precise',
  searchoptimization: 'search-optimization',
  effectivebommanagement: 'effective-bom-management',
  specificationchat: 'specification-chat',
  engineeringcalculator: 'engineering-calculator',
  favorites: 'favorites',
  tarifflookup: 'tariff-lookup',
  changelog: 'changelog',
  registrodecambios: 'changelog',
  calculadoradeingenieria: 'engineering-calculator',
  calculadoraderegistrodecambiosingenieria: 'changelog',
  indice: 'index',
  introduccion: 'getting-started',
  introducción: 'getting-started',
  index: 'index',
  recherchedia: 'ai-search',
  ecriturederequeteai: 'ai-query-writing',
  connaissance: 'knowledge',
  bibliothequekicad: 'kicad-library',
  greffonkicad: 'kicad-plugin',
  extensionchrome: 'chrome-extension',
  integrationeda: 'eda-integration',
  contacteznous: 'contact-us',
  modelesecadelectronique: 'ecad-models',
  modelescaoelectronique: 'ecad-models',
  chatdespecification: 'specification-chat',
  floueaprecise: 'fuzzy-to-precise',
  travailpartgenie: 'partgenie-work',
  rechercheendirect: 'live-sourcing',
  recherchetarifaire: 'tariff-lookup',
  redactionderequetesdia: 'ai-query-writing',
  redactionderequetesai: 'ai-query-writing',
  journaldesmodifications: 'changelog',
  calculatriceingenierie: 'engineering-calculator',
  membreshipgagyeok: 'membership-pricing',
  openelabmodules: 'openelab-modules',
  modulesopenelab: 'openelab-modules',
  complementodekicad: 'kicad-plugin',
  kicad: 'kicad-plugin',
  membershippricing: 'membership-pricing',
}

for (const [k, v] of Object.entries(ALIASES)) {
  if (!slugByKey.has(k)) slugByKey.set(k, v)
}

const ANCHOR_ALIASES = {
  confidentialiteetautorisations: 'privacy-and-permissions',
  privacyandpermissions: 'privacy-and-permissions',
}

function resolveSlug(raw) {
  let anchor = ''
  let base = raw.trim()
  const hash = base.indexOf('#')
  if (hash >= 0) {
    anchor = base.slice(hash)
    base = base.slice(0, hash).trim()
    const anchorKey = normalizeKey(anchor.slice(1))
    if (ANCHOR_ALIASES[anchorKey]) {
      anchor = `#${ANCHOR_ALIASES[anchorKey]}`
    }
  }
  const trimmed = base.replace(/\s+$/, '')
  if (slugs.includes(trimmed)) return trimmed + anchor
  const key = normalizeKey(trimmed)
  if (slugByKey.has(key)) return slugByKey.get(key) + anchor
  let best = null
  let bestLen = 0
  for (const slug of slugs) {
    const sk = normalizeKey(slug)
    if (key.includes(sk) || sk.includes(key)) {
      const len = Math.min(key.length, sk.length)
      if (len > bestLen) {
        bestLen = len
        best = slug
      }
    }
  }
  return best ? best + anchor : null
}

const brokenLinkRe =
  /\[([^\]]*)\]\s*\(\s*\/((?:en-US|[a-z]{2}-(?:Hans|Hant|[A-Z]{2}))\s+\/?([^)]*?))\s*\)/g

function fixBoldSpacing(text) {
  return text.replace(/\*\s+\*([^*\n]+?)\*\s+\*/g, '**$1**').replace(/\*\s+\*([^*\n]+?)\*\*/g, '**$1**')
}

function localeForFile(linkLocale, fileLocale) {
  if (linkLocale === 'en-US' || linkLocale === 'es-US' || linkLocale === 'de-US') {
    return fileLocale
  }
  return linkLocale
}

const inlineSlugRe =
  /\[([^\]]*)\]\(\s*\/((?:en-US|[a-z]{2}-(?:Hans|Hant|[A-Z]{2})))\/([^)#]*?)(#[^)]*)?\)/g

function fixFile(filePath, locale) {
  let text = fs.readFileSync(filePath, 'utf8')
  const before = text
  text = text.replace(brokenLinkRe, (full, label, _pathChunk, slugPart) => {
    const slug = resolveSlug(slugPart)
    if (!slug) {
      console.warn(`  unresolved: ${locale} ${path.basename(filePath)} → ${slugPart.trim()}`)
      return full
    }
    return `[${label}](/${locale}/${slug})`
  })
  text = text.replace(inlineSlugRe, (full, label, linkLocale, slugPart, anchor = '') => {
    const useLocale = localeForFile(linkLocale, locale)
    const trimmed = slugPart.trim()
    if (slugs.includes(trimmed) && !/\s/.test(trimmed)) {
      if (useLocale === linkLocale) return full
      return `[${label}](/${useLocale}/${trimmed}${anchor})`
    }
    if (!/\s/.test(trimmed) && !trimmed.includes('|')) {
      return full
    }
    const slug = resolveSlug(trimmed)
    if (!slug) {
      console.warn(`  unresolved inline: ${locale} ${path.basename(filePath)} → ${trimmed}`)
      return full
    }
    return `[${label}](/${useLocale}/${slug}${anchor})`
  })
  text = text.replace(
    /\[([^\]]+)\]\(\/([a-z]{2}-[A-Z]{2})\|([^)]+)\)/g,
    (_, label, loc, slugPart) => {
      const slug = resolveSlug(slugPart) || slugPart.trim()
      return `[${label}](/${loc}/${slug})`
    }
  )
  text = fixBoldSpacing(text)
  if (text !== before) {
    if (write) fs.writeFileSync(filePath, text)
    return true
  }
  return false
}

let changed = 0
for (const locale of LOCALES) {
  const dir = path.join(root, locale)
  if (!fs.existsSync(dir)) continue
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.mdx'))) {
    if (fixFile(path.join(dir, file), locale)) {
      changed++
      if (write) console.log(`${locale}/${file}`)
    }
  }
}

console.log(write ? `fixed ${changed} files` : `would fix ${changed} files (pass --write)`)
