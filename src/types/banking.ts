/**
 * ConnectBank AI - Core Banking Domain Models and Types
 */

export type AccountType = 'savings' | 'current' | 'fixed_deposit';
export type AccountStatus = 'active' | 'frozen' | 'dormant';
export type TransactionType = 'credit' | 'debit';
export type TransactionStatus = 'completed' | 'flagged' | 'failed' | 'pending';
export type TransactionChannel = 'UPI' | 'IMPS' | 'NEFT' | 'ATM' | 'POS' | 'ONLINE';
export type KYCStatus = 'verified' | 'pending_reverification' | 'incomplete' | 'rejected';
export type RiskSeverity = 'low' | 'medium' | 'high' | 'critical';
export type LoanType = 'personal' | 'home' | 'auto' | 'education';
export type LoanStatus = 'active' | 'closed' | 'applied';

export interface UserCredential {
  id: string;
  username: string;
  passwordHash: string; // Stored securely
  passwordPlainForDemo?: string; // Stored for transparent demo display in UI
  customerId: string;
  role: 'customer' | 'admin' | 'compliance_officer';
  createdAt: string;
  lastLoginAt?: string;
  status: 'active' | 'suspended';
}

export interface CreateUserInput {
  name: string;
  username: string;
  password: string;
  email: string;
  phone: string;
  occupation: string;
  monthlyIncome: number;
  initialDeposit: number;
  accountType?: AccountType;
  city?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  maskedPhone: string;
  panMasked: string;
  aadhaarMasked: string;
  dob: string;
  occupation: string;
  monthlyIncome: number; // in INR
  creditScore: number; // CIBIL score (300-900)
  customerSince: string;
  city: string;
  riskRating: 'low' | 'medium' | 'high';
}

export interface Account {
  id: string;
  customerId: string;
  accountNumber: string;
  maskedAccountNumber: string;
  accountType: AccountType;
  balance: number; // in INR
  currency: 'INR';
  status: AccountStatus;
  ifsc: string;
  branchName: string;
  interestRate: number; // e.g., 3.5 for savings
  createdAt: string;
}

export interface TransactionMetadata {
  deviceId?: string;
  ipAddress?: string;
  location?: string;
  isForeign?: boolean;
  velocityWindowMinutes?: number;
  burstCount?: number;
}

export interface Transaction {
  id: string;
  accountId: string;
  customerId: string;
  amount: number; // in INR
  type: TransactionType;
  category: 'Salary' | 'Shopping' | 'Dining' | 'Utilities' | 'Transfer' | 'EMI' | 'Investment' | 'Travel' | 'Electronics';
  description: string;
  timestamp: string;
  status: TransactionStatus;
  counterparty?: string;
  channel: TransactionChannel;
  referenceNumber: string;
  metadata?: TransactionMetadata;
}

export interface Loan {
  id: string;
  customerId: string;
  loanType: LoanType;
  principal: number; // in INR
  interestRate: number; // Annual % e.g. 10.5
  tenureMonths: number;
  emiAmount: number; // monthly EMI in INR
  remainingBalance: number;
  disbursedDate: string;
  nextEmiDate: string;
  status: LoanStatus;
  emisPaid: number;
  totalEmis: number;
}

export interface KYCRecord {
  customerId: string;
  status: KYCStatus;
  aadhaarVerified: boolean;
  panVerified: boolean;
  addressProofVerified: boolean;
  videoKycCompleted: boolean;
  lastVerifiedDate: string;
  nextDueDate: string;
  amlCheckStatus: 'clear' | 'review_required' | 'flagged';
  riskCategory: 'low' | 'medium' | 'high';
  missingRequirements: string[];
}

export interface FraudAlert {
  id: string;
  customerId: string;
  transactionId?: string;
  ruleTriggered: string;
  riskScore: number; // 0 to 100
  severity: RiskSeverity;
  description: string;
  evidence: {
    transactionAmount?: number;
    location?: string;
    deviationPercentage?: number;
    frequencyCount?: number;
    deviceDiscrepancy?: boolean;
  };
  recommendations: string[];
  status: 'open' | 'investigating' | 'resolved' | 'dismissed';
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  customerId: string;
  type: 'fraud' | 'security' | 'account' | 'loan' | 'compliance' | 'system';
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
  priority: 'urgent' | 'normal' | 'info';
  actionUrl?: string;
}

export interface AuditLog {
  id: string;
  customerId: string;
  actor: 'customer' | 'supervisor_agent' | 'system' | 'compliance_officer';
  action: string;
  details: Record<string, unknown>;
  timestamp: string;
  ipAddress?: string;
}

// ----------------- AGENT & TOOL LAYER TYPES -----------------

export type AgentRole =
  | 'supervisor'
  | 'customer_agent'
  | 'banking_product_agent'
  | 'risk_fraud_agent'
  | 'credit_loan_agent'
  | 'compliance_agent'
  | 'notification_agent';

export interface ToolCall {
  id: string;
  toolName: string;
  callerAgent: AgentRole;
  parameters: Record<string, unknown>;
  timestamp: string;
}

export interface ToolResult {
  toolCallId: string;
  toolName: string;
  status: 'success' | 'error' | 'denied';
  result?: unknown;
  error?: string;
  durationMs: number;
}

export interface PolicyCitation {
  docId: string;
  title: string;
  category: string;
  excerpt: string;
  relevanceScore: number;
}

export interface TaskStep {
  stepId: string;
  assignedAgent: AgentRole;
  taskDescription: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'escalated';
  toolsUsed: string[];
  summary?: string;
  durationMs?: number;
}

export interface AgentExecutionTrace {
  requestId: string;
  correlationId: string;
  customerId: string;
  timestamp: string;
  userPrompt: string;
  classifiedIntent: string;
  isModelGrounded: boolean;
  modelUsed: string;
  selectedAgents: AgentRole[];
  steps: TaskStep[];
  toolCalls: ToolCall[];
  toolResults: ToolResult[];
  policyCitations?: PolicyCitation[];
  guardrailInterventions?: string[];
  requiresConfirmation?: boolean;
  confirmationDetails?: {
    actionType: string;
    targetId?: string;
    warningMessage: string;
  };
  durationMs: number;
  executionStatus: 'success' | 'partial' | 'escalated' | 'denied' | 'failed';
}

export interface AssistantChatRequest {
  message: string;
  customerId: string;
  forceDeterministic?: boolean;
  confirmedAction?: boolean;
}

export interface AssistantChatResponse {
  requestId: string;
  correlationId: string;
  intent: string;
  selectedAgents: AgentRole[];
  toolCalls: ToolCall[];
  toolResults: ToolResult[];
  policyCitations: PolicyCitation[];
  riskFlags: string[];
  requiresConfirmation: boolean;
  confirmationDetails?: {
    actionType: string;
    targetId?: string;
    warningMessage: string;
  };
  finalResponse: string;
  executionTrace: AgentExecutionTrace;
  executionStatus: 'success' | 'partial' | 'escalated' | 'denied' | 'failed';
  durationMs: number;
  engine: 'gemini-3.8-flash' | 'deterministic-fallback';
}

// ----------------- CALCULATOR & ELIGIBILITY SCHEMAS -----------------

export interface EMICalculationInput {
  principal: number;
  annualInterestRate: number;
  tenureMonths: number;
}

export interface EMICalculationResult {
  principal: number;
  annualInterestRate: number;
  tenureMonths: number;
  monthlyEMI: number;
  totalInterest: number;
  totalPayment: number;
  monthlyInterestRatePercent: number;
  amortizationPreview: Array<{
    month: number;
    emi: number;
    principalPaid: number;
    interestPaid: number;
    remainingPrincipal: number;
  }>;
}

export interface LoanEligibilityInput {
  customerId: string;
  requestedAmount: number;
  loanType: LoanType;
  tenureMonths: number;
  customIncome?: number;
}

export interface LoanEligibilityResult {
  customerId: string;
  requestedAmount: number;
  loanType: LoanType;
  eligible: boolean;
  maxEligibleAmount: number;
  estimatedEMI: number;
  debtToIncomeRatioPercent: number;
  maxAllowedDTIPercent: number;
  creditScore: number;
  cibilStatus: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  factors: string[];
  missingRequirements: string[];
  recommendedTenureMonths?: number;
  disclaimer: string;
}
