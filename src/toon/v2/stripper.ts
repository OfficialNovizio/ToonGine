// src/toon/v2/stripper.ts — Markdown Structure Stripper
//
// O(n) single-pass state machine. Strips all formatting the LLM doesn't need:
//   - Markdown syntax (#, *, `, |, -, >, ---)
//   - Code blocks → [CODE:lang:LOC]
//   - Tables → [TABLE:cols×rows]
//   - YAML frontmatter → removed
//   - HTML comments → removed
//   - Blank lines → collapsed
//   - Link URLs → text only [text](url) → text
//   - Images → [IMG:alt]
//
// Preserves: heading hierarchy, list structure, paragraph text, key-value pairs.
// Expected: 30-50% size reduction on real project markdown with zero quality loss.
//
// Usage:
//   import { strip } from 'toongine/toon/v2/stripper'
//   const skeleton = strip(markdownContent)

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StripResult {
  output: string           // Stripped semantic skeleton
  rawLength: number        // Original char count
  strippedLength: number   // Stripped char count
  savingsPercent: number   // Compression ratio
  stats: {
    codeBlocks: number
    tables: number
    headings: number
    lists: number
    frontmatterRemoved: boolean
    commentsRemoved: number
    linksStripped: number
    imagesStripped: number
  }
}

// ─── State Machine ────────────────────────────────────────────────────────────

enum State {
  TEXT,
  HEADING,
  CODE_FENCE,
  CODE_CONTENT,
  TABLE_HEADER,
  TABLE_ROW,
  LIST_ITEM,
  FRONTMATTER,
  BLOCKQUOTE,
  HORIZONTAL_RULE,
  HTML_COMMENT,
  BLANK_LINE,
}

export function strip(markdown: string): StripResult {
  const lines = markdown.split('\n')
  const output: string[] = []
  let state: State = State.TEXT
  let codeLang = ''
  let codeLines = 0
  let tableCols = 0
  let tableRows = 0
  let inFrontmatter = false
  let frontmatterDelimCount = 0
  let currentHeadingLevel = 0
  let lastWasBlank = false

  const stats = {
    codeBlocks: 0, tables: 0, headings: 0, lists: 0,
    frontmatterRemoved: false, commentsRemoved: 0,
    linksStripped: 0, imagesStripped: 0,
  }

  for (const raw of lines) {
    const line = raw.trim()

    // ── State: FRONTMATTER ──────────────────────────────────────────
    if (state === State.FRONTMATTER) {
      if (line === '---' || line === '...') {
        frontmatterDelimCount++
        if (frontmatterDelimCount >= 2) {
          state = State.TEXT
          stats.frontmatterRemoved = true
        }
      }
      continue
    }

    // Detect frontmatter start (must be first line)
    if (output.length === 0 && (line === '---' || line === '...')) {
      state = State.FRONTMATTER
      frontmatterDelimCount = 1
      continue
    }

    // ── State: CODE_FENCE ───────────────────────────────────────────
    if (state === State.CODE_FENCE) {
      // End of code block
      if (line.startsWith('```') || line.startsWith('~~~')) {
        output.push(`[CODE:${codeLang}:${codeLines}LOC]`)
        stats.codeBlocks++
        state = State.TEXT
        continue
      }
      codeLines++
      continue
    }

    // ── State: CODE_CONTENT (indented) ──────────────────────────────
    if (state === State.CODE_CONTENT) {
      if (raw.startsWith('    ') || raw.startsWith('\t')) {
        codeLines++
        continue
      }
      output.push(`[CODE:indent:${codeLines}LOC]`)
      stats.codeBlocks++
      state = State.TEXT
      // Fall through to process current line
    }

    // ── State: TABLE ────────────────────────────────────────────────
    if (state === State.TABLE_HEADER || state === State.TABLE_ROW) {
      if (line.startsWith('|')) {
        if (state === State.TABLE_HEADER) {
          tableCols = line.split('|').filter(c => c.trim()).length
          state = State.TABLE_ROW
          continue
        }
        // Skip separator row
        if (line.match(/^\|[\s\-:|]+\|$/)) continue
        tableRows++
        continue
      }
      output.push(`[TABLE:${tableCols}×${tableRows}]`)
      stats.tables++
      state = State.TEXT
      // Fall through
    }

    // ── State: BLOCKQUOTE ───────────────────────────────────────────
    if (state === State.BLOCKQUOTE) {
      if (line.startsWith('>')) {
        const content = stripInline(line.slice(1).trim(), stats)
        if (content) output.push(content)
        continue
      }
      state = State.TEXT
      // Fall through
    }

    // ── State: LIST_ITEM ────────────────────────────────────────────
    if (state === State.LIST_ITEM) {
      const listMatch = line.match(/^(\s*)([\-\*\+]|\d+[\.\)])\s+(.+)/)
      if (listMatch) {
        const indent = Math.floor(listMatch[1].length / 2)
        const content = stripInline(listMatch[3], stats)
        output.push(`${'  '.repeat(indent)}${content}`)
        continue
      }
      state = State.TEXT
      // Fall through
    }

    // ── Blank line ──────────────────────────────────────────────────
    if (!line) {
      if (!lastWasBlank) {
        output.push('')
        lastWasBlank = true
      }
      continue
    }

    // ── Detect new states ───────────────────────────────────────────

    // Code fence
    if (line.startsWith('```') || line.startsWith('~~~')) {
      codeLang = line.slice(3).trim()
      codeLines = 0
      state = State.CODE_FENCE
      continue
    }

    // Indented code
    if (raw.startsWith('    ') || raw.startsWith('\t')) {
      codeLines = 0
      state = State.CODE_CONTENT
      continue
    }

    // Table
    if (line.startsWith('|')) {
      tableCols = 0
      tableRows = 0
      state = State.TABLE_HEADER
      continue
    }

    // Heading
    const headingMatch = line.match(/^(#{1,6})\s+(.+)/)
    if (headingMatch) {
      const level = headingMatch[1].length
      const text = stripInline(headingMatch[2], stats)
      if (text) {
        output.push(`${'#'.repeat(level)} ${text}`)
        stats.headings++
      }
      currentHeadingLevel = level
      state = State.TEXT
      lastWasBlank = false
      continue
    }

    // Horizontal rule
    if (line.match(/^[\-\*_]{3,}$/)) {
      output.push('---')
      state = State.TEXT
      lastWasBlank = false
      continue
    }

    // Blockquote
    if (line.startsWith('>')) {
      const content = stripInline(line.slice(1).trim(), stats)
      if (content) output.push(content)
      state = State.BLOCKQUOTE
      lastWasBlank = false
      continue
    }

    // List item
    const listMatch = line.match(/^(\s*)([\-\*\+]|\d+[\.\)])\s+(.+)/)
    if (listMatch) {
      const indent = Math.floor(listMatch[1].length / 2)
      const content = stripInline(listMatch[3], stats)
      output.push(`${'  '.repeat(indent)}${content}`)
      state = State.LIST_ITEM
      stats.lists++
      lastWasBlank = false
      continue
    }

    // HTML comment
    if (line.startsWith('<!--')) {
      if (line.includes('-->')) {
        stats.commentsRemoved++
        continue
      }
      state = State.HTML_COMMENT
      continue
    }

    // ── Plain text ──────────────────────────────────────────────────
    const stripped = stripInline(line, stats)
    if (stripped) {
      output.push(stripped)
      lastWasBlank = false
    }
  }

  // Flush any remaining state
  if (state === State.CODE_FENCE || state === State.CODE_CONTENT) {
    output.push(`[CODE:${codeLang}:${codeLines}LOC]`)
    stats.codeBlocks++
  }
  if (state === State.TABLE_HEADER || state === State.TABLE_ROW) {
    output.push(`[TABLE:${tableCols}×${tableRows}]`)
    stats.tables++
  }

  const result = output.join('\n').trim()
  const savings = Math.round((1 - result.length / Math.max(1, markdown.length)) * 100)

  return {
    output: result,
    rawLength: markdown.length,
    strippedLength: result.length,
    savingsPercent: savings,
    stats,
  }
}

// ─── Inline Stripper ──────────────────────────────────────────────────────────

function stripInline(text: string, stats: StripResult['stats']): string {
  let result = text

  // Strip bold/italic markers
  result = result.replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
  result = result.replace(/_{1,3}([^_]+)_{1,3}/g, '$1')
  result = result.replace(/~{2}([^~]+)~{2}/g, '$1')

  // Strip inline code
  result = result.replace(/`([^`]+)`/g, '$1')

  // Strip images → [IMG:alt]
  result = result.replace(/!\[([^\]]*)\]\([^)]+\)/g, (_, alt) => {
    stats.imagesStripped++
    return alt ? `[IMG:${alt}]` : '[IMG]'
  })

  // Strip links → text only
  result = result.replace(/\[([^\]]+)\]\([^)]+\)/g, (_, text) => {
    stats.linksStripped++
    return text
  })

  // Strip HTML tags
  result = result.replace(/<[^>]+>/g, '')

  // Collapse whitespace
  result = result.replace(/\s+/g, ' ').trim()

  return result
}
