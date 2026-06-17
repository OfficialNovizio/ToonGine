import { BridgeConfig } from './bridge-types';
export interface ToolStatus {
    name: string;
    installed: boolean;
    path: string;
    version: string;
    error?: string;
}
export declare function detectTools(projectRoot: string): ToolStatus[];
export declare function installCodegraph(projectRoot: string): ToolStatus;
export declare function ensureAllTools(projectRoot: string): BridgeConfig['tools'];
//# sourceMappingURL=tool-installer.d.ts.map