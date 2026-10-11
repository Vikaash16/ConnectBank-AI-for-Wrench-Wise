/**
 * ConnectBank AI - System Status, 9-Layer Architecture & Settings
 */

import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient.ts';
import { toolRegistry } from '../tools/registry.ts';
import { UserCredential } from '../types/banking.ts';
import {
  Settings,
  Layers,
  Cpu,
  Shield,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  RefreshCw,
  Terminal,
  BookOpen,
  Sparkles,
  KeyRound,
  UserPlus,
  Database,
  UserCheck,
} from 'lucide-react';

interface SystemStatusSettingsProps {
  onDatabaseReset: () => void;
  onOpenCreateUser?: () => void;
  onSwitchCustomer?: (customerId: string) => void;
}

export const SystemStatusSettings: React.FC<SystemStatusSettingsProps> = ({
  onDatabaseReset,
  onOpenCreateUser,
  onSwitchCustomer,
}) => {
  const [status, setStatus] = useState<any>(null);
  const [users, setUsers] = useState<UserCredential[]>([]);
  const [isResetting, setIsResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [activeLayer, setActiveLayer] = useState<number>(4);

  useEffect(() => {
    loadStatus();
    loadUsers();
  }, []);

  const loadStatus = async () => {
    const data = await apiClient.getSystemStatus();
    setStatus(data);
  };

  const loadUsers = async () => {
    const list = await apiClient.getUsers();
    setUsers(list);
  };

  const handleResetData = async () => {
    if (!window.confirm('Reset database to clean baseline seed data? This will restore original accounts, transactions, and alerts.')) {
      return;
    }
    setIsResetting(true);
    await apiClient.resetDatabase();
    await loadStatus();
    setIsResetting(false);
    setResetDone(true);
    onDatabaseReset();
    setTimeout(() => setResetDone(false), 4000);
  };

  const layers = [
    {
      num: 1,
      title: 'Banking Channels / Users',
      desc: 'Web Banking, Mobile App simulator, Call Center / RM Portal, Persona Authenticator.',
      tech: 'React SPA, Vite, TypeScript, Customer Switcher with Tenant Isolation.',
    },
    {
      num: 2,
      title: 'API & Experience Layer',
      desc: 'Request validation (Zod), Correlation IDs, Session Management, Safe Error Handling.',
      tech: 'Express Node.js, REST API, Typed Service Client with seamless fallback.',
    },
    {
      num: 3,
      title: 'AI Gateway & Control Plane',
      desc: 'Gemini 3.8 Flash model routing, PII Masking, Prompt Injection defense, Token budgeting.',
      tech: '@google/genai SDK, Regex PII maskers, Deterministic Fallback Engine.',
    },
    {
      num: 4,
      title: 'Multi-Agent Orchestrator',
      desc: 'Supervisor Agent with sub-task decomposition, intent classification, and 5 specialized agents.',
      tech: 'SupervisorAgent, CustomerAgent, RiskFraudAgent, CreditAgent, ComplianceAgent, NotificationAgent.',
    },
    {
      num: 5,
      title: 'Agent Tool / MCP Layer',
      desc: '13 MCP-style tools with Zod input schema validation, role authorization, and audit logs.',
      tech: 'ToolRegistry with strict role-based execution boundaries.',
    },
    {
      num: 6,
      title: 'Enterprise Data Layer',
      desc: 'Simulated Core Banking, Accounts, Transactions, Loans, KYC records, and Audit Logs.',
      tech: 'In-Memory Atomic Repository with customer ownership verification on all accesses.',
    },
    {
      num: 7,
      title: 'Knowledge / RAG Layer',
      desc: 'RBI Master Directions (KYC, Limiting Customer Liability in Fraud, Loan Underwriting).',
      tech: 'Local Policy Knowledge Base with BM25 token matching and excerpt ranker.',
    },
    {
      num: 8,
      title: 'External Services Simulators',
      desc: 'CIBIL Credit Bureau, UIDAI KYC & AML Watchlist, NPCI UPI 2.0 Switch, SMS Gateway.',
      tech: 'Realistic mock service adapters with simulated latency and telemetry.',
    },
    {
      num: 9,
      title: 'Platform Observability & Governance',
      desc: 'Real-time execution traces, step timelines, tool input/outputs, latency metrics, and audit trail.',
      tech: 'AgentExecutionTrace schema, ExecutionTraceViewer, Human-in-the-Loop Confirmation.',
    },
  ];

  const tools = toolRegistry.getAllTools();

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            System Status & Architecture Governance
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Real-time infrastructure health, 9-layer banking architecture breakdown, and demo controls.
          </p>
        </div>

        <button
          onClick={handleResetData}
          disabled={isResetting}
          className="flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
        >
          <RotateCw className={`w-4 h-4 ${isResetting ? 'animate-spin' : ''}`} />
          <span>Reset Demo Seed Data</span>
        </button>
      </div>

      {resetDone && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>All database records successfully restored to reproducible seed state!</span>
        </div>
      )}

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* AI Gateway */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              AI Gateway Status
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                status?.gateway?.isConfigured
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {status?.gateway?.isConfigured ? 'LIVE GEMINI' : 'DETERMINISTIC ACTIVE'}
            </span>
          </div>
          <div className="text-lg font-bold text-slate-900">
            {status?.gateway?.isConfigured ? 'Gemini 3.8 Flash' : 'Deterministic AI Engine'}
          </div>
          <p className="text-xs text-slate-500">
            {status?.gateway?.isConfigured
              ? 'Connected via @google/genai SDK with server-side proxying.'
              : '100% offline-ready deterministic multi-agent routing with zero external API dependencies.'}
          </p>
        </div>

        {/* Payment Networks */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Payment Switch Telemetry
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              OPERATIONAL
            </span>
          </div>
          <div className="text-lg font-bold text-slate-900">NPCI UPI 2.0 & NEFT</div>
          <p className="text-xs text-slate-500">
            Average switch latency: <strong>142ms</strong> • Success rate: <strong>99.82%</strong>
          </p>
        </div>

        {/* Database & Tools */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Tool Registry & Schemas
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
              {tools.length} TOOLS
            </span>
          </div>
          <div className="text-lg font-bold text-slate-900">MCP-Style Registry</div>
          <p className="text-xs text-slate-500">
            Zod runtime validation, tenant isolation, and role authorization active.
          </p>
        </div>
      </div>

      {/* 9-Layer Architecture Interactive Explorer */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-base">
              ConnectBank AI — 9-Layer Architecture Implementation Map
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Reference Spec Alignment</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {layers.map(l => (
            <button
              key={l.num}
              onClick={() => setActiveLayer(l.num)}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                activeLayer === l.num
                  ? 'bg-blue-50/90 border-blue-400 shadow-xs'
                  : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-mono">
                  Layer {l.num}
                </span>
                {activeLayer === l.num && (
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                )}
              </div>
              <div className="font-bold text-xs text-slate-900">{l.title}</div>
              <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">{l.desc}</p>
            </button>
          ))}
        </div>

        {/* Active Layer Details */}
        {layers.find(l => l.num === activeLayer) && (
          <div className="p-4 bg-slate-900 text-slate-200 rounded-xl text-xs space-y-2 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="font-bold text-cyan-400 text-sm">
                Layer {activeLayer}: {layers[activeLayer - 1].title}
              </span>
              <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-mono">
                Production Ready Subset
              </span>
            </div>
            <p className="text-slate-300">{layers[activeLayer - 1].desc}</p>
            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
              <span className="text-cyan-300 font-semibold">Implementation Stack: </span>
              {layers[activeLayer - 1].tech}
            </div>
          </div>
        )}
      </div>

      {/* Registered Banking Tools Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <h3 className="font-bold text-slate-900 text-sm">Registered MCP-Style Tools ({tools.length})</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                <th className="py-2.5 px-3">Tool Name</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3">Authorized Agent Roles</th>
                <th className="py-2.5 px-3 text-center">Validation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tools.map(t => (
                <tr key={t.name} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 font-mono font-semibold text-blue-600">
                    {t.name}()
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 max-w-xs">{t.description}</td>
                  <td className="py-2.5 px-3">
                    <div className="flex flex-wrap gap-1">
                      {t.authorizedRoles.map(r => (
                        <span
                          key={r}
                          className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-mono"
                        >
                          {r.replace('_agent', '')}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="text-emerald-600 font-bold text-[10px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Zod Schema
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Database Users & Stored Credentials */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-blue-600" />
              <span>Database Users & Stored Credentials ({users.length})</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Fetched from persistent database. Each user credential record authenticates a customer session.
            </p>
          </div>
          {onOpenCreateUser && (
            <button
              onClick={onOpenCreateUser}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Create User & Credentials</span>
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                <th className="py-2.5 px-3">User ID</th>
                <th className="py-2.5 px-3">Username</th>
                <th className="py-2.5 px-3">Password Credential</th>
                <th className="py-2.5 px-3">Linked Customer</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-600">
                    {u.id}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-blue-600">
                    {u.username}
                  </td>
                  <td className="py-2.5 px-3 font-mono">
                    <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                      {u.passwordPlainForDemo || '********'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-700">
                    {u.customerId}
                  </td>
                  <td className="py-2.5 px-3 capitalize text-slate-600">
                    {u.role}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                      ACTIVE
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {onSwitchCustomer && (
                      <button
                        onClick={() => onSwitchCustomer(u.customerId)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
                      >
                        Switch Session →
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
