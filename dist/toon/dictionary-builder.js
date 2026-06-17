"use strict";
// src/toon/dictionary-builder.ts — Builds project-specific abbreviation dictionary
// Scans all .md files, finds frequent multi-word phrases, proposes abbreviations
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildDictionary = buildDictionary;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function buildDictionary(projectRoot, minFreq = 5) {
    // Collect all .md content
    const allText = [];
    function collect(dir) {
        if (!fs.existsSync(dir))
            return;
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.next' || entry.name === '.toon')
                continue;
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                collect(full);
            }
            else if (entry.name.endsWith('.md')) {
                try {
                    allText.push(fs.readFileSync(full, 'utf-8'));
                }
                catch { }
            }
        }
    }
    collect(path.join(projectRoot, '.toon', 'agents'));
    collect(path.join(projectRoot, 'docs'));
    // Extract frequent 2-4 word phrases
    const phraseCounts = new Map();
    const wordRegex = /[A-Z][a-z]+(?:\s+[a-z]+){1,3}/g;
    for (const text of allText) {
        const matches = text.match(wordRegex) || [];
        for (const match of matches) {
            const lower = match.toLowerCase();
            if (match.length > 10 && match.length < 50 && !match.match(/^[A-Z]/))
                continue;
            phraseCounts.set(lower, (phraseCounts.get(lower) || 0) + 1);
        }
    }
    // Filter frequent phrases and generate abbreviations
    const dict = {};
    const sorted = Array.from(phraseCounts.entries())
        .filter(([_, count]) => count >= minFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 200);
    for (const [phrase, count] of sorted) {
        const words = phrase.split(/\s+/);
        const abbrev = words.map(w => w[0].toUpperCase()).join('');
        // Avoid collisions
        if (!Object.values(dict).includes(abbrev)) {
            dict[phrase] = abbrev;
        }
    }
    return dict;
}
// CLI
if (require.main === module) {
    const root = process.argv[2] || process.cwd();
    const dict = buildDictionary(root);
    console.log(JSON.stringify(dict, null, 2));
}
//# sourceMappingURL=dictionary-builder.js.map