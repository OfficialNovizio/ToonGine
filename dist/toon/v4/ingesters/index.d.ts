import { UnifiedGraph } from '../unified-graph';
import { IngestionResult } from '../bridge-types';
import { ingestCodeReviewGraph } from './code-review-graph';
import { ingestGraphify } from './graphify';
import { ingestCodegraph } from './codegraph';
export interface FullIngestionReport {
    projectRoot: string;
    results: IngestionResult[];
    totalNodes: number;
    totalEdges: number;
    totalDeduped: number;
    totalErrors: number;
    durationMs: number;
    unifiedStats: ReturnType<UnifiedGraph['stats']>;
}
export declare function ingestAll(unified: UnifiedGraph, projectRoot: string): FullIngestionReport;
export { ingestCodeReviewGraph, ingestGraphify, ingestCodegraph };
//# sourceMappingURL=index.d.ts.map