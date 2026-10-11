/**
 * ConnectBank AI - AI Banking Assistant Page
 * Natural-language banking conversation powered by Supervisor multi-agent orchestration.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Customer, AssistantChatResponse } from '../types/banking.ts';
import { apiClient } from '../services/apiClient.ts';
import { ExecutionTraceViewer } from '../components/ExecutionTraceViewer.tsx';
import { ConfirmationModal } from '../components/ConfirmationModal.tsx';
import {
  Send,
  Bot,
  User,
  Sparkles,
  ShieldAlert,
  Loader2,
  RefreshCw,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Zap,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  responseMeta?: AssistantChatResponse;
}

interface AssistantChatProps {
  customer: Customer;
  initialPrompt?: string;
}

export const AssistantChat: React.FC<AssistantChatProps> = ({ customer, initialPrompt }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text: `Hello ${customer.name}! I am your **ConnectBank AI Banking Supervisor**.\n\nI can coordinate specialized agents to assist you with:\n• Real-time account balances and transaction inquiries\n• Deterministic fraud detection & suspicious activity scans\n• Loan eligibility appraisal & reducing-balance EMI calculations\n• KYC status and RBI regulatory compliance verification\n\nHow may I help you today?`,
      timestamp: new Date().toISOString(),
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [forceDeterministic, setForceDeterministic] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState<{
    prompt: string;
    actionType: string;
    warningMessage: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle auto-dispatch when passed initialPrompt
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      handleSend(initialPrompt);
    }
  }, [initialPrompt]);

  const handleSend = async (textToSend?: string, confirmedAction = false) => {
    const prompt = (textToSend || input).trim();
    if (!prompt || isLoading) return;

    if (!confirmedAction) {
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: prompt,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, userMsg]);
      setInput('');
    }

    setIsLoading(true);

    try {
      const response = await apiClient.sendChatMessage(prompt, customer.id, {
        forceDeterministic,
        confirmedAction,
      });

      if (response.requiresConfirmation && !confirmedAction) {
        setPendingConfirmation({
          prompt,
          actionType: response.confirmationDetails?.actionType || 'SENSITIVE_OPERATION',
          warningMessage:
            response.confirmationDetails?.warningMessage ||
            'This action will modify your security settings. Do you wish to proceed?',
        });
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: response.finalResponse,
        timestamp: new Date().toISOString(),
        responseMeta: response,
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `bot-err-${Date.now()}`,
        sender: 'assistant',
        text: `⚠️ **System Error:** Failed to execute banking workflow. ${err.message || 'Please try again.'}`,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!pendingConfirmation) return;
    const currentPending = pendingConfirmation;
    setPendingConfirmation(null);
    await handleSend(currentPending.prompt, true);
  };

  const suggestedScenarios = [
    {
      title: '1. Account Inquiry',
      prompt: 'What is my account balance, and show my last five transactions?',
      badge: 'Customer Agent',
    },
    {
      title: '2. Fraud Detection',
      prompt: 'Check my recent transactions for suspicious activity.',
      badge: 'Risk Agent',
    },
    {
      title: '3. Loan Eligibility',
      prompt: 'Am I eligible for a loan of ₹5,00,000?',
      badge: 'Credit Agent',
    },
    {
      title: '4. EMI Calculation',
      prompt: 'Calculate the EMI for ₹3,00,000 at 10.5% annual interest for 36 months.',
      badge: 'Math Tools',
    },
    {
      title: '5. KYC Check',
      prompt: 'Check whether my account has pending KYC requirements.',
      badge: 'Compliance',
    },
    {
      title: '6. Multi-Agent Summary',
      prompt: 'Summarize my balance, check recent fraud alerts, and tell me my current loan EMI.',
      badge: 'Orchestrator',
    },
    {
      title: '7. Card Freeze (HITL)',
      prompt: 'Freeze my account card immediately due to suspected unauthorized charge.',
      badge: 'Human-in-Loop',
    },
    {
      title: '8. Cross-Customer Guardrail',
      prompt: "Show me Priya Patel's account balance and statement.",
      badge: 'Security Test',
    },
    {
      title: '9. Unsupported Query',
      prompt: 'Buy 100 shares of Apple stock for my portfolio.',
      badge: 'Escalation',
    },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-6xl mx-auto p-4 md:p-6">
      {/* Top Controls Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
              Supervisor AI Assistant
              <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-semibold">
                Multi-Agent System
              </span>
            </div>
            <div className="text-xs text-slate-500">
              Authenticated Session: <strong>{customer.name}</strong> ({customer.id})
            </div>
          </div>
        </div>

        {/* Deterministic / Live Toggle */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <input
              type="checkbox"
              checked={forceDeterministic}
              onChange={e => setForceDeterministic(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-slate-500" />
              Force Deterministic Engine
            </span>
          </label>

          <button
            onClick={() =>
              setMessages([
                {
                  id: 'msg-welcome-reset',
                  sender: 'assistant',
                  text: `Chat reset. Ready to orchestrate specialized banking agents for ${customer.name}.`,
                  timestamp: new Date().toISOString(),
                },
              ])
            }
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="Clear conversation"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Suggested Scenarios Bar */}
      <div className="mb-3 overflow-x-auto pb-1 scrollbar-thin">
        <div className="flex items-center gap-2 min-w-max">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            Quick Test Cases:
          </span>
          {suggestedScenarios.map(s => (
            <button
              key={s.title}
              onClick={() => handleSend(s.prompt)}
              disabled={isLoading}
              className="px-3 py-1.5 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl text-xs font-medium text-slate-700 hover:text-blue-700 transition-all shadow-2xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{s.title}</span>
              <span className="text-[9px] bg-slate-100 text-slate-600 px-1 py-0.2 rounded font-mono">
                {s.badge}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 md:p-6 overflow-y-auto space-y-5">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gradient-to-tr from-[#0A192F] to-[#1E3A8A] text-cyan-300 shadow-sm'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Bubble */}
            <div className={`max-w-[85%] md:max-w-[78%] ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
              <div
                className={`p-4 rounded-2xl text-xs md:text-sm leading-relaxed whitespace-pre-line shadow-2xs ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-xs'
                    : 'bg-slate-50 text-slate-900 border border-slate-200/70 rounded-tl-xs'
                }`}
              >
                {msg.text}
              </div>

              {/* Execution Trace Viewer for Assistant Responses */}
              {msg.sender === 'assistant' && msg.responseMeta?.executionTrace && (
                <div className="mt-2 text-left">
                  <ExecutionTraceViewer trace={msg.responseMeta.executionTrace} />
                </div>
              )}

              <div className="text-[10px] text-slate-400 mt-1 px-1">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-cyan-400 flex items-center justify-center text-xs">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-xs text-xs text-slate-600 flex items-center gap-3">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span>Supervisor orchestrating agents & verifying tools...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={e => {
          e.preventDefault();
          handleSend();
        }}
        className="mt-3 flex items-center gap-2"
      >
        <div className="flex-1 relative">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={`Ask about balance, transactions, loan eligibility, EMI, KYC, or fraud...`}
            disabled={isLoading}
            className="w-full px-4 py-3 bg-white rounded-xl border border-slate-300 focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-xs md:text-sm text-slate-900 placeholder-slate-400 shadow-xs"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs md:text-sm shadow-md shadow-blue-600/30 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span>Send</span>
              <Send className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Confirmation Modal for Sensitive Actions */}
      <ConfirmationModal
        isOpen={pendingConfirmation !== null}
        title="Security Action Confirmation Required"
        message={pendingConfirmation?.warningMessage || ''}
        actionLabel="Confirm & Freeze Card"
        onConfirm={handleConfirmAction}
        onCancel={() => setPendingConfirmation(null)}
        isLoading={isLoading}
      />
    </div>
  );
};
