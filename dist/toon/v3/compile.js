"use strict";
// src/toon/v3/compile.ts — Build engine.bin on toongine integrate
//
// Scans project docs + memories + Hermes Agent data, strips, chunks, indexes,
// trains BPE, and compiles everything into engine.bin.
// Hermes Agent (~/.hermes/) is the persistent brain — indexed with priority.
// Loaded once at first agent call, cached in memory forever.
Object.defineProperty(exports, "__esModule", { value: true });
exports.compile = compile;
const stripper_1 = require("../v2/stripper");
const stemmer_1 = require("./stemmer");
const bpe_1 = require("./bpe");
const crypto_1 = require("crypto");
const fs_1 = require("fs");
const path_1 = require("path");
const os_1 = require("os");
const collector_1 = require("../../metrics/collector");
function compile(options) {
    const startTime = Date.now();
    const root = options.projectRoot;
    const outPath = options.outPath || (0, path_1.join)(root, '.toon', 'v3', 'engine.bin');
    // 1. Collect all documents, memories, graphs, project configs + Hermes Agent data
    const docs = collectFiles((0, path_1.join)(root, 'docs'), '.md');
    const mems = [
        ...collectFiles((0, path_1.join)(root, 'agent-department'), '.md').filter(f => f.includes('MEMORY') || f.includes('AGENT')),
        ...collectFiles((0, path_1.join)(root, 'agent-memory'), '.md').filter(f => f.includes('MEMORY') || f.includes('AGENT')),
    ];
    const graphs = collectFiles((0, path_1.join)(root, 'graphify-out'), '.md');
    const graphJson = collectFiles((0, path_1.join)(root, 'graphify-out'), '.json');
    const claudeMd = (0, fs_1.existsSync)((0, path_1.join)(root, 'CLAUDE.md')) ? [(0, path_1.join)(root, 'CLAUDE.md')] : [];
    const supabaseMigrations = collectFiles((0, path_1.join)(root, 'supabase'), '.sql');
    const scriptsDir = collectFiles((0, path_1.join)(root, 'scripts'), '.mjs');
    const envTemplate = (0, fs_1.existsSync)((0, path_1.join)(root, '.env.example')) ? [(0, path_1.join)(root, '.env.example')] : [];
    // ─── Hermes Agent — the persistent brain (VPS) ───────────────────────────
    const hermesHome = (0, path_1.join)((0, os_1.homedir)(), '.hermes');
    const hermesMemories = (0, fs_1.existsSync)((0, path_1.join)(hermesHome, 'memories'))
        ? collectFiles((0, path_1.join)(hermesHome, 'memories'), '.md')
        : [];
    const hermesSkills = (0, fs_1.existsSync)((0, path_1.join)(hermesHome, 'skills'))
        ? collectFiles((0, path_1.join)(hermesHome, 'skills'), 'SKILL.md')
        : [];
    const hermesSessions = (0, fs_1.existsSync)((0, path_1.join)(hermesHome, 'sessions'))
        ? collectFiles((0, path_1.join)(hermesHome, 'sessions'), '.json')
        : [];
    // Also scan .toon/ directories if originals absorbed
    const toonDocs = collectFiles((0, path_1.join)(root, '.toon', 'docs'), '.toon');
    const toonMemory = collectFiles((0, path_1.join)(root, '.toon', 'memory'), '.toon');
    const toonGraphs = collectFiles((0, path_1.join)(root, '.toon', 'graphs'), '.toon');
    const toonProject = (0, fs_1.existsSync)((0, path_1.join)(root, '.toon', 'project', 'CLAUDE.md')) ? [(0, path_1.join)(root, '.toon', 'project', 'CLAUDE.md')] : [];
    const allFiles = [
        ...docs, ...mems, ...graphs, ...graphJson, ...claudeMd,
        ...supabaseMigrations, ...scriptsDir, ...envTemplate,
        ...toonDocs, ...toonMemory, ...toonGraphs, ...toonProject,
        ...hermesMemories, ...hermesSkills, ...hermesSessions,
    ];
    // 2. Strip + chunk all files
    const allChunks = [];
    const docTrees = {};
    const allText = [];
    let chunkId = 0;
    for (const file of allFiles) {
        if (!(0, fs_1.existsSync)(file))
            continue;
        const content = (0, fs_1.readFileSync)(file, 'utf-8');
        const stripped = (0, stripper_1.strip)(content);
        // Tag Hermes Agent data with 'hermes/' prefix for priority matching
        const resolvedFile = (0, path_1.resolve)(file);
        const resolvedHermesHome = (0, path_1.resolve)(hermesHome);
        let docId = (0, path_1.relative)(root, file).replace(/\.[^.]+$/, '');
        if (resolvedFile.startsWith(resolvedHermesHome)) {
            docId = 'hermes/' + (0, path_1.relative)(resolvedHermesHome, resolvedFile).replace(/\.[^.]+$/, '');
        }
        allText.push(stripped.output);
        // Build doc tree (H1/H2 headings only)
        const treeLines = [];
        const chunks = chunkDocument(stripped.output, docId, chunkId);
        // Fallback: files without markdown headings (Hermes memories, JSON, etc.)
        if (chunks.length === 0 && stripped.output.trim().length > 0) {
            const heading = docId.split('/').pop() || docId;
            chunks.push({
                id: chunkId,
                docId,
                level: 1,
                heading,
                body: stripped.output.trim().substring(0, 2000),
                keywords: extractKeywords(stripped.output.trim().substring(0, 2000), 50), // more keywords for non-markdown
                bigrams: [],
                hash: '',
            });
        }
        for (const c of chunks) {
            if (c.level <= 2)
                treeLines.push(`${'#'.repeat(c.level)} ${c.heading}`);
            c.hash = hashChunk(c.body);
            // Only extract keywords if not already set (fallback chunks have pre-set keywords)
            if (c.keywords.length === 0) {
                c.keywords = extractKeywords(c.body + ' ' + c.heading);
            }
            c.bigrams = extractBigrams(c.keywords);
            allChunks.push(c);
            chunkId++;
        }
        docTrees[docId] = treeLines.join('\n');
    }
    // 3. Build inverted index with IDF filtering
    // First pass: count document frequency per keyword
    const docFreq = new Map();
    for (const chunk of allChunks) {
        for (const kw of chunk.keywords) {
            docFreq.set(kw, (docFreq.get(kw) || 0) + 1);
        }
    }
    // Filter: only keep keywords that appear in <15% of chunks (distinctive)
    for (const chunk of allChunks) {
        chunk.keywords = chunk.keywords.filter(kw => (docFreq.get(kw) || 0) < allChunks.length * 0.15);
    }
    const invertedIndex = {};
    const bigramIndex = {};
    for (const chunk of allChunks) {
        for (const kw of chunk.keywords) {
            if (!Array.isArray(invertedIndex[kw]))
                invertedIndex[kw] = [];
            invertedIndex[kw].push(chunk.id);
        }
        for (const bg of chunk.bigrams) {
            if (!Array.isArray(bigramIndex[bg]))
                bigramIndex[bg] = [];
            bigramIndex[bg].push(chunk.id);
        }
    }
    // 4. Train BPE on all stripped text
    const corpus = allText.join(' ');
    const bpeTable = (0, bpe_1.trainBPE)(corpus, options.maxMergeIterations || 256);
    // 5. Compile to blob
    const engineData = {
        chunks: allChunks.map(c => ({ ...c, body: c.body.slice(0, 500) })), // cap body size
        invertedIndex,
        bigramIndex,
        bpeTable: {
            merges: bpeTable.merges,
            vocab: Object.fromEntries(bpeTable.vocab.entries()),
            reverse: Object.fromEntries(bpeTable.reverse.entries()),
        },
        docTree: docTrees,
        trainedAt: new Date().toISOString(),
        corpusSize: corpus.length,
        chunkCount: allChunks.length,
    };
    (0, fs_1.mkdirSync)((0, path_1.join)(outPath, '..'), { recursive: true });
    (0, fs_1.writeFileSync)(outPath, JSON.stringify(engineData));
    // Record compile metrics (ALWAYS ON v2.0)
    const durationMs = Date.now() - startTime;
    collector_1.metrics.recordCompile({
        timestamp: Date.now(),
        durationMs,
        filesScanned: allFiles.length,
        chunksBuilt: allChunks.length,
        termsIndexed: Object.keys(invertedIndex).length,
        bpeTokens: Number(bpeTable.vocab.size) || 0,
        corpusSizeBytes: corpus.length,
        binSizeBytes: JSON.stringify(engineData).length,
    });
    return {
        path: outPath,
        docCount: allFiles.length,
        chunkCount: allChunks.length,
        corpusSize: corpus.length,
        bpeTokens: Number(bpeTable.vocab.size) || 0,
        indexSize: Object.keys(invertedIndex).length,
    };
}
// ─── Helpers ──────────────────────────────────────────────────────────────────
function collectFiles(dir, ext) {
    const files = [];
    if (!(0, fs_1.existsSync)(dir))
        return files;
    for (const entry of (0, fs_1.readdirSync)(dir, { withFileTypes: true })) {
        const full = (0, path_1.join)(dir, entry.name);
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
            files.push(...collectFiles(full, ext));
        }
        else if (entry.name.endsWith(ext)) {
            files.push(full);
        }
    }
    return files;
}
function chunkDocument(text, docId, startId) {
    const chunks = [];
    const lines = text.split('\n');
    let current = null;
    let id = startId;
    for (const line of lines) {
        const m = line.match(/^(#{1,4})\s+(.+)/);
        if (m) {
            if (current)
                chunks.push(current);
            current = {
                id: id++,
                docId,
                level: m[1].length,
                heading: m[2],
                body: '',
                keywords: [],
                bigrams: [],
                hash: '',
            };
        }
        else if (current && line.trim()) {
            current.body += line + '\n';
        }
    }
    if (current)
        chunks.push(current);
    return chunks;
}
function extractKeywords(text, limit = 15) {
    const words = text.toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2)
        .filter(w => !/^(the|and|for|with|that|this|from|have|been|were|they|them|their|about|which|when|would|could|should|what|are|not|but|its|all|can|has|had|was|you|your|our|its|his|her|who|how|did|does|will|may|get|got|put|set|let|see|use|make|made|just|also|into|over|than|then|only|other|some|such|each|more|very|much|many|well|back|down|even|most|new|now|one|two|out|way|say|like|know|take|come|think|look|want|give|find|tell|ask|try|leave|keep|let|seem|feel|need|mean|become|show|call|work|still|last|between|same|part|place|year|thing|name|type|form|case|point|group|number|world|hand|side|kind|home|line|word|end|life|day|man|men|woman|women|child|people|person|state|country|school|house|family|problem|fact|idea|question|story|night|lot|right|left|top|bottom|front|back|high|low|small|large|long|short|little|big|early|late|young|old|good|bad|great|different|important|public|private|whole|certain|possible|hard|easy|able|open|close|full|free|real|true|false|ready|sure|clear|common|special|strong|simple|human|local|social|national|political|economic|military|cultural|religious|natural)$/.test(w))
        .map(stemmer_1.stem);
    return [...new Set(words)].slice(0, limit);
}
function extractBigrams(keywords) {
    const bigrams = [];
    for (let i = 0; i < keywords.length - 1; i++) {
        bigrams.push(keywords[i] + '_' + keywords[i + 1]);
    }
    return bigrams;
}
function hashChunk(body) {
    return (0, crypto_1.createHash)('sha256').update(body).digest('hex').slice(0, 8);
}
//# sourceMappingURL=compile.js.map