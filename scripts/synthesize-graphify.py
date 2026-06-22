#!/usr/bin/env python3
"""Synthesize graphify graph.json → .toon/graphify/GRAPH_REPORT.toon"""
import json, sys, os
from collections import Counter

def synthesize(project_root):
    gf_json = os.path.join(project_root, '.toon', 'graphify', 'graph.json')
    if not os.path.exists(gf_json):
        print(f"  ⚠️  No graph.json — run graphify first")
        return False

    with open(gf_json) as f:
        g = json.load(f)

    nodes = g.get('nodes', [])
    edges = g.get('links', [])
    
    # Abbreviation dictionary
    abbrev = {}
    abbrev_id = 0
    def abbr(word):
        nonlocal abbrev_id
        if len(word) > 5 and word not in abbrev:
            abbrev[word] = f'§{abbrev_id}'
            abbrev_id += 1
        return abbrev.get(word, word)

    # Counts
    file_types = Counter(n.get('file_type', '?') for n in nodes)
    origins = Counter(n.get('_origin', '?') for n in nodes)
    communities = Counter(n.get('community', 0) for n in nodes)

    lines = []
    lines.append('SRC graphify')
    lines.append(f'NODES {len(nodes)}')
    lines.append(f'EDGES {len(edges)}')
    lines.append(f'COMMUNITIES {len(communities)}')
    lines.append(f'COMMIT {g.get("built_at_commit", "?")[:8]}')
    lines.append('')

    lines.append('## Types')
    for ft, count in file_types.most_common():
        lines.append(f'  {ft}: {count}')
    lines.append('')

    lines.append('## Origins')
    for o, count in origins.most_common():
        lines.append(f'  {o}: {count}')
    lines.append('')

    lines.append('## Community Hubs')
    # Group nodes by community
    comm_nodes = {}
    for n in nodes:
        c = n.get('community', 0)
        comm_nodes.setdefault(c, []).append(n)
    for cid in sorted(comm_nodes.keys(), key=lambda c: -len(comm_nodes[c]))[:15]:
        cnodes = comm_nodes[cid]
        top = cnodes[0]
        lines.append(f'  Community {cid}: {len(cnodes)} nodes — {abbr(top.get("label","?"))}')
    lines.append('')

    lines.append('## Nodes')
    for n in nodes[:100]:
        lines.append(f"  [{n.get('file_type','?')[0].upper()}] {abbr(n.get('label','?'))} @ {abbr(n.get('source_file','?'))} (c{n.get('community',0)})")
    if len(nodes) > 100:
        lines.append(f'  ... +{len(nodes)-100} more')
    lines.append('')

    lines.append('## Edges')
    for e in edges[:50]:
        src = e.get('source', '?')
        tgt = e.get('target', '?')
        rel = e.get('relation', e.get('kind', '?'))
        lines.append(f"  {abbr(str(src))} → {rel} → {abbr(str(tgt))}")
    lines.append('')

    lines.append('---')
    lines.append('## Dict')
    for word, token in sorted(abbrev.items(), key=lambda x: int(x[1][1:])):
        lines.append(f'{token}={word}')

    output = '\n'.join(lines)
    
    toon_path = os.path.join(project_root, '.toon', 'graphify', 'GRAPH_REPORT.toon')
    with open(toon_path, 'w') as f:
        f.write(output)
    
    print(f"  ✅ Synthesized {len(nodes)} nodes → .toon/graphify/GRAPH_REPORT.toon")
    print(f"     {len(output)} bytes, {len(abbrev)} abbreviations")
    return True

if __name__ == '__main__':
    root = sys.argv[1] if len(sys.argv) > 1 else os.getcwd()
    synthesize(os.path.abspath(root))
