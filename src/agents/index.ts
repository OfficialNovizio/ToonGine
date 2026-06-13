// src/agents/index.ts — Barrel export for toongine/agents
export { loadRegistry, getAgent, getAgentsByDept, getAgentsByLevel, getCouncilMembers, autoGenerateManifest } from './registry'
export { validateManifest, type ManifestValidation } from './manifest-schema'
export { generateHermesSkills } from './hermes-generator'
