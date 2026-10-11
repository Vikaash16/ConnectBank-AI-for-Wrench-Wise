/**
 * ConnectBank AI - Observable Agent Execution Trace Viewer
 * Visualizes multi-agent orchestration steps, tool calls, RAG citations, and latency telemetry.
 */

import React, { useState } from 'react';
import { AgentExecutionTrace, ToolCall, ToolResult } from '../types/banking.ts';
import {
  Activity,
  Bot,
  Wrench,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  Layers,
  Sparkles,
  Terminal,
} from 'lucide-react';

interface ExecutionTraceViewerProps {
  trace: AgentExecutionTrace;
  initiallyExpanded?: boolean;
}

export const ExecutionTraceViewer: React.FC<ExecutionTraceViewerProps> = ({
  trace,
  initiallyExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);
  const [activeTab, setActiveTab] = useState<'timeline' | 'tools' | 'rag' | 'json'>('timeline');
  const [expandedToolIndex, setExpandedToolIndex] = useState<number | null>(null);

  const getAgentBadgeColor = (role: string) => {
    switch (role) {
      case 'supervisor':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'customer_agent':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'risk_fraud_agent':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'credit_loan_agent':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'compliance_agent':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'notification_agent':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="mt-3 bg-slate-900 text-slate-200 rounded-xl border border-slate-800 overflow-hidden shadow-md text-xs">
      {/* Header bar */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-4 py-2.5 bg-slate-950/80 hover:bg-slate-950 flex items-center justify-between cursor-pointer transition-colors border-b border-slate-800/80 select-none"
      >
        <div className="flex items-center gap-2.5">
          <Activity className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-slate-200">Multi-Agent Execution Trace</span>
          <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px] font-mono text-cyan-300">
            {trace.classifiedIntent}
          </span>
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-500" />
            {trace.durationMs}ms
          </span>
        </div>

        <div className="flex items-center gap-2">
          {trace.selectedAgents.map(ag => (
            <span
              key={ag}
              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${getAgentBadgeColor(ag)}`}
            >
              {ag.replace('_agent', '').replace('_', ' ').toUpperCase()}
            </span>
          ))}
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400 ml-1" />
          )}
        </div>
      </div>

      {/* Expanded Body */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Subtabs */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'timeline'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Workflow Steps ({trace.steps.length})
            </button>
            <button
              onClick={() => setActiveTab('tools')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'tools'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Tool Calls ({trace.toolCalls.length})
            </button>
            {trace.policyCitations && trace.policyCitations.length > 0 && (
              <button
                onClick={() => setActiveTab('rag')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  activeTab === 'rag'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                RAG Policies ({trace.policyCitations.length})
              </button>
            )}
            <button
              onClick={() => setActiveTab('json')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'json'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Raw Trace
            </button>
          </div>

          {/* TAB 1: Timeline Steps */}
          {activeTab === 'timeline' && (
            <div className="space-y-3">
              {trace.steps.map((step, idx) => (
                <div
                  key={step.stepId}
                  className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 flex items-start gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center font-mono text-[11px] text-cyan-400 font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-100 flex items-center gap-1.5">
                        <Bot className="w-3.5 h-3.5 text-blue-400" />
                        {step.assignedAgent.replace('_agent', '').toUpperCase()} AGENT
                      </span>
                      {step.durationMs !== undefined && (
                        <span className="text-[11px] text-slate-500 font-mono">
                          {step.durationMs}ms
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 text-[11px] mt-0.5">{step.taskDescription}</p>

                    {step.summary && (
                      <div className="mt-2 text-slate-300 text-[11px] bg-slate-900/90 p-2 rounded border border-slate-800">
                        {step.summary}
                      </div>
                    )}

                    {step.toolsUsed.length > 0 && (
                      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-slate-500">Tools:</span>
                        {step.toolsUsed.map(t => (
                          <span
                            key={t}
                            className="bg-slate-800 text-cyan-300 px-1.5 py-0.5 rounded text-[10px] font-mono border border-slate-700"
                          >
                            {t}()
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: Tool Calls */}
          {activeTab === 'tools' && (
            <div className="space-y-2">
              {trace.toolCalls.map((tc, idx) => {
                const tr = trace.toolResults.find(r => r.toolName === tc.toolName) || trace.toolResults[idx];
                const isOpen = expandedToolIndex === idx;

                return (
                  <div
                    key={tc.id}
                    className="bg-slate-950/70 rounded-lg border border-slate-800 overflow-hidden"
                  >
                    <div
                      onClick={() => setExpandedToolIndex(isOpen ? null : idx)}
                      className="p-2.5 flex items-center justify-between hover:bg-slate-800/40 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Wrench className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="font-mono text-cyan-300 font-medium">{tc.toolName}</span>
                        <span className="text-slate-500 text-[10px]">by {tc.callerAgent}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {tr?.status === 'success' ? (
                          <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Success
                          </span>
                        ) : (
                          <span className="text-rose-400 flex items-center gap-1 text-[11px]">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {tr?.status || 'Executed'}
                          </span>
                        )}
                        <span className="text-slate-500 font-mono text-[10px]">
                          {tr?.durationMs}ms
                        </span>
                        {isOpen ? (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {isOpen && (
                      <div className="p-3 bg-slate-900 border-t border-slate-800 space-y-2">
                        <div>
                          <div className="text-[10px] text-slate-400 font-semibold uppercase mb-1">
                            Input Parameters (Zod Validated):
                          </div>
                          <pre className="p-2 bg-slate-950 rounded text-[11px] font-mono text-slate-300 overflow-x-auto border border-slate-800">
                            {JSON.stringify(tc.parameters, null, 2)}
                          </pre>
                        </div>
                        {Boolean(tr?.result) && (
                          <div>
                            <div className="text-[10px] text-slate-400 font-semibold uppercase mb-1">
                              Structured Tool Output:
                            </div>
                            <pre className="p-2 bg-slate-950 rounded text-[11px] font-mono text-emerald-300 overflow-x-auto border border-slate-800 max-h-40">
                              {JSON.stringify(tr.result, null, 2)}
                            </pre>
                          </div>
                        )}
                        {tr?.error && (
                          <div className="p-2 bg-rose-950/50 text-rose-300 rounded border border-rose-800 text-[11px]">
                            {tr.error}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: RAG Policy Citations */}
          {activeTab === 'rag' && trace.policyCitations && (
            <div className="space-y-2">
              {trace.policyCitations.map(cit => (
                <div
                  key={cit.docId}
                  className="p-3 bg-slate-950/70 rounded-lg border border-slate-800 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                      {cit.title}
                    </span>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                      Score: {cit.relevanceScore}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Doc ID: {cit.docId} | Category: {cit.category}
                  </div>
                  <p className="text-slate-300 text-[11px] bg-slate-900 p-2 rounded border border-slate-850 italic">
                    "{cit.excerpt}"
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: Raw JSON */}
          {activeTab === 'json' && (
            <pre className="p-3 bg-slate-950 rounded-lg text-[10px] font-mono text-slate-300 overflow-x-auto max-h-60 border border-slate-800">
              {JSON.stringify(trace, null, 2)}
            </pre>
          )}

          {/* Telemetry Footer */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Req: {trace.requestId}</span>
            <span>Model: {trace.modelUsed}</span>
            <span>Status: {trace.executionStatus.toUpperCase()}</span>
          </div>
        </div>
      )}
    </div>
  );
};
