/**
 * Layer 4 - Multi-Agent Architecture Contracts
 */

import { AgentRole, ToolCall, ToolResult, PolicyCitation, TaskStep } from '../types/banking.ts';

export interface AgentContext {
  authenticatedCustomerId: string;
  requestId: string;
  userPrompt: string;
  extractedParameters?: Record<string, unknown>;
}

export interface AgentExecutionOutput {
  agentRole: AgentRole;
  summary: string;
  structuredData?: Record<string, unknown>;
  toolCallsMade: ToolCall[];
  toolResultsReceived: ToolResult[];
  policyCitations?: PolicyCitation[];
  riskFlags?: string[];
  requiresConfirmation?: boolean;
  confirmationDetails?: {
    actionType: string;
    targetId?: string;
    warningMessage: string;
  };
}

export interface SpecializedAgent {
  name: string;
  role: AgentRole;
  description: string;
  getCapabilities: () => string[];
  canHandle: (intent: string, prompt: string) => boolean;
  execute: (task: string, context: AgentContext) => Promise<AgentExecutionOutput>;
}
