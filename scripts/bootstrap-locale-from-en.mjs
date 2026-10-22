#!/usr/bin/env node
/**
 * Copy en-US/*.mdx to target dir and rewrite /en-US/ internal links.
 *   node scripts/bootstrap-locale-from-en.mjs de-DE
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const src = path.join(root, 'en-US')
const destName = process.argv[2]
if (!destName) {
  console.error('usage: bootstrap-locale-from-en.mjs <destDir>')
  process.exit(2)
}
const dest = path.join(root, destName)
fs.mkdirSync(dest, { recursive: true })
for (const f of fs.readdirSync(src).filter((x) => x.endsWith('.mdx'))) {
  let t = fs.readFileSync(path.join(src, f), 'utf8')
  t = t.replaceAll('/en-US/', `/${destName}/`)
  fs.writeFileSync(path.join(dest, f), t)
}
console.log(`bootstrapped ${destName}`)
