"""
CAOS — Long-Term Memory Store (SQLite FTS5)

The problem: Agents forget. Context windows discard old conversations.
The solution: SQLite FTS5 database that stores EVERYTHING forever.
Agents query it on-demand via MCP tools like a human searches their memory.

Design:
- All memories, decisions, mistakes, conversations → one DB
- FTS5 full-text search over all content
- Queryable by: keyword, date range, agent, memory type, session
- Never expires — institutional knowledge preserved forever
- TOON-compressed at rest, decompressed on retrieval
- Hermes agents get MCP tools to search their own history
"""

import sqlite3, json, time, os, hashlib
from pathlib import Path
from dataclasses import dataclass
from typing import Optional
from collections import defaultdict


@dataclass
class MemoryRecord:
    id: str
    agent: str
    memory_type: str      # episodic, semantic, procedural, mistake, decision, conversation
    content: str
    context_hash: str
    confidence: float
    session_id: str
    task: str
    timestamp: float
    tags: str             # comma-separated
    metadata_json: str    # extra data as JSON blob
    toon_compressed: str  # TOON version for retrieval


class LongTermMemoryStore:
    """
    SQLite FTS5 store for all agent memories.
    
    Schema:
    - memories: main table with all records
    - memories_fts: FTS5 virtual table for full-text search
    - memory_stats: aggregate stats per agent
    
    Features:
    - Full-text search (FTS5 with BM25 ranking)
    - Date range queries ("what happened in March?")
    - Agent filtering ("what did Dev decide?")
    - Type filtering ("show me all mistakes about auth")
    - Session grouping ("what happened in session-42?")
    - TOON compression at rest
    """
    
    def __init__(self, db_path: str = ".toon/memory/memory_store.db"):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.conn = sqlite3.connect(str(self.db_path))
        self.conn.row_factory = sqlite3.Row
        self._init_schema()
    
    def _init_schema(self):
        """Create tables if they don't exist."""
        self.conn.executescript("""
            -- Main memory table
            CREATE TABLE IF NOT EXISTS memories (
                id TEXT PRIMARY KEY,
                agent TEXT NOT NULL,
                memory_type TEXT NOT NULL,
                content TEXT NOT NULL,
                context_hash TEXT,
                confidence REAL DEFAULT 1.0,
                session_id TEXT,
                task TEXT,
                timestamp REAL NOT NULL,
                tags TEXT,
                metadata_json TEXT,
                toon_compressed TEXT,
                created_at REAL DEFAULT (strftime('%s', 'now'))
            );
            
            -- FTS5 full-text search index
            CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts 
            USING fts5(
                id UNINDEXED,
                agent,
                memory_type,
                content,
                task,
                tags,
                metadata_json,
                content=memories,
                content_rowid=rowid
            );
            
            -- Triggers to keep FTS in sync
            CREATE TRIGGER IF NOT EXISTS memories_ai AFTER INSERT ON memories BEGIN
                INSERT INTO memories_fts(rowid, id, agent, memory_type, content, task, tags, metadata_json)
                VALUES (new.rowid, new.id, new.agent, new.memory_type, new.content, new.task, new.tags, new.metadata_json);
            END;
            
            CREATE TRIGGER IF NOT EXISTS memories_ad AFTER DELETE ON memories BEGIN
                INSERT INTO memories_fts(memories_fts, rowid, id, agent, memory_type, content, task, tags, metadata_json)
                VALUES ('delete', old.rowid, old.id, old.agent, old.memory_type, old.content, old.task, old.tags, old.metadata_json);
            END;
            
            -- Indexes for fast queries
            CREATE INDEX IF NOT EXISTS idx_memories_agent ON memories(agent);
            CREATE INDEX IF NOT EXISTS idx_memories_type ON memories(memory_type);
            CREATE INDEX IF NOT EXISTS idx_memories_timestamp ON memories(timestamp);
            CREATE INDEX IF NOT EXISTS idx_memories_session ON memories(session_id);
            CREATE INDEX IF NOT EXISTS idx_memories_context_hash ON memories(context_hash);
        """)
        self.conn.commit()
    
    # ── WRITE ─────────────────────────────────────────────────
    
    def store(self, record: MemoryRecord):
        """Store a memory. Never expires."""
        self.conn.execute("""
            INSERT OR REPLACE INTO memories 
            (id, agent, memory_type, content, context_hash, confidence, 
             session_id, task, timestamp, tags, metadata_json, toon_compressed)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            record.id, record.agent, record.memory_type,
            record.content, record.context_hash, record.confidence,
            record.session_id, record.task, record.timestamp,
            record.tags, record.metadata_json, record.toon_compressed,
        ))
        self.conn.commit()
    
    def store_batch(self, records: list[MemoryRecord]):
        """Store multiple memories efficiently."""
        self.conn.executemany("""
            INSERT OR REPLACE INTO memories 
            (id, agent, memory_type, content, context_hash, confidence,
             session_id, task, timestamp, tags, metadata_json, toon_compressed)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, [
            (r.id, r.agent, r.memory_type, r.content, r.context_hash,
             r.confidence, r.session_id, r.task, r.timestamp,
             r.tags, r.metadata_json, r.toon_compressed)
            for r in records
        ])
        self.conn.commit()
    
    # ── SEARCH — Full-Text ────────────────────────────────────
    
    def search(self, query: str, agent: str = None, 
               memory_type: str = None, limit: int = 10,
               since_days: int = None) -> list[dict]:
        """
        Full-text search across ALL memories, including ones from months ago.
        
        Uses FTS5 with BM25 ranking. Agents call this when they need
        to remember something from the past.
        
        Args:
            query: Natural language search ("what did we decide about auth?")
            agent: Optional filter by agent name
            memory_type: Optional filter by type (mistake, decision, etc.)
            limit: Max results
            since_days: Only memories from last N days (None = all time)
        
        Returns:
            Ranked list of matching memories with snippets.
        """
        
        conditions = []
        params = []
        
        # Build FTS5 query
        fts_query = query
        
        if agent:
            conditions.append("agent = ?")
            params.append(agent)
        
        if memory_type:
            conditions.append("memory_type = ?")
            params.append(memory_type)
        
        if since_days is not None:
            cutoff = time.time() - (since_days * 86400)
            conditions.append("timestamp >= ?")
            params.append(cutoff)
        
        where_clause = " AND ".join(conditions) if conditions else "1=1"
        
        sql = f"""
            SELECT m.*, 
                   snippet(memories_fts, 0, '<mark>', '</mark>', '...', 32) as snippet,
                   rank
            FROM memories_fts f
            JOIN memories m ON f.rowid = m.rowid
            WHERE memories_fts MATCH ? AND {where_clause}
            ORDER BY rank
            LIMIT ?
        """
        
        params = [fts_query] + params + [limit]
        
        try:
            rows = self.conn.execute(sql, params).fetchall()
        except sqlite3.OperationalError:
            # FTS5 query syntax error — fall back to LIKE search
            like_query = f"%{query}%"
            sql = f"""
                SELECT *, NULL as snippet, rowid as rank 
                FROM memories 
                WHERE (content LIKE ? OR task LIKE ? OR tags LIKE ?)
                  AND {where_clause}
                ORDER BY timestamp DESC
                LIMIT ?
            """
            params = [like_query, like_query, like_query] + params[1:]
            try:
                rows = self.conn.execute(sql, params).fetchall()
            except:
                rows = []
        
        return [dict(r) for r in rows]
    
    # ── RECALL — By Date/Agent/Type ───────────────────────────
    
    def recall_by_date(self, start_date: float, end_date: float = None,
                       agent: str = None, memory_type: str = None,
                       limit: int = 50) -> list[dict]:
        """
        Recall all memories from a specific time period.
        "What happened in March 2026?"
        
        Args:
            start_date: Unix timestamp of start
            end_date: Unix timestamp of end (default: now)
            agent: Optional agent filter
            memory_type: Optional type filter
            limit: Max results
        """
        if end_date is None:
            end_date = time.time()
        
        conditions = ["timestamp >= ?", "timestamp <= ?"]
        params = [start_date, end_date]
        
        if agent:
            conditions.append("agent = ?")
            params.append(agent)
        if memory_type:
            conditions.append("memory_type = ?")
            params.append(memory_type)
        
        where = " AND ".join(conditions)
        
        rows = self.conn.execute(f"""
            SELECT * FROM memories 
            WHERE {where}
            ORDER BY timestamp DESC
            LIMIT ?
        """, params + [limit]).fetchall()
        
        return [dict(r) for r in rows]
    
    def recall_decisions(self, agent: str = None, 
                         since_days: int = None, limit: int = 20) -> list[dict]:
        """
        Recall all decisions made. Critical for institutional knowledge.
        "What did we decide about the database migration?"
        """
        conditions = ["memory_type = 'decision'"]
        params = []
        
        if agent:
            conditions.append("agent = ?")
            params.append(agent)
        if since_days:
            cutoff = time.time() - (since_days * 86400)
            conditions.append("timestamp >= ?")
            params.append(cutoff)
        
        where = " AND ".join(conditions)
        
        rows = self.conn.execute(f"""
            SELECT * FROM memories 
            WHERE {where}
            ORDER BY timestamp DESC
            LIMIT ?
        """, params + [limit]).fetchall()
        
        return [dict(r) for r in rows]
    
    # ── MISTAKE RECALL — Never Repeat ─────────────────────────
    
    def recall_mistakes(self, context: str = None, agent: str = None,
                        since_days: int = None, min_severity: int = 1,
                        limit: int = 10) -> list[dict]:
        """
        Recall mistakes — with context matching.
        "Have we made this mistake before?"
        
        This is the core of "never forget" — agents query this
        before starting any task to avoid repeating old errors.
        """
        conditions = ["memory_type = 'mistake'"]
        params = []
        
        if agent:
            conditions.append("agent = ?")
            params.append(agent)
        if since_days:
            cutoff = time.time() - (since_days * 86400)
            conditions.append("timestamp >= ?")
            params.append(cutoff)
        if min_severity > 1:
            conditions.append("CAST(json_extract(metadata_json, '$.severity') AS INTEGER) >= ?")
            params.append(min_severity)
        
        where = " AND ".join(conditions)
        
        if context:
            # FTS5 context-aware search
            fts_query = context
            
            fts_sql = f"""
                SELECT m.*, snippet(memories_fts, 0, '<mark>', '</mark>', '...', 32) as snippet, rank
                FROM memories_fts f
                JOIN memories m ON f.rowid = m.rowid
                WHERE memories_fts MATCH ? AND {where}
                ORDER BY rank, m.timestamp DESC
                LIMIT ?
            """
            try:
                rows = self.conn.execute(fts_sql, [fts_query] + params + [limit]).fetchall()
            except:
                rows = []
        else:
            rows = self.conn.execute(f"""
                SELECT *, NULL as snippet, rowid as rank 
                FROM memories 
                WHERE {where}
                ORDER BY timestamp DESC
                LIMIT ?
            """, params + [limit]).fetchall()
        
        return [dict(r) for r in rows]
    
    # ── CONVERSATION RECALL ───────────────────────────────────
    
    def recall_conversation(self, session_id: str = None, 
                            agent: str = None, since_days: int = None,
                            limit: int = 30) -> list[dict]:
        """
        Recall conversations and decisions from past sessions.
        "What did we talk about in session-42?"
        "What was decided about the auth architecture?"
        """
        conditions = ["memory_type IN ('decision', 'conversation', 'episodic')"]
        params = []
        
        if session_id:
            conditions.append("session_id = ?")
            params.append(session_id)
        if agent:
            conditions.append("agent = ?")
            params.append(agent)
        if since_days:
            cutoff = time.time() - (since_days * 86400)
            conditions.append("timestamp >= ?")
            params.append(cutoff)
        
        where = " AND ".join(conditions)
        
        rows = self.conn.execute(f"""
            SELECT * FROM memories 
            WHERE {where}
            ORDER BY timestamp ASC
            LIMIT ?
        """, params + [limit]).fetchall()
        
        return [dict(r) for r in rows]
    
    # ── STATS & SUMMARY ───────────────────────────────────────
    
    def get_agent_summary(self, agent: str) -> dict:
        """Get summary of an agent's entire memory history."""
        
        total = self.conn.execute(
            "SELECT COUNT(*) FROM memories WHERE agent = ?", (agent,)
        ).fetchone()[0]
        
        by_type = {}
        for row in self.conn.execute(
            "SELECT memory_type, COUNT(*) as cnt FROM memories WHERE agent = ? GROUP BY memory_type",
            (agent,)
        ):
            by_type[row["memory_type"]] = row["cnt"]
        
        oldest = self.conn.execute(
            "SELECT MIN(timestamp) FROM memories WHERE agent = ?", (agent,)
        ).fetchone()[0]
        
        newest = self.conn.execute(
            "SELECT MAX(timestamp) FROM memories WHERE agent = ?", (agent,)
        ).fetchone()[0]
        
        top_mistakes = self.conn.execute("""
            SELECT task, COUNT(*) as cnt 
            FROM memories 
            WHERE agent = ? AND memory_type = 'mistake'
            GROUP BY context_hash
            ORDER BY cnt DESC
            LIMIT 5
        """, (agent,)).fetchall()
        
        return {
            "agent": agent,
            "total_memories": total,
            "by_type": by_type,
            "oldest_memory": oldest,
            "newest_memory": newest,
            "memory_span_days": (newest - oldest) / 86400 if oldest and newest else 0,
            "repeated_mistakes": [dict(r) for r in top_mistakes],
        }
    
    def get_store_stats(self) -> dict:
        """Get stats for the entire memory store."""
        
        total = self.conn.execute("SELECT COUNT(*) FROM memories").fetchone()[0]
        agents = self.conn.execute(
            "SELECT agent, COUNT(*) as cnt FROM memories GROUP BY agent ORDER BY cnt DESC"
        ).fetchall()
        
        by_type = {}
        for row in self.conn.execute(
            "SELECT memory_type, COUNT(*) as cnt FROM memories GROUP BY memory_type"
        ):
            by_type[row["memory_type"]] = row["cnt"]
        
        date_range = self.conn.execute(
            "SELECT MIN(timestamp), MAX(timestamp) FROM memories"
        ).fetchone()
        
        return {
            "total_memories": total,
            "agent_count": len(agents),
            "agents": [dict(r) for r in agents],
            "by_type": by_type,
            "oldest": date_range[0],
            "newest": date_range[1],
            "span_days": (date_range[1] - date_range[0]) / 86400 if date_range[0] else 0,
        }
    
    # ── MAINTENANCE ───────────────────────────────────────────
    
    def vacuum(self):
        """Optimize database. Run periodically."""
        self.conn.execute("INSERT INTO memories_fts(memories_fts) VALUES('optimize')")
        self.conn.execute("VACUUM")
        self.conn.commit()
    
    def close(self):
        self.conn.close()


# ═══════════════════════════════════════════════════════════════
# INTEGRATION WITH MEMORY_SYSTEM.PY
# ═══════════════════════════════════════════════════════════════

class HybridMemoryManager:
    """
    Combines:
    - Working memory (current context, from memory_system.py)
    - Long-term memory (SQLite FTS5, never expires)
    
    Flow:
    1. Session start: load working memory (~29 tokens injected)
    2. During task: agent queries long-term memory on demand via tools
    3. Task complete: save to BOTH working + long-term memory
    4. Session end: consolidate everything
    """
    
    def __init__(self, toon_dir: str = ".toon"):
        from memory_system import AgentMemoryManager
        self.working_memory = AgentMemoryManager(toon_dir)
        self.long_term_memory = LongTermMemoryStore(
            os.path.join(toon_dir, "memory", "memory_store.db")
        )
    
    def inject_session(self, agent: str, task: str, context: str) -> dict:
        """
        Session start: inject working memory summary.
        Long-term memory is available via tools — query on demand.
        """
        return self.working_memory.inject_session_context(agent, task, context)
    
    def after_task(self, agent: str, task: str, result: dict, session_id: str):
        """Task complete: save to both stores."""
        # Working memory
        self.working_memory.update_after_task(agent, task, result, session_id)
        
        # Long-term memory (never expires)
        record = MemoryRecord(
            id=f"ltm-{agent}-{int(time.time())}-{hashlib.sha256(task.encode()).hexdigest()[:8]}",
            agent=agent,
            memory_type=self._classify_result(result),
            content=f"Task: {task}\nResult: {result.get('status')}\nOutput: {str(result.get('output',''))[:500]}",
            context_hash=hashlib.sha256(task.encode()).hexdigest()[:16],
            confidence=result.get("confidence", 0.8),
            session_id=session_id,
            task=task[:200],
            timestamp=time.time(),
            tags=','.join(self._extract_tags(task)),
            metadata_json=json.dumps({
                "status": result.get("status"),
                "success": result.get("success", False),
                "belifs_killed": result.get("beliefs_killed", 0),
                "strikes": result.get("strikes", 0),
            }),
            toon_compressed="",  # Will be compressed
        )
        self.long_term_memory.store(record)
    
    def store_decision(self, agent: str, decision: str, context: str,
                       session_id: str, stakeholders: list[str] = None):
        """Store an important decision for institutional memory."""
        record = MemoryRecord(
            id=f"decision-{agent}-{int(time.time())}",
            agent=agent,
            memory_type="decision",
            content=f"DECISION: {decision}\nContext: {context}",
            context_hash=hashlib.sha256(context.encode()).hexdigest()[:16],
            confidence=1.0,
            session_id=session_id,
            task=decision[:200],
            timestamp=time.time(),
            tags="decision",
            metadata_json=json.dumps({
                "stakeholders": stakeholders or [agent],
                "context": context[:500],
            }),
            toon_compressed="",
        )
        self.long_term_memory.store(record)
    
    def store_conversation(self, agent: str, content: str, session_id: str):
        """Store conversation excerpt for future recall."""
        record = MemoryRecord(
            id=f"conv-{agent}-{int(time.time())}",
            agent=agent,
            memory_type="conversation",
            content=content[:1000],
            context_hash=hashlib.sha256(content.encode()).hexdigest()[:16],
            confidence=1.0,
            session_id=session_id,
            task="",
            timestamp=time.time(),
            tags="conversation",
            metadata_json="{}",
            toon_compressed="",
        )
        self.long_term_memory.store(record)
    
    def after_session(self, agent: str, session_id: str, summary: dict):
        """Session end: consolidate."""
        self.working_memory.update_after_session(agent, session_id, summary)
    
    # ── QUERY TOOLS (for MCP) ─────────────────────────────────
    
    def memory_search(self, query: str, agent: str = None,
                      memory_type: str = None, limit: int = 10) -> list[dict]:
        """Search all memories — including ones from months ago."""
        return self.long_term_memory.search(query, agent, memory_type, limit)
    
    def memory_recall_period(self, start_date: float, end_date: float = None,
                             agent: str = None) -> list[dict]:
        """Recall memories from a specific time period."""
        return self.long_term_memory.recall_by_date(start_date, end_date, agent)
    
    def memory_mistakes(self, context: str = None, agent: str = None,
                        since_days: int = None) -> list[dict]:
        """Recall mistakes — have we done this wrong before?"""
        return self.long_term_memory.recall_mistakes(context, agent, since_days)
    
    def memory_decisions(self, agent: str = None, 
                         since_days: int = None) -> list[dict]:
        """Recall all decisions made."""
        return self.long_term_memory.recall_decisions(agent, since_days)
    
    def memory_conversation(self, session_id: str = None,
                            since_days: int = None) -> list[dict]:
        """Recall past conversations."""
        return self.long_term_memory.recall_conversation(session_id, since_days=since_days)
    
    def memory_stats(self, agent: str = None) -> dict:
        """Get memory statistics."""
        if agent:
            return self.long_term_memory.get_agent_summary(agent)
        return self.long_term_memory.get_store_stats()
    
    # ── HELPERS ───────────────────────────────────────────────
    
    def _classify_result(self, result: dict) -> str:
        status = result.get("status", "")
        if status in ["converged", "completed"]:
            return "episodic"
        elif status == "failed":
            return "mistake"
        elif status == "killed":
            return "mistake"
        return "episodic"
    
    def _extract_tags(self, text: str) -> list[str]:
        keywords = ["auth", "login", "api", "database", "ui", "component",
                    "deploy", "test", "security", "performance", "bug", "fix"]
        return [kw for kw in keywords if kw in text.lower()]
