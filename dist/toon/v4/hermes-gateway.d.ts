import { MCPToolDef } from './bridge-types';
export declare const GRAPH_MCP_TOOLS: MCPToolDef[];
export declare class HermesGraphGateway {
    private unified;
    private projectRoot;
    constructor(projectRoot: string);
    init(): boolean;
    handleToolCall(toolName: string, args: Record<string, any>): string;
    getTools(): MCPToolDef[];
    close(): void;
}
export declare function createGraphGateway(projectRoot: string): HermesGraphGateway;
//# sourceMappingURL=hermes-gateway.d.ts.map