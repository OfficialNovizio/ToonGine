export interface HermesMemorySection {
    heading: string;
    entries: string[];
}
export interface CompressedHermesMemory {
    agentId: string;
    sections: {
        heading: string;
        toonLines: string[];
    }[];
    stats: {
        originalLines: number;
        compressedLines: number;
        savingsPercent: number;
    };
}
/**
 * Parse a Hermes MEMORY.md file into sections, compress each entry to TOON.
 * Saves to ~/.hermes/memories/TOON/<agentId>.toon or project's .toon/memory/
 */
export declare function compressHermesMemory(memoryPath: string, agentId: string): CompressedHermesMemory;
export interface SessionDeltaState {
    sessionId: string;
    lastHash: string;
    entryHashes: Map<string, string>;
    turnCount: number;
}
/**
 * Compute delta between current session data and last synced state.
 * Only returns new/changed/deleted items — 93% savings on repeat syncs.
 */
export declare function computeHermesSessionDelta(sessionId: string, entries: Map<string, string>): {
    isFullSync: boolean;
    delta: string;
    summary: string;
};
export interface CompressedSkill {
    name: string;
    description: string;
    steps: string[];
    pitfalls: string[];
    compressed: string;
}
/**
 * Compress a Hermes skill (SKILL.md) into a compact TOON block.
 * Skills are injected into system prompts — smaller = more skills fit.
 */
export declare function compressHermesSkill(skillPath: string): CompressedSkill | null;
export interface HermesToonResult {
    memoriesCompressed: number;
    sessionsDeltaEnabled: boolean;
    skillsCompressed: number;
    toonMemoryDir: string;
    errors: string[];
}
/**
 * Run full TOON-ification on all Hermes data for a project.
 * Called automatically during `toongine integrate` if Hermes is detected.
 */
export declare function toonifyHermes(projectRoot: string, hermesHome?: string): HermesToonResult;
//# sourceMappingURL=hermes-bridge.d.ts.map