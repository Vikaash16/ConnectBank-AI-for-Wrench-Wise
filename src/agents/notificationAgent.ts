/**
 * Layer 4 - Notification Agent
 * Specialized in dispatching customer alerts, summarizing notifications, and multi-channel delivery.
 */

import { SpecializedAgent, AgentContext, AgentExecutionOutput } from './types.ts';
import { toolRegistry } from '../tools/registry.ts';
import { ToolCall, ToolResult } from '../types/banking.ts';

export const notificationAgent: SpecializedAgent = {
  name: 'Notification & Alerts Agent',
  role: 'notification_agent',
  description: 'Specialized in customer notifications, security alerts, and dispatching simulated communications.',
  getCapabilities: () => [
    'Retrieve unread and historical customer notifications',
    'Summarize recent fraud and account security alerts',
    'Dispatch simulated SMS and in-app bell notifications',
  ],
  canHandle: (intent: string, prompt: string) => {
    const p = prompt.toLowerCase();
    return (
      intent === 'NOTIFICATION_CHECK' ||
      p.includes('notification') ||
      p.includes('alert') ||
      p.includes('messages') ||
      p.includes('send alert')
    );
  },
  execute: async (task: string, context: AgentContext): Promise<AgentExecutionOutput> => {
    const toolCallsMade: ToolCall[] = [];
    const toolResultsReceived: ToolResult[] = [];

    const notifToolCall: ToolCall = {
      id: `TC-${Date.now().toString(36)}-NTF`,
      toolName: 'get_notifications',
      callerAgent: 'notification_agent',
      parameters: { limit: 5 },
      timestamp: new Date().toISOString(),
    };
    toolCallsMade.push(notifToolCall);

    const notifRes = await toolRegistry.invokeTool(
      'get_notifications',
      { limit: 5 },
      { authenticatedCustomerId: context.authenticatedCustomerId, callerAgent: 'notification_agent', requestId: context.requestId }
    );
    toolResultsReceived.push(notifRes);

    const data = notifRes.result as any;

    return {
      agentRole: 'notification_agent',
      summary: `Retrieved notifications: ${data?.unreadCount ?? 0} unread alert(s) across all categories.`,
      structuredData: data,
      toolCallsMade,
      toolResultsReceived,
    };
  },
};
