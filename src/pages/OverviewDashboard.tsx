/**
 * ConnectBank AI - Overview Dashboard Page
 */

import React from 'react';
import { Customer, Account, Transaction, Loan, FraudAlert, KYCRecord, AgentExecutionTrace } from '../types/banking.ts';
import { ActiveTab } from '../components/Sidebar.tsx';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldAlert,
  Calculator,
  FileCheck2,
  Bot,
  TrendingUp,
  CreditCard,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface OverviewDashboardProps {
  customer: Customer;
  totalBalance: number;
  accounts: Account[];
  recentTransactions: Transaction[];
  loans: { items: Loan[]; totalOutstanding: number; monthlyEmiTotal: number };
  fraudAlerts: FraudAlert[];
  kyc: KYCRecord | null;
  recentTraces: AgentExecutionTrace[];
  onNavigate: (tab: ActiveTab, prompt?: string) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  customer,
  totalBalance,
  accounts,
  recentTransactions,
  loans,
  fraudAlerts,
  kyc,
  recentTraces,
  onNavigate,
}) => {
  const activeAlerts = fraudAlerts.filter(a => a.status === 'open');
  const isKycDue = kyc?.status === 'pending_reverification';

  const formatINR = (val: number) => {
    return val.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#0A192F] via-[#0F2744] to-[#1E3A8A] rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-blue-900/40">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-cyan-300 border border-cyan-400/30">
              Welcome back
            </span>
            <span className="text-xs text-slate-300 font-mono">ID: {customer.id}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            {customer.name}
          </h1>
          <p className="text-xs md:text-sm text-slate-300 mt-1">
            {customer.occupation} • {customer.city}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onNavigate('assistant', 'Summarize my balance, check recent fraud alerts, and tell me my current loan EMI.')}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold rounded-xl text-xs md:text-sm shadow-md shadow-blue-600/30 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Multi-Agent Summary</span>
          </button>
          <button
            onClick={() => onNavigate('assistant')}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-xs md:text-sm transition-all border border-white/20 cursor-pointer"
          >
            <Bot className="w-4 h-4 text-cyan-300" />
            <span>Open Assistant</span>
          </button>
        </div>
      </div>

      {/* Critical Alert Banner if Fraud Detected */}
      {activeAlerts.length > 0 && (
        <div className="bg-rose-50 border-l-4 border-rose-600 p-4 rounded-xl shadow-xs flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-rose-100 text-rose-600 rounded-lg shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-900">
                Security Alert: {activeAlerts[0].description}
              </h4>
              <p className="text-xs text-rose-700 mt-0.5">
                Risk Score: <strong>{activeAlerts[0].riskScore}/100</strong> • Rule: {activeAlerts[0].ruleTriggered}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('fraud')}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shrink-0 shadow-xs transition-colors cursor-pointer"
          >
            Review & Lock Card
          </button>
        </div>
      )}

      {/* KYC Alert if Due */}
      {isKycDue && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-xl shadow-xs flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-lg shrink-0 mt-0.5">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">
                Action Required: Periodic KYC Re-verification Due
              </h4>
              <p className="text-xs text-amber-700 mt-0.5">
                Under RBI directions, please update your business address proof & video identification.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('kyc')}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shrink-0 shadow-xs transition-colors cursor-pointer"
          >
            Complete KYC
          </button>
        </div>
      )}

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Consolidated Balance */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Total Balance</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            ₹{formatINR(totalBalance)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>{accounts.length} linked account(s)</span>
            <button
              onClick={() => onNavigate('accounts')}
              className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
            >
              Details →
            </button>
          </div>
        </div>

        {/* Card 2: Active Loans & EMI */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Monthly Loan EMI</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Calculator className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            ₹{formatINR(loans.monthlyEmiTotal)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>{loans.items.length} active loan(s)</span>
            <button
              onClick={() => onNavigate('loans')}
              className="text-emerald-600 hover:text-emerald-700 font-semibold cursor-pointer"
            >
              Calculator →
            </button>
          </div>
        </div>

        {/* Card 3: CIBIL Score & Underwriting */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>CIBIL Credit Score</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-baseline gap-2">
            {customer.creditScore}
            <span className="text-xs font-bold text-emerald-600">Prime Tier</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Simulated Bureau Feed</span>
            <span className="text-slate-400 font-mono">PAN: {customer.panMasked}</span>
          </div>
        </div>

        {/* Card 4: Compliance & Risk Rating */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>KYC & Risk Status</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-bold text-slate-900 capitalize flex items-center gap-1.5 mt-1">
            {kyc?.status === 'verified' ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Fully Verified</span>
              </>
            ) : (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-amber-700">Re-verification Due</span>
              </>
            )}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Risk Tier: {customer.riskRating.toUpperCase()}</span>
            <button
              onClick={() => onNavigate('kyc')}
              className="text-purple-600 hover:text-purple-700 font-semibold cursor-pointer"
            >
              Status →
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Accounts & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Accounts & AI Fast Prompts (1 col) */}
        <div className="space-y-6">
          {/* Linked Accounts */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-sm">Linked Accounts</h3>
              <button
                onClick={() => onNavigate('accounts')}
                className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer"
              >
                View all
              </button>
            </div>

            <div className="space-y-3">
              {accounts.map(acc => (
                <div
                  key={acc.id}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-slate-500" />
                      <span className="font-semibold text-xs text-slate-800 capitalize">
                        {acc.accountType} Account
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        acc.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {acc.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-xs font-mono text-slate-500">{acc.maskedAccountNumber}</span>
                    <span className="text-sm font-extrabold text-slate-900">
                      ₹{formatINR(acc.balance)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Suggested Assistant Prompts */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50/60 rounded-2xl p-5 border border-blue-200/60 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-blue-950 text-sm">Ask Banking Assistant</h3>
            </div>
            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              Supervisor orchestrates specialized agents and authorized tools in real time.
            </p>
            <div className="space-y-2">
              {[
                { label: 'Check account balance & last 5 txns', prompt: 'What is my account balance, and show my last five transactions?' },
                { label: 'Scan transactions for fraud', prompt: 'Check my recent transactions for suspicious activity.' },
                { label: 'Check loan eligibility for ₹5,00,000', prompt: 'Am I eligible for a loan of ₹5,00,000?' },
                { label: 'Calculate loan EMI (₹3L @ 10.5%)', prompt: 'Calculate the EMI for ₹3,00,000 at 10.5% annual interest for 36 months.' },
              ].map(p => (
                <button
                  key={p.label}
                  onClick={() => onNavigate('assistant', p.prompt)}
                  className="w-full text-left p-2.5 rounded-xl bg-white border border-blue-200/70 hover:border-blue-400 text-xs font-medium text-slate-800 hover:text-blue-600 transition-all shadow-2xs flex items-center justify-between cursor-pointer group"
                >
                  <span>{p.label}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Recent Transactions & Agent Activity (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Transactions Table */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Recent Activity</h3>
                <p className="text-xs text-slate-500">Real-time ledger events and simulated switch telemetry</p>
              </div>
              <button
                onClick={() => onNavigate('accounts')}
                className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer"
              >
                All Transactions →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px]">
                    <th className="pb-2.5">Description</th>
                    <th className="pb-2.5">Category</th>
                    <th className="pb-2.5">Date</th>
                    <th className="pb-2.5">Channel</th>
                    <th className="pb-2.5 text-right">Amount</th>
                    <th className="pb-2.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentTransactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 font-medium text-slate-800 pr-2">
                        {tx.description}
                      </td>
                      <td className="py-3 text-slate-500">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                          {tx.category}
                        </span>
                      </td>
                      <td className="py-3 text-slate-400 font-mono text-[11px]">
                        {new Date(tx.timestamp).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-slate-600 font-mono text-[10px]">
                        {tx.channel}
                      </td>
                      <td className="py-3 text-right font-bold pr-2">
                        <span className={tx.type === 'credit' ? 'text-emerald-600' : 'text-slate-900'}>
                          {tx.type === 'credit' ? '+' : '-'}₹{formatINR(tx.amount)}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        {tx.status === 'completed' && (
                          <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-semibold border border-emerald-200">
                            Completed
                          </span>
                        )}
                        {tx.status === 'flagged' && (
                          <span className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded text-[10px] font-semibold border border-rose-200 animate-pulse">
                            ⚠️ Flagged
                          </span>
                        )}
                        {tx.status === 'failed' && (
                          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-semibold">
                            Failed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Multi-Agent Execution Telemetry Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">Supervisor Orchestration Feed</h3>
              </div>
              <button
                onClick={() => onNavigate('monitor')}
                className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer"
              >
                Telemetry Monitor →
              </button>
            </div>

            {recentTraces.length === 0 ? (
              <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-500">
                No recent agent executions. Try asking the AI Assistant a question above!
              </div>
            ) : (
              <div className="space-y-2">
                {recentTraces.map(tr => (
                  <div
                    key={tr.requestId}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-800 line-clamp-1">
                        "{tr.userPrompt}"
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500">
                        <span className="font-mono bg-slate-200 px-1 rounded">{tr.classifiedIntent}</span>
                        <span>•</span>
                        <span>{tr.selectedAgents.length} agents engaged</span>
                        <span>•</span>
                        <span>{tr.toolCalls.length} tool calls</span>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500 shrink-0 ml-2">
                      {tr.durationMs}ms
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
