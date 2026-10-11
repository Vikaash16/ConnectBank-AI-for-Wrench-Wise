/**
 * ConnectBank AI - Frontend API Service Layer
 * Clean typed client communicating with the backend API with seamless local fallback.
 */

import {
  Customer,
  Account,
  Transaction,
  Loan,
  KYCRecord,
  FraudAlert,
  NotificationItem,
  AuditLog,
  AgentExecutionTrace,
  AssistantChatResponse,
  EMICalculationResult,
  LoanEligibilityResult,
  UserCredential,
  CreateUserInput,
} from '../types/banking.ts';
import { bankingDB } from '../db/database.ts';
import { supervisorAgent } from '../agents/supervisorAgent.ts';
import { calculateEMIFormula } from '../tools/bankingTools.ts';

export const apiClient = {
  async getUsers(): Promise<UserCredential[]> {
    try {
      const res = await fetch('/api/users');
      if (res.ok) return await res.json();
    } catch {}
    return bankingDB.getAllUsers();
  },

  async createUser(input: CreateUserInput): Promise<{ success: boolean; user: UserCredential; customer: Customer; account: Account }> {
    try {
      const res = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (res.ok) return await res.json();
      const err = await res.json();
      throw new Error(err.error || 'Failed to create user in database');
    } catch (err: any) {
      if (err.message && !err.message.includes('fetch')) throw err;
    }
    const created = bankingDB.createUser(input);
    return { success: true, ...created };
  },

  async loginUser(username: string, password: string): Promise<{ success: boolean; user: UserCredential; customer: Customer }> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) return await res.json();
      const err = await res.json();
      throw new Error(err.error || 'Authentication failed');
    } catch (err: any) {
      if (err.message && !err.message.includes('fetch')) throw err;
    }
    const user = bankingDB.authenticateUser(username, password);
    if (!user) throw new Error('Invalid credentials');
    const customer = bankingDB.getCustomerById(user.customerId)!;
    return { success: true, user, customer };
  },

  async getCustomers(): Promise<Customer[]> {
    try {
      const res = await fetch('/api/customers');
      if (res.ok) return await res.json();
    } catch {}
    return bankingDB.getAllCustomers();
  },

  async getDashboard(customerId: string): Promise<any> {
    try {
      const res = await fetch(`/api/dashboard/${customerId}`);
      if (res.ok) return await res.json();
    } catch {}
    const customer = bankingDB.getCustomerById(customerId)!;
    const accounts = bankingDB.getAccountsByCustomer(customerId);
    const totalBalance = accounts.reduce((acc, a) => acc + a.balance, 0);
    const recentTransactions = bankingDB.getTransactionsByCustomer(customerId, { limit: 5 });
    const activeLoans = bankingDB.getLoansByCustomer(customerId);
    return {
      customer,
      totalBalance,
      accounts,
      recentTransactions,
      loans: {
        items: activeLoans,
        totalOutstanding: activeLoans.reduce((sum, l) => sum + l.remainingBalance, 0),
        monthlyEmiTotal: activeLoans.reduce((sum, l) => sum + l.emiAmount, 0),
      },
      fraudAlerts: bankingDB.getFraudAlertsByCustomer(customerId),
      kyc: bankingDB.getKYCByCustomer(customerId),
      unreadNotificationsCount: bankingDB.getNotificationsByCustomer(customerId).filter(n => !n.read).length,
      recentTraces: bankingDB.getExecutionTraces(customerId, 3),
    };
  },

  async getAccounts(customerId: string): Promise<Account[]> {
    try {
      const res = await fetch(`/api/accounts/${customerId}`);
      if (res.ok) return await res.json();
    } catch {}
    return bankingDB.getAccountsByCustomer(customerId);
  },

  async getTransactions(customerId: string, options?: { limit?: number; category?: string; status?: string; search?: string }): Promise<Transaction[]> {
    try {
      const params = new URLSearchParams();
      if (options?.limit) params.set('limit', String(options.limit));
      if (options?.category) params.set('category', options.category);
      if (options?.status) params.set('status', options.status);
      if (options?.search) params.set('search', options.search);
      const res = await fetch(`/api/transactions/${customerId}?${params.toString()}`);
      if (res.ok) return await res.json();
    } catch {}
    return bankingDB.getTransactionsByCustomer(customerId, options);
  },

  async getLoans(customerId: string): Promise<Loan[]> {
    try {
      const res = await fetch(`/api/loans/${customerId}`);
      if (res.ok) return await res.json();
    } catch {}
    return bankingDB.getLoansByCustomer(customerId);
  },

  async calculateEMI(principal: number, annualInterestRate: number, tenureMonths: number): Promise<EMICalculationResult> {
    try {
      const res = await fetch('/api/loans/calculate-emi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ principal, annualInterestRate, tenureMonths }),
      });
      if (res.ok) return await res.json();
    } catch {}
    return calculateEMIFormula(principal, annualInterestRate, tenureMonths);
  },

  async checkLoanEligibility(customerId: string, requestedAmount: number, loanType = 'personal', tenureMonths = 36): Promise<LoanEligibilityResult> {
    try {
      const res = await fetch('/api/loans/eligibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, requestedAmount, loanType, tenureMonths }),
      });
      if (res.ok) return await res.json();
    } catch {}
    const { checkLoanEligibilityTool } = await import('../tools/bankingTools.ts');
    return checkLoanEligibilityTool.execute(
      { customerId, requestedAmount, loanType: loanType as any, tenureMonths },
      { authenticatedCustomerId: customerId, callerAgent: 'credit_loan_agent', requestId: `FALLBACK-${Date.now()}` }
    );
  },

  async getFraudAlerts(customerId: string): Promise<FraudAlert[]> {
    try {
      const res = await fetch(`/api/fraud/alerts/${customerId}`);
      if (res.ok) return await res.json();
    } catch {}
    return bankingDB.getFraudAlertsByCustomer(customerId);
  },

  async runFraudAnalysis(customerId: string): Promise<any> {
    try {
      const res = await fetch('/api/fraud/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId }),
      });
      if (res.ok) return await res.json();
    } catch {}
    const { analyzeTransactionRiskTool } = await import('../tools/bankingTools.ts');
    return analyzeTransactionRiskTool.execute(
      { customerId, lookbackDays: 30 },
      { authenticatedCustomerId: customerId, callerAgent: 'risk_fraud_agent', requestId: `FALLBACK-${Date.now()}` }
    );
  },

  async getKYC(customerId: string): Promise<{ kyc: KYCRecord | null; amlScreening?: any }> {
    try {
      const res = await fetch(`/api/kyc/${customerId}`);
      if (res.ok) return await res.json();
    } catch {}
    const { MockKYCAMLService } = await import('../data/mockServices.ts');
    return {
      kyc: bankingDB.getKYCByCustomer(customerId),
      amlScreening: MockKYCAMLService.screenCustomer(customerId),
    };
  },

  async getNotifications(customerId: string): Promise<NotificationItem[]> {
    try {
      const res = await fetch(`/api/notifications/${customerId}`);
      if (res.ok) return await res.json();
    } catch {}
    return bankingDB.getNotificationsByCustomer(customerId);
  },

  async markNotificationRead(id: string, customerId: string): Promise<void> {
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId }),
      });
    } catch {}
    bankingDB.markNotificationAsRead(id, customerId);
  },

  async markAllNotificationsRead(customerId: string): Promise<void> {
    try {
      await fetch(`/api/notifications/${customerId}/read-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch {}
    bankingDB.markAllNotificationsAsRead(customerId);
  },

  async sendChatMessage(
    message: string,
    customerId: string,
    options?: { forceDeterministic?: boolean; confirmedAction?: boolean }
  ): Promise<AssistantChatResponse> {
    try {
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          customerId,
          forceDeterministic: options?.forceDeterministic,
          confirmedAction: options?.confirmedAction,
        }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    // Seamless in-process supervisor execution
    return await supervisorAgent.orchestrate(message, customerId, options);
  },

  async getAgentTraces(customerId?: string): Promise<AgentExecutionTrace[]> {
    try {
      const url = customerId ? `/api/agent-traces?customerId=${customerId}` : '/api/agent-traces';
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch {}
    return bankingDB.getExecutionTraces(customerId, 30);
  },

  async getAuditLogs(customerId?: string): Promise<AuditLog[]> {
    try {
      const url = customerId ? `/api/audit-logs?customerId=${customerId}` : '/api/audit-logs';
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch {}
    return bankingDB.getAuditLogs(customerId, 50);
  },

  async getSystemStatus(): Promise<any> {
    try {
      const res = await fetch('/api/system/status');
      if (res.ok) return await res.json();
    } catch {}
    const { geminiGateway } = await import('../ai/geminiGateway.ts');
    const { MockPaymentGateway } = await import('../data/mockServices.ts');
    const { toolRegistry } = await import('../tools/registry.ts');
    return {
      gateway: geminiGateway.getStatus(),
      paymentHealth: MockPaymentGateway.checkNetworkHealth(),
      toolsRegistered: toolRegistry.getAllTools().length,
      totalCustomers: bankingDB.getAllCustomers().length,
      recentTracesCount: bankingDB.getExecutionTraces().length,
      timestamp: new Date().toISOString(),
    };
  },

  async resetDatabase(): Promise<void> {
    try {
      await fetch('/api/system/reset-seed', { method: 'POST' });
    } catch {}
    bankingDB.resetToSeedData();
  },
};
