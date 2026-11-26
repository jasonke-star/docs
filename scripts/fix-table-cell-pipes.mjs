#!/usr/bin/env node
/**
 * Undo mistaken ` / ` → ` | ` inside markdown table cells (from repair-mintlify-jsx).
 *   node scripts/fix-table-cell-pipes.mjs [--write]
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const write = process.argv.includes('--write')

const LOCALES = ['zh-Hans', 'zh-Hant', 'de-DE', 'fr-FR', 'es-MX', 'ja-JP', 'ko-KR']

function fixTableLine(line) {
  if (!line.trimStart().startsWith('|')) return line
  let l = line

  l = l.replace(
    /\|\s*Altium\s*\|\s*Eagle\s*\|\s*OrCAD\s*\|\s*Allegro\s*\|/gi,
    '| Altium / Eagle / OrCAD / Allegro |',
  )

  l = l.replace(
    /\|\s*Integration\s*\|\s*How it connects\s*\|\s*What you can do\s*\|\s*EDA\s*\|\s*browser open\?\s*\|/i,
    '| Integration | How it connects | What you can do | EDA / browser open? |',
  )

  l = l.replace(/\*\*([^*\n|]+?)\s+\|\s+([^*\n|]+?)\*\*/g, '**$1 / $2**')
  l = l.replace(/P\s*=\s*V2\s*\|\s*R/gi, 'P = V²/R')
  l = l.replace(/V2\s*\|\s*R/gi, 'V²/R')
  l = l.replace(/VI\s*\|\s*I2R/gi, 'VI / I2R')
  l = l.replace(/\*\s*Elektrisch\s*\*\*\*\s*Bestanden\s*\|\s*nicht/gi, '**Elektrisch** · Bestanden / nicht')
  l = l.replace(/\*\s*Thermisch\s*\*\s*\*\s*Bestanden\s*\|\s*nicht/gi, '**Thermisch** · Bestanden / nicht')
  l = l.replace(/Pasa\s*\|\s*Falla/gi, 'Pasa / Falla')
  l = l.replace(/Karte\s*\|\s*Liste/gi, 'Karte / Liste')
  l = l.replace(/grüne\s*\|\s*orange\s*\|\s*lila/gi, 'grüne, orange, lila')
  l = l.replace(/verdes\s*\|\s*naranjas\s*\|\s*moradas/gi, 'verdes, naranjas, moradas')
  l = l.replace(/\|\s*\|\s*/g, '| ')

  l = l.replace(/\s+\|\s+(?=[A-ZÄÖÜ][a-zäöüß]+,\s)/g, ' / ')

  const pipes = (l.match(/\|/g) || []).length
  if (pipes > 6) {
    l = l.replace(/(?<=\*\*[^|]{3,80})\s+\|\s+(?=[^|]{3,80}\*\*)/g, ' / ')
  }

  return l
}

function processFile(fp) {
  const lines = fs.readFileSync(fp, 'utf8').split('\n')
  let changed = false
  const out = lines.map((line) => {
    const fixed = fixTableLine(line)
    if (fixed !== line) changed = true
    return fixed
  })
  if (changed && write) fs.writeFileSync(fp, out.join('\n'))
  return changed
}

let n = 0
for (const loc of LOCALES) {
  const dir = path.join(root, loc)
  if (!fs.existsSync(dir)) continue
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.mdx'))) {
    if (processFile(path.join(dir, f))) {
      n++
      if (write) console.log(`${loc}/${f}`)
    }
  }
}
console.log(write ? `fixed ${n} files` : `dry-run: ${n} files`)