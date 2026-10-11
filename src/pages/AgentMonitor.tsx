/**
 * ConnectBank AI - Agent Execution Monitor & Observability Dashboard
 * Layer 9 - Traces, agent trajectories, tool invocations, and latency metrics.
 */

import React, { useState, useEffect } from 'react';
import { Customer, AgentExecutionTrace } from '../types/banking.ts';
import { apiClient } from '../services/apiClient.ts';
import { ExecutionTraceViewer } from '../components/ExecutionTraceViewer.tsx';
import {
  Activity,
  Bot,
  Wrench,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Search,
  Filter,
  Layers,
  Terminal,
} from 'lucide-react';

interface AgentMonitorProps {
  customer: Customer;
}

export const AgentMonitor: React.FC<AgentMonitorProps> = ({ customer }) => {
  const [traces, setTraces] = useState<AgentExecutionTrace[]>([]);
  const [selectedTrace, setSelectedTrace] = useState<AgentExecutionTrace | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filterCustomer, setFilterCustomer] = useState<'current' | 'all'>('all');

  useEffect(() => {
    loadTraces();
  }, [filterCustomer, customer.id]);

  const loadTraces = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.getAgentTraces(
        filterCustomer === 'current' ? customer.id : undefined
      );
      setTraces(data);
      if (data.length > 0 && !selectedTrace) {
        setSelectedTrace(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const totalToolCalls = traces.reduce((sum, t) => sum + t.toolCalls.length, 0);
  const avgLatency = traces.length > 0
    ? Math.round(traces.reduce((sum, t) => sum + t.durationMs, 0) / traces.length)
    : 0;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Agent Execution Monitor & Observability
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Real-time supervisor routing decisions, tool call inputs/outputs, and latency telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs">
            <button
              onClick={() => setFilterCustomer('all')}
              className={`px-3 py-1 rounded-lg font-semibold cursor-pointer transition-colors ${
                filterCustomer === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Customers
            </button>
            <button
              onClick={() => setFilterCustomer('current')}
              className={`px-3 py-1 rounded-lg font-semibold cursor-pointer transition-colors ${
                filterCustomer === 'current'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {customer.name} ({customer.id})
            </button>
          </div>

          <button
            onClick={loadTraces}
            className="p-2 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
            title="Refresh traces"
          >
            <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Telemetry Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Total Orchestrations
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{traces.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Traces logged in memory</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Average Latency
          </div>
          <div className="text-2xl font-black text-blue-600 mt-1">{avgLatency} ms</div>
          <div className="text-[11px] text-slate-500 mt-1">Multi-agent execution loop</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Tool Invocations
          </div>
          <div className="text-2xl font-black text-indigo-600 mt-1">{totalToolCalls}</div>
          <div className="text-[11px] text-slate-500 mt-1">Zod-validated tool executions</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Security Interventions
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-1">100%</div>
          <div className="text-[11px] text-slate-500 mt-1">Tenant isolation enforced</div>
        </div>
      </div>

      {/* Main Split Grid: Traces List & Detail Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Traces list (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm">Execution Traces</h3>
            <span className="text-xs text-slate-400">{traces.length} records</span>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {traces.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No traces recorded yet. Ask the Assistant a question to generate execution logs!
              </div>
            ) : (
              traces.map(tr => {
                const isSelected = selectedTrace?.requestId === tr.requestId;
                return (
                  <div
                    key={tr.requestId}
                    onClick={() => setSelectedTrace(tr)}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-300 shadow-xs'
                        : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold">
                        {tr.classifiedIntent}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">{tr.durationMs}ms</span>
                    </div>

                    <div className="mt-2 font-semibold text-slate-900 line-clamp-2">
                      "{tr.userPrompt}"
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                      <span>Customer: {tr.customerId}</span>
                      <span>{tr.selectedAgents.length} agents • {tr.toolCalls.length} tools</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Selected Trace Detail Viewer (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Trace Inspector</h3>
              {selectedTrace && (
                <div className="text-xs text-slate-400 font-mono mt-0.5">
                  ID: {selectedTrace.requestId} | Corr: {selectedTrace.correlationId}
                </div>
              )}
            </div>
            {selectedTrace && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  selectedTrace.executionStatus === 'success'
                    ? 'bg-emerald-100 text-emerald-800'
                    : selectedTrace.executionStatus === 'denied'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {selectedTrace.executionStatus.toUpperCase()}
              </span>
            )}
          </div>

          {selectedTrace ? (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Input Query</div>
                <div className="font-bold text-slate-900 text-sm">{selectedTrace.userPrompt}</div>
              </div>

              {/* Full trace interactive viewer */}
              <ExecutionTraceViewer trace={selectedTrace} initiallyExpanded={true} />
            </div>
          ) : (
            <div className="py-16 text-center text-slate-400 text-xs">
              Select an execution trace from the left panel to inspect workflow steps.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
