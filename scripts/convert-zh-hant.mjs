#!/usr/bin/env node
/**
 * Build zh-Hant/ from zh-Hans/ using OpenCC s2twp (Taiwan phrases).
 * Fixes internal links zh-Hans -> zh-Hant; keeps index.mdx from en-US copy for nav.
 *
 *   npm install opencc-js
 *   node scripts/convert-zh-hant.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Converter } from 'opencc-js'
import { applyZhHantTerms } from './zh-hant-terms.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const srcDir = path.join(root, 'zh-Hans')
const destDir = path.join(root, 'zh-Hant')
const enIndex = path.join(root, 'en-US/index.mdx')

const converter = Converter({ from: 'cn', to: 'tw' })

if (!fs.existsSync(srcDir)) {
  console.error('zh-Hans missing')
  process.exit(1)
}
fs.mkdirSync(destDir, { recursive: true })

const files = fs.readdirSync(srcDir).filter((f) => f.endsWith('.mdx'))

for (const file of files) {
  if (file === 'what-is-partgenie.mdx') continue
  let text = fs.readFileSync(path.join(srcDir, file), 'utf8')
  text = text.replaceAll('/zh-Hans/', '/zh-Hant/')
  text = applyZhHantTerms(converter(text))
  fs.writeFileSync(path.join(destDir, file), text)
}

if (fs.existsSync(enIndex)) {
  let index = fs.readFileSync(enIndex, 'utf8')
  index = index.replaceAll('/en-US/', '/zh-Hant/')
  index = applyZhHantTerms(converter(index))
  index = index.replace(/^title:.*$/m, 'title: "什麼是 PartGenie"')
  index = index.replace(/^description:.*$/m, 'description: "AI 電子工程助手：搜尋、BOM、設計與採購"')
  fs.writeFileSync(path.join(destDir, 'index.mdx'), index)
}

console.log(`zh-Hant: ${files.length} files (+ index from en-US)`)
