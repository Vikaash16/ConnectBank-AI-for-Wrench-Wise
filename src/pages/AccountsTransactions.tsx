/**
 * ConnectBank AI - Accounts & Transactions Management
 */

import React, { useState, useEffect } from 'react';
import { Customer, Account, Transaction } from '../types/banking.ts';
import { apiClient } from '../services/apiClient.ts';
import {
  CreditCard,
  Search,
  Filter,
  Download,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  Layers,
  CheckCircle2,
  Clock,
  MapPin,
  Smartphone,
  Globe,
} from 'lucide-react';

interface AccountsTransactionsProps {
  customer: Customer;
}

export const AccountsTransactions: React.FC<AccountsTransactionsProps> = ({ customer }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [customer.id]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [accs, txns] = await Promise.all([
        apiClient.getAccounts(customer.id),
        apiClient.getTransactions(customer.id, { limit: 50 }),
      ]);
      setAccounts(accs);
      setTransactions(txns);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTxns = transactions.filter(t => {
    if (categoryFilter !== 'all' && t.category.toLowerCase() !== categoryFilter.toLowerCase()) {
      return false;
    }
    if (statusFilter !== 'all' && t.status !== statusFilter) {
      return false;
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        t.description.toLowerCase().includes(q) ||
        (t.counterparty && t.counterparty.toLowerCase().includes(q)) ||
        t.referenceNumber.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const formatINR = (val: number) => {
    return val.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Accounts & Transactions
        </h1>
        <p className="text-xs md:text-sm text-slate-500 mt-1">
          Explore linked bank accounts, transaction history, and switch-level metadata for {customer.name}.
        </p>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {accounts.map(acc => (
          <div
            key={acc.id}
            className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs relative overflow-hidden group hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-blue-600" />
                {acc.accountType.replace('_', ' ')}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  acc.status === 'active'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {acc.status.toUpperCase()}
              </span>
            </div>

            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              ₹{formatINR(acc.balance)}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 space-y-1.5 text-xs text-slate-500">
              <div className="flex justify-between">
                <span>Account Number:</span>
                <span className="font-mono font-semibold text-slate-700">
                  {acc.maskedAccountNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span>IFSC Code:</span>
                <span className="font-mono text-slate-700">{acc.ifsc}</span>
              </div>
              <div className="flex justify-between">
                <span>Interest Rate:</span>
                <span className="font-semibold text-slate-700">{acc.interestRate}% p.a.</span>
              </div>
              <div className="flex justify-between">
                <span>Branch:</span>
                <span className="text-slate-700 truncate max-w-[170px]" title={acc.branchName}>
                  {acc.branchName}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Transaction Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search description, reference, or merchant..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-hidden focus:border-blue-600 focus:bg-white transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 font-medium cursor-pointer"
          >
            <option value="all">All Categories</option>
            <option value="Salary">Salary</option>
            <option value="Shopping">Shopping</option>
            <option value="Dining">Dining</option>
            <option value="Utilities">Utilities</option>
            <option value="EMI">EMI</option>
            <option value="Transfer">Transfer</option>
            <option value="Electronics">Electronics</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 font-medium cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="flagged">Flagged (Risk)</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Transaction / Merchant</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">Reference No.</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-right">Status</th>
                <th className="py-3 px-4 text-center">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTxns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No transactions match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredTxns.map(tx => (
                  <tr
                    key={tx.id}
                    onClick={() => setSelectedTxn(tx)}
                    className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{tx.description}</div>
                      {tx.counterparty && (
                        <div className="text-[11px] text-slate-400">{tx.counterparty}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-medium">
                        {tx.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {new Date(tx.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-semibold">
                        {tx.channel}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                      {tx.referenceNumber}
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-sm">
                      <span className={tx.type === 'credit' ? 'text-emerald-600' : 'text-slate-900'}>
                        {tx.type === 'credit' ? '+' : '-'}₹{formatINR(tx.amount)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {tx.status === 'completed' && (
                        <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-[10px] font-semibold border border-emerald-200">
                          Completed
                        </span>
                      )}
                      {tx.status === 'flagged' && (
                        <span className="bg-rose-50 text-rose-700 px-2.5 py-1 rounded-full text-[10px] font-semibold border border-rose-200 animate-pulse">
                          ⚠️ Flagged
                        </span>
                      )}
                      {tx.status === 'failed' && (
                        <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full text-[10px] font-semibold">
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button className="text-blue-600 hover:text-blue-800 font-semibold text-[11px]">
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Details Modal */}
      {selectedTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <div className="p-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-slate-900 text-base">Transaction Details</h3>
                </div>
                <button
                  onClick={() => setSelectedTxn(null)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Description</div>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">{selectedTxn.description}</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Amount</div>
                    <div className="font-extrabold text-slate-900 text-base mt-0.5">
                      {selectedTxn.type === 'credit' ? '+' : '-'}₹{formatINR(selectedTxn.amount)}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Status</div>
                    <div className="font-bold mt-0.5 capitalize">
                      {selectedTxn.status}
                    </div>
                  </div>
                </div>

                {selectedTxn.metadata && (
                  <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                    <div className="font-bold text-blue-950 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-blue-600" />
                      <span>Security & Device Telemetry</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-slate-700">
                      <div>Location: <strong>{selectedTxn.metadata.location || 'N/A'}</strong></div>
                      <div>IP: <strong className="font-mono">{selectedTxn.metadata.ipAddress || 'N/A'}</strong></div>
                      <div>Device: <strong>{selectedTxn.metadata.deviceId || 'N/A'}</strong></div>
                      <div>Foreign: <strong>{selectedTxn.metadata.isForeign ? 'YES (Overseas)' : 'NO'}</strong></div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedTxn(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
