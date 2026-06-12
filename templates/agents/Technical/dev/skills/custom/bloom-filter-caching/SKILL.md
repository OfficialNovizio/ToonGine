---
name: bloom-filter-caching
description: Bloom filter caching strategy for YVON. Covers membership testing (seen before? cached?), false positive rate tuning, cache stampede prevention, and YVON-specific use cases (deduplicating competitor checks, seen-content filtering, rate limit pre-screening).
version: 1.0.0
---

## Purpose

A bloom filter is a probabilistic data structure that answers "has this item been seen before?" with zero false negatives and a tunable false positive rate. For YVON, this is the right tool when:
- You need to avoid re-fetching or re-processing content you've already seen
- You need a fast membership check before hitting Supabase (reduce DB queries)
- You need to pre-screen rate limit candidates before the full rate limit check
- You need to deduplicate competitor URLs, post IDs, or campaign assets before storing

**Key property:** A bloom filter never says "not seen" when it has been seen. It may say "seen" when it hasn't (false positive). Tune the false positive rate based on the cost of a false positive in your use case.

---

## How It Works

A bloom filter uses multiple hash functions mapped to a bit array:
- **Add item:** Hash the item with k functions, set k bits to 1
- **Check item:** Hash the item, check if all k bits are 1 — if any is 0, definitely not seen; if all are 1, probably seen

**False positive rate formula:**
`p ≈ (1 - e^(-kn/m))^k`
- `n` = number of items inserted
- `m` = bit array size
- `k` = number of hash functions (optimal: `k = (m/n) ln 2 ≈ 0.693 m/n`)

**Rule of thumb for YVON:**
- Expected < 10K items, 1% false positive rate → 95KB filter
- Expected < 100K items, 0.1% false positive rate → 1.8MB filter

---

## YVON-Specific Use Cases

### 1. Competitor URL Deduplication
Before fetching a competitor URL through Apify, check the bloom filter. False positive (skip a new URL) rate: acceptable at 1%. Saves Apify API credits on already-processed content.

### 2. Social Content Deduplication
Before inserting a post/content item into Supabase, check the bloom filter. Prevents duplicate rows from parallel ingestion jobs without a DB unique constraint check on every insert.

### 3. Rate Limit Pre-screening
Before a full Supabase rate_limits table lookup, check the bloom filter: "has this IP made a request in this window?" False positive → proceed to full check (safe). Eliminates 80–90% of DB queries on low-traffic IPs.

### 4. Seen-Content Filtering (Analytics)
Track which content items have already been scored/ranked this session. Avoids re-running expensive analytics computations on unchanged data.

---

## Implementation for YVON (Vercel + Supabase)

### Option A: In-Memory (per-request, small datasets)
```typescript
import { BloomFilter } from 'bloom-filters' // npm: bloom-filters

const filter = BloomFilter.create(10000, 0.01) // 10K items, 1% FP rate

// Add
filter.add(itemId)

// Check
if (filter.has(itemId)) {
  // probably seen — verify against DB if false positive cost is high
} else {
  // definitely not seen — skip DB check
}
```

### Option B: Persistent (across requests, Supabase storage)
Serialize the filter to a Buffer and store in Supabase storage or a `bloom_filters` table. Reload at route initialization. Flush back to storage after N additions.

```typescript
// Serialize
const serialized = Buffer.from(filter.saveAsJSON())

// Store in Supabase
await supabase.from('bloom_filters').upsert({
  filter_key: 'competitor_urls',
  venture_slug: ventureSlug,
  data: serialized.toString('base64'),
  updated_at: new Date().toISOString()
})

// Reload
const { data } = await supabase.from('bloom_filters')
  .select('data')
  .eq('filter_key', 'competitor_urls')
  .eq('venture_slug', ventureSlug)
  .single()

const filter = BloomFilter.fromJSON(JSON.parse(Buffer.from(data.data, 'base64').toString()))
```

### Option C: Edge Middleware (rate limit pre-screening only)
Keep a short-lived bloom filter in Edge middleware memory for IP pre-screening. Resets on cold start (acceptable — just falls back to full DB check).

---

## Dev's Approval Criteria for Bloom Filter Usage

Before approving any bloom filter implementation:
- [ ] Is the false positive rate defined and acceptable for this use case?
- [ ] Is there a fallback when the filter says "seen" but the item is actually new? (DB verification for high-cost false positives)
- [ ] Is the filter size bounded? Will it stay within memory limits at maximum expected item count?
- [ ] For persistent filters: is there a reset/rotation schedule when the filter approaches saturation?
- [ ] Is venture_slug scoping applied so Novizio and Hourbour filters don't contaminate each other?

---

## Package
`bloom-filters` (npm) — pure TypeScript, no native deps, works on Vercel Edge.
`npm install bloom-filters`
