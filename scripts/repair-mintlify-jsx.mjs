#!/usr/bin/env node
/**
 * Restore Mintlify JSX tags corrupted by machine translation (Steps, CardGroup, Accordion, etc.)
 *
 *   node scripts/repair-mintlify-jsx.mjs [--write]
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const write = process.argv.includes('--write')

const LOCALES = ['zh-Hans', 'zh-Hant', 'de-DE', 'fr-FR', 'es-MX', 'ja-JP', 'ko-KR']

/** @type {Array<[RegExp, string]>} */
const REPLACEMENTS = [
  [/MODELL:\s*/gi, ''],
  [/⟦FOLGENDERMAßEN⟧/g, '<Steps>'],
  [/⟦\/SCHRITT⟧/g, '</Step>'],
  [/<Folgendermaßen>/gi, '<Steps>'],
  [/<\/Folgendermaßen>/gi, '</Steps>'],
  [/<Schritt\b/gi, '<Step'],
  [/<\/Schritt>/gi, '</Step>'],
  [/<\s*Étapes\s*>/gi, '<Steps>'],
  [/<\s*\/\s*Étapes\s*>/gi, '</Steps>'],
  [/<\s*Étape\b/gi, '<Step'],
  [/<\s*\/\s*Étape\s*>/gi, '</Step>'],
  [/<Pas\b/gi, '<Step'],
  [/<\/Pas>/gi, '</Step>'],
  [/<ステップ\b/g, '<Step'],
  [/<\/ステップ>/g, '</Step>'],
  [/<단계\b/g, '<Step'],
  [/<\/단계>/g, '</Step>'],
  [/<Kartengruppe\b/gi, '<CardGroup'],
  [/<\/Kartengruppe>/gi, '</CardGroup>'],
  [/<Grupo de tarjetas\b/gi, '<CardGroup'],
  [/<GrupoDeTarjetas\b/gi, '<CardGroup'],
  [/<Akkordeongruppe>/gi, '<AccordionGroup>'],
  [/<\/Akkordeongruppe>/gi, '</AccordionGroup>'],
  [/<Groupe d'accordéons>/gi, '<AccordionGroup>'],
  [/<Grupo de acordeón>/gi, '<AccordionGroup>'],
  [/<Akkordeon-Titel=/gi, '<Accordion title='],
  [/<Akkordeon\s+Titel=/gi, '<Accordion title='],
  [/<Akkordeon\b/gi, '<Accordion'],
  [/<\/Akkordeon>/gi, '</Accordion>'],
  [/<\/Ziehharmonika>/gi, '</Accordion>'],
  [/<Ziehharmonika>/gi, '<Accordion>'],
  [/<\/更新>/g, '</Update>'],
  [/<更新\b/g, '<Update'],
  [/<Info>\s*<\/Info>/g, ''],
  [/\/\s*Locale\s+\/(?=[a-z]{2})/gi, '/'],
  [/\/(es|de|fr|ja|ko)—([A-Z]{2})\//g, '/$1-$2/'],
  [/<\s*Grupo de acordeón>/gi, '<AccordionGroup>'],
  [/<\s*\/\s*Grupo de Acordeón>/gi, '</AccordionGroup>'],
  [/<\s*\/\s*Acordeón\s*>/gi, '</Accordion>'],
  [/<\s*Accordion\b/gi, '<Accordion'],
  [/<\s*\/\s*Accordion\s*>/gi, '</Accordion>'],
  [/<Accordion title=\s*"/g, '<Accordion title="'],
  [/\]\s+\(\s*\//g, '](/'],
  [/\(\s*\/\s*(en-US|de-DE|fr-FR|es-MX|ja-JP|ko-KR|zh-Hans|zh-Hant)\s+\/\s*/g, '(/$1/'],
]

function fixMarkdownTableRows(text) {
  return text
    .split('\n')
    .map((line) => {
      const t = line.trimEnd()
      if (/^\s*\|>\s*$/.test(t)) return line.replace(/^\s*\|>\s*$/, '  />')
      if (/^\s*\/>\s*$/.test(t)) return line
      if (!/\|\s*$/.test(t)) return line
      if (!/^\s*\/\s+[^/|]+\s+\/\s+.+/.test(t)) return line
      return line.replace(/^\s*\/\s+/, '| ').replace(/\s+\/\s+(?=[^|\n]+)/, ' | ')
    })
    .join('\n')
}

function fixBrokenImgClosers(text) {
  return text.replace(/^\s*\|>\s*$/gm, '  />')
}

function fixSpacedLocaleLinks(text) {
  return text.replace(
    /\[([^\]]+)\]\s*\(\s*\/([a-z]{2}-[A-Z]{2})\s+\/\s*([^)]+)\)/g,
    (m, label, loc, slug) => {
      const clean = slug
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[äöüÄÖÜßáéíóúñ]/gi, (c) => {
          const map = { ä: 'a', ö: 'o', ü: 'u', ß: 'ss', á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ñ: 'n' }
          return map[c.toLowerCase()] || c
        })
      return `[${label}](/${loc}/${clean})`
    },
  )
}

function repair(text) {
  let out = text
  for (const [re, rep] of REPLACEMENTS) {
    out = typeof rep === 'string' ? out.replace(re, rep) : out.replace(re, rep)
  }
  out = out.replace(/\*\s+\*([^*\n]+?)\*\s+\*/g, '**$1**')
  out = out.replace(/\*\s+\*([^*\n]+?)\*\*/g, '**$1**')
  out = out.replace(/<\/Update>(?!\n)/g, '</Update>\n')
  out = fixBrokenImgClosers(out)
  out = fixMarkdownTableRows(out)
  out = fixSpacedLocaleLinks(out)
  return out
}

let changed = 0
for (const loc of LOCALES) {
  const dir = path.join(root, loc)
  if (!fs.existsSync(dir)) continue
  for (const name of fs.readdirSync(dir).filter((f) => f.endsWith('.mdx'))) {
    const fp = path.join(dir, name)
    const before = fs.readFileSync(fp, 'utf8')
    const after = repair(before)
    if (after !== before) {
      changed++
      if (write) fs.writeFileSync(fp, after)
      else console.log('would fix', `${loc}/${name}`)
    }
  }
}

if (write) console.log(`repaired ${changed} files`)
else console.log(`dry-run: ${changed} files need repair (pass --write)`)