export interface AgentSkill {
    name: string;
    category: string;
}
export interface ToonAgent {
    id: string;
    name: string;
    role: string;
    department: string;
    level: number;
    status: 'active' | 'idle' | 'offline';
    skills_count: number;
    skills: AgentSkill[];
    memory_size: string;
    memory_health: number;
    last_active: string | null;
    updated_at: string;
}
export interface ActivityEntry {
    id: number;
    agent_name: string;
    task: string;
    tokens: number;
    duration_sec: number;
    status: string;
    created_at: string;
}
export interface CouncilEntry {
    id: number;
    topic: string;
    decision: string;
    votes: Record<string, unknown>;
    summary: string;
    created_at: string;
}
export interface SyncLog {
    synced_at: string;
    agents_count: number;
    activity_count: number;
    status: string;
}
export interface ActivityRun {
    run_id: string;
    repo_id: string;
    agent_id: string;
    agent_name: string;
    department: string;
    provider: string;
    model: string;
    tokens_in: number;
    tokens_out: number;
    cost_usd: number;
    duration_ms: number;
    task: string;
    status: string;
    created_at: string;
}
export interface Snapshot {
    repo_id: string;
    granularity: 'hour' | 'day' | 'month';
    slot: number;
    period_start: string;
    period_end: string;
    tokens_total: number;
    cost_total: number;
    run_count: number;
    active_agents: number;
    top_agent: string;
    top_task: string;
    efficiency_pct: number;
}
export interface ProviderLedger {
    id: number;
    repo_id: string;
    provider: string;
    state: 'activated' | 'active' | 'low' | 'depleted' | 'switched';
    balance_start: number;
    balance_current: number;
    total_spent: number;
    total_tokens: number;
    avg_cost_per_1k: number;
    efficiency_pct: number;
    activated_at: string;
    depleted_at: string | null;
    switched_at: string | null;
    is_current: boolean;
}
export interface ProjectInfo {
    repo_id: string;
    repo_name: string;
    owner: string;
    first_seen_at: string;
    last_active_at: string;
    total_runs: number;
    total_tokens: number;
    total_cost: number;
}
export declare function getAgents(): Promise<ToonAgent[]>;
export declare function getActivity(limit?: number): Promise<ActivityEntry[]>;
export declare function getCouncil(limit?: number): Promise<CouncilEntry[]>;
export declare function getLastSync(): Promise<SyncLog | null>;
export declare function getDepartments(): Promise<{
    name: string;
    agentCount: number;
    skillsTotal: number;
}[]>;
export declare function isConfigured(): boolean;
/** Get the current project's repo ID. */
export declare function getRepoId(): string;
/** Register this project in Supabase (idempotent). Called by postinstall. */
export declare function registerProject(): Promise<ProjectInfo | null>;
/** Get token burn snapshots for this repo (ring buffer read — O(1)). */
export declare function getSnapshots(granularity?: 'hour' | 'day' | 'month'): Promise<Snapshot[]>;
/** Get activity log for this repo. */
export declare function getActivityLog(limit?: number): Promise<ActivityRun[]>;
/** Get provider ledger — current + previous providers. */
export declare function getProviderLedger(): Promise<ProviderLedger[]>;
/** Get cost leaderboard — most expensive tasks (min-heap Top-K). */
export declare function getLeaderboard(limit?: number): Promise<ActivityRun[]>;
/** Get all registered projects (for project selector dropdown). */
export declare function getProjects(): Promise<ProjectInfo[]>;
//# sourceMappingURL=index.d.ts.map