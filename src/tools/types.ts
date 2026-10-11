/**
 * Layer 5 - MCP-Style Banking Tool Definitions and Contracts
 */

import { z } from 'zod';
import { AgentRole, ToolResult } from '../types/banking.ts';

export interface ToolExecutionContext {
  authenticatedCustomerId: string;
  callerAgent: AgentRole;
  requestId: string;
}

export interface BankingToolDefinition<TInput = any, TOutput = any> {
  name: string;
  description: string;
  authorizedRoles: AgentRole[];
  inputSchema: z.ZodSchema<TInput>;
  execute: (input: TInput, context: ToolExecutionContext) => Promise<TOutput> | TOutput;
}

export interface ToolExecutionResponse {
  toolName: string;
  result: ToolResult;
}
