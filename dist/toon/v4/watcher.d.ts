export interface WatcherStatus {
    tool: string;
    running: boolean;
    pid: number | null;
    lastRebuild: string | null;
    errors: number;
}
export declare function startWatcher(projectRoot: string): WatcherStatus[];
export declare function stopAllWatchers(): void;
export declare function getWatcherStatus(): WatcherStatus[];
//# sourceMappingURL=watcher.d.ts.map