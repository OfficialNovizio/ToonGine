#!/usr/bin/env node
// scripts/train-compression.ts — Trains BPE + dynamic dictionary from project corpus
// Run: npx ts-node scripts/train-compression.ts [projectRoot]
// 
// This script:
// 1. Scans the project for all text content (CLAUDE.md, docs, agents, readme)
// 2. Trains BPE on the corpus (saves to engine.bin)
// 3. Generates a dynamic dictionary from common bigrams/trigrams
// 4. Saves everything to .toon/v3/engine.bin and .toon/dictionary.toon

import { existsSync, readFileSync, writeFileSync, readdirSync, mkdirSync, statSync } from 'fs'
import { join, basename } from 'path'
import { createHash } from 'crypto'

const root = process.argv[2] || process.cwd()

// ── Step 1: Collect corpus ─────────────────────────────────────────────────
function collectCorpus(dir: string): string {
  const extensions = ['.md', '.ts', '.tsx', '.json', '.txt', '.yml', '.yaml']
  const exclude = ['node_modules', '.git', 'dist', '.next', '.toon', 'engine.bin']
  let corpus = ''

  function walk(d: string) {
    try {
      for (const entry of readdirSync(d)) {
        if (exclude.some(e => entry.includes(e))) continue
        const full = join(d, entry)
        try {
          const st = statSync(full)
          if (st.isDirectory()) {
            if (st.size > 100_000_000) continue // skip huge dirs
            walk(full)
          } else if (st.size < 500_000 && extensions.some(e => entry.endsWith(e))) {
            corpus += readFileSync(full, 'utf-8') + '\n'
          }
        } catch {}
      }
    } catch {}
  }

  walk(dir)
  return corpus.slice(0, 5_000_000) // Cap at 5MB for training performance
}

console.log('📚 Collecting project corpus...')
const corpus = collectCorpus(root)
console.log(`   Corpus: ${corpus.length.toLocaleString()} chars from project files`)

// ── Step 2: Train BPE ────────────────────────────────────────────────────
console.log('🔤 Training BPE (256 merges)...')

function trainBPE(text: string, numMerges: number = 256) {
  const words = text.split(/\s+/).filter(w => w.length >= 2)
  const wordFreq = new Map<string, number>()
  for (const w of words) wordFreq.set(w, (wordFreq.get(w) || 0) + 1)

  const frequentWords = [...wordFreq.entries()]
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3000)

  const splits = new Map<string, string[]>()
  for (const [word] of frequentWords) {
    splits.set(word, word.split(''))
  }

  const merges: [string, string, string][] = []
  for (let iter = 0; iter < numMerges; iter++) {
    const pairFreq = new Map<string, number>()
    for (const [word, chars] of splits) {
      for (let i = 0; i < chars.length - 1; i++) {
        const pair = chars[i] + chars[i + 1]
        pairFreq.set(pair, (pairFreq.get(pair) || 0) + (wordFreq.get(word) || 1))
      }
    }
    let best = '', bestCount = 0
    for (const [pair, count] of pairFreq) {
      if (count > bestCount) { best = pair; bestCount = count }
    }
    if (bestCount < 3) break
    const mid = Math.floor(best.length / 2)
    merges.push([best.slice(0, mid), best.slice(mid), best])
    for (const [word, chars] of splits) {
      const merged: string[] = []
      for (let i = 0; i < chars.length; i++) {
        if (i < chars.length - 1 && chars[i] + chars[i + 1] === best) {
          merged.push(best); i++
        } else merged.push(chars[i])
      }
      splits.set(word, merged)
    }
  }

  const tokenFreq = new Map<string, number>()
  for (const [word, chars] of splits) {
    for (const t of chars) {
      if (t.length >= 2) tokenFreq.set(t, (tokenFreq.get(t) || 0) + (wordFreq.get(word) || 1))
    }
  }

  const sorted = [...tokenFreq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 256)
  const vocab = new Map<string, string>()
  const reverse = new Map<string, string>()
  const base64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
  let idx = 0
  for (const [token] of sorted) {
    const code = idx < 64 ? base64[idx] : base64[Math.floor(idx / 64)] + base64[idx % 64]
    vocab.set(token, code); reverse.set(code, token); idx++
  }
  return { merges, vocab, reverse }
}

const bpeTable = trainBPE(corpus)
console.log(`   BPE vocab: ${bpeTable.vocab.size} tokens`)

// ── Step 3: Generate dynamic dictionary ───────────────────────────────────
console.log('📖 Generating dynamic dictionary...')

function generateDictionary(corpus: string): Map<string, string> {
  // Extract most common bigrams (2-word phrases)
  const words = corpus.toLowerCase().replace(/[^a-z0-9_/\s-]/g, '').split(/\s+/).filter(w => w.length >= 3)
  const stopWords = new Set(['the','and','for','that','this','with','from','have','are','was','not','but','you','all','can','has','had','were','they','their','them','its','also','into','more','some','than','then','when','will','each','about','which','other','been','being'])

  // Bigram frequency
  const bigramFreq = new Map<string, number>()
  for (let i = 0; i < words.length - 1; i++) {
    if (stopWords.has(words[i]) && stopWords.has(words[i+1])) continue
    const bg = words[i] + ' ' + words[i+1]
    bigramFreq.set(bg, (bigramFreq.get(bg) || 0) + 1)
  }

  // Take top 200 bigrams and assign 2-4 char abbreviations
  const top = [...bigramFreq.entries()]
    .filter(([,c]) => c >= 3)
    .sort((a,b) => b[1] - a[1])
    .slice(0, 200)

  const dict = new Map<string, string>()
  const chars = 'abcdefghijklmnopqrstuvwxyz'
  let ci = 0, cj = 0
  for (const [phrase] of top) {
    const abbr = chars[ci] + chars[cj]
    dict.set(phrase, abbr)
    cj++; if (cj >= 26) { cj = 0; ci++; if (ci >= 26) break }
  }

  return dict
}

const dictionary = generateDictionary(corpus)
console.log(`   Dictionary: ${dictionary.size} entries`)

// ── Step 4: Save to .toon/ ────────────────────────────────────────────────
const toonDir = join(root, '.toon', 'v3')
mkdirSync(toonDir, { recursive: true })

// Save BPE to engine.bin alongside existing chunks
const engineBinPath = join(toonDir, 'engine.bin')
let engineData: any = { chunks: [], invertedIndex: {}, bigramIndex: {}, docTree: {}, trainedAt: '', corpusSize: 0, chunkCount: 0 }
if (existsSync(engineBinPath)) {
  try { engineData = JSON.parse(readFileSync(engineBinPath, 'utf-8')) } catch {}
}
engineData.bpeTable = {
  merges: bpeTable.merges,
  vocab: Object.fromEntries(bpeTable.vocab),
  reverse: Object.fromEntries(bpeTable.reverse),
}
writeFileSync(engineBinPath, JSON.stringify(engineData, null, 2))

// Save dictionary
const dictPath = join(root, '.toon', 'dictionary.toon')
const dictLines = ['DICT v=novizio:0|hourbour:1|yvon-dashboard:2']
dictLines.push('DICT a=marcus:0|diana:1|dev:2|raj:3|mia:4|quinn:5|kai:6|lena:7|rio:8|nate:9|atlas:10|pixel:11|felix:12')
dictLines.push('DICT t=' + [...dictionary.entries()].map(([k,v]) => k+':'+v).join('|'))
dictLines.push('DICT s=today:0|this-week:1|critical:2|low:3')
writeFileSync(dictPath, dictLines.join('\n'))

console.log(`✅ Saved to ${toonDir}/engine.bin and ${join(root, '.toon', 'dictionary.toon')}`)
console.log(`   BPE: ${bpeTable.vocab.size} tokens, Dictionary: ${dictionary.size} entries`)
console.log('')
console.log('Top 20 dictionary entries:')
let shown = 0
for (const [phrase, abbr] of dictionary) {
  if (shown++ >= 20) break
  console.log(`   "${phrase}" → "${abbr}"`)
}
