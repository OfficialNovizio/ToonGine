#!/usr/bin/env python3
"""TOON Session Search — compressed session retrieval from Hermes state.db

Usage:
  python3 toon-session-compress.py <query> [--limit N] [--profile NAME]
  python3 toon-session-compress.py --session-id <id> [--window N]

Output: TOON-compressed session results. Abbreviation dictionary appended at end.
Falls back to raw text if state.db not found or query fails.
"""
import sqlite3
import sys
import os
import json
import re
from collections import Counter
from datetime import datetime

HERMES_HOME = os.environ.get('HERMES_HOME', os.path.expanduser('~/.hermes'))
STATE_DB = os.path.join(HERMES_HOME, 'state.db')

# ─── TOON Compression Engine ──────────────────────────────────────────────────
def build_abbrev_dict(texts, min_len=5, max_abbrev=200):
    """Build abbreviation dictionary from corpus of texts."""
    # Extract all words, prefer longer capitalized/pascal-case tokens
    word_counts = Counter()
    for text in texts:
        # Match CamelCase, snake_case, kebab-case, and plain words
        words = re.findall(r'[A-Z][a-z]+(?:[A-Z][a-z]+)+|[a-z]+(?:_[a-z]+)+|[a-z]+(?:-[a-z]+)+|\b[a-zA-Z]{6,}\b', text)
        for w in words:
            if len(w) >= min_len:
                word_counts[w] += 1
    
    # Keep the most frequent words (not common English stopwords)
    stopwords = {'the', 'this', 'that', 'with', 'from', 'have', 'been', 'were', 'they', 'their', 
                 'would', 'could', 'should', 'about', 'which', 'when', 'what', 'where'}
    abbrev = {}
    abbrev_id = 0
    for word, count in word_counts.most_common(max_abbrev):
        if word.lower() not in stopwords and count >= 2:
            abbrev[word] = f'§{abbrev_id}'
            abbrev_id += 1
    return abbrev

def compress_text(text, abbrev):
    """Apply abbreviation dictionary to text, longest matches first."""
    # Sort by length descending to replace longest matches first
    for word in sorted(abbrev.keys(), key=len, reverse=True):
        text = text.replace(word, abbrev[word])
    return text

def compress_messages(messages, abbrev):
    """Compress a list of message dicts."""
    compressed = []
    for msg in messages:
        role = msg.get('role', '?')[0].upper()  # U, A, T
        ts = msg.get('timestamp', 0)
        dt = datetime.fromtimestamp(ts).strftime('%m-%d %H:%M') if ts else '??'
        content = compress_text(msg.get('content', '') or '', abbrev)
        # Truncate very long messages
        if len(content) > 500:
            content = content[:500] + '…'
        compressed.append(f'[{role} {dt}] {content}')
    return compressed

def format_output(messages, abbrev, query_info):
    """Format compressed session output."""
    lines = []
    lines.append(f'SRC session-search')
    lines.append(f'QRY {query_info}')
    lines.append(f'HITS {len(messages)}')
    lines.append(f'COMP {len(abbrev)} abbreviations')
    lines.append('')
    
    for msg in messages:
        lines.append(msg)
    
    if abbrev:
        lines.append('')
        lines.append('---')
        lines.append('## Dict')
        for word, token in sorted(abbrev.items(), key=lambda x: int(x[1][1:])):
            lines.append(f'{token}={word}')
    
    return '\n'.join(lines)

# ─── Query Functions ─────────────────────────────────────────────────────────
def fts5_search(conn, query, limit=20):
    """FTS5 search on messages_fts."""
    # Escape FTS5 special chars
    safe_query = query.replace('"', '""')
    try:
        rows = conn.execute(
            """SELECT m.id, m.session_id, m.role, m.content, m.timestamp, m.tool_name
               FROM messages_fts f
               JOIN messages m ON f.rowid = m.id
               WHERE messages_fts MATCH ?
               ORDER BY rank
               LIMIT ?""",
            (safe_query, limit)
        ).fetchall()
        return [dict(zip(['id', 'session_id', 'role', 'content', 'timestamp', 'tool_name'], r)) for r in rows]
    except Exception as e:
        print(f"  ⚠️  FTS5 error: {e} — falling back to LIKE search", file=sys.stderr)
        # Fallback: LIKE search
        like_q = f'%{query}%'
        rows = conn.execute(
            """SELECT id, session_id, role, content, timestamp, tool_name
               FROM messages WHERE content LIKE ? ORDER BY timestamp DESC LIMIT ?""",
            (like_q, limit)
        ).fetchall()
        return [dict(zip(['id', 'session_id', 'role', 'content', 'timestamp', 'tool_name'], r)) for r in rows]

def session_messages(conn, session_id, window=20):
    """Get messages from a specific session with window."""
    rows = conn.execute(
        """SELECT id, session_id, role, content, timestamp, tool_name
           FROM messages WHERE session_id = ? 
           ORDER BY timestamp ASC LIMIT ?""",
        (session_id, window)
    ).fetchall()
    return [dict(zip(['id', 'session_id', 'role', 'content', 'timestamp', 'tool_name'], r)) for r in rows]

def recent_sessions(conn, limit=5):
    """Get recent session summaries."""
    rows = conn.execute(
        """SELECT s.id, s.source, s.started_at, s.message_count, s.input_tokens, s.output_tokens,
                  (SELECT SUBSTR(content, 1, 200) FROM messages WHERE session_id = s.id AND role = 'user' ORDER BY timestamp ASC LIMIT 1) as first_msg
           FROM sessions s 
           ORDER BY s.started_at DESC LIMIT ?""",
        (limit,)
    ).fetchall()
    return [dict(zip(['id', 'source', 'started_at', 'message_count', 'input_tokens', 'output_tokens', 'first_msg'], r)) for r in rows]

# ─── Main ────────────────────────────────────────────────────────────────────
def main():
    if not os.path.exists(STATE_DB):
        print(f"  ⚠️  No state.db at {STATE_DB}", file=sys.stderr)
        sys.exit(1)
    
    conn = sqlite3.connect(STATE_DB)
    conn.row_factory = sqlite3.Row
    
    args = sys.argv[1:]
    limit = 20
    session_id = None
    window = 20
    query = None
    mode = 'search'  # search | session | recent
    
    i = 0
    while i < len(args):
        if args[i] == '--limit' and i + 1 < len(args):
            limit = int(args[i+1]); i += 2
        elif args[i] == '--session-id' and i + 1 < len(args):
            session_id = args[i+1]; mode = 'session'; i += 2
        elif args[i] == '--window' and i + 1 < len(args):
            window = int(args[i+1]); i += 2
        elif args[i] == '--recent':
            mode = 'recent'; i += 1
        elif not args[i].startswith('--'):
            query = args[i]; i += 1
        else:
            i += 1
    
    try:
        if mode == 'recent':
            sessions = recent_sessions(conn, limit)
            all_texts = [s.get('first_msg', '') or '' for s in sessions]
            abbrev = build_abbrev_dict(all_texts)
            
            lines = []
            lines.append(f'SRC session-search --recent')
            lines.append(f'HITS {len(sessions)}')
            lines.append('')
            for s in sessions:
                dt = datetime.fromtimestamp(s['started_at']).strftime('%Y-%m-%d %H:%M') if s['started_at'] else '?'
                src = s.get('source', '?')
                msg_count = s.get('message_count', 0)
                itok = s.get('input_tokens', 0)
                otok = s.get('output_tokens', 0)
                fm = compress_text((s.get('first_msg', '') or '')[:120], abbrev)
                lines.append(f'[{dt}] {src} | {msg_count}msgs | {itok+otok}tok')
                if fm:
                    lines.append(f'  ↳ {fm}')
                lines.append('')
            
            if abbrev:
                lines.append('---')
                lines.append('## Dict')
                for word, token in sorted(abbrev.items(), key=lambda x: int(x[1][1:])):
                    lines.append(f'{token}={word}')
            
            print('\n'.join(lines))
        
        elif mode == 'session':
            msgs = session_messages(conn, session_id, window)
            all_texts = [m.get('content', '') or '' for m in msgs]
            abbrev = build_abbrev_dict(all_texts)
            compressed = compress_messages(msgs, abbrev)
            print(format_output(compressed, abbrev, f'session:{session_id} w{window}'))
        
        else:  # search
            if not query:
                print("Usage: toon-session-compress.py <query> [--limit N] [--recent] [--session-id ID]", file=sys.stderr)
                sys.exit(1)
            
            msgs = fts5_search(conn, query, limit)
            all_texts = [m.get('content', '') or '' for m in msgs]
            abbrev = build_abbrev_dict(all_texts)
            compressed = compress_messages(msgs, abbrev)
            print(format_output(compressed, abbrev, f'"{query}" limit={limit}'))
    
    finally:
        conn.close()

if __name__ == '__main__':
    main()
