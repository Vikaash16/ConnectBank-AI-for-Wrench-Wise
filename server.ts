/**
 * ConnectBank AI - Express API Server & Vite Middleware Host
 * Port 3000
 */

import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { bankingDB } from './src/db/database.ts';
import { supervisorAgent } from './src/agents/supervisorAgent.ts';
import { calculateEMIFormula } from './src/tools/bankingTools.ts';
import { toolRegistry } from './src/tools/registry.ts';
import { geminiGateway } from './src/ai/geminiGateway.ts';
import { searchPolicies } from './src/rag/retriever.ts';
import { MockCreditBureau, MockPaymentGateway, MockKYCAMLService } from './src/data/mockServices.ts';

import fs from 'node:fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Database Disk Persistence
const DB_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DB_DIR, 'connectbank_db.json');

try {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    bankingDB.importState(parsed);
    console.log('[ConnectBank DB] Loaded database state from disk:', DB_FILE);
  } else {
    fs.writeFileSync(DB_FILE, JSON.stringify(bankingDB.exportState(), null, 2), 'utf-8');
    console.log('[ConnectBank DB] Initialized fresh database on disk:', DB_FILE);
  }

  // Hook for automatic synchronization to disk on any database update
  bankingDB.setPersistenceHook((state) => {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
    } catch (err) {
      console.error('[ConnectBank DB] Disk write error:', err);
    }
  });
} catch (err) {
  console.warn('[ConnectBank DB] Disk persistence initialization warning:', err);
}

const app = express();
const PORT = 3000;

app.use(express.json());

// API Request Logger & Correlation ID Middleware
app.use((req, res, next) => {
  const correlationId = `REQ-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`;
  res.setHeader('X-Correlation-ID', correlationId);
  res.setHeader('X-Service', 'ConnectBank-AI-Core');
  next();
});

// ----------------- HEALTH & SYSTEM STATUS -----------------
app.get('/api/health', (req: Request, res: Response) => {
  const modelStatus = geminiGateway.getStatus();
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'ConnectBank AI Server',
    environment: process.env.NODE_ENV || 'development',
    aiGateway: {
      status: modelStatus.isConfigured ? 'CONNECTED' : 'STANDBY_FALLBACK',
      model: modelStatus.modelName,
      mode: modelStatus.mode,
    },
    paymentGateway: MockPaymentGateway.checkNetworkHealth(),
  });
});

app.get('/api/system/status', (req: Request, res: Response) => {
  const modelStatus = geminiGateway.getStatus();
  const paymentHealth = MockPaymentGateway.checkNetworkHealth();
  const toolsCount = toolRegistry.getAllTools().length;
  const customers = bankingDB.getAllCustomers();
  const traces = bankingDB.getExecutionTraces(undefined, 100);

  res.json({
    gateway: modelStatus,
    paymentHealth,
    toolsRegistered: toolsCount,
    totalCustomers: customers.length,
    recentTracesCount: traces.length,
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/system/reset-seed', (req: Request, res: Response) => {
  bankingDB.resetToSeedData();
  res.json({
    success: true,
    message: 'ConnectBank database reset to baseline seed records.',
    timestamp: new Date().toISOString(),
  });
});

// ----------------- USERS & CREDENTIALS (STORED IN DATABASE) -----------------
app.get('/api/users', (req: Request, res: Response) => {
  const users = bankingDB.getAllUsers();
  res.json(users);
});

app.post('/api/users/create', (req: Request, res: Response) => {
  try {
    const { name, username, password, email, phone, occupation, monthlyIncome, initialDeposit, accountType, city } = req.body;

    if (!name || !username || !password) {
      return res.status(400).json({ error: 'Name, username, and password are required.' });
    }

    const created = bankingDB.createUser({
      name,
      username: username.trim(),
      password,
      email: email || `${username}@connectbank.in`,
      phone: phone || '+91 98765 00000',
      occupation: occupation || 'Professional',
      monthlyIncome: Number(monthlyIncome) || 75000,
      initialDeposit: Number(initialDeposit) || 10000,
      accountType: accountType || 'savings',
      city: city || 'Mumbai, Maharashtra',
    });

    res.status(201).json({
      success: true,
      message: 'User and credentials stored successfully in database.',
      ...created,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to create user in database.' });
  }
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const authenticated = bankingDB.authenticateUser(username, password);
  if (!authenticated) {
    return res.status(401).json({ error: 'Invalid credentials. Please verify your username and password.' });
  }

  const customer = bankingDB.getCustomerById(authenticated.customerId);
  res.json({
    success: true,
    user: authenticated,
    customer,
  });
});

// ----------------- CUSTOMERS -----------------
app.get('/api/customers', (req: Request, res: Response) => {
  const customers = bankingDB.getAllCustomers();
  res.json(customers);
});

app.get('/api/customers/:id', (req: Request, res: Response) => {
  const customer = bankingDB.getCustomerById(req.params.id);
  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }
  res.json(customer);
});

// ----------------- DASHBOARD AGGREGATE -----------------
app.get('/api/dashboard/:customerId', (req: Request, res: Response) => {
  const customerId = req.params.customerId;
  const customer = bankingDB.getCustomerById(customerId);
  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }

  const accounts = bankingDB.getAccountsByCustomer(customerId);
  const totalBalance = accounts.reduce((acc, a) => acc + a.balance, 0);
  const recentTransactions = bankingDB.getTransactionsByCustomer(customerId, { limit: 5 });
  const activeLoans = bankingDB.getLoansByCustomer(customerId);
  const totalLoanOutstanding = activeLoans.reduce((sum, l) => sum + l.remainingBalance, 0);
  const monthlyEmiTotal = activeLoans.reduce((sum, l) => sum + l.emiAmount, 0);
  const fraudAlerts = bankingDB.getFraudAlertsByCustomer(customerId);
  const kyc = bankingDB.getKYCByCustomer(customerId);
  const notifications = bankingDB.getNotificationsByCustomer(customerId);
  const recentTraces = bankingDB.getExecutionTraces(customerId, 3);

  res.json({
    customer,
    totalBalance,
    accounts,
    recentTransactions,
    loans: {
      items: activeLoans,
      totalOutstanding: totalLoanOutstanding,
      monthlyEmiTotal,
    },
    fraudAlerts,
    kyc,
    unreadNotificationsCount: notifications.filter(n => !n.read).length,
    recentTraces,
  });
});

// ----------------- ACCOUNTS & TRANSACTIONS -----------------
app.get('/api/accounts/:customerId', (req: Request, res: Response) => {
  const accounts = bankingDB.getAccountsByCustomer(req.params.customerId);
  res.json(accounts);
});

app.get('/api/transactions/:customerId', (req: Request, res: Response) => {
  const { limit, category, status, search } = req.query;
  const txns = bankingDB.getTransactionsByCustomer(req.params.customerId, {
    limit: limit ? parseInt(limit as string, 10) : 50,
    category: category as string,
    status: status as string,
    search: search as string,
  });
  res.json(txns);
});

// ----------------- LOANS & EMI CALCULATOR -----------------
app.get('/api/loans/:customerId', (req: Request, res: Response) => {
  const loans = bankingDB.getLoansByCustomer(req.params.customerId);
  res.json(loans);
});

app.post('/api/loans/calculate-emi', (req: Request, res: Response) => {
  try {
    const { principal, annualInterestRate, tenureMonths } = req.body;
    const result = calculateEMIFormula(
      Number(principal),
      Number(annualInterestRate),
      Number(tenureMonths)
    );
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/loans/eligibility', async (req: Request, res: Response) => {
  try {
    const { customerId, requestedAmount, loanType, tenureMonths } = req.body;
    const toolResult = await toolRegistry.invokeTool(
      'check_loan_eligibility',
      {
        customerId,
        requestedAmount: Number(requestedAmount),
        loanType: loanType || 'personal',
        tenureMonths: Number(tenureMonths) || 36,
      },
      { authenticatedCustomerId: customerId, callerAgent: 'credit_loan_agent', requestId: `REQ-API-${Date.now()}` }
    );
    res.json(toolResult.result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ----------------- FRAUD MONITORING -----------------
app.get('/api/fraud/alerts/:customerId', (req: Request, res: Response) => {
  const alerts = bankingDB.getFraudAlertsByCustomer(req.params.customerId);
  res.json(alerts);
});

app.post('/api/fraud/analyze', async (req: Request, res: Response) => {
  try {
    const { customerId } = req.body;
    const toolResult = await toolRegistry.invokeTool(
      'analyze_transaction_risk',
      { customerId, lookbackDays: 30 },
      { authenticatedCustomerId: customerId, callerAgent: 'risk_fraud_agent', requestId: `REQ-API-${Date.now()}` }
    );
    res.json(toolResult.result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ----------------- KYC & COMPLIANCE -----------------
app.get('/api/kyc/:customerId', (req: Request, res: Response) => {
  const kyc = bankingDB.getKYCByCustomer(req.params.customerId);
  const aml = MockKYCAMLService.screenCustomer(req.params.customerId);
  res.json({ kyc, amlScreening: aml });
});

// ----------------- NOTIFICATIONS -----------------
app.get('/api/notifications/:customerId', (req: Request, res: Response) => {
  const list = bankingDB.getNotificationsByCustomer(req.params.customerId);
  res.json(list);
});

app.post('/api/notifications/:id/read', (req: Request, res: Response) => {
  const { customerId } = req.body;
  const success = bankingDB.markNotificationAsRead(req.params.id, customerId);
  res.json({ success });
});

app.post('/api/notifications/:customerId/read-all', (req: Request, res: Response) => {
  bankingDB.markAllNotificationsAsRead(req.params.customerId);
  res.json({ success: true });
});

// ----------------- POLICIES RAG SEARCH -----------------
app.get('/api/policies/search', (req: Request, res: Response) => {
  const query = (req.query.q as string) || '';
  const results = searchPolicies(query, 5);
  res.json(results);
});

// ----------------- AUDIT LOGS & AGENT TRACES -----------------
app.get('/api/audit-logs', (req: Request, res: Response) => {
  const customerId = req.query.customerId as string | undefined;
  const logs = bankingDB.getAuditLogs(customerId, 50);
  res.json(logs);
});

app.get('/api/agent-traces', (req: Request, res: Response) => {
  const customerId = req.query.customerId as string | undefined;
  const traces = bankingDB.getExecutionTraces(customerId, 30);
  res.json(traces);
});

app.get('/api/agent-traces/:requestId', (req: Request, res: Response) => {
  const trace = bankingDB.getExecutionTraceById(req.params.requestId);
  if (!trace) {
    return res.status(404).json({ error: 'Trace not found' });
  }
  res.json(trace);
});

// ----------------- ASSISTANT CHAT (SUPERVISOR MULTI-AGENT ORCHESTRATION) -----------------
app.post('/api/assistant/chat', async (req: Request, res: Response) => {
  try {
    const { message, customerId, forceDeterministic, confirmedAction } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message string is required' });
    }
    if (!customerId) {
      return res.status(400).json({ error: 'Authenticated customerId is required' });
    }

    const response = await supervisorAgent.orchestrate(message, customerId, {
      forceDeterministic: Boolean(forceDeterministic),
      confirmedAction: Boolean(confirmedAction),
    });

    res.json(response);
  } catch (err: any) {
    console.error('[API /api/assistant/chat error]:', err);
    res.status(500).json({
      error: err.message || 'Internal supervisor orchestration error',
      executionStatus: 'failed',
    });
  }
});

// ----------------- VITE MIDDLEWARES & STATIC SERVING -----------------
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    // In production, serve dist folder
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    // In development, mount Vite dev server middlewares
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ConnectBank AI] Server listening on port ${PORT} (dev & API unified)`);
  });
}

startServer().catch(err => {
  console.error('Fatal server startup failure:', err);
  process.exit(1);
});
