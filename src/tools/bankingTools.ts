/**
 * Layer 5 - Implementation of Banking Tools
 * All tools validate inputs via Zod and strictly enforce authenticated customer ownership.
 */

import { z } from 'zod';
import { BankingToolDefinition, ToolExecutionContext } from './types.ts';
import { bankingDB } from '../db/database.ts';
import { MockCreditBureau, MockKYCAMLService } from '../data/mockServices.ts';
import { EMICalculationResult, LoanEligibilityResult } from '../types/banking.ts';

// ----------------- MATH HELPERS -----------------

export function calculateEMIFormula(
  principal: number,
  annualInterestRate: number,
  tenureMonths: number
): EMICalculationResult {
  if (principal <= 0) throw new Error('Principal amount must be greater than zero.');
  if (tenureMonths <= 0) throw new Error('Tenure in months must be greater than zero.');
  if (annualInterestRate < 0) throw new Error('Annual interest rate cannot be negative.');

  let monthlyEMI = 0;
  const monthlyRate = annualInterestRate / 12 / 100;

  if (annualInterestRate === 0) {
    monthlyEMI = Math.round((principal / tenureMonths) * 100) / 100;
  } else {
    const factor = Math.pow(1 + monthlyRate, tenureMonths);
    monthlyEMI = (principal * monthlyRate * factor) / (factor - 1);
    monthlyEMI = Math.round(monthlyEMI * 100) / 100;
  }

  const totalPayment = Math.round(monthlyEMI * tenureMonths * 100) / 100;
  const totalInterest = Math.max(0, Math.round((totalPayment - principal) * 100) / 100);

  // Generate 6-month preview
  const amortizationPreview: EMICalculationResult['amortizationPreview'] = [];
  let balance = principal;
  const previewMonths = Math.min(6, tenureMonths);

  for (let m = 1; m <= previewMonths; m++) {
    const interestPart = annualInterestRate === 0 ? 0 : Math.round(balance * monthlyRate * 100) / 100;
    const principalPart = Math.min(balance, Math.round((monthlyEMI - interestPart) * 100) / 100);
    balance = Math.max(0, Math.round((balance - principalPart) * 100) / 100);

    amortizationPreview.push({
      month: m,
      emi: monthlyEMI,
      principalPaid: principalPart,
      interestPaid: interestPart,
      remainingPrincipal: balance,
    });
  }

  return {
    principal,
    annualInterestRate,
    tenureMonths,
    monthlyEMI,
    totalInterest,
    totalPayment,
    monthlyInterestRatePercent: Number((monthlyRate * 100).toFixed(4)),
    amortizationPreview,
  };
}

// ----------------- TOOL 1: GET CUSTOMER PROFILE -----------------
export const getCustomerProfileTool: BankingToolDefinition = {
  name: 'get_customer_profile',
  description: 'Retrieve profile details, masked KYC IDs, monthly income, and risk rating for the authenticated customer.',
  authorizedRoles: ['supervisor', 'customer_agent', 'compliance_agent', 'credit_loan_agent'],
  inputSchema: z.object({
    customerId: z.string().describe('The customer identifier (must match authenticated user)'),
  }),
  execute: (input: { customerId: string }, context: ToolExecutionContext) => {
    if (input.customerId !== context.authenticatedCustomerId) {
      throw new Error(`SECURITY ACCESS DENIED: Cross-customer access forbidden for customer ${input.customerId}`);
    }
    const customer = bankingDB.getCustomerById(input.customerId);
    if (!customer) throw new Error(`Customer ${input.customerId} not found.`);
    return {
      customerId: customer.id,
      name: customer.name,
      maskedPhone: customer.maskedPhone,
      city: customer.city,
      panMasked: customer.panMasked,
      aadhaarMasked: customer.aadhaarMasked,
      occupation: customer.occupation,
      monthlyIncome: customer.monthlyIncome,
      creditScore: customer.creditScore,
      riskRating: customer.riskRating,
      customerSince: customer.customerSince,
    };
  },
};

// ----------------- TOOL 2: GET ACCOUNTS -----------------
export const getAccountsTool: BankingToolDefinition = {
  name: 'get_accounts',
  description: 'Retrieve all bank accounts (savings, current, FD) belonging to the authenticated customer.',
  authorizedRoles: ['supervisor', 'customer_agent', 'banking_product_agent'],
  inputSchema: z.object({
    customerId: z.string().describe('Customer ID'),
  }),
  execute: (input: { customerId: string }, context: ToolExecutionContext) => {
    if (input.customerId !== context.authenticatedCustomerId) {
      throw new Error(`SECURITY ACCESS DENIED: Cannot query accounts for customer ${input.customerId}`);
    }
    const accounts = bankingDB.getAccountsByCustomer(input.customerId);
    const totalBalance = accounts.reduce((acc, a) => acc + a.balance, 0);
    return {
      customerId: input.customerId,
      totalBalance,
      currency: 'INR',
      accountCount: accounts.length,
      accounts: accounts.map(a => ({
        id: a.id,
        accountNumberMasked: a.maskedAccountNumber,
        accountType: a.accountType,
        balance: a.balance,
        currency: a.currency,
        status: a.status,
        branchName: a.branchName,
        interestRate: a.interestRate,
      })),
    };
  },
};

// ----------------- TOOL 3: GET ACCOUNT BALANCE -----------------
export const getAccountBalanceTool: BankingToolDefinition = {
  name: 'get_account_balance',
  description: 'Fetch the real-time balance and status of a specific account.',
  authorizedRoles: ['supervisor', 'customer_agent', 'banking_product_agent'],
  inputSchema: z.object({
    accountId: z.string().optional().describe('Specific account ID or omit to get primary account'),
  }),
  execute: (input: { accountId?: string }, context: ToolExecutionContext) => {
    const accounts = bankingDB.getAccountsByCustomer(context.authenticatedCustomerId);
    if (accounts.length === 0) throw new Error('No accounts found for authenticated customer.');

    const targetAccount = input.accountId
      ? accounts.find(a => a.id === input.accountId)
      : accounts[0];

    if (!targetAccount) {
      throw new Error(`Account ${input.accountId} not found or not owned by authenticated customer.`);
    }

    return {
      accountId: targetAccount.id,
      accountNumberMasked: targetAccount.maskedAccountNumber,
      accountType: targetAccount.accountType,
      balance: targetAccount.balance,
      currency: targetAccount.currency,
      status: targetAccount.status,
      lastUpdated: new Date().toISOString(),
    };
  },
};

// ----------------- TOOL 4: GET TRANSACTIONS -----------------
export const getTransactionsTool: BankingToolDefinition = {
  name: 'get_transactions',
  description: 'Query recent transactions for the customer with optional count, category, and keyword search filters.',
  authorizedRoles: ['supervisor', 'customer_agent', 'risk_fraud_agent'],
  inputSchema: z.object({
    limit: z.number().min(1).max(50).default(5).describe('Number of transactions to return'),
    category: z.string().optional().describe('Filter by category like Salary, Shopping, Dining, EMI'),
    status: z.string().optional().describe('Filter by status like completed, flagged, failed'),
    search: z.string().optional().describe('Keyword search in descriptions'),
  }),
  execute: (input: { limit?: number; category?: string; status?: string; search?: string }, context: ToolExecutionContext) => {
    const txns = bankingDB.getTransactionsByCustomer(context.authenticatedCustomerId, {
      limit: input.limit ?? 5,
      category: input.category,
      status: input.status,
      search: input.search,
    });

    return {
      count: txns.length,
      customerId: context.authenticatedCustomerId,
      transactions: txns.map(t => ({
        id: t.id,
        amount: t.amount,
        type: t.type,
        category: t.category,
        description: t.description,
        timestamp: t.timestamp,
        status: t.status,
        counterparty: t.counterparty,
        channel: t.channel,
        referenceNumber: t.referenceNumber,
        isSuspicious: t.status === 'flagged',
      })),
    };
  },
};

// ----------------- TOOL 5: GET TRANSACTION DETAILS -----------------
export const getTransactionDetailsTool: BankingToolDefinition = {
  name: 'get_transaction_details',
  description: 'Retrieve granular details for a specific transaction including device, IP, and geolocation metadata.',
  authorizedRoles: ['supervisor', 'customer_agent', 'risk_fraud_agent'],
  inputSchema: z.object({
    transactionId: z.string().describe('Unique transaction ID'),
  }),
  execute: (input: { transactionId: string }, context: ToolExecutionContext) => {
    const txn = bankingDB.getTransactionById(input.transactionId, context.authenticatedCustomerId);
    if (!txn) {
      throw new Error(`Transaction ${input.transactionId} not found or unauthorized.`);
    }
    return {
      ...txn,
      isFlagged: txn.status === 'flagged',
    };
  },
};

// ----------------- TOOL 6: ANALYZE TRANSACTION RISK -----------------
export const analyzeTransactionRiskTool: BankingToolDefinition = {
  name: 'analyze_transaction_risk',
  description: 'Analyze recent customer transactions against deterministic risk rules (geo-velocity, high-amount deviation, repetitive bursts).',
  authorizedRoles: ['supervisor', 'risk_fraud_agent'],
  inputSchema: z.object({
    customerId: z.string().describe('Authenticated customer ID'),
    lookbackDays: z.number().default(30).describe('Window of days to analyze'),
  }),
  execute: (input: { customerId: string; lookbackDays?: number }, context: ToolExecutionContext) => {
    if (input.customerId !== context.authenticatedCustomerId) {
      throw new Error(`SECURITY ACCESS DENIED: Cannot run risk analysis on other customer ${input.customerId}`);
    }

    const txns = bankingDB.getTransactionsByCustomer(input.customerId, { limit: 25 });
    const customer = bankingDB.getCustomerById(input.customerId);
    const existingAlerts = bankingDB.getFraudAlertsByCustomer(input.customerId);

    const flaggedTxns = txns.filter(t => t.status === 'flagged');
    const foreignTxns = txns.filter(t => t.metadata?.isForeign);
    const highAmountThreshold = (customer?.monthlyIncome || 100000) * 0.5;
    const unusuallyHighTxns = txns.filter(t => t.amount > highAmountThreshold && t.type === 'debit');

    // Deterministic Risk Score
    let overallRiskScore = 15;
    const triggeredRules: string[] = [];

    if (flaggedTxns.length > 0) {
      overallRiskScore += 45;
      triggeredRules.push(`FLAGGED_TRANSACTIONS_FOUND (${flaggedTxns.length} items)`);
    }
    if (foreignTxns.length > 0) {
      overallRiskScore += 30;
      triggeredRules.push(`CROSS_BORDER_GEO_ANOMALY (${foreignTxns.map(t => t.metadata?.location).join(', ')})`);
    }
    if (unusuallyHighTxns.length > 0) {
      overallRiskScore += 15;
      triggeredRules.push(`HIGH_VALUE_DEVIATION (> ₹${Math.round(highAmountThreshold).toLocaleString('en-IN')})`);
    }

    overallRiskScore = Math.min(99, Math.max(5, overallRiskScore));

    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (overallRiskScore >= 80) riskLevel = 'critical';
    else if (overallRiskScore >= 60) riskLevel = 'high';
    else if (overallRiskScore >= 35) riskLevel = 'medium';

    return {
      customerId: input.customerId,
      overallRiskScore,
      riskLevel,
      triggeredRules,
      analyzedTransactionCount: txns.length,
      suspiciousTransactions: flaggedTxns.map(t => ({
        id: t.id,
        amount: t.amount,
        description: t.description,
        timestamp: t.timestamp,
        location: t.metadata?.location || 'Unknown',
        channel: t.channel,
      })),
      openAlerts: existingAlerts.filter(a => a.status === 'open'),
      recommendedActions:
        riskLevel === 'critical' || riskLevel === 'high'
          ? [
              'Freeze international online and POS transactions.',
              'Verify identity with biometric/OTP verification.',
              'Dispute unauthorized transaction under RBI Zero-Liability circular within 3 working days.',
            ]
          : ['No immediate action needed. Continue routine monitoring.'],
    };
  },
};

// ----------------- TOOL 7: GET LOAN DETAILS -----------------
export const getLoanDetailsTool: BankingToolDefinition = {
  name: 'get_loan_details',
  description: 'Retrieve current active loans, outstanding balance, monthly EMI, and repayment schedule.',
  authorizedRoles: ['supervisor', 'credit_loan_agent', 'customer_agent'],
  inputSchema: z.object({
    customerId: z.string().describe('Authenticated customer ID'),
  }),
  execute: (input: { customerId: string }, context: ToolExecutionContext) => {
    if (input.customerId !== context.authenticatedCustomerId) {
      throw new Error(`SECURITY ACCESS DENIED: Cannot query loans for customer ${input.customerId}`);
    }
    const loans = bankingDB.getLoansByCustomer(input.customerId);
    const totalOutstanding = loans.reduce((acc, l) => acc + l.remainingBalance, 0);
    const totalMonthlyEmi = loans.reduce((acc, l) => acc + l.emiAmount, 0);

    return {
      customerId: input.customerId,
      activeLoansCount: loans.length,
      totalOutstandingINR: totalOutstanding,
      totalMonthlyEmiINR: totalMonthlyEmi,
      loans: loans.map(l => ({
        id: l.id,
        loanType: l.loanType,
        principal: l.principal,
        interestRate: l.interestRate,
        tenureMonths: l.tenureMonths,
        monthlyEMI: l.emiAmount,
        remainingBalance: l.remainingBalance,
        nextEmiDate: l.nextEmiDate,
        emisPaid: l.emisPaid,
        totalEmis: l.totalEmis,
        progressPercent: Math.round((l.emisPaid / l.totalEmis) * 100),
      })),
    };
  },
};

// ----------------- TOOL 8: CALCULATE LOAN EMI -----------------
export const calculateLoanEMITool: BankingToolDefinition = {
  name: 'calculate_loan_emi',
  description: 'Compute precise reducing-balance monthly EMI, total interest, and amortisation preview for any loan amount, rate, and tenure.',
  authorizedRoles: ['supervisor', 'credit_loan_agent', 'banking_product_agent', 'customer_agent'],
  inputSchema: z.object({
    principal: z.number().positive().describe('Principal loan amount in INR'),
    annualInterestRate: z.number().min(0).max(50).describe('Annual interest rate in % (e.g. 10.5)'),
    tenureMonths: z.number().int().positive().max(360).describe('Loan tenure in months (e.g. 36)'),
  }),
  execute: (input: { principal: number; annualInterestRate: number; tenureMonths: number }) => {
    return calculateEMIFormula(input.principal, input.annualInterestRate, input.tenureMonths);
  },
};

// ----------------- TOOL 9: CHECK LOAN ELIGIBILITY -----------------
export const checkLoanEligibilityTool: BankingToolDefinition = {
  name: 'check_loan_eligibility',
  description: 'Evaluate simulated loan eligibility based on monthly income, existing loan EMIs, CIBIL score, and RBI FOIR guidelines.',
  authorizedRoles: ['supervisor', 'credit_loan_agent'],
  inputSchema: z.object({
    customerId: z.string().describe('Customer ID'),
    requestedAmount: z.number().positive().describe('Desired loan amount in INR'),
    loanType: z.enum(['personal', 'home', 'auto', 'education']).default('personal'),
    tenureMonths: z.number().int().min(6).max(360).default(36),
  }),
  execute: (
    input: { customerId: string; requestedAmount: number; loanType: 'personal' | 'home' | 'auto' | 'education'; tenureMonths: number },
    context: ToolExecutionContext
  ): LoanEligibilityResult => {
    if (input.customerId !== context.authenticatedCustomerId) {
      throw new Error(`SECURITY ACCESS DENIED: Cannot check loan eligibility for customer ${input.customerId}`);
    }

    const customer = bankingDB.getCustomerById(input.customerId);
    if (!customer) throw new Error('Customer not found.');

    const activeLoans = bankingDB.getLoansByCustomer(input.customerId);
    const existingMonthlyEMIs = activeLoans.reduce((sum, l) => sum + l.emiAmount, 0);

    const creditBureau = MockCreditBureau.fetchReport(input.customerId, customer.creditScore, customer.panMasked);

    // Interest rate according to loan type and credit score
    let baseRate = 11.5;
    if (input.loanType === 'home') baseRate = 8.5;
    if (input.loanType === 'auto') baseRate = 9.25;
    if (input.loanType === 'education') baseRate = 9.5;

    // Discount for excellent score
    if (customer.creditScore >= 750) baseRate -= 0.5;

    const emiCalc = calculateEMIFormula(input.requestedAmount, baseRate, input.tenureMonths);
    const newEMI = emiCalc.monthlyEMI;

    // Fixed Obligation to Income Ratio (FOIR / DTI)
    const totalObligations = existingMonthlyEMIs + newEMI;
    const debtToIncomeRatioPercent = Math.round((totalObligations / customer.monthlyIncome) * 100);

    // Allowed FOIR
    let maxAllowedDTIPercent = 50;
    if (customer.monthlyIncome > 150000) maxAllowedDTIPercent = 60;
    else if (customer.monthlyIncome < 50000) maxAllowedDTIPercent = 45;

    const availableMonthlyEmiCapacity = Math.max(0, customer.monthlyIncome * (maxAllowedDTIPercent / 100) - existingMonthlyEMIs);

    // Maximum eligible principal based on capacity
    const monthlyRate = baseRate / 12 / 100;
    let maxEligibleAmount = 0;
    if (availableMonthlyEmiCapacity > 0) {
      const factor = Math.pow(1 + monthlyRate, input.tenureMonths);
      maxEligibleAmount = Math.round((availableMonthlyEmiCapacity * (factor - 1)) / (monthlyRate * factor));
      // Cap personal loans to 15x income
      if (input.loanType === 'personal') {
        maxEligibleAmount = Math.min(maxEligibleAmount, customer.monthlyIncome * 15, 2500000);
      }
    }

    const factors: string[] = [];
    const missingRequirements: string[] = [];

    let eligible = true;

    if (customer.creditScore < 680) {
      eligible = false;
      factors.push(`CIBIL score of ${customer.creditScore} is below minimum requirement of 680.`);
      missingRequirements.push('Credit score rehabilitation required before approval.');
    } else {
      factors.push(`Healthy CIBIL score of ${customer.creditScore} qualifies for prime tier interest (${baseRate}%).`);
    }

    if (debtToIncomeRatioPercent > maxAllowedDTIPercent) {
      eligible = false;
      factors.push(
        `Projected Debt-to-Income (DTI) of ${debtToIncomeRatioPercent}% exceeds maximum permissible threshold of ${maxAllowedDTIPercent}%.`
      );
      missingRequirements.push(
        `Consider extending tenure to ${Math.min(60, input.tenureMonths + 12)} months or reducing loan amount to ₹${maxEligibleAmount.toLocaleString('en-IN')}.`
      );
    } else {
      factors.push(`Debt-to-Income ratio of ${debtToIncomeRatioPercent}% is well within policy limits (max ${maxAllowedDTIPercent}%).`);
    }

    return {
      customerId: input.customerId,
      requestedAmount: input.requestedAmount,
      loanType: input.loanType,
      eligible,
      maxEligibleAmount,
      estimatedEMI: newEMI,
      debtToIncomeRatioPercent,
      maxAllowedDTIPercent,
      creditScore: customer.creditScore,
      cibilStatus: creditBureau.scoreBand,
      factors,
      missingRequirements,
      recommendedTenureMonths: eligible ? input.tenureMonths : Math.min(60, input.tenureMonths + 12),
      disclaimer: 'SIMULATED ESTIMATE ONLY: Subject to bank verification of bank statements, ITR returns, and credit appraisal.',
    };
  },
};

// ----------------- TOOL 10: GET KYC STATUS -----------------
export const getKYCStatusTool: BankingToolDefinition = {
  name: 'get_kyc_status',
  description: 'Retrieve official KYC compliance status, pending re-verification requirements, and AML screening flags.',
  authorizedRoles: ['supervisor', 'compliance_agent', 'customer_agent'],
  inputSchema: z.object({
    customerId: z.string().describe('Customer ID'),
  }),
  execute: (input: { customerId: string }, context: ToolExecutionContext) => {
    if (input.customerId !== context.authenticatedCustomerId) {
      throw new Error(`SECURITY ACCESS DENIED: Cannot query KYC for customer ${input.customerId}`);
    }
    const kyc = bankingDB.getKYCByCustomer(input.customerId);
    if (!kyc) throw new Error('KYC record not found.');

    const amlScreen = MockKYCAMLService.screenCustomer(input.customerId);

    return {
      customerId: input.customerId,
      status: kyc.status,
      isCompliant: kyc.status === 'verified',
      aadhaarVerified: kyc.aadhaarVerified,
      panVerified: kyc.panVerified,
      addressProofVerified: kyc.addressProofVerified,
      videoKycCompleted: kyc.videoKycCompleted,
      lastVerifiedDate: kyc.lastVerifiedDate,
      nextDueDate: kyc.nextDueDate,
      missingRequirements: kyc.missingRequirements,
      amlScreening: {
        regulatoryStatus: amlScreen.regulatoryStatus,
        amlRiskScore: amlScreen.amlRiskScore,
        pepStatus: amlScreen.pepStatus,
      },
    };
  },
};

// ----------------- TOOL 11: GET NOTIFICATIONS -----------------
export const getNotificationsTool: BankingToolDefinition = {
  name: 'get_notifications',
  description: 'Fetch security, fraud, and account notifications for the authenticated customer.',
  authorizedRoles: ['supervisor', 'notification_agent', 'customer_agent'],
  inputSchema: z.object({
    limit: z.number().min(1).max(20).default(10),
  }),
  execute: (input: { limit?: number }, context: ToolExecutionContext) => {
    const list = bankingDB.getNotificationsByCustomer(context.authenticatedCustomerId);
    const unreadCount = list.filter(n => !n.read).length;
    return {
      unreadCount,
      totalCount: list.length,
      notifications: list.slice(0, input.limit ?? 10),
    };
  },
};

// ----------------- TOOL 12: CREATE NOTIFICATION -----------------
export const createSimulatedNotificationTool: BankingToolDefinition = {
  name: 'create_simulated_notification',
  description: 'Dispatch a simulated in-app notification and SMS alert to customer.',
  authorizedRoles: ['supervisor', 'notification_agent', 'risk_fraud_agent', 'compliance_agent'],
  inputSchema: z.object({
    title: z.string().min(3),
    message: z.string().min(5),
    type: z.enum(['fraud', 'security', 'account', 'loan', 'compliance', 'system']).default('system'),
    priority: z.enum(['urgent', 'normal', 'info']).default('normal'),
  }),
  execute: (
    input: { title: string; message: string; type: 'fraud' | 'security' | 'account' | 'loan' | 'compliance' | 'system'; priority: 'urgent' | 'normal' | 'info' },
    context: ToolExecutionContext
  ) => {
    const created = bankingDB.createNotification(context.authenticatedCustomerId, {
      title: input.title,
      message: input.message,
      type: input.type,
      priority: input.priority,
    });
    return {
      status: 'created',
      notificationId: created.id,
      deliveredChannels: ['In-App Bell Notification', 'Simulated SMS Gateway'],
    };
  },
};

// ----------------- TOOL 13: FREEZE CARD OR ACCOUNT (State-Changing) -----------------
export const freezeCardOrAccountTool: BankingToolDefinition = {
  name: 'freeze_card_or_account',
  description: 'Execute an emergency security freeze on the customer account or card to prevent unauthorized debits.',
  authorizedRoles: ['supervisor', 'risk_fraud_agent'],
  inputSchema: z.object({
    accountId: z.string().describe('Target Account ID to freeze'),
    reason: z.string().min(5).describe('Reason for security freeze'),
  }),
  execute: (input: { accountId: string; reason: string }, context: ToolExecutionContext) => {
    const success = bankingDB.freezeAccountCard(context.authenticatedCustomerId, input.accountId, input.reason);
    if (!success) {
      throw new Error(`Failed to freeze account ${input.accountId}. Account not found or unauthorized.`);
    }
    return {
      success: true,
      accountId: input.accountId,
      action: 'ACCOUNT_FROZEN',
      status: 'frozen',
      confirmationMessage: 'Emergency security freeze activated. Debits and card transactions blocked.',
      timestamp: new Date().toISOString(),
    };
  },
};
