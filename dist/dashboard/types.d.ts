export interface TokenBurnData {
    tokenUsage: {
        date: string;
        tokens: number;
    }[];
    costByDept: {
        department: string;
        percentage: number;
        tokens: number;
        cost: number;
    }[];
    costTrend: {
        date: string;
        cost: number;
    }[];
    perAgentBurn: {
        agent: string;
        tokens: number;
        cost: number;
    }[];
    providerHealth: {
        provider: string;
        usagePercent: number;
        balance: number | null;
        configured: boolean;
    }[];
}
export interface ProjectHealthData {
    kpi: {
        toonAvg: number;
        bundleSize: number;
        apiSuccess: number;
        issuesOpen: number;
        issuesCritical: number;
    };
    toonQuality: {
        category: string;
        percent: number;
        grade: string;
    }[];
    savingsTrend: {
        date: string;
        percent: number;
    }[];
    topKMatch: {
        chunksMatched: number;
        chunksInjected: number;
        l1: number;
        l2: number;
        ref: number;
    };
    codebase: {
        lastCompile: string;
        duration: string;
        files: number;
        chunks: number;
        terms: number;
        bpe: number;
        corpusSize: string;
        compressedSize: string;
        compressionPercent: number;
        delta: string;
        tsErrors: number;
    };
    apiHealth: {
        status200: number;
        status400: number;
        status500: number;
        total24h: number;
        errors: number;
        topError: string;
    };
    promptQuality: {
        avgContext: string;
        avgInjected: string;
        reduction: number;
        cacheHits: number;
        bestAgent: string;
        worstAgent: string;
    };
    issues: {
        time: string;
        message: string;
        severity: 'warning' | 'error' | 'success';
    }[];
    docCoverage: {
        dir: string;
        percent: number;
        covered: number;
        total: number;
    }[];
}
export interface AgentMemoryData {
    memories: {
        agent: string;
        dept: string;
        size: number;
        health: number;
    }[];
    memoryTotalSize: number;
    memoryAgentCount: number;
    graph: {
        nodes: number;
        edges: number;
        density: number;
        kinds: {
            kind: string;
            count: number;
        }[];
        tools: {
            tool: string;
            count: number;
        }[];
        highConfidence: number;
    } | null;
    plugins: {
        name: string;
        status: 'ok' | 'warn' | 'error';
        detail: string;
    }[];
    hermes: {
        sessions: number;
        tokensIn: number;
        tokensOut: number;
    };
    skillsTotal: number;
    agentEfficiency: {
        agent: string;
        calls: number;
        successRate: number;
        avgTokens: number;
        avgCost: number;
    }[];
}
//# sourceMappingURL=types.d.ts.map