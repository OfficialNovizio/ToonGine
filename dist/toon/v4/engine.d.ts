import { AgentContextRequest } from './context-builder';
export interface V4EngineConfig {
    projectRoot: string;
    enableGraphContext?: boolean;
    maxGraphTokens?: number;
}
export interface V4AgentContext {
    agentData: string;
    graphContext: string;
    totalTokens: number;
    graphTokens: number;
    agentTokens: number;
    graphStale: boolean;
    toolsAvailable: string[];
}
export declare class V4Engine {
    private projectRoot;
    private config;
    private unified;
    constructor(config: V4EngineConfig);
    initGraph(): boolean;
    buildContext(request: AgentContextRequest): V4AgentContext;
    private loadAgentData;
    status(): {
        agentDataSize: number;
        graphNodes: number;
        graphEdges: number;
        toolsAvailable: string[];
    };
    close(): void;
}
export declare function createV4Engine(projectRoot: string): V4Engine;
//# sourceMappingURL=engine.d.ts.map