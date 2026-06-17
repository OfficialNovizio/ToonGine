// src/toon/dictionary-builder.ts — Builds project-specific abbreviation dictionary
// Scans all .md files, finds frequent multi-word phrases, proposes abbreviations

import * as fs from 'fs'
import * as path from 'path'

interface TermFreq {
  phrase: string
  count: number
  abbreviation: string
}

export function buildDictionary(projectRoot: string, minFreq = 5): Record<string, string> {
  // Collect all .md content
  const allText: string[] = []
  
  function collect(dir: string) {
    if (!fs.existsSync(dir)) return
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.next' || entry.name === '.toon')
        continue
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        collect(full)
      } else if (entry.name.endsWith('.md')) {
        try {
          allText.push(fs.readFileSync(full, 'utf-8'))
        } catch {}
      }
    }
  }
  
  collect(path.join(projectRoot, '.toon', 'agents'))
  collect(path.join(projectRoot, 'docs'))
  
  // Extract frequent 2-4 word phrases
  const phraseCounts: Map<string, number> = new Map()
  const wordRegex = /[A-Z][a-z]+(?:\s+[a-z]+){1,3}/g
  
  for (const text of allText) {
    const matches = text.match(wordRegex) || []
    for (const match of matches) {
      const lower = match.toLowerCase()
      if (match.length > 10 && match.length < 50 && !match.match(/^[A-Z]/)) continue
      phraseCounts.set(lower, (phraseCounts.get(lower) || 0) + 1)
    }
  }
  
  // Filter frequent phrases and generate abbreviations
  const dict: Record<string, string> = {}
  const sorted = Array.from(phraseCounts.entries())
    .filter(([_, count]) => count >= minFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 200)
  
  for (const [phrase, count] of sorted) {
    const words = phrase.split(/\s+/)
    const abbrev = words.map(w => w[0].toUpperCase()).join('')
    // Avoid collisions
    if (!Object.values(dict).includes(abbrev)) {
      dict[phrase] = abbrev
    }
  }
  
  return dict
}

// CLI
if (require.main === module) {
  const root = process.argv[2] || process.cwd()
  const dict = buildDictionary(root)
  console.log(JSON.stringify(dict, null, 2))
}
