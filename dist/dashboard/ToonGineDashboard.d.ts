import React from 'react';
import type { TokenBurnData, ProjectHealthData, AgentMemoryData } from './types';
type Tab = 'memory' | 'burn' | 'health';
interface Props {
    tab: Tab;
    tokenBurnData: TokenBurnData | null;
    projectHealthData: ProjectHealthData | null;
    agentMemoryData: AgentMemoryData | null;
}
export declare function ToonGineDashboard({ tab, tokenBurnData, projectHealthData, agentMemoryData }: Props): React.JSX.Element;
export {};
//# sourceMappingURL=ToonGineDashboard.d.ts.map