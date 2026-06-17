import { UnifiedGraph } from './unified-graph';
export interface AgentContextRequest {
    agentId: string;
    agentDept: string;
    agentLevel: number;
    query?: string;
    maxTokens?: number;
}
export interface GraphContextPayload {
    statHeader: string;
    topSymbols: string;
    deltaRef: string;
    deltaRefs: Record<string, string>;
    totalTokens: number;
    isStale: boolean;
}
export declare function buildAgentContext(unified: UnifiedGraph, request: AgentContextRequest): GraphContextPayload;
export declare function formatContextForLLM(ctx: GraphContextPayload): string;
//# sourceMappingURL=context-builder.d.ts.map