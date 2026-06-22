#!/usr/bin/env python3
"""Synthesize code-review-graph graph.db → .toon/code-review-graph/CODEGRAPH_REPORT.toon"""
import sqlite3, sys, os
from collections import Counter

def synthesize(project_root):
    db_path = os.path.join(project_root, '.toon', 'code-review-graph', 'graph.db')
    if not os.path.exists(db_path):
        print(f"  ⚠️  No graph.db — run code-review-graph build first")
        return False

    db = sqlite3.connect(db_path)
    db.row_factory = sqlite3.Row

    nodes = [dict(r) for r in db.execute('SELECT * FROM nodes ORDER BY kind, name')]
    edges = [dict(r) for r in db.execute('SELECT * FROM edges')]
    
    # Abbreviation dictionary
    abbrev = {}
    abbrev_id = 0
    def abbr(word):
        nonlocal abbrev_id
        if len(word) > 5 and word not in abbrev:
            abbrev[word] = f'§{abbrev_id}'
            abbrev_id += 1
        return abbrev.get(word, word)

    kind_counts = Counter(n.get('kind', '?') for n in nodes)
    lang_counts = Counter(n.get('language', '?') for n in nodes if n.get('language'))
    edge_kinds = Counter(e.get('kind', '?') for e in edges)

    lines = []
    lines.append('SRC code-review-graph')
    lines.append(f'NODES {len(nodes)}')
    lines.append(f'EDGES {len(edges)}')
    lines.append('')

    lines.append('## Kinds')
    for kind, count in kind_counts.most_common():
        lines.append(f'  {kind}: {count}')
    lines.append('')

    lines.append('## Languages')
    for lang, count in lang_counts.most_common():
        lines.append(f'  {lang}: {count}')
    lines.append('')

    lines.append('## Edge Types')
    for ek, count in edge_kinds.most_common():
        lines.append(f'  {ek}: {count}')
    lines.append('')

    lines.append('## Nodes')
    for n in nodes[:100]:
        kind_ch = n.get('kind', '?')[0].upper()
        exp = '* ' if n.get('is_exported') else '  '
        lines.append(f"{exp}[{kind_ch}] {abbr(n.get('name','?'))} @ {abbr(n.get('file_path','?'))} (L{n.get('start_line',0)})")
    if len(nodes) > 100:
        lines.append(f'  ... +{len(nodes)-100} more')
    lines.append('')

    lines.append('## Edges')
    for e in edges[:50]:
        sn = next((n.get('name', '?') for n in nodes if n.get('id') == e.get('source')), str(e.get('source', '?'))[:20])
        tn = next((n.get('name', '?') for n in nodes if n.get('id') == e.get('target')), str(e.get('target', '?'))[:20])
        lines.append(f"  {abbr(sn)} → {e.get('kind','?')} → {abbr(tn)}")
    if len(edges) > 50:
        lines.append(f'  ... +{len(edges)-50} more')
    lines.append('')

    lines.append('---')
    lines.append('## Dict')
    for word, token in sorted(abbrev.items(), key=lambda x: int(x[1][1:])):
        lines.append(f'{token}={word}')

    output = '\n'.join(lines)
    db.close()

    toon_path = os.path.join(project_root, '.toon', 'code-review-graph', 'CODEGRAPH_REPORT.toon')
    with open(toon_path, 'w') as f:
        f.write(output)
    
    print(f"  ✅ Synthesized {len(nodes)} nodes → .toon/code-review-graph/CODEGRAPH_REPORT.toon")
    print(f"     {len(output)} bytes, {len(abbrev)} abbreviations")
    return True

if __name__ == '__main__':
    root = sys.argv[1] if len(sys.argv) > 1 else os.getcwd()
    synthesize(os.path.abspath(root))
