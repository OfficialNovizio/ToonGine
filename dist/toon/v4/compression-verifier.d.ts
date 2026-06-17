export interface CompressionReport {
    rawSizeBytes: number;
    compressedTokens: number;
    compressedBytes: number;
    compressionRatio: number;
    targetMet: boolean;
    breakdown: {
        agentDataBytes: number;
        graphDataBytes: number;
        agentTokens: number;
        graphTokens: number;
    };
    perAgent: Array<{
        agentId: string;
        agentTokens: number;
        graphTokens: number;
        totalTokens: number;
    }>;
}
export declare function measureCompression(projectRoot: string): CompressionReport;
//# sourceMappingURL=compression-verifier.d.ts.map