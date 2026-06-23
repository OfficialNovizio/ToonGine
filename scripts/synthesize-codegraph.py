#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
"""Synthesize codegraph.db → .toon/codegraph/ (TOON format)"""
import sqlite3, sys, os
from collections import Counter

def synthesize(project_root):
    cg_db = os.path.join(project_root, '.codegraph', 'codegraph.db')
    if not os.path.exists(cg_db):
        print(f"  ⚠️  No .codegraph/codegraph.db — run 'codegraph init' first")
        return False

    db = sqlite3.connect(cg_db)
    db.row_factory = sqlite3.Row

    nodes = [dict(r) for r in db.execute('SELECT * FROM nodes ORDER BY kind, name')]
    edges = [dict(r) for r in db.execute('SELECT * FROM edges')]
    files = [dict(r) for r in db.execute('SELECT * FROM files ORDER BY path')]

    # Abbreviation dictionary
    abbrev = {}
    abbrev_id = 0
    def abbr(word):
        nonlocal abbrev_id
        if len(word) > 5 and word not in abbrev:
            abbrev[word] = f'§{abbrev_id}'
            abbrev_id += 1
        return abbrev.get(word, word)

    kind_counts = Counter(n['kind'] for n in nodes)
    lang_counts = Counter(n['language'] for n in nodes if n['language'])
    call_edges = [e for e in edges if e['kind'] in ('calls', 'imports', 'references', 'contains')]

    lines = []
    lines.append('SRC codegraph')
    lines.append(f'NODES {len(nodes)}')
    lines.append(f'EDGES {len(edges)}')
    lines.append(f'FILES {len(files)}')
    lines.append('')

    lines.append('## Kinds')
    for kind, count in kind_counts.most_common():
        lines.append(f'  {kind}: {count}')
    lines.append('')

    lines.append('## Languages')
    for lang, count in lang_counts.most_common():
        lines.append(f'  {lang}: {count}')
    lines.append('')

    lines.append('## Files')
    for f in files:
        lines.append(f"  {f['path']} [{f['language'] or '?'}] {f['node_count']}n")

    lines.append('')
    lines.append('## Symbols')
    for n in nodes:
        kind_ch = n['kind'][0].upper()
        exp = '* ' if n['is_exported'] else '  '
        lines.append(f"{exp}[{kind_ch}] {abbr(n['name'])} @ {abbr(n['file_path'])}")
    lines.append('')

    lines.append('## Edges')
    for e in call_edges:
        sn = next((n['name'] for n in nodes if n['id'] == e['source']), e['source'][:20])
        tn = next((n['name'] for n in nodes if n['id'] == e['target']), e['target'][:20])
        lines.append(f"  {abbr(sn)} → {e['kind']} → {abbr(tn)}")

    lines.append('')
    lines.append('---')
    lines.append('## Dict')
    for word, token in sorted(abbrev.items(), key=lambda x: int(x[1][1:])):
        lines.append(f'{token}={word}')

    output = '\n'.join(lines)
    db.close()

    # Write to .toon/codegraph/
    cg_dir = os.path.join(project_root, '.toon', 'codegraph')
    os.makedirs(cg_dir, exist_ok=True)
    
    toon_path = os.path.join(cg_dir, 'CODEGRAPH_REPORT.toon')
    with open(toon_path, 'w') as f:
        f.write(output)
    
    print(f"  ✅ Synthesized {len(nodes)} nodes → .toon/codegraph/CODEGRAPH_REPORT.toon")
    print(f"     {len(output)} bytes, {len(abbrev)} abbreviations")
    return True

if __name__ == '__main__':
    root = sys.argv[1] if len(sys.argv) > 1 else os.getcwd()
    synthesize(os.path.abspath(root))
