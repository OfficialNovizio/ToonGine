import { WatcherStatus } from './watcher';
import { BridgeConfig } from './bridge-types';
export interface ActivationReport {
    projectRoot: string;
    isEmpty: boolean;
    tools: BridgeConfig['tools'];
    graphNodes: number;
    graphEdges: number;
    watchers: WatcherStatus[];
    durationMs: number;
    errors: string[];
}
export declare function activate(projectRoot: string): ActivationReport;
export declare function deactivate(projectRoot: string): void;
//# sourceMappingURL=auto-activate.d.ts.map