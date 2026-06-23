// Quick prototype: Section splitter + TF-IDF scorer on real project data
// Run this to verify the 70% projection before building the full v3 pipeline

const { strip } = require('./dist/toon/v2/stripper');
const fs = require('fs');

// ─── Layer 2: Section Splitter ─────────────────────────────────────────────
function splitSections(text) {
  const sections = [];
  const lines = text.split('\n');
  let current = null;

  for (const line of lines) {
    const m = line.match(/^(#{1,4})\s+(.+)/);
    if (m) {
      if (current) sections.push(current);
      current = { level: m[1].length, heading: m[2], text: '', lines: [] };
    } else if (current && line.trim()) {
      current.lines.push(line);
      current.text += line + '\n';
    }
  }
  if (current) sections.push(current);
  return sections;
}

// ─── Layer 3: TF-IDF Importance Scorer ────────────────────────────────────
function buildIDF(corpusText) {
  const words = corpusText.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const total = words.length;
  const docFreq = {};
  for (const w of [...new Set(words)]) {
    const count = words.filter(x => x === w).length;
    docFreq[w] = Math.log(total / (1 + count));
  }
  return docFreq;
}

function scoreSection(section, idf, docIndex, totalSections) {
  const words = section.text.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  if (words.length === 0) return 0;

  // TF-IDF density
  let tfidfSum = 0;
  for (const w of words) {
    tfidfSum += (idf[w] || 0);
  }
  const tfidf = tfidfSum / words.length;

  // Position weight (first 20% = 1.5x, middle = 1.0x, last 20% = 1.3x)
  const pos = docIndex / totalSections;
  const posWeight = pos < 0.2 ? 1.5 : pos > 0.8 ? 1.3 : 1.0;

  // Heading bonus
  const headingBonus = section.level === 1 ? 2.0 : section.level === 2 ? 1.5 : section.level === 3 ? 1.2 : 1.0;

  // Length bonus (very short or very long sections get penalized)
  const lenBonus = words.length < 5 ? 0.5 : words.length > 200 ? 0.8 : 1.0;

  return tfidf * posWeight * headingBonus * lenBonus;
}

// ─── TEST ON CLAUDE.md ────────────────────────────────────────────────────
const raw = fs.readFileSync('/root/yvon/CLAUDE.md', 'utf-8');
const stripped = strip(raw);
const sections = splitSections(stripped.output);

// Build IDF from the document itself (in production: project-wide)
const idf = buildIDF(stripped.output);

// Score all sections
for (let i = 0; i < sections.length; i++) {
  sections[i].score = scoreSection(sections[i], idf, i, sections.length);
}

// Sort by score
sections.sort((a, b) => b.score - a.score);

// Calculate cumulative savings at different keep ratios
console.log('SECTIONS: ' + sections.length);
console.log('Raw: ' + raw.length + ' chars → Stripped: ' + stripped.output.length + ' chars');
console.log('');

const ratios = [0.1, 0.2, 0.3, 0.5, 0.7, 1.0];
for (const ratio of ratios) {
  const keep = Math.max(1, Math.floor(sections.length * ratio));
  const kept = sections.slice(0, keep);
  const keptChars = kept.reduce((sum, s) => sum + s.text.length, 0);
  const savings = Math.round((1 - keptChars / raw.length) * 100);
  console.log('Keep ' + (ratio*100).toFixed(0) + '% (' + keep + '/' + sections.length + ' sections): ' +
    keptChars + ' chars = ' + savings + '% savings  [$' + (keptChars/4 * 0.000003).toFixed(5) + '/call]');
}

// Show top 5 kept sections at 30%
console.log('');
console.log('TOP SECTIONS (30% kept):');
const top30 = sections.slice(0, Math.floor(sections.length * 0.3));
for (const s of top30.slice(0, 5)) {
  console.log('  #'.repeat(s.level) + ' ' + s.heading + ' [' + s.text.length + ' chars, score=' + s.score.toFixed(2) + ']');
}

// Also test on another document
console.log('');
console.log('═══════════════════════════════');
console.log('MARCUS MEMORY.md:');
const memRaw = fs.readFileSync('/root/yvon/.toon/agents/CEO/marcus/MEMORY.md', 'utf-8');
const memStripped = strip(memRaw);
const memSections = splitSections(memStripped.output);
const memIdf = buildIDF(memStripped.output);
for (let i = 0; i < memSections.length; i++) {
  memSections[i].score = scoreSection(memSections[i], memIdf, i, memSections.length);
}
memSections.sort((a, b) => b.score - a.score);

for (const ratio of [0.1, 0.2, 0.3, 0.5, 1.0]) {
  const keep = Math.max(1, Math.floor(memSections.length * ratio));
  const kept = memSections.slice(0, keep);
  const keptChars = kept.reduce((sum, s) => sum + s.text.length, 0);
  const savings = Math.round((1 - keptChars / memRaw.length) * 100);
  console.log('Keep ' + (ratio*100).toFixed(0) + '%: ' + keptChars + ' chars = ' + savings + '% savings');
}
