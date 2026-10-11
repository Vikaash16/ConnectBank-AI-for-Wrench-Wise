/**
 * Layer 5 - MCP-Style Central Banking Tool Registry
 * Enforces role-based tool authorization, input validation with Zod, and audit trails.
 */

import { BankingToolDefinition, ToolExecutionContext } from './types.ts';
import {
  getCustomerProfileTool,
  getAccountsTool,
  getAccountBalanceTool,
  getTransactionsTool,
  getTransactionDetailsTool,
  analyzeTransactionRiskTool,
  getLoanDetailsTool,
  calculateLoanEMITool,
  checkLoanEligibilityTool,
  getKYCStatusTool,
  getNotificationsTool,
  createSimulatedNotificationTool,
  freezeCardOrAccountTool,
} from './bankingTools.ts';
import { AgentRole, ToolResult } from '../types/banking.ts';
import { bankingDB } from '../db/database.ts';

class ToolRegistry {
  private tools: Map<string, BankingToolDefinition> = new Map();

  constructor() {
    this.register(getCustomerProfileTool);
    this.register(getAccountsTool);
    this.register(getAccountBalanceTool);
    this.register(getTransactionsTool);
    this.register(getTransactionDetailsTool);
    this.register(analyzeTransactionRiskTool);
    this.register(getLoanDetailsTool);
    this.register(calculateLoanEMITool);
    this.register(checkLoanEligibilityTool);
    this.register(getKYCStatusTool);
    this.register(getNotificationsTool);
    this.register(createSimulatedNotificationTool);
    this.register(freezeCardOrAccountTool);
  }

  public register(tool: BankingToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  public getTool(name: string): BankingToolDefinition | undefined {
    return this.tools.get(name);
  }

  public getAllTools(): BankingToolDefinition[] {
    return Array.from(this.tools.values());
  }

  public getToolsForRole(role: AgentRole): BankingToolDefinition[] {
    return Array.from(this.tools.values()).filter(t => t.authorizedRoles.includes(role));
  }

  public async invokeTool(
    toolName: string,
    rawParameters: Record<string, unknown>,
    context: ToolExecutionContext
  ): Promise<ToolResult> {
    const startTime = Date.now();
    const toolCallId = `TC-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`;

    const tool = this.tools.get(toolName);
    if (!tool) {
      return {
        toolCallId,
        toolName,
        status: 'error',
        error: `Tool "${toolName}" is not registered in the ConnectBank tool registry.`,
        durationMs: Date.now() - startTime,
      };
    }

    // Role-based access authorization check
    if (!tool.authorizedRoles.includes(context.callerAgent)) {
      bankingDB.logAudit({
        customerId: context.authenticatedCustomerId,
        actor: 'supervisor_agent',
        action: 'TOOL_AUTHORIZATION_DENIED',
        details: { toolName, callerAgent: context.callerAgent, reason: 'Role unauthorized' },
      });

      return {
        toolCallId,
        toolName,
        status: 'denied',
        error: `Agent role "${context.callerAgent}" is NOT authorized to execute tool "${toolName}".`,
        durationMs: Date.now() - startTime,
      };
    }

    // Input validation with Zod
    const validation = tool.inputSchema.safeParse(rawParameters);
    if (!validation.success) {
      const errorMsg = validation.error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
      return {
        toolCallId,
        toolName,
        status: 'error',
        error: `Schema validation error for tool "${toolName}": ${errorMsg}`,
        durationMs: Date.now() - startTime,
      };
    }

    try {
      const output = await tool.execute(validation.data, context);
      const durationMs = Date.now() - startTime;

      bankingDB.logAudit({
        customerId: context.authenticatedCustomerId,
        actor: 'supervisor_agent',
        action: 'TOOL_EXECUTED',
        details: { toolName, callerAgent: context.callerAgent, durationMs, success: true },
      });

      return {
        toolCallId,
        toolName,
        status: 'success',
        result: output,
        durationMs,
      };
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      bankingDB.logAudit({
        customerId: context.authenticatedCustomerId,
        actor: 'supervisor_agent',
        action: 'TOOL_EXECUTION_FAILED',
        details: { toolName, callerAgent: context.callerAgent, error: err.message, durationMs },
      });

      return {
        toolCallId,
        toolName,
        status: err.message?.includes('SECURITY ACCESS DENIED') ? 'denied' : 'error',
        error: err.message || 'Unknown tool execution error.',
        durationMs,
      };
    }
  }
}

export const toolRegistry = new ToolRegistry();
