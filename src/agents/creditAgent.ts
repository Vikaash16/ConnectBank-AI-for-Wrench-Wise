/**
 * Layer 4 - Credit / Loan Agent
 * Specialized in reducing-balance EMI calculations, loan portfolio inquiries, and preliminary eligibility appraisal.
 */

import { SpecializedAgent, AgentContext, AgentExecutionOutput } from './types.ts';
import { toolRegistry } from '../tools/registry.ts';
import { ToolCall, ToolResult } from '../types/banking.ts';
import { retrieveRelevantPolicies } from '../rag/retriever.ts';

export const creditAgent: SpecializedAgent = {
  name: 'Credit & Loans Agent',
  role: 'credit_loan_agent',
  description: 'Specialized in loan portfolio details, mathematical EMI calculations, and eligibility estimations.',
  getCapabilities: () => [
    'Retrieve existing active loans, remaining balance, and next EMI due date',
    'Calculate reducing balance monthly EMI, total interest, and amortisation',
    'Evaluate preliminary loan eligibility under RBI Debt-to-Income / FOIR limits',
    'Explain credit underwriting factors and CIBIL requirements',
  ],
  canHandle: (intent: string, prompt: string) => {
    const p = prompt.toLowerCase();
    return (
      intent === 'LOAN_ELIGIBILITY' ||
      intent === 'EMI_CALCULATION' ||
      intent === 'MULTI_AGENT_SUMMARY' ||
      p.includes('loan') ||
      p.includes('emi') ||
      p.includes('eligible') ||
      p.includes('interest rate') ||
      p.includes('borrow') ||
      p.includes('mortgage')
    );
  },
  execute: async (task: string, context: AgentContext): Promise<AgentExecutionOutput> => {
    const toolCallsMade: ToolCall[] = [];
    const toolResultsReceived: ToolResult[] = [];
    const p = context.userPrompt.toLowerCase();

    // Check if user wants an explicit EMI calculation:
    // e.g. "Calculate the EMI for ₹3,00,000 at 10.5% annual interest for 36 months"
    const hasEmiCalcPattern =
      (p.includes('calculate') || p.includes('what is the emi') || p.includes('emi for')) &&
      (p.includes('%') || p.includes('month') || p.includes('interest'));

    // Check if user is asking for loan eligibility:
    // e.g. "Am I eligible for a loan of ₹5,00,000?"
    const hasEligibilityPattern =
      p.includes('eligible') || p.includes('eligibility') || p.includes('qualify') || p.includes('can i get a loan');

    // 1. Handle Explicit EMI Calculation
    if (hasEmiCalcPattern && !hasEligibilityPattern) {
      // Parse principal: e.g. 3,00,000 or 300000 or 5 lakh
      let principal = 300000;
      let rate = 10.5;
      let tenure = 36;

      // Extract amount: e.g. ₹3,00,000 or 300000 or 5 lakh or 5,00,000
      const lakhMatch = p.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lac)/i);
      if (lakhMatch) {
        principal = parseFloat(lakhMatch[1]) * 100000;
      } else {
        const amtMatch = p.match(/(?:₹|rs\.?|inr)?\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]+)?|[0-9]{4,10})/i);
        if (amtMatch && amtMatch[1]) {
          const rawNum = amtMatch[1].replace(/,/g, '');
          const parsed = parseFloat(rawNum);
          if (parsed > 1000) principal = parsed;
        }
      }

      // Extract rate: e.g. 10.5% or 10.5 %
      const rateMatch = p.match(/(\d+(?:\.\d+)?)\s*%/);
      if (rateMatch && rateMatch[1]) {
        rate = parseFloat(rateMatch[1]);
      }

      // Extract tenure: e.g. 36 months or 3 years
      const tenureMonthsMatch = p.match(/(\d+)\s*(?:month|mo)/i);
      const tenureYearsMatch = p.match(/(\d+)\s*(?:year|yr)/i);
      if (tenureMonthsMatch && tenureMonthsMatch[1]) {
        tenure = parseInt(tenureMonthsMatch[1], 10);
      } else if (tenureYearsMatch && tenureYearsMatch[1]) {
        tenure = parseInt(tenureYearsMatch[1], 10) * 12;
      }

      const emiToolCall: ToolCall = {
        id: `TC-${Date.now().toString(36)}-EMI`,
        toolName: 'calculate_loan_emi',
        callerAgent: 'credit_loan_agent',
        parameters: { principal, annualInterestRate: rate, tenureMonths: tenure },
        timestamp: new Date().toISOString(),
      };
      toolCallsMade.push(emiToolCall);

      const emiRes = await toolRegistry.invokeTool(
        'calculate_loan_emi',
        { principal, annualInterestRate: rate, tenureMonths: tenure },
        { authenticatedCustomerId: context.authenticatedCustomerId, callerAgent: 'credit_loan_agent', requestId: context.requestId }
      );
      toolResultsReceived.push(emiRes);

      const policies = retrieveRelevantPolicies('reducing balance emi calculation amortisation');

      const emiData = emiRes.result as any;
      return {
        agentRole: 'credit_loan_agent',
        summary: `Calculated monthly EMI for ₹${principal.toLocaleString('en-IN')} at ${rate}% for ${tenure} months: ₹${emiData?.monthlyEMI?.toLocaleString('en-IN')}/month. Total interest payable: ₹${emiData?.totalInterest?.toLocaleString('en-IN')}.`,
        structuredData: emiData,
        toolCallsMade,
        toolResultsReceived,
        policyCitations: policies,
      };
    }

    // 2. Handle Loan Eligibility
    if (hasEligibilityPattern) {
      let requestedAmount = 500000;
      const lakhMatch = p.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lac)/i);
      if (lakhMatch) {
        requestedAmount = parseFloat(lakhMatch[1]) * 100000;
      } else {
        const amtMatch = p.match(/(?:₹|rs\.?|inr)?\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]+)?|[0-9]{4,10})/i);
        if (amtMatch && amtMatch[1]) {
          const rawNum = amtMatch[1].replace(/,/g, '');
          const parsed = parseFloat(rawNum);
          if (parsed > 1000) requestedAmount = parsed;
        }
      }

      let loanType: 'personal' | 'home' | 'auto' | 'education' = 'personal';
      if (p.includes('home') || p.includes('house')) loanType = 'home';
      else if (p.includes('car') || p.includes('auto') || p.includes('vehicle')) loanType = 'auto';
      else if (p.includes('education') || p.includes('study')) loanType = 'education';

      const tenure = loanType === 'home' ? 180 : 36;

      const eligToolCall: ToolCall = {
        id: `TC-${Date.now().toString(36)}-ELG`,
        toolName: 'check_loan_eligibility',
        callerAgent: 'credit_loan_agent',
        parameters: { customerId: context.authenticatedCustomerId, requestedAmount, loanType, tenureMonths: tenure },
        timestamp: new Date().toISOString(),
      };
      toolCallsMade.push(eligToolCall);

      const eligRes = await toolRegistry.invokeTool(
        'check_loan_eligibility',
        { customerId: context.authenticatedCustomerId, requestedAmount, loanType, tenureMonths: tenure },
        { authenticatedCustomerId: context.authenticatedCustomerId, callerAgent: 'credit_loan_agent', requestId: context.requestId }
      );
      toolResultsReceived.push(eligRes);

      const policies = retrieveRelevantPolicies('loan underwriting eligibility cibil score foir');
      const eligData = eligRes.result as any;

      return {
        agentRole: 'credit_loan_agent',
        summary: `Evaluated simulated loan eligibility for ₹${requestedAmount.toLocaleString('en-IN')}: ${eligData?.eligible ? 'ELIGIBLE' : 'NOT FULLY ELIGIBLE'}. Estimated EMI: ₹${eligData?.estimatedEMI?.toLocaleString('en-IN')}/mo. Max eligible: ₹${eligData?.maxEligibleAmount?.toLocaleString('en-IN')}.`,
        structuredData: eligData,
        toolCallsMade,
        toolResultsReceived,
        policyCitations: policies,
      };
    }

    // 3. Default: Retrieve Existing Loans & Current EMI
    const loanToolCall: ToolCall = {
      id: `TC-${Date.now().toString(36)}-LN`,
      toolName: 'get_loan_details',
      callerAgent: 'credit_loan_agent',
      parameters: { customerId: context.authenticatedCustomerId },
      timestamp: new Date().toISOString(),
    };
    toolCallsMade.push(loanToolCall);

    const loanRes = await toolRegistry.invokeTool(
      'get_loan_details',
      { customerId: context.authenticatedCustomerId },
      { authenticatedCustomerId: context.authenticatedCustomerId, callerAgent: 'credit_loan_agent', requestId: context.requestId }
    );
    toolResultsReceived.push(loanRes);

    const loanData = loanRes.result as any;
    const policies = retrieveRelevantPolicies('reducing balance emi loan repayment');

    return {
      agentRole: 'credit_loan_agent',
      summary: `Retrieved active loans. Currently has ${loanData?.activeLoansCount ?? 0} active loan(s) with total monthly EMI obligation of ₹${loanData?.totalMonthlyEmiINR?.toLocaleString('en-IN') ?? 0} and total outstanding principal of ₹${loanData?.totalOutstandingINR?.toLocaleString('en-IN') ?? 0}.`,
      structuredData: loanData,
      toolCallsMade,
      toolResultsReceived,
      policyCitations: policies,
    };
  },
};
