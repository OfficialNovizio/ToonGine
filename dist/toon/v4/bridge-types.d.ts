export interface UnifiedNode {
    id: string;
    name: string;
    qualified_name: string;
    kind: string;
    file_path: string | null;
    language: string | null;
    community: string | null;
    tool_source: string;
    tool_node_id: string | null;
    extra: Record<string, any>;
}
export interface UnifiedEdge {
    id?: number;
    source_id: string;
    target_id: string;
    kind: string;
    confidence: number;
    tool_source: string;
    extra: Record<string, any>;
}
export interface UnifiedGraphStats {
    nodeCount: number;
    edgeCount: number;
    fileCount: number;
    communityCount: number;
    languageBreakdown: Record<string, number>;
    toolBreakdown: Record<string, number>;
    lastBuilt: string | null;
    stale: boolean;
}
export interface IngestionResult {
    tool: string;
    nodesIngested: number;
    edgesIngested: number;
    nodesDeduped: number;
    errors: string[];
    durationMs: number;
}
export interface BridgeConfig {
    version: '4.0.0';
    projectRoot: string;
    tools: {
        'code-review-graph': {
            installed: boolean;
            path: string;
            status: 'ok' | 'missing' | 'error';
        };
        'graphify': {
            installed: boolean;
            path: string;
            status: 'ok' | 'missing' | 'error';
        };
        'codegraph': {
            installed: boolean;
            path: string;
            status: 'ok' | 'missing' | 'error';
        };
    };
    watcher: {
        enabled: boolean;
        debounceMs: number;
        running: boolean;
    };
    compression: {
        target: number;
        achieved: number;
    };
}
export interface MCPToolDef {
    name: string;
    description: string;
    inputSchema: {
        type: 'object';
        properties: Record<string, {
            type: string;
            description: string;
        }>;
        required: string[];
    };
}
export declare function stableHash(input: string): string;
export declare function nodeId(qualifiedName: string, tool: string): string;
//# sourceMappingURL=bridge-types.d.ts.map