# TOON v3 — Complete Architecture Breakdown
>
> Target: 90-98% consistent efficiency across ALL paths.
> Fail-safe: any path below 90% → break and redesign that path.

## WORKING TREE CHART

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        YVON TOON v3 ENGINE                                   │
│                     Query-Aware Progressive Loading                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
        ┌─────────────┬───────────────┼───────────────┬─────────────┐
        ▼             ▼               ▼               ▼             ▼
   ┌─────────┐  ┌──────────┐  ┌────────────┐  ┌──────────┐  ┌──────────┐
   │ DOCUMENT│  │  MEMORY  │  │   PROMPT   │  │   API    │  │  SESSION │
   │  PATH   │  │   PATH   │  │    PATH    │  │ RESPONSE │  │   DELTA  │
   └────┬────┘  └────┬─────┘  └─────┬──────┘  └────┬─────┘  └────┬─────┘
        │            │              │              │             │
        ▼            ▼              ▼              ▼             ▼
   ┌─────────┐  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐
   │ STRIP   │  │ STRIP   │   │ABBREV   │   │ DECODE  │   │  DIFF   │
   │ 43%     │  │ 9-29%   │   │ 28-36%  │   │ TOON→   │   │ 90-98%  │
   │         │  │         │   │         │   │ HUMAN   │   │         │
   └────┬────┘  └────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘
        │            │              │              │             │
        ▼            ▼              ▼              ▼             ▼
   ┌─────────┐  ┌─────────┐   ┌──────────┐  ┌──────────┐  ┌──────────┐
   │ CHUNK   │  │ EXTRACT │   │STRUCTURE │  │  PARSE   │  │  MERGE   │
   │ by ##   │  │ sections│   │ DETECT   │  │ segments │  │  into    │
   │         │  │         │   │ JSON/KV  │  │          │  │  context │
   └────┬────┘  └────┬─────┘   └────┬──────┘  └────┬─────┘  └────┬─────┘
        │            │              │              │             │
        ▼            ▼              ▼              ▼             ▼
   ┌─────────┐  ┌─────────┐   ┌──────────┐  ┌──────────┐  ┌──────────┐
   │ INDEX   │  │ INDEX   │   │  TOON.   │  │ EXPAND   │  │  CACHE   │
   │ stem+kws│  │ stem+kws│   │  DENSE() │  │ abbrev   │  │  prev    │
   │         │  │         │   │  41%     │  │          │  │  state   │
   └────┬────┘  └────┬─────┘   └────┬──────┘  └────┬─────┘  └────┬─────┘
        │            │              │              │             │
        ▼            ▼              ▼              ▼             ▼
   ┌─────────┐  ┌─────────┐   ┌──────────┐  ┌──────────┐  ┌──────────┐
   │ MATCH   │  │ MATCH   │   │ INJECT   │  │ INJECT   │  │ INJECT   │
   │ query   │  │ agent   │   │ into     │  │ into     │  │ only     │
   │ → chunks│  │ role→mem│   │ prompt   │  │ SSE      │  │ changed  │
   └────┬────┘  └────┬─────┘   └────┬──────┘  └────┬─────┘  └────┬─────┘
        │            │              │              │             │
        ▼            ▼              ▼              ▼             ▼
   ┌─────────┐  ┌─────────┐   ┌──────────┐  ┌──────────┐  ┌──────────┐
   │ INJECT  │  │ INJECT  │   │          │  │          │  │          │
   │ L1/L2   │  │ L1/L2   │   │  90-98%  │  │  85-95%  │  │  95-99%  │
   │ by score│  │ by score│   │ CONSIST  │  │ CONSIST  │  │ CONSIST  │
   └────┬────┘  └────┬─────┘   └──────────┘  └──────────┘  └──────────┘
        │            │
        ▼            ▼
   ┌─────────────────────────────────┐
   │         CIE RESOLVER            │
   │    On-demand chunk expansion    │
   │    LLM asks → CIE loads L3      │
   │    from .toon/v3/chunks/[hash]  │
   └─────────────────────────────────┘
```

## PATH 1: DOCUMENT INJECTION (123 files)

### Flow
```
integrate (once):
  read CLAUDE.md (14,252 chars)
  → strip() → 8,111 chars (43%)
  → chunk() → 26 chunks by ## headings
  → stem() → normalize keywords per chunk [porter stemmer]
  → index() → inverted index: keyword → [chunk_ids]
  → summarize() → L1 (heading), L2 (first sentence), L3 (full text)
  → store() → .toon/v3/chunks/CLAUDE.md/[chunk_id].json

every Claude call:
  query → extractKeywords() → stem each word
  → match() → for each doc: query ∩ chunk.keywords
  → score() → match_count + heading_bonus + position_weight
  → HIGH (≥3 matches) → inject L2 (first sentence, 30-80 chars)
  → MED (1-2 matches) → inject L1 (heading, 5-15 chars)
  → NONE → inject [REF:hash] (12 chars)
  → assemblePrompt() → nav_tree + matched_chunks + reference_hashes
```

### Critical Algorithm: Porter Stemmer + TF-IDF match
```
stem("deployment") = "deploy"
stem("deploying")  = "deploy"  
stem("deployed")   = "deploy"
→ All match the same keyword index entry
→ Fixes the "deployment error" → 12 chars problem
→ Expected: 5-8x more matches, 300-500 chars instead of 12
```

### Weak Points & Fail-safes
| Weak Point | Risk | Fail-safe |
|------------|------|-----------|
| Stemmer misses compound words | "database_schema" → no match | Bigram index: also index word pairs |
| Chunk split breaks related content | Section split at wrong heading | Overlap window: each chunk includes ±1 neighbor heading |
| L2 summary (first sentence) too vague | "This section covers..." → useless | If L2 <20 chars or starts with "This/I/It", use keywords as summary |
| Query has zero keyword matches | 0 chunks injected | Fallback: inject document titles + H2 tree (always, ~200 chars) |
| Efficiency drops below 90% | Cost spike | Auto-trigger: re-index with expanded keyword set |

### Target Efficiency
```
CLAUDE.md:     14,252 → ~400 chars = 97%  (was 43% v2)
Phase 8 Plan:   3,498 → ~200 chars = 94%  (was 30% v2)
All 123 docs: 112,846 → ~3,500 chars = 97% (was 41% v2)
```

---

## PATH 2: MEMORY INJECTION (13 agents)

### Flow
```
integrate (once):
  read agent-department/CEO/marcus/MEMORY.md (8,221 chars)
  → strip() → 7,504 chars (9%)
  → extract() → sections by ## + key-value pairs
  → index() → keyword index per section
  → tag() → tag sections: [preference], [decision], [context], [skill], [tool]
  → summarize() → L1 (section heading), L2 (key-value pairs)

every Claude call with agentId="marcus":
  → getAgentRole(agentId) → ["CEO", "direction", "strategy", "synthesis"]
  → match() → agent_role ∩ memory_section_tags
  → ALWAYS inject: [preference] sections (how agent should behave)
  → QUERY match: [decision] + [context] matching user query
  → SKIP: [tool] + [skill] sections (loaded separately by CIE)
```

### Critical Algorithm: Role-Aware Memory Scoring
```
agentRole tags for "marcus" = {ceo:1.0, strategy:0.8, synthesis:0.7, direction:0.9}
section tags = {preference:1.0, decision:0.6, context:0.4, skill:0.0, tool:0.0}

score = Σ (agentRole[tag] × sectionTag[tag]) + query_match_bonus

Always keep: sections with preference tag (score >0.8)
Query-dependent: decision + context sections (if query matches)
Always drop: skill + tool sections (tag score = 0.0)

→ Keeps ~20% of memory = 1,500 chars (82% savings)
→ With stemmer: ~800 chars (90% savings)
```

### Weak Points & Fail-safes
| Weak Point | Risk | Fail-safe |
|------------|------|-----------|
| Agent role tags are hardcoded | New agent types miss context | Scan MEMORY.md headings → auto-tag |
| Critical preference missed | Agent behaves wrong | Preference sections ALWAYS injected regardless of score |
| Memory grows over time | Kept sections exceed budget | Cap at 1,000 chars. If >1,000, trim lowest-scored sections |

### Target Efficiency
```
Marcus MEMORY:   8,221 → ~800 chars = 90%  (was 29% v2)
All 13 agents:  71,890 → ~6,000 chars = 92% (was 26% v2)
```

---

## PATH 3: PROMPT COMPRESSION (user messages)

### Flow
```
every Claude call:
  userMessage (290 chars)
  → detectStructure() 
    ├─ JSON blocks → toon.dense() → [TOON:decision]...[/TOON] (41% savings)
    ├─ bullet lists → encodePrompt() → L| records (22% savings)
    ├─ key-value → K| records (22% savings)
    └─ free text → abbreviateText() + remove fillers (28-36% savings)
  → compressPrompt() → 185 chars (36% savings)
```

### Target: 40-50% (not 90% — prompts are already concise)
```
Raw prompt:      290 chars
Compressed:      160 chars = 45% savings
Cost Opus:       $0.00060/call (negligible either way)
```

### Weak Points
| Weak Point | Fix |
|------------|-----|
| JSON detection regex fragile | Use JSON.parse() try/catch instead |
| Abbreviation collisions | Already filtered to ≥3 char abbreviations |
| Structure detection misses mixed content | Multi-pass: JSON first, then lists, then KV |

---

## PATH 4: API RESPONSE (Claude output)

### Flow
```
Claude SSE stream:
  text_delta events → buffer
  → detectToon() → does output contain TOON records?
    ├─ YES → decodeToonResponse() → expand to human text → stream to client
    └─ NO  → pass through raw
```

### Current State
```
Decoder fixed (✅). But never called in SSE stream.
Need to wire: buffer chunks, detect TOON pattern, decode before sending to client.
```

### Target: 85-95% savings on structured output
```
Claude output (raw JSON):     5,000 chars
Claude output (TOON dense):   2,500 chars (50% savings on Claude's side)
Decoded for human:            5,000 chars (expanded back to readable)
→ Cost savings on OUTPUT tokens (Opus $75/M output!)
→ $0.375 → $0.187 per response = $0.188 saved per call
```

---

## PATH 5: SESSION DELTA (multi-turn)

### Flow
```
Turn 1:
  inject docs + memory → 1,200 chars
  saveState(turnId, {docHashes: [...], memHashes: [...]})

Turn 2:
  computeDelta(turn1State, currentState)
  → changedDocs = docs with different hashes
  → changedMems = mems with different hashes
  → inject only changed content + [SAME:turn1_refs]
  → 1,200 → 80 chars (93% savings)

Turn 3-10:
  → 1,200 → 30 chars avg (97% savings)
```

### Critical Algorithm: Content-Addressable Delta
```
hash(content) = SHA-256(content).slice(0, 16) → 16-char hex fingerprint
delta(prev, curr) = {
  added: curr.hashes - prev.hashes,
  removed: prev.hashes - curr.hashes,
  changed: {hash: newHash for hash in prev ∩ curr where content changed}
}
inject: only added + changed chunks. Reference unchanged ones.
```

### Target: 95-99% for repeated content
```
10-turn conversation savings: 87-97% additional
Combined with query-aware: $109/yr → $15/yr
```

---

## CRITICAL ALGORITHMS SUMMARY

| Algorithm | Complexity | Purpose | Weak Point |
|-----------|-----------|---------|------------|
| Porter Stemmer | O(n) per word | Normalize keywords | Non-English words, acronyms |
| Inverted Index | O(1) lookup | Keyword→chunk mapping | Memory for large docs |
| Cosine Match (v3.1) | O(k×n) | Semantic chunk scoring | Needs embeddings |
| Content Hash | O(n) SHA-256 | Change detection | 16-char collision risk 1:4B |
| Chunk Boundary | O(n) single pass | Split by headings | Malformed markdown |
| Score Threshold | O(1) | Keep/drop decision | Static threshold vs adaptive |

## FAIL-SAFE: Auto-Break on Efficiency Drop

```typescript
function monitor(savings: number, path: string): void {
  if (savings < 90 && path !== 'prompt') {
    console.error(`❌ ${path}: ${savings}% — BELOW 90%, BREAKING`);
    // 1. Expand keyword index (add bigrams)
    // 2. Lower match threshold (2→1)
    // 3. Add fallback sections (H1/H2 tree)
    // 4. If still <90%: fall back to full stripped text for that path
    // 5. Log failure for manual review
  }
}
```

## OPUS COST — ALL PATHS COMBINED (100 calls/day)

| Path | Raw/yr | v2/yr | v3/yr | Savings |
|------|--------|-------|-------|---------|
| Documents | $3,555 | $2,471 | **$55** | 98% |
| Memory | $1,850 | $1,480 | **$185** | 90% |
| Prompts | $108 | $69 | **$60** | 44% |
| API Output | $1,875 | $1,875 | **$937** | 50% |
| Session Delta | — | — | **$15** | 99% |
| **TOTAL** | **$7,388** | **$5,895** | **$1,252** | **83%** |

### Per-call breakdown (Opus)
```
Documents:  $0.0015  (was $0.0534)
Memory:     $0.0030  (was $0.0308)
Prompt:     $0.0006  (was $0.0011)
API Output: $0.0375  (was $0.0750)
Delta:      $0.0002  (was $0.0852 for full reload)
─────────────────────────────────
TOTAL:      $0.0428/call  (was $0.2455)
            $4.28/day     (was $24.55)
            $128/month    (was $737)
            $1,252/year   (was $7,388)
```

**83% total cost reduction. $7,388 → $1,252/year.**
