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
export interface CodebaseSnapshot {
    repo_id: string;
    slot: number;
    sampled_at: string;
    ts_errors: number;
    ts_error_free: boolean;
    files_total: number;
    lines_total: number;
    build_duration_ms: number;
    dependencies: number;
    outdated_deps: number;
}
export interface ApiHealthEntry {
    id: number;
    repo_id: string;
    endpoint: string;
    status_code: number;
    duration_ms: number;
    error_message: string;
    created_at: string;
}
export interface IssueEntry {
    id: number;
    repo_id: string;
    priority: number;
    category: string;
    source: string;
    title: string;
    detail: string;
    file_path: string | null;
    line_number: number | null;
    status: 'open' | 'in_progress' | 'resolved' | 'wontfix';
    severity: number;
    impact_points: number;
    effort_minutes: number;
    assigned_to: string | null;
    created_at: string;
    updated_at: string;
    resolved_at: string | null;
}
export interface ToonHealthEntry {
    id: number;
    repo_id: string;
    sampled_at: string;
    files_cached: number;
    cache_size_bytes: number;
    graph_nodes: number;
    graph_edges: number;
    graph_size_bytes: number;
    total_docs: number;
    total_files: number;
    toon_dir_size_bytes: number;
    agents_with_skills: number;
    total_skills: number;
    avg_skills_per_agent: number;
    cache_stale: boolean;
    graph_orphaned: boolean;
    compression_ratio: number;
    compile_errors: number;
    graph_errors: number;
}
export interface HealthEvent {
    id: number;
    repo_id: string;
    event_type: string;
    severity: number;
    title: string;
    detail: string;
    linked_commit: string | null;
    linked_agent: string | null;
    health_impact: number;
    occurred_at: string;
}
export interface Recommendation {
    id: number;
    repo_id: string;
    priority: number;
    category: string;
    title: string;
    detail: string;
    impact_points: number;
    effort_minutes: number;
    generated_at: string;
    dismissed: boolean;
}
export interface HealthScore {
    score: number;
    codebase: number;
    api: number;
    toon: number;
    issues: number;
    trend: number;
    trend_direction: 'up' | 'down' | 'stable';
    projected_next: number;
    top_insight: string;
}
/** Get codebase snapshots for the ring buffer. */
export declare function getCodebaseSnapshots(limit?: number): Promise<CodebaseSnapshot[]>;
/** Get API health for last 24h. */
export declare function getApiHealth(limit?: number): Promise<ApiHealthEntry[]>;
/** Get open issues, ordered by priority. */
export declare function getIssues(limit?: number): Promise<IssueEntry[]>;
/** Get TOON compression health data. */
export declare function getToonHealth(limit?: number): Promise<ToonHealthEntry[]>;
/** Get health events timeline. */
export declare function getHealthEvents(limit?: number): Promise<HealthEvent[]>;
/** Get active recommendations, ordered by priority. */
export declare function getRecommendations(limit?: number): Promise<Recommendation[]>;
/** Compute health score from all pillars. */
export declare function getHealthScore(): Promise<HealthScore>;
/** Get all registered projects. */
export declare function getProjects(): Promise<ProjectInfo[]>;
//# sourceMappingURL=index.d.ts.map