/**
 * Layer 6 - Simulated Enterprise Banking Data Repository
 * Enforces customer data ownership, tenant isolation, and audit logging.
 * Supports User Credentials, Customer Registration, and Disk Persistence.
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
  UserCredential,
  CreateUserInput,
} from '../types/banking.ts';
import {
  SEED_CUSTOMERS,
  SEED_ACCOUNTS,
  SEED_TRANSACTIONS,
  SEED_LOANS,
  SEED_KYC,
  SEED_FRAUD_ALERTS,
  SEED_NOTIFICATIONS,
} from '../data/seedData.ts';

const SEED_USERS: UserCredential[] = [
  {
    id: 'USR-1001',
    username: 'aarav.sharma',
    passwordHash: 'c2VjdXJlMTIz', // Mock hash
    passwordPlainForDemo: 'Connect@123',
    customerId: 'CUST-1001',
    role: 'customer',
    createdAt: '2026-01-15T09:00:00Z',
    status: 'active',
  },
  {
    id: 'USR-1002',
    username: 'priya.patel',
    passwordHash: 'Z3JlZW5iaXoyMDI2',
    passwordPlainForDemo: 'GreenBiz#2026',
    customerId: 'CUST-1002',
    role: 'customer',
    createdAt: '2026-02-10T10:30:00Z',
    status: 'active',
  },
  {
    id: 'USR-1003',
    username: 'rajesh.kumar',
    passwordHash: 'c2VuaW9ycmV0MjAyNg==',
    passwordPlainForDemo: 'SeniorRet@2026',
    customerId: 'CUST-1003',
    role: 'customer',
    createdAt: '2026-01-05T08:15:00Z',
    status: 'active',
  },
];

class BankingDatabase {
  private users: Map<string, UserCredential> = new Map();
  private customers: Map<string, Customer> = new Map();
  private accounts: Map<string, Account> = new Map();
  private transactions: Map<string, Transaction> = new Map();
  private loans: Map<string, Loan> = new Map();
  private kycRecords: Map<string, KYCRecord> = new Map();
  private fraudAlerts: Map<string, FraudAlert> = new Map();
  private notifications: Map<string, NotificationItem> = new Map();
  private auditLogs: AuditLog[] = [];
  private executionTraces: AgentExecutionTrace[] = [];

  private persistenceHook: ((state: any) => void) | null = null;

  constructor() {
    this.resetToSeedData();
  }

  public setPersistenceHook(hook: (state: any) => void): void {
    this.persistenceHook = hook;
  }

  private triggerPersistence(): void {
    if (this.persistenceHook) {
      try {
        this.persistenceHook(this.exportState());
      } catch (err) {
        console.warn('[BankingDB] Persistence hook failed:', err);
      }
    }
  }

  public exportState(): Record<string, any> {
    return {
      users: Array.from(this.users.values()),
      customers: Array.from(this.customers.values()),
      accounts: Array.from(this.accounts.values()),
      transactions: Array.from(this.transactions.values()),
      loans: Array.from(this.loans.values()),
      kycRecords: Array.from(this.kycRecords.entries()).map(([k, v]) => ({ customerId: k, record: v })),
      fraudAlerts: Array.from(this.fraudAlerts.values()),
      notifications: Array.from(this.notifications.values()),
      auditLogs: this.auditLogs.slice(0, 100),
      executionTraces: this.executionTraces.slice(0, 50),
      exportedAt: new Date().toISOString(),
    };
  }

  public importState(data: Record<string, any>): void {
    if (!data) return;

    if (Array.isArray(data.users)) {
      this.users.clear();
      data.users.forEach((u: UserCredential) => this.users.set(u.id, u));
    }
    if (Array.isArray(data.customers)) {
      this.customers.clear();
      data.customers.forEach((c: Customer) => this.customers.set(c.id, c));
    }
    if (Array.isArray(data.accounts)) {
      this.accounts.clear();
      data.accounts.forEach((a: Account) => this.accounts.set(a.id, a));
    }
    if (Array.isArray(data.transactions)) {
      this.transactions.clear();
      data.transactions.forEach((t: Transaction) => this.transactions.set(t.id, t));
    }
    if (Array.isArray(data.loans)) {
      this.loans.clear();
      data.loans.forEach((l: Loan) => this.loans.set(l.id, l));
    }
    if (Array.isArray(data.kycRecords)) {
      this.kycRecords.clear();
      data.kycRecords.forEach((item: any) => this.kycRecords.set(item.customerId, item.record));
    }
    if (Array.isArray(data.fraudAlerts)) {
      this.fraudAlerts.clear();
      data.fraudAlerts.forEach((f: FraudAlert) => this.fraudAlerts.set(f.id, f));
    }
    if (Array.isArray(data.notifications)) {
      this.notifications.clear();
      data.notifications.forEach((n: NotificationItem) => this.notifications.set(n.id, n));
    }
    if (Array.isArray(data.auditLogs)) {
      this.auditLogs = [...data.auditLogs];
    }
    if (Array.isArray(data.executionTraces)) {
      this.executionTraces = [...data.executionTraces];
    }
  }

  public resetToSeedData(): void {
    this.users.clear();
    this.customers.clear();
    this.accounts.clear();
    this.transactions.clear();
    this.loans.clear();
    this.kycRecords.clear();
    this.fraudAlerts.clear();
    this.notifications.clear();
    this.auditLogs = [];
    this.executionTraces = [];

    // Deep clone to ensure mutation safety
    SEED_USERS.forEach(u => this.users.set(u.id, { ...u }));
    SEED_CUSTOMERS.forEach(c => this.customers.set(c.id, { ...c }));
    SEED_ACCOUNTS.forEach(a => this.accounts.set(a.id, { ...a }));
    SEED_TRANSACTIONS.forEach(t => this.transactions.set(t.id, { ...t }));
    SEED_LOANS.forEach(l => this.loans.set(l.id, { ...l }));
    Object.entries(SEED_KYC).forEach(([cid, kyc]) => this.kycRecords.set(cid, { ...kyc }));
    SEED_FRAUD_ALERTS.forEach(f => this.fraudAlerts.set(f.id, { ...f }));
    SEED_NOTIFICATIONS.forEach(n => this.notifications.set(n.id, { ...n }));

    this.logAudit({
      customerId: 'SYSTEM',
      actor: 'system',
      action: 'DATABASE_INITIALIZED_OR_RESET',
      details: { timestamp: new Date().toISOString(), totalCustomers: this.customers.size },
    });

    this.triggerPersistence();
  }

  // --- Users & Authentication ---
  public getAllUsers(): UserCredential[] {
    return Array.from(this.users.values());
  }

  public getUserByUsername(username: string): UserCredential | null {
    for (const u of this.users.values()) {
      if (u.username.toLowerCase() === username.toLowerCase()) {
        return { ...u };
      }
    }
    return null;
  }

  public getUserByCustomerId(customerId: string): UserCredential | null {
    for (const u of this.users.values()) {
      if (u.customerId === customerId) {
        return { ...u };
      }
    }
    return null;
  }

  public authenticateUser(username: string, passwordPlain: string): UserCredential | null {
    const user = this.getUserByUsername(username);
    if (!user) return null;

    if (user.passwordPlainForDemo && user.passwordPlainForDemo === passwordPlain) {
      user.lastLoginAt = new Date().toISOString();
      this.users.set(user.id, user);
      this.triggerPersistence();
      return { ...user };
    }

    return null;
  }

  public createUser(input: CreateUserInput): {
    user: UserCredential;
    customer: Customer;
    account: Account;
  } {
    // 1. Validate username uniqueness
    const existing = this.getUserByUsername(input.username);
    if (existing) {
      throw new Error(`Username "${input.username}" is already taken in the database.`);
    }

    // 2. Generate new IDs
    const nextNum = 1001 + this.customers.size;
    const customerId = `CUST-${nextNum}`;
    const userId = `USR-${nextNum}`;
    const accountId = `ACC-${nextNum}-${(input.accountType || 'savings').slice(0, 3).toUpperCase()}`;

    // 3. Generate random masked PAN & Aadhaar
    const randomPanSuffix = Math.floor(1000 + Math.random() * 9000);
    const randomAadhaarLast4 = Math.floor(1000 + Math.random() * 9000);
    const randomAccountLast4 = Math.floor(1000 + Math.random() * 9000);

    const maskedPhone = input.phone.length > 5
      ? input.phone.slice(0, 5) + 'XX-XX' + input.phone.slice(-3)
      : '+91 98XXX-XX' + Math.floor(100 + Math.random() * 899);

    // 4. Create Customer
    const newCustomer: Customer = {
      id: customerId,
      name: input.name,
      email: input.email || `${input.username}@connectbank.in`,
      phone: input.phone || '+91 98765 00000',
      maskedPhone,
      panMasked: `CNBPK${randomPanSuffix}X`,
      aadhaarMasked: `XXXX-XXXX-${randomAadhaarLast4}`,
      dob: '1992-04-18',
      occupation: input.occupation || 'Professional',
      monthlyIncome: Number(input.monthlyIncome) || 85000,
      creditScore: 740,
      customerSince: new Date().toISOString().split('T')[0],
      city: input.city || 'Mumbai, Maharashtra',
      riskRating: 'low',
    };
    this.customers.set(customerId, newCustomer);

    // 5. Create User Credential
    const newUser: UserCredential = {
      id: userId,
      username: input.username,
      passwordHash: Buffer.from(input.password).toString('base64'),
      passwordPlainForDemo: input.password,
      customerId,
      role: 'customer',
      createdAt: new Date().toISOString(),
      status: 'active',
    };
    this.users.set(userId, newUser);

    // 6. Create Primary Account
    const initialDeposit = Number(input.initialDeposit) || 10000;
    const newAccount: Account = {
      id: accountId,
      customerId,
      accountNumber: `50${nextNum}000000${randomAccountLast4}`,
      maskedAccountNumber: `XXXX-XXXX-${randomAccountLast4}`,
      accountType: input.accountType || 'savings',
      balance: initialDeposit,
      currency: 'INR',
      status: 'active',
      ifsc: 'CNBK0005510',
      branchName: 'ConnectBank Digital Hub, Mumbai',
      interestRate: input.accountType === 'current' ? 0.0 : 3.5,
      createdAt: new Date().toISOString(),
    };
    this.accounts.set(accountId, newAccount);

    // 7. Create Initial Opening Deposit Transaction
    if (initialDeposit > 0) {
      const openTxn: Transaction = {
        id: `TXN-${nextNum}-INIT`,
        accountId,
        customerId,
        amount: initialDeposit,
        type: 'credit',
        category: 'Transfer',
        description: 'Initial Opening Account Deposit',
        timestamp: new Date().toISOString(),
        status: 'completed',
        counterparty: 'ConnectBank Onboarding Switch',
        channel: 'ONLINE',
        referenceNumber: `INIT${Date.now().toString().slice(-8)}`,
      };
      this.transactions.set(openTxn.id, openTxn);
    }

    // 8. Create Initial KYC Record
    const newKYC: KYCRecord = {
      customerId,
      status: 'verified',
      aadhaarVerified: true,
      panVerified: true,
      addressProofVerified: true,
      videoKycCompleted: true,
      lastVerifiedDate: new Date().toISOString().split('T')[0],
      nextDueDate: '2028-10-11',
      amlCheckStatus: 'clear',
      riskCategory: 'low',
      missingRequirements: [],
    };
    this.kycRecords.set(customerId, newKYC);

    // 9. Create Welcome Notification
    this.createNotification(customerId, {
      type: 'account',
      title: 'Welcome to ConnectBank AI!',
      message: `Your account (${newAccount.maskedAccountNumber}) has been activated with an opening balance of ₹${initialDeposit.toLocaleString('en-IN')}.`,
      priority: 'normal',
    });

    // 10. Log Audit
    this.logAudit({
      customerId,
      actor: 'system',
      action: 'USER_AND_ACCOUNT_CREATED',
      details: { username: input.username, customerId, accountId, initialDeposit },
    });

    this.triggerPersistence();

    return { user: newUser, customer: newCustomer, account: newAccount };
  }

  // --- Customers ---
  public getAllCustomers(): Customer[] {
    return Array.from(this.customers.values());
  }

  public getCustomerById(customerId: string): Customer | null {
    const customer = this.customers.get(customerId);
    return customer ? { ...customer } : null;
  }

  // --- Accounts (Customer Isolation Enforced) ---
  public getAccountsByCustomer(customerId: string): Account[] {
    return Array.from(this.accounts.values())
      .filter(a => a.customerId === customerId)
      .map(a => ({ ...a }));
  }

  public getAccountById(accountId: string, customerId: string): Account | null {
    const acc = this.accounts.get(accountId);
    if (!acc || acc.customerId !== customerId) {
      return null;
    }
    return { ...acc };
  }

  public freezeAccountCard(customerId: string, accountId: string, reason: string): boolean {
    const acc = this.accounts.get(accountId);
    if (!acc || acc.customerId !== customerId) {
      return false;
    }
    acc.status = 'frozen';
    this.accounts.set(accountId, acc);

    this.logAudit({
      customerId,
      actor: 'customer',
      action: 'ACCOUNT_CARD_FROZEN_SECURITY_HOLD',
      details: { accountId, reason },
    });

    this.createNotification(customerId, {
      type: 'security',
      title: 'Security Freeze Activated',
      message: `Account ending in ${acc.maskedAccountNumber.slice(-4)} has been frozen: ${reason}`,
      priority: 'urgent',
    });

    this.triggerPersistence();
    return true;
  }

  // --- Transactions (Customer Isolation Enforced) ---
  public getTransactionsByCustomer(
    customerId: string,
    options?: {
      limit?: number;
      category?: string;
      status?: string;
      search?: string;
    }
  ): Transaction[] {
    let txns = Array.from(this.transactions.values())
      .filter(t => t.customerId === customerId);

    if (options?.category && options.category !== 'all') {
      txns = txns.filter(t => t.category.toLowerCase() === options.category!.toLowerCase());
    }

    if (options?.status && options.status !== 'all') {
      txns = txns.filter(t => t.status === options.status);
    }

    if (options?.search) {
      const q = options.search.toLowerCase();
      txns = txns.filter(t =>
        t.description.toLowerCase().includes(q) ||
        (t.counterparty && t.counterparty.toLowerCase().includes(q)) ||
        t.channel.toLowerCase().includes(q) ||
        t.referenceNumber.toLowerCase().includes(q)
      );
    }

    // Sort descending by timestamp
    txns.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (options?.limit && options.limit > 0) {
      txns = txns.slice(0, options.limit);
    }

    return txns.map(t => ({ ...t }));
  }

  public getTransactionById(transactionId: string, customerId: string): Transaction | null {
    const txn = this.transactions.get(transactionId);
    if (!txn || txn.customerId !== customerId) {
      return null;
    }
    return { ...txn };
  }

  // --- Loans (Customer Isolation Enforced) ---
  public getLoansByCustomer(customerId: string): Loan[] {
    return Array.from(this.loans.values())
      .filter(l => l.customerId === customerId)
      .map(l => ({ ...l }));
  }

  public getLoanById(loanId: string, customerId: string): Loan | null {
    const loan = this.loans.get(loanId);
    if (!loan || loan.customerId !== customerId) {
      return null;
    }
    return { ...loan };
  }

  // --- KYC (Customer Isolation Enforced) ---
  public getKYCByCustomer(customerId: string): KYCRecord | null {
    const kyc = this.kycRecords.get(customerId);
    return kyc ? { ...kyc } : null;
  }

  public updateKYCStatus(customerId: string, updates: Partial<KYCRecord>): KYCRecord | null {
    const kyc = this.kycRecords.get(customerId);
    if (!kyc) return null;
    const updated = { ...kyc, ...updates };
    this.kycRecords.set(customerId, updated);

    this.logAudit({
      customerId,
      actor: 'compliance_officer',
      action: 'KYC_STATUS_UPDATED',
      details: updates,
    });

    this.triggerPersistence();
    return { ...updated };
  }

  // --- Fraud Alerts (Customer Isolation Enforced) ---
  public getFraudAlertsByCustomer(customerId: string): FraudAlert[] {
    return Array.from(this.fraudAlerts.values())
      .filter(f => f.customerId === customerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(f => ({ ...f }));
  }

  public addFraudAlert(alert: Omit<FraudAlert, 'id' | 'createdAt'>): FraudAlert {
    const newAlert: FraudAlert = {
      ...alert,
      id: `FRD-${Date.now().toString(36).toUpperCase()}`,
      createdAt: new Date().toISOString(),
    };
    this.fraudAlerts.set(newAlert.id, newAlert);

    this.createNotification(alert.customerId, {
      type: 'fraud',
      title: `Risk Alert (${alert.severity.toUpperCase()}): ${alert.ruleTriggered}`,
      message: alert.description,
      priority: alert.severity === 'high' || alert.severity === 'critical' ? 'urgent' : 'normal',
      actionUrl: '/fraud-monitoring',
    });

    this.logAudit({
      customerId: alert.customerId,
      actor: 'supervisor_agent',
      action: 'FRAUD_ALERT_GENERATED',
      details: { alertId: newAlert.id, riskScore: alert.riskScore, rule: alert.ruleTriggered },
    });

    this.triggerPersistence();
    return { ...newAlert };
  }

  public updateFraudAlertStatus(alertId: string, customerId: string, status: FraudAlert['status']): boolean {
    const alert = this.fraudAlerts.get(alertId);
    if (!alert || alert.customerId !== customerId) return false;
    alert.status = status;
    this.fraudAlerts.set(alertId, alert);
    this.triggerPersistence();
    return true;
  }

  // --- Notifications (Customer Isolation Enforced) ---
  public getNotificationsByCustomer(customerId: string): NotificationItem[] {
    return Array.from(this.notifications.values())
      .filter(n => n.customerId === customerId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .map(n => ({ ...n }));
  }

  public markNotificationAsRead(notificationId: string, customerId: string): boolean {
    const notif = this.notifications.get(notificationId);
    if (!notif || notif.customerId !== customerId) return false;
    notif.read = true;
    this.notifications.set(notificationId, notif);
    this.triggerPersistence();
    return true;
  }

  public markAllNotificationsAsRead(customerId: string): void {
    Array.from(this.notifications.values())
      .filter(n => n.customerId === customerId)
      .forEach(n => {
        n.read = true;
        this.notifications.set(n.id, n);
      });
    this.triggerPersistence();
  }

  public createNotification(
    customerId: string,
    params: Omit<NotificationItem, 'id' | 'customerId' | 'timestamp' | 'read'>
  ): NotificationItem {
    const notif: NotificationItem = {
      ...params,
      id: `NOTIF-${Date.now().toString(36).toUpperCase()}`,
      customerId,
      timestamp: new Date().toISOString(),
      read: false,
    };
    this.notifications.set(notif.id, notif);
    this.triggerPersistence();
    return { ...notif };
  }

  // --- Audit Logs ---
  public logAudit(entry: Omit<AuditLog, 'id' | 'timestamp'>): void {
    const log: AuditLog = {
      ...entry,
      id: `AUDIT-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.unshift(log);
    if (this.auditLogs.length > 500) {
      this.auditLogs.pop();
    }
    this.triggerPersistence();
  }

  public getAuditLogs(customerId?: string, limit = 50): AuditLog[] {
    if (customerId) {
      return this.auditLogs.filter(a => a.customerId === customerId).slice(0, limit);
    }
    return this.auditLogs.slice(0, limit);
  }

  // --- Execution Traces ---
  public recordExecutionTrace(trace: AgentExecutionTrace): void {
    this.executionTraces.unshift(trace);
    if (this.executionTraces.length > 100) {
      this.executionTraces.pop();
    }
    this.triggerPersistence();
  }

  public getExecutionTraces(customerId?: string, limit = 20): AgentExecutionTrace[] {
    if (customerId) {
      return this.executionTraces.filter(t => t.customerId === customerId).slice(0, limit);
    }
    return this.executionTraces.slice(0, limit);
  }

  public getExecutionTraceById(requestId: string): AgentExecutionTrace | null {
    return this.executionTraces.find(t => t.requestId === requestId) || null;
  }
}

// Singleton database instance
export const bankingDB = new BankingDatabase();
