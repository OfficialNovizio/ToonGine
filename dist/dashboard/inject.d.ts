export interface InjectResult {
    created: string[];
    updated: string[];
    skipped: string[];
    errors: string[];
    dashboardPath: string | null;
}
export declare function injectDashboard(projectRoot: string, config?: any): InjectResult;
//# sourceMappingURL=inject.d.ts.map