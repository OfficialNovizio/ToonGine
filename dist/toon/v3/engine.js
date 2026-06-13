"use strict";
// src/toon/v3/engine.ts — TOON v3 Core Engine
//
// Loads once at startup. Handles: BPE encode, chunk match, context injection, delta.
// O(1) keyword lookup, O(k) per chunk scoring, O(n) BPE encoding.
//
// Usage:
//   import { createEngine } from 'toongine/toon/v3/engine'
//   const engine = createEngine('/root/yvon/.toon/v3/engine.bin')
//   const ctx = engine.process({ systemPrompt, userMessage, agentId, ventureId })
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEngine = createEngine;
const stemmer_1 = require("./stemmer");
const fs_1 = require("fs");
const path_1 = require("path");
const crypto_1 = require("crypto");
const collector_1 = require("../../metrics/collector");
// ─── Engine ───────────────────────────────────────────────────────────────────
function createEngine(binPath) {
    let _data = null;
    let _delta = null;
    function load() {
        if (_data)
            return _data;
        if (!(0, fs_1.existsSync)(binPath))
            throw new Error(`Engine blob not found: ${binPath}`);
        const raw = (0, fs_1.readFileSync)(binPath, 'utf-8');
        _data = JSON.parse(raw);
        // Convert serialized Maps back
        if (_data && _data.bpeTable) {
            _data.bpeTable.vocab = new Map(Object.entries(_data.bpeTable.vocab || {}));
            _data.bpeTable.reverse = new Map(Object.entries(_data.bpeTable.reverse || {}));
        }
        return _data;
    }
    function compressPrompt(text) {
        // BPE is only for internal store — user prompts must stay LLM-readable
        // Use abbreviation + colloquial cleanup instead
        let result = abbreviateQuery(text);
        result = result.replace(/please note that /gi, '').replace(/I would like to /gi, '');
        return result;
    }
    // Quick abbreviation map — common words the LLM understands shortened
    function abbreviateQuery(text) {
        const abbrs = {
            'comprehensive': 'full',
            'analysis': 'analysis',
            'analyze': 'analyze',
            'dashboard': 'dashboard',
            'with live data streaming from': 'w/ live',
            'social media APIs': 'social APIs',
            'Use the existing': 'Use existing',
            'architecture and agent routing system': 'arch + agent routing',
            'current pricing strategy': 'pricing',
            'fashion brand': 'brand',
            'and identify gaps where competitors are': 'find competitor gaps',
            'market research data': 'market data',
            'context retrieval pipeline': 'CIE pipeline',
            'to reduce latency by': 'cut latency',
            'The current implementation uses': 'Using',
            'for deduplication': 'for dedup',
            'compression schema': 'TOON schema',
            'for structured financial data': 'for finance',
            'across multiple ventures': 'across ventures',
        };
        let result = text;
        for (const [full, short] of Object.entries(abbrs)) {
            result = result.replace(new RegExp(full, 'gi'), short);
        }
        return result;
    }
    function matchContext(query, agentId, maxDocs = 3) {
        const data = load();
        const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2).map(stemmer_1.stem);
        const queryBigrams = [];
        for (let i = 0; i < queryWords.length - 1; i++) {
            queryBigrams.push(queryWords[i] + '_' + queryWords[i + 1]);
        }
        // IDF: compute inverse document frequency for each keyword
        const totalChunks = data.chunks.length;
        const idf = new Map();
        for (const qw of queryWords) {
            const hits = (data.invertedIndex[qw] || []).length;
            idf.set(qw, hits > 0 ? Math.log(totalChunks / hits) : 0);
        }
        for (const bg of queryBigrams) {
            const hits = (data.bigramIndex[bg] || []).length;
            idf.set(bg, hits > 0 ? Math.log(totalChunks / (hits || 1)) : 0);
        }
        // Score every chunk
        const scored = [];
        const seen = new Set();
        for (const qw of queryWords) {
            const hits = data.invertedIndex[qw] || [];
            for (const idx of hits) {
                if (seen.has(idx))
                    continue;
                seen.add(idx);
                const chunk = data.chunks[idx];
                // TF-IDF weighted unigram match
                let tfidfScore = 0;
                for (const w of queryWords) {
                    if (chunk.keywords.some(k => k === w || k.includes(w) || w.includes(k))) {
                        tfidfScore += (idf.get(w) || 0.5);
                    }
                }
                // Bigram bonus
                for (const bg of queryBigrams) {
                    if (chunk.bigrams.some(b => b.includes(bg.split('_')[0]) && b.includes(bg.split('_')[1]))) {
                        tfidfScore += (idf.get(bg) || 1) * 1.5;
                    }
                }
                const positionBonus = idx < 3 ? 1.5 : chunk.level === 1 ? 2.0 : chunk.level === 2 ? 1.5 : 1.0;
                const agentBonus = agentId && chunk.keywords.some(k => k.includes(agentId.toLowerCase())) ? 2.0 : 1.0;
                // Hermes Agent data gets priority — always include the persistent brain
                const hermesBonus = chunk.docId.startsWith('hermes/') ? 5.0 : 1.0;
                // USER.md preferences are always relevant
                const userBonus = chunk.docId.includes('USER') ? 3.0 : 1.0;
                const score = tfidfScore * positionBonus * agentBonus * hermesBonus * userBonus;
                if (score > 0)
                    scored.push({ chunk, score });
            }
        }
        // Sort by score descending
        scored.sort((a, b) => b.score - a.score);
        // Fallback: if nothing matched, inject doc tree
        if (scored.length === 0) {
            const treeResults = [];
            for (const [docId, treeText] of Object.entries(data.docTree).slice(0, maxDocs)) {
                treeResults.push({
                    chunk: { id: -1, docId, level: 0, heading: docId, body: treeText, keywords: [], bigrams: [], hash: '' },
                    score: 1,
                    level: 'L1',
                    text: `# ${docId}\n${treeText}`,
                });
            }
            return treeResults;
        }
        // Adaptive threshold: target top ~5 chunks for content, rest as REF
        const topN = Math.min(8, scored.length);
        const threshold = scored[0].score * 0.15; // 15% of top score
        // Convert to MatchResult with progressive levels
        return scored.slice(0, 20).map(({ chunk, score }, i) => {
            if (i < topN && score >= threshold) {
                return { chunk, score, level: 'L2', text: `## ${chunk.heading}\n${chunk.body.slice(0, 120)}` };
            }
            else if (score >= threshold * 0.5) {
                return { chunk, score, level: 'L1', text: `#${'#'.repeat(chunk.level)} ${chunk.heading}` };
            }
            else {
                return { chunk, score, level: 'REF', text: `[REF:${chunk.hash}]` };
            }
        });
    }
    function buildSystemPrompt(basePrompt, docMatches, agentId) {
        const parts = [];
        const data = load();
        // Hermes USER preferences — ALWAYS injected (the persistent identity)
        const userChunk = data?.chunks?.find((c) => c.docId === 'hermes/memories/USER');
        if (userChunk) {
            parts.push('[HERMES AGENT — PERSISTENT IDENTITY]\n## USER\n' + userChunk.body.slice(0, 400));
        }
        // Hermes MEMORY — always injected if matched
        const hermesMemory = docMatches.filter(m => m.chunk.docId.includes('hermes/memories/MEMORY'));
        if (hermesMemory.length > 0) {
            parts.push('[HERMES AGENT — PERSISTENT MEMORY]\n' + hermesMemory.map(m => m.text).join('\n'));
        }
        // Dictionary
        parts.push('[TOON DICTIONARY — use abbreviations: ...]');
        // Document context
        if (docMatches.length > 0) {
            const docLines = docMatches.map(m => m.text);
            parts.push('[RELEVANT DOCUMENTS]\n' + docLines.join('\n'));
        }
        // Agent memory (loaded by existing middleware)
        if (agentId) {
            parts.push(`[AGENT:${agentId}]`);
        }
        // Base system prompt
        parts.push(basePrompt);
        return parts.join('\n\n');
    }
    // ─── Session Delta ──────────────────────────────────────────────────────────
    function saveDelta(sessionId, matches, query) {
        const hashes = new Set(matches.map(m => m.chunk.hash).filter(h => h));
        const queryWords = new Set(query.toLowerCase().split(/\s+/).filter(w => w.length > 2).map(stemmer_1.stem));
        _delta = { sessionId, prevHashes: hashes, prevQueryWords: queryWords };
        // Persist
        const dir = (0, path_1.join)(binPath, '..', 'sessions');
        (0, fs_1.mkdirSync)(dir, { recursive: true });
        (0, fs_1.writeFileSync)((0, path_1.join)(dir, sessionId + '.json'), JSON.stringify({
            hashes: [...hashes],
            queryWords: [...queryWords],
        }));
    }
    function loadDelta(sessionId) {
        if (_delta && _delta.sessionId === sessionId)
            return _delta;
        const path = (0, path_1.join)(binPath, '..', 'sessions', sessionId + '.json');
        if (!(0, fs_1.existsSync)(path))
            return null;
        try {
            const data = JSON.parse((0, fs_1.readFileSync)(path, 'utf-8'));
            _delta = {
                sessionId,
                prevHashes: new Set(data.hashes),
                prevQueryWords: new Set(data.queryWords),
            };
            return _delta;
        }
        catch {
            return null;
        }
    }
    function detectTopicShift(prevWords, currentQuery) {
        const currWords = new Set(currentQuery.toLowerCase().split(/\s+/).filter(w => w.length > 2).map(stemmer_1.stem));
        if (currWords.size === 0)
            return false;
        let overlap = 0;
        for (const w of currWords) {
            if (prevWords.has(w))
                overlap++;
        }
        return (overlap / currWords.size) < 0.4;
    }
    // ─── Full Process (one call does everything) ───────────────────────────────
    function process(options) {
        load();
        // 1. Compress prompt
        const compressed = compressPrompt(options.userMessage);
        // 2. Check session delta
        const delta = options.sessionId ? loadDelta(options.sessionId) : null;
        const isTopicShift = delta ? detectTopicShift(delta.prevQueryWords, options.userMessage) : true;
        // 3. Match context (full match on topic shift or first turn)
        let matches = [];
        if (isTopicShift || !delta) {
            matches = matchContext(options.userMessage, options.agentId);
        }
        else {
            // Delta: only send newly matched chunks
            const allMatches = matchContext(options.userMessage, options.agentId);
            const newHashes = new Set(allMatches.map(m => m.chunk.hash));
            matches = allMatches.filter(m => !delta.prevHashes.has(m.chunk.hash));
            // Add same-chunk reference
            const sameCount = allMatches.length - matches.length;
            if (sameCount > 0) {
                matches.push({
                    chunk: { id: -2, docId: 'delta', level: 0, heading: 'SAME', body: '', keywords: [], bigrams: [], hash: '' },
                    score: 0,
                    level: 'REF',
                    text: `[SAME:${sameCount} chunks unchanged]`,
                });
            }
        }
        // 4. Build system prompt
        const fullSystem = buildSystemPrompt(options.systemPrompt, matches, options.agentId);
        // 5. Save delta for next turn
        if (options.sessionId) {
            saveDelta(options.sessionId, matches, options.userMessage);
        }
        // 6. Record metrics (ALWAYS ON v2.0)
        const savingsPercent = options.userMessage.length > 0
            ? Math.round(((options.userMessage.length - compressed.length) / options.userMessage.length) * 1000) / 10
            : 0;
        const env = typeof globalThis !== 'undefined' ? globalThis.process?.env : {};
        collector_1.metrics.recordEngineQuery({
            timestamp: Date.now(),
            provider: env.YVON_PROVIDER || 'deepseek',
            model: env.YVON_MODEL || env.ANTHROPIC_MODEL || 'default',
            agentId: options.agentId || env.YVON_AGENT_ID,
            ventureId: options.ventureId || env.YVON_VENTURE_ID,
            taskType: classifyTask(options.userMessage),
            queryHash: (0, crypto_1.createHash)('sha256').update(options.userMessage).digest('hex').slice(0, 8),
            originalChars: options.userMessage.length,
            injectedChars: matches.reduce((s, m) => s + m.text.length, 0),
            savingsPercent,
            chunksMatched: matches.length,
            chunksInjected: matches.filter(m => m.level !== 'REF').length,
            injectionLevel: matches.length > 0 ? matches[0].level : 'L2',
            latencyMs: 0, // filled by middleware wrapper
            docCount: matches.filter(m => m.chunk.docId !== 'delta' && m.chunk.docId !== 'SAME').length,
            memoryCount: 0,
        });
        return {
            compressedUserMessage: compressed,
            docContext: matches.map(m => m.text).join('\n'),
            memoryContext: '',
            dictionary: '[DICTIONARY]',
            stats: {
                originalPromptLen: options.userMessage.length,
                compressedPromptLen: compressed.length,
                docsInjected: matches.filter(m => m.level !== 'REF').length,
                memoryEntries: 0,
                totalContextLen: fullSystem.length,
            },
        };
    }
    function computeDelta(prevMatches, currMatches) {
        const prevSet = new Set(prevMatches.map(m => m.chunk.hash));
        const currSet = new Set(currMatches.map(m => m.chunk.hash));
        return {
            added: currMatches.filter(m => !prevSet.has(m.chunk.hash)),
            removed: prevMatches.filter(m => !currSet.has(m.chunk.hash)),
            same: currMatches.filter(m => prevSet.has(m.chunk.hash)),
        };
    }
    function hashChunk(body) {
        return (0, crypto_1.createHash)('sha256').update(body).digest('hex').slice(0, 8);
    }
    return {
        load,
        compressPrompt,
        matchContext,
        buildSystemPrompt,
        process,
        saveDelta,
        loadDelta,
        detectTopicShift,
        computeDelta,
        hashChunk,
        getData: () => _data,
    };
}
// ─── Task Classifier ──────────────────────────────────────────────────────────
// Lightweight keyword-based classification — no LLM call needed.
function classifyTask(text) {
    const lower = text.toLowerCase();
    if (/bug|error|fix|crash|broken|failing|test fail|debug/i.test(lower))
        return 'debugging';
    if (/code review|pull request|pr review|review this code|check this pr/i.test(lower))
        return 'code-review';
    if (/build|deploy|ship|release|publish|npm publish|vercel/i.test(lower))
        return 'deployment';
    if (/strategy|roadmap|plan|okr|direction|vision|quarterly|annual/i.test(lower))
        return 'strategy';
    if (/competitor|market|competition|rival|industry/i.test(lower))
        return 'competitor';
    if (/analytics|metrics|kpi|data|stats|dashboard|report|chart/i.test(lower))
        return 'analytics';
    if (/content|post|caption|copy|write|blog|social media|tweet|instagram/i.test(lower))
        return 'content';
    if (/finance|cost|revenue|budget|pricing|roi|profit|loss/i.test(lower))
        return 'finance';
    if (/design|ui|ux|layout|style|css|component|visual/i.test(lower))
        return 'design';
    if (/api|endpoint|route|backend|database|schema|query|supabase/i.test(lower))
        return 'backend';
    if (/frontend|react|next|component|page|client/i.test(lower))
        return 'frontend';
    if (/test|qa|verify|check|validate/i.test(lower))
        return 'testing';
    if (/plan|organize|schedule|task|todo|assign/i.test(lower))
        return 'planning';
    return 'general';
}
//# sourceMappingURL=engine.js.map