/**
 * Layer 4 - Risk / Fraud Agent
 * Specialized in deterministic transaction risk scoring, geo-velocity anomalies, and security protections.
 */

import { SpecializedAgent, AgentContext, AgentExecutionOutput } from './types.ts';
import { toolRegistry } from '../tools/registry.ts';
import { ToolCall, ToolResult } from '../types/banking.ts';
import { retrieveRelevantPolicies } from '../rag/retriever.ts';

export const fraudAgent: SpecializedAgent = {
  name: 'Risk & Fraud Agent',
  role: 'risk_fraud_agent',
  description: 'Specialized in transaction monitoring, geo-velocity anomalies, risk scoring, and security holds.',
  getCapabilities: () => [
    'Analyze recent transactions against deterministic fraud rules',
    'Detect geographic anomalies and IP mismatches',
    'Calculate objective transaction risk score (0-100)',
    'Recommend card freeze, dispute escalation, and RBI Zero-Liability filing',
  ],
  canHandle: (intent: string, prompt: string) => {
    const p = prompt.toLowerCase();
    return (
      intent === 'FRAUD_RISK_CHECK' ||
      intent === 'FREEZE_CARD_SECURITY' ||
      intent === 'MULTI_AGENT_SUMMARY' ||
      p.includes('fraud') ||
      p.includes('suspicious') ||
      p.includes('unauthorized') ||
      p.includes('scam') ||
      p.includes('freeze') ||
      p.includes('block card') ||
      p.includes('hack') ||
      p.includes('security alert')
    );
  },
  execute: async (task: string, context: AgentContext): Promise<AgentExecutionOutput> => {
    const toolCallsMade: ToolCall[] = [];
    const toolResultsReceived: ToolResult[] = [];
    const p = context.userPrompt.toLowerCase();

    // Check if user is asking to freeze card / account
    const isFreezeIntent = p.includes('freeze') || p.includes('block my card') || p.includes('lock my account') || p.includes('freeze my account');

    if (isFreezeIntent) {
      // Check if this action is already confirmed
      const isConfirmed = context.extractedParameters?.confirmedAction === true;

      if (!isConfirmed) {
        // Human-in-the-loop: Request explicit confirmation
        return {
          agentRole: 'risk_fraud_agent',
          summary: 'Security Freeze requested: Requires customer confirmation before locking payment channels.',
          requiresConfirmation: true,
          confirmationDetails: {
            actionType: 'FREEZE_ACCOUNT_CARD',
            warningMessage: 'This will temporarily block all debit card, UPI, and online outgoing transactions on your primary account. Are you sure you wish to proceed?',
          },
          toolCallsMade: [],
          toolResultsReceived: [],
        };
      }

      // If confirmed, execute the freeze tool
      const freezeCall: ToolCall = {
        id: `TC-${Date.now().toString(36)}-FRZ`,
        toolName: 'freeze_card_or_account',
        callerAgent: 'risk_fraud_agent',
        parameters: { accountId: 'ACC-1001-SAV', reason: 'Customer initiated emergency security freeze via AI Assistant' },
        timestamp: new Date().toISOString(),
      };
      toolCallsMade.push(freezeCall);
      const freezeRes = await toolRegistry.invokeTool(
        'freeze_card_or_account',
        { accountId: 'ACC-1001-SAV', reason: 'Customer initiated emergency security freeze via AI Assistant' },
        { authenticatedCustomerId: context.authenticatedCustomerId, callerAgent: 'risk_fraud_agent', requestId: context.requestId }
      );
      toolResultsReceived.push(freezeRes);

      return {
        agentRole: 'risk_fraud_agent',
        summary: 'Emergency security freeze has been successfully executed on your account.',
        structuredData: { freezeResult: freezeRes.result },
        toolCallsMade,
        toolResultsReceived,
      };
    }

    // Standard Fraud Analysis
    const riskToolCall: ToolCall = {
      id: `TC-${Date.now().toString(36)}-RSK`,
      toolName: 'analyze_transaction_risk',
      callerAgent: 'risk_fraud_agent',
      parameters: { customerId: context.authenticatedCustomerId, lookbackDays: 30 },
      timestamp: new Date().toISOString(),
    };
    toolCallsMade.push(riskToolCall);

    const riskResult = await toolRegistry.invokeTool(
      'analyze_transaction_risk',
      { customerId: context.authenticatedCustomerId, lookbackDays: 30 },
      { authenticatedCustomerId: context.authenticatedCustomerId, callerAgent: 'risk_fraud_agent', requestId: context.requestId }
    );
    toolResultsReceived.push(riskResult);

    const riskData = riskResult.result as any;
    const policies = retrieveRelevantPolicies('unauthorized electronic transactions zero liability fraud dispute');

    const riskFlags: string[] = [];
    if (riskData?.overallRiskScore >= 60) {
      riskFlags.push(`HIGH_RISK_DETECTED: Score ${riskData.overallRiskScore}/100`);
      riskFlags.push(...(riskData.triggeredRules || []));
    }

    return {
      agentRole: 'risk_fraud_agent',
      summary: `Completed deterministic transaction analysis. Calculated risk score: ${riskData?.overallRiskScore ?? 0}/100 (${riskData?.riskLevel?.toUpperCase() ?? 'NORMAL'}). Detected ${riskData?.suspiciousTransactions?.length ?? 0} suspicious transaction(s).`,
      structuredData: riskData,
      toolCallsMade,
      toolResultsReceived,
      policyCitations: policies,
      riskFlags,
    };
  },
};
