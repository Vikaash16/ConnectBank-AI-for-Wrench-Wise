/**
 * Layer 4 - Multi-Agent Supervisor / Orchestrator Agent
 * Decomposes complex user requests, routes to specialized agents, enforces guardrails,
 * aggregates tool results, generates execution traces, and synthesizes grounded answers.
 */

import {
  AgentRole,
  AgentExecutionTrace,
  AssistantChatResponse,
  TaskStep,
  ToolCall,
  ToolResult,
  PolicyCitation,
} from '../types/banking.ts';
import { bankingDB } from '../db/database.ts';
import { customerAgent } from './customerAgent.ts';
import { fraudAgent } from './fraudAgent.ts';
import { creditAgent } from './creditAgent.ts';
import { complianceAgent } from './complianceAgent.ts';
import { notificationAgent } from './notificationAgent.ts';
import { AgentContext, AgentExecutionOutput } from './types.ts';
import { evaluateSecurityGuardrails } from '../ai/guardrails.ts';
import { geminiGateway } from '../ai/geminiGateway.ts';
import { retrieveRelevantPolicies } from '../rag/retriever.ts';

export class SupervisorAgent {
  /**
   * Classify user natural language intent.
   */
  public classifyIntent(prompt: string): string {
    const p = prompt.toLowerCase();

    // 1. Cross-Customer or malicious check is handled by guardrails first

    // 2. Multi-Agent Combined Summary check:
    // "Summarize my balance, check recent fraud alerts, and tell me my current loan EMI."
    const hasBalance = p.includes('balance') || p.includes('account');
    const hasFraud = p.includes('fraud') || p.includes('suspicious') || p.includes('alert');
    const hasLoanOrEmi = p.includes('emi') || p.includes('loan');

    if ((hasBalance && hasFraud && hasLoanOrEmi) || p.includes('summarize my balance') || p.includes('banking summary')) {
      return 'MULTI_AGENT_SUMMARY';
    }

    // 3. Freeze / Security Card Lock
    if (p.includes('freeze') || p.includes('lock my card') || p.includes('block my card') || p.includes('freeze my account')) {
      return 'FREEZE_CARD_SECURITY';
    }

    // 4. Fraud & Risk Check
    if (p.includes('suspicious') || p.includes('fraud') || p.includes('unauthorized') || p.includes('scam') || p.includes('security risk')) {
      return 'FRAUD_RISK_CHECK';
    }

    // 5. EMI Calculation with numbers
    if ((p.includes('calculate') || p.includes('calculate the emi') || p.includes('emi for')) && (p.includes('%') || p.includes('month') || p.includes('interest'))) {
      return 'EMI_CALCULATION';
    }

    // 6. Loan Eligibility
    if (p.includes('eligible') || p.includes('eligibility') || p.includes('qualify') || p.includes('can i get a loan')) {
      return 'LOAN_ELIGIBILITY';
    }

    // 7. KYC / Compliance
    if (p.includes('kyc') || p.includes('compliance') || p.includes('verification') || p.includes('re-verification') || p.includes('pending document')) {
      return 'KYC_COMPLIANCE';
    }

    // 8. General Account Inquiry
    if (p.includes('balance') || p.includes('transaction') || p.includes('statement') || p.includes('last 5') || p.includes('account') || p.includes('my profile')) {
      return 'ACCOUNT_INQUIRY';
    }

    // 9. Policy / RAG inquiries
    if (p.includes('interest rate') || p.includes('policy') || p.includes('ombudsman') || p.includes('rbi rule') || p.includes('minimum balance')) {
      return 'POLICY_RAG_QUESTION';
    }

    // 10. Unsupported topics (stocks, weather, general trivia)
    if (p.includes('stock') || p.includes('crypto') || p.includes('bitcoin') || p.includes('weather') || p.includes('movie') || p.includes('recipe')) {
      return 'UNSUPPORTED';
    }

    // 11. Ambiguous requests
    if (p.trim().length < 8 || p === 'what about my money?' || p === 'help' || p === 'status') {
      return 'AMBIGUOUS';
    }

    return 'ACCOUNT_INQUIRY';
  }

  /**
   * Main supervisor orchestration pipeline.
   */
  public async orchestrate(
    prompt: string,
    authenticatedCustomerId: string,
    options?: { forceDeterministic?: boolean; confirmedAction?: boolean }
  ): Promise<AssistantChatResponse> {
    const startTime = Date.now();
    const requestId = `REQ-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`;
    const correlationId = `CORR-${Date.now().toString(36)}`;

    // Verify Customer Existence
    const customer = bankingDB.getCustomerById(authenticatedCustomerId);
    if (!customer) {
      throw new Error(`Customer session invalid: ${authenticatedCustomerId} not found.`);
    }

    // 1. Evaluate Security Guardrails (PII & Cross-Customer Isolation)
    const guardrailCheck = evaluateSecurityGuardrails(prompt, authenticatedCustomerId);

    if (!guardrailCheck.passed) {
      const trace: AgentExecutionTrace = {
        requestId,
        correlationId,
        customerId: authenticatedCustomerId,
        timestamp: new Date().toISOString(),
        userPrompt: prompt,
        classifiedIntent: 'SECURITY_VIOLATION_BLOCKED',
        isModelGrounded: false,
        modelUsed: 'SecurityGuardrailEngine',
        selectedAgents: ['supervisor'],
        steps: [
          {
            stepId: 'STEP-GUARDRAIL-INTERVENE',
            assignedAgent: 'supervisor',
            taskDescription: 'Evaluated input against PII boundaries and cross-customer isolation policies',
            status: 'failed',
            toolsUsed: [],
            summary: guardrailCheck.reason,
            durationMs: Date.now() - startTime,
          },
        ],
        toolCalls: [],
        toolResults: [],
        guardrailInterventions: [guardrailCheck.reason!],
        durationMs: Date.now() - startTime,
        executionStatus: 'denied',
      };

      bankingDB.recordExecutionTrace(trace);
      bankingDB.logAudit({
        customerId: authenticatedCustomerId,
        actor: 'system',
        action: 'SECURITY_GUARDRAIL_INTERVENTION',
        details: { flagType: guardrailCheck.flagType, reason: guardrailCheck.reason, requestId },
      });

      return {
        requestId,
        correlationId,
        intent: 'SECURITY_VIOLATION_BLOCKED',
        selectedAgents: ['supervisor'],
        toolCalls: [],
        toolResults: [],
        policyCitations: [],
        riskFlags: ['ACCESS_CONTROL_VIOLATION'],
        requiresConfirmation: false,
        finalResponse: `🔒 **Security Access Notice:** ${guardrailCheck.reason}\n\nFor privacy and banking secrecy, you are only authorized to access information for your own authenticated profile (${customer.name}, ${customer.id}).`,
        executionTrace: trace,
        executionStatus: 'denied',
        durationMs: Date.now() - startTime,
        engine: 'deterministic-fallback',
      };
    }

    // 2. Classify Intent
    const intent = this.classifyIntent(prompt);

    // Handle Unsupported Request
    if (intent === 'UNSUPPORTED') {
      const trace: AgentExecutionTrace = {
        requestId,
        correlationId,
        customerId: authenticatedCustomerId,
        timestamp: new Date().toISOString(),
        userPrompt: prompt,
        classifiedIntent: intent,
        isModelGrounded: false,
        modelUsed: 'SupervisorIntentClassifier',
        selectedAgents: ['supervisor'],
        steps: [],
        toolCalls: [],
        toolResults: [],
        durationMs: Date.now() - startTime,
        executionStatus: 'escalated',
      };
      bankingDB.recordExecutionTrace(trace);

      return {
        requestId,
        correlationId,
        intent,
        selectedAgents: ['supervisor'],
        toolCalls: [],
        toolResults: [],
        policyCitations: [],
        riskFlags: [],
        requiresConfirmation: false,
        finalResponse: `ConnectBank AI is designed exclusively for retail and SME banking operations. I cannot process stock trading, crypto transactions, or general queries.\n\n**Supported Capabilities:**\n• Account balance & transaction exploration\n• Real-time fraud and suspicious activity screening\n• Personal & home loan eligibility check\n• Reducing-balance EMI calculation\n• KYC status and compliance documentation`,
        executionTrace: trace,
        executionStatus: 'escalated',
        durationMs: Date.now() - startTime,
        engine: 'deterministic-fallback',
      };
    }

    // Handle Ambiguous Request
    if (intent === 'AMBIGUOUS') {
      const trace: AgentExecutionTrace = {
        requestId,
        correlationId,
        customerId: authenticatedCustomerId,
        timestamp: new Date().toISOString(),
        userPrompt: prompt,
        classifiedIntent: intent,
        isModelGrounded: false,
        modelUsed: 'SupervisorIntentClassifier',
        selectedAgents: ['supervisor'],
        steps: [],
        toolCalls: [],
        toolResults: [],
        durationMs: Date.now() - startTime,
        executionStatus: 'partial',
      };
      bankingDB.recordExecutionTrace(trace);

      return {
        requestId,
        correlationId,
        intent,
        selectedAgents: ['supervisor'],
        toolCalls: [],
        toolResults: [],
        policyCitations: [],
        riskFlags: [],
        requiresConfirmation: false,
        finalResponse: `Could you please clarify your request? For example, you can ask:\n• "What is my account balance and last 5 transactions?"\n• "Check my recent transactions for suspicious activity."\n• "Am I eligible for a loan of ₹5,00,000?"\n• "Calculate the EMI for ₹3,00,000 at 10.5% for 36 months."\n• "Check whether my account has pending KYC requirements."`,
        executionTrace: trace,
        executionStatus: 'partial',
        durationMs: Date.now() - startTime,
        engine: 'deterministic-fallback',
      };
    }

    // 3. Task Decomposition and Agent Selection
    const selectedAgents: AgentRole[] = [];
    const taskPlan: { agent: AgentRole; task: string }[] = [];

    if (intent === 'MULTI_AGENT_SUMMARY') {
      selectedAgents.push('customer_agent', 'risk_fraud_agent', 'credit_loan_agent');
      taskPlan.push(
        { agent: 'customer_agent', task: 'Retrieve current accounts, balance, and recent transaction overview' },
        { agent: 'risk_fraud_agent', task: 'Analyze recent transactions for fraud flags and geo anomalies' },
        { agent: 'credit_loan_agent', task: 'Retrieve existing active loans and current monthly EMI obligations' }
      );
    } else if (intent === 'FRAUD_RISK_CHECK' || intent === 'FREEZE_CARD_SECURITY') {
      selectedAgents.push('risk_fraud_agent');
      taskPlan.push({ agent: 'risk_fraud_agent', task: 'Execute deterministic fraud rules and risk assessment' });
    } else if (intent === 'LOAN_ELIGIBILITY' || intent === 'EMI_CALCULATION') {
      selectedAgents.push('credit_loan_agent');
      taskPlan.push({ agent: 'credit_loan_agent', task: 'Process loan calculation or eligibility estimation' });
    } else if (intent === 'KYC_COMPLIANCE') {
      selectedAgents.push('compliance_agent');
      taskPlan.push({ agent: 'compliance_agent', task: 'Inspect customer KYC verification and AML status' });
    } else if (intent === 'POLICY_RAG_QUESTION') {
      // Direct RAG retrieval with customer agent support
      selectedAgents.push('customer_agent');
      taskPlan.push({ agent: 'customer_agent', task: 'Query relevant policy documents' });
    } else {
      // Default: ACCOUNT_INQUIRY
      selectedAgents.push('customer_agent');
      taskPlan.push({ agent: 'customer_agent', task: 'Fetch accounts, balances, and transaction history' });
    }

    // 4. Multi-Agent Execution Loop
    const steps: TaskStep[] = [];
    const allToolCalls: ToolCall[] = [];
    const allToolResults: ToolResult[] = [];
    const agentOutputs: AgentExecutionOutput[] = [];
    const allPolicyCitations: PolicyCitation[] = [];
    const allRiskFlags: string[] = [];
    let requiresConfirmation = false;
    let confirmationDetails: any = undefined;

    const agentContext: AgentContext = {
      authenticatedCustomerId,
      requestId,
      userPrompt: prompt,
      extractedParameters: { confirmedAction: options?.confirmedAction },
    };

    for (let i = 0; i < taskPlan.length; i++) {
      const { agent, task } = taskPlan[i];
      const stepStartTime = Date.now();
      const stepId = `STEP-${i + 1}-${agent.toUpperCase()}`;

      let output: AgentExecutionOutput;

      if (agent === 'customer_agent') {
        output = await customerAgent.execute(task, agentContext);
      } else if (agent === 'risk_fraud_agent') {
        output = await fraudAgent.execute(task, agentContext);
      } else if (agent === 'credit_loan_agent') {
        output = await creditAgent.execute(task, agentContext);
      } else if (agent === 'compliance_agent') {
        output = await complianceAgent.execute(task, agentContext);
      } else if (agent === 'notification_agent') {
        output = await notificationAgent.execute(task, agentContext);
      } else {
        continue;
      }

      agentOutputs.push(output);
      allToolCalls.push(...output.toolCallsMade);
      allToolResults.push(...output.toolResultsReceived);

      if (output.policyCitations) {
        allPolicyCitations.push(...output.policyCitations);
      }
      if (output.riskFlags) {
        allRiskFlags.push(...output.riskFlags);
      }
      if (output.requiresConfirmation) {
        requiresConfirmation = true;
        confirmationDetails = output.confirmationDetails;
      }

      steps.push({
        stepId,
        assignedAgent: agent,
        taskDescription: task,
        status: 'completed',
        toolsUsed: output.toolCallsMade.map(tc => tc.toolName),
        summary: output.summary,
        durationMs: Date.now() - stepStartTime,
      });
    }

    // Deduplicate policy citations
    const uniqueCitations = Array.from(
      new Map(allPolicyCitations.map(c => [c.docId, c])).values()
    );

    // 5. Synthesize Final Response (Gemini or Deterministic Fallback)
    let finalResponse = '';
    let engineUsed: 'gemini-3.8-flash' | 'deterministic-fallback' = 'deterministic-fallback';

    if (requiresConfirmation) {
      finalResponse = `⚠️ **Confirmation Required:** ${confirmationDetails?.warningMessage || 'Please confirm to proceed with this sensitive action.'}`;
    } else {
      const genResult = await geminiGateway.generateGroundedResponse(
        {
          customerName: customer.name,
          userPrompt: prompt,
          intent,
          agentOutputs,
          policyCitations: uniqueCitations,
        },
        options?.forceDeterministic
      );
      finalResponse = genResult.response;
      engineUsed = genResult.engine;
    }

    // 6. Record Execution Trace
    const totalDurationMs = Date.now() - startTime;
    const executionTrace: AgentExecutionTrace = {
      requestId,
      correlationId,
      customerId: authenticatedCustomerId,
      timestamp: new Date().toISOString(),
      userPrompt: prompt,
      classifiedIntent: intent,
      isModelGrounded: true,
      modelUsed: engineUsed === 'gemini-3.8-flash' ? 'gemini-3.8-flash' : 'DeterministicFallbackSynthesizer',
      selectedAgents,
      steps,
      toolCalls: allToolCalls,
      toolResults: allToolResults,
      policyCitations: uniqueCitations,
      requiresConfirmation,
      confirmationDetails,
      durationMs: totalDurationMs,
      executionStatus: 'success',
    };

    bankingDB.recordExecutionTrace(executionTrace);
    bankingDB.logAudit({
      customerId: authenticatedCustomerId,
      actor: 'supervisor_agent',
      action: 'ORCHESTRATION_COMPLETED',
      details: { requestId, intent, selectedAgents, toolCallsCount: allToolCalls.length, durationMs: totalDurationMs },
    });

    return {
      requestId,
      correlationId,
      intent,
      selectedAgents,
      toolCalls: allToolCalls,
      toolResults: allToolResults,
      policyCitations: uniqueCitations,
      riskFlags: allRiskFlags,
      requiresConfirmation,
      confirmationDetails,
      finalResponse,
      executionTrace,
      executionStatus: 'success',
      durationMs: totalDurationMs,
      engine: engineUsed,
    };
  }
}

export const supervisorAgent = new SupervisorAgent();
