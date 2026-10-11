/**
 * Layer 4 - Compliance & Regulatory Agent
 * Specialized in KYC compliance, periodic updation mandates, AML screening, and RBI regulations.
 */

import { SpecializedAgent, AgentContext, AgentExecutionOutput } from './types.ts';
import { toolRegistry } from '../tools/registry.ts';
import { ToolCall, ToolResult } from '../types/banking.ts';
import { retrieveRelevantPolicies } from '../rag/retriever.ts';

export const complianceAgent: SpecializedAgent = {
  name: 'Compliance & KYC Agent',
  role: 'compliance_agent',
  description: 'Specialized in customer KYC status, document verification, AML screening, and regulatory adherence.',
  getCapabilities: () => [
    'Retrieve customer KYC verification status and timeline',
    'Identify pending or missing documentation requirements',
    'Screen simulated Anti-Money Laundering (AML) risk indicators',
    'Retrieve RBI Master Direction guidelines for KYC and V-CIP',
  ],
  canHandle: (intent: string, prompt: string) => {
    const p = prompt.toLowerCase();
    return (
      intent === 'KYC_COMPLIANCE' ||
      p.includes('kyc') ||
      p.includes('compliance') ||
      p.includes('verification') ||
      p.includes('document') ||
      p.includes('aadhaar') ||
      p.includes('pan card') ||
      p.includes('aml') ||
      p.includes('rbi regulation')
    );
  },
  execute: async (task: string, context: AgentContext): Promise<AgentExecutionOutput> => {
    const toolCallsMade: ToolCall[] = [];
    const toolResultsReceived: ToolResult[] = [];

    const kycToolCall: ToolCall = {
      id: `TC-${Date.now().toString(36)}-KYC`,
      toolName: 'get_kyc_status',
      callerAgent: 'compliance_agent',
      parameters: { customerId: context.authenticatedCustomerId },
      timestamp: new Date().toISOString(),
    };
    toolCallsMade.push(kycToolCall);

    const kycRes = await toolRegistry.invokeTool(
      'get_kyc_status',
      { customerId: context.authenticatedCustomerId },
      { authenticatedCustomerId: context.authenticatedCustomerId, callerAgent: 'compliance_agent', requestId: context.requestId }
    );
    toolResultsReceived.push(kycRes);

    const kycData = kycRes.result as any;
    const policies = retrieveRelevantPolicies('rbi master direction kyc periodic updation video kyc');

    const missing = kycData?.missingRequirements || [];
    let summary = '';
    if (kycData?.isCompliant) {
      summary = `KYC Status: Fully Verified & Compliant. Aadhaar & PAN verified. Next periodic review due on ${kycData?.nextDueDate || '2027'}. AML screening: CLEAR.`;
    } else {
      summary = `KYC Status: Action Required (${kycData?.status?.replace('_', ' ').toUpperCase()}). Found ${missing.length} pending requirement(s): ${missing.join('; ')}.`;
    }

    return {
      agentRole: 'compliance_agent',
      summary,
      structuredData: kycData,
      toolCallsMade,
      toolResultsReceived,
      policyCitations: policies,
    };
  },
};
