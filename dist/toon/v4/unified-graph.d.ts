import { UnifiedNode, UnifiedEdge, UnifiedGraphStats, IngestionResult } from './bridge-types';
export declare class UnifiedGraph {
    private db;
    private dbPath;
    constructor(dbPath: string);
    initialize(): void;
    ingestNodes(nodes: UnifiedNode[]): number;
    ingestEdges(edges: UnifiedEdge[]): number;
    ingest(tool: string, nodes: UnifiedNode[], edges: UnifiedEdge[]): IngestionResult;
    stats(): UnifiedGraphStats;
    search(query: string, limit?: number): UnifiedNode[];
    findByFilePattern(pattern: string, limit?: number): UnifiedNode[];
    findCallers(nodeId: string, limit?: number): Array<UnifiedNode & {
        edge_kind: string;
    }>;
    findCallees(nodeId: string, limit?: number): Array<UnifiedNode & {
        edge_kind: string;
    }>;
    impact(nodeId: string, maxDepth?: number): string[];
    close(): void;
    private rowToNode;
}
export declare function createUnifiedGraph(projectRoot: string): UnifiedGraph;
//# sourceMappingURL=unified-graph.d.ts.map