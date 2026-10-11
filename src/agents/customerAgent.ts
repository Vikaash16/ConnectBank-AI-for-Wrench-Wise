/**
 * Layer 4 - Customer / Banking Agent
 * Handles customer profile inquiries, account balance overviews, and transaction exploration.
 */

import { SpecializedAgent, AgentContext, AgentExecutionOutput } from './types.ts';
import { toolRegistry } from '../tools/registry.ts';
import { ToolCall, ToolResult } from '../types/banking.ts';

export const customerAgent: SpecializedAgent = {
  name: 'Customer & Accounts Agent',
  role: 'customer_agent',
  description: 'Specialized in customer portfolio, account balances, and transaction retrieval.',
  getCapabilities: () => [
    'Retrieve customer profile and KYC tier',
    'Fetch real-time balances across all accounts',
    'Retrieve recent transaction history with category and status filters',
    'Search transaction details by reference number or merchant',
  ],
  canHandle: (intent: string, prompt: string) => {
    const p = prompt.toLowerCase();
    return (
      intent === 'ACCOUNT_INQUIRY' ||
      intent === 'MULTI_AGENT_SUMMARY' ||
      p.includes('balance') ||
      p.includes('account') ||
      p.includes('transaction') ||
      p.includes('spend') ||
      p.includes('statement') ||
      p.includes('profile')
    );
  },
  execute: async (task: string, context: AgentContext): Promise<AgentExecutionOutput> => {
    const toolCallsMade: ToolCall[] = [];
    const toolResultsReceived: ToolResult[] = [];
    const p = context.userPrompt.toLowerCase();

    // Determine what to query
    const wantsBalance = p.includes('balance') || p.includes('how much') || p.includes('account') || task.includes('balance');
    const wantsTransactions = p.includes('transaction') || p.includes('spent') || p.includes('statement') || p.includes('last 5') || p.includes('history') || task.includes('transactions');
    const wantsProfile = p.includes('profile') || p.includes('my details') || p.includes('who am i');

    // 1. Fetch Accounts
    const accToolCall: ToolCall = {
      id: `TC-${Date.now().toString(36)}-1`,
      toolName: 'get_accounts',
      callerAgent: 'customer_agent',
      parameters: { customerId: context.authenticatedCustomerId },
      timestamp: new Date().toISOString(),
    };
    toolCallsMade.push(accToolCall);
    const accResult = await toolRegistry.invokeTool(
      'get_accounts',
      { customerId: context.authenticatedCustomerId },
      { authenticatedCustomerId: context.authenticatedCustomerId, callerAgent: 'customer_agent', requestId: context.requestId }
    );
    toolResultsReceived.push(accResult);

    // 2. Fetch Transactions (if requested or by default for account inquiry)
    let txnResult: ToolResult | undefined;
    if (wantsTransactions || wantsBalance) {
      // Parse limit if user said "last 5" or "10"
      let limit = 5;
      const numMatch = context.userPrompt.match(/(?:last|past|recent)\s+(\d+)/i);
      if (numMatch && numMatch[1]) {
        limit = parseInt(numMatch[1], 10);
      }

      const txnToolCall: ToolCall = {
        id: `TC-${Date.now().toString(36)}-2`,
        toolName: 'get_transactions',
        callerAgent: 'customer_agent',
        parameters: { limit },
        timestamp: new Date().toISOString(),
      };
      toolCallsMade.push(txnToolCall);
      txnResult = await toolRegistry.invokeTool(
        'get_transactions',
        { limit },
        { authenticatedCustomerId: context.authenticatedCustomerId, callerAgent: 'customer_agent', requestId: context.requestId }
      );
      toolResultsReceived.push(txnResult);
    }

    // 3. Fetch Profile if asked
    if (wantsProfile) {
      const profToolCall: ToolCall = {
        id: `TC-${Date.now().toString(36)}-3`,
        toolName: 'get_customer_profile',
        callerAgent: 'customer_agent',
        parameters: { customerId: context.authenticatedCustomerId },
        timestamp: new Date().toISOString(),
      };
      toolCallsMade.push(profToolCall);
      const profResult = await toolRegistry.invokeTool(
        'get_customer_profile',
        { customerId: context.authenticatedCustomerId },
        { authenticatedCustomerId: context.authenticatedCustomerId, callerAgent: 'customer_agent', requestId: context.requestId }
      );
      toolResultsReceived.push(profResult);
    }

    // Build structured output & concise summary
    const accountsData = accResult.result as any;
    const txnsData = txnResult?.result as any;

    const summaryParts: string[] = [];
    if (accountsData?.accounts) {
      const totalFmt = Number(accountsData.totalBalance).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      summaryParts.push(`Retrieved ${accountsData.accountCount} active account(s) with total balance of ₹${totalFmt}.`);
    }
    if (txnsData?.transactions) {
      summaryParts.push(`Retrieved ${txnsData.count} recent transaction(s).`);
    }

    return {
      agentRole: 'customer_agent',
      summary: summaryParts.join(' ') || 'Customer banking portfolio retrieved.',
      structuredData: {
        accounts: accountsData,
        transactions: txnsData,
      },
      toolCallsMade,
      toolResultsReceived,
    };
  },
};
