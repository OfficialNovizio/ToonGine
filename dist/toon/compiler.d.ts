export interface CompileResult {
    sourcePath: string;
    destPath: string;
    sourceSize: number;
    compressedSize: number;
    savingsPercent: number;
    durationMs: number;
    sections: number;
    abbreviationsApplied: number;
    skipped?: boolean;
    error?: string;
}
export interface CompileAllResult {
    totalFiles: number;
    compiled: number;
    errors: number;
    totalSourceSize: number;
    totalCompressedSize: number;
    overallSavingsPercent: number;
    durationMs: number;
    results: CompileResult[];
}
export declare function compileFile(sourcePath: string, projectRoot: string, dict?: Record<string, string>): CompileResult;
export declare function compileAll(projectRoot: string, dict?: Record<string, string>): CompileAllResult;
export declare function compileAllIncremental(projectRoot: string, dict?: Record<string, string>, force?: boolean): CompileAllResult & {
    skipped: number;
    cached: boolean;
};
//# sourceMappingURL=compiler.d.ts.map