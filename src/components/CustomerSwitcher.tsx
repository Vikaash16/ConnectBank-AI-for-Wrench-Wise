/**
 * ConnectBank AI - Persona Switcher (Simulated Authentication)
 */

import React, { useState } from 'react';
import { Customer } from '../types/banking.ts';
import { UserCheck, ChevronDown, Check, User, ShieldAlert, Award } from 'lucide-react';

interface CustomerSwitcherProps {
  customers: Customer[];
  selectedCustomerId: string;
  onSelectCustomer: (customerId: string) => void;
  onOpenCreateUser: () => void;
  onOpenLogin: () => void;
}

export const CustomerSwitcher: React.FC<CustomerSwitcherProps> = ({
  customers,
  selectedCustomerId,
  onSelectCustomer,
  onOpenCreateUser,
  onOpenLogin,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const current = customers.find(c => c.id === selectedCustomerId) || customers[0];

  if (!current) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all text-left shadow-xs cursor-pointer"
      >
        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
          {current.name.split(' ').map(n => n[0]).join('')}
        </div>
        <div className="hidden sm:block">
          <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
            {current.name}
            <span className="text-[10px] bg-slate-100 text-slate-600 px-1 rounded font-mono">
              {current.id}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 truncate max-w-[140px]">
            {current.occupation}
          </div>
        </div>
        <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="p-2 border-b border-slate-100 mb-1">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Switch Simulated Customer
              </div>
              <div className="text-[11px] text-slate-500">
                Demonstrates multi-tenant isolation, distinct accounts & risk profiles.
              </div>
            </div>

            <div className="space-y-1">
              {customers.map(c => {
                const isSelected = c.id === selectedCustomerId;
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      onSelectCustomer(c.id);
                      setIsOpen(false);
                    }}
                    className={`w-full p-2.5 rounded-lg text-left transition-all flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/80 border border-blue-200 text-blue-900'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full font-bold flex items-center justify-center text-xs shrink-0 ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {c.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 truncate">{c.name}</span>
                        {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">{c.occupation}</div>
                      <div className="mt-1 flex items-center gap-2 text-[10px]">
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-mono">
                          {c.id}
                        </span>
                        <span className="text-emerald-700 font-medium">
                          CIBIL: {c.creditScore}
                        </span>
                        {c.id === 'CUST-1001' && (
                          <span className="bg-amber-100 text-amber-800 px-1 rounded font-semibold">
                            ⚠️ 1 Suspicious Txn
                          </span>
                        )}
                        {c.id === 'CUST-1002' && (
                          <span className="bg-purple-100 text-purple-800 px-1 rounded font-semibold">
                            KYC Due
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 mt-2 border-t border-slate-100 space-y-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenCreateUser();
                }}
                className="w-full py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>+ Create User & Credentials</span>
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenLogin();
                }}
                className="w-full py-1.5 px-3 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>🔑 Sign In with Credentials</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
