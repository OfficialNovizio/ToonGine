import React from 'react'
import type { TokenBurnData, ProjectHealthData, AgentMemoryData } from './types'
import { TokenBurn } from './TokenBurn'
import { ProjectHealth } from './ProjectHealth'
import { AgentMemory } from './AgentMemory'

type Tab = 'memory' | 'burn' | 'health'

interface Props { tab: Tab; tokenBurnData: TokenBurnData | null; projectHealthData: ProjectHealthData | null; agentMemoryData: AgentMemoryData | null }

export function ToonGineDashboard({ tab, tokenBurnData, projectHealthData, agentMemoryData }: Props) {
  if (tab === 'memory') return <AgentMemory data={agentMemoryData!} />
  if (tab === 'burn')    return <TokenBurn data={tokenBurnData!} />
  return <ProjectHealth data={projectHealthData!} />
}
