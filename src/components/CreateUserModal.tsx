/**
 * ConnectBank AI - Create User & Credentials Modal
 * Allows creating a new customer persona with login credentials stored in the database.
 */

import React, { useState } from 'react';
import { CreateUserInput, AccountType } from '../types/banking.ts';
import { apiClient } from '../services/apiClient.ts';
import {
  UserPlus,
  X,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  User,
  Mail,
  Phone,
  Briefcase,
  IndianRupee,
  Building,
  ShieldCheck,
  Eye,
  EyeOff,
  Database,
} from 'lucide-react';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: (newCustomerId: string) => void;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onUserCreated,
}) => {
  const [formData, setFormData] = useState<CreateUserInput>({
    name: '',
    username: '',
    password: '',
    email: '',
    phone: '+91 98',
    occupation: 'Software Engineer',
    monthlyIncome: 95000,
    initialDeposit: 25000,
    accountType: 'savings',
    city: 'Pune, Maharashtra',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdResult, setCreatedResult] = useState<any>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Full Name is required.');
      return;
    }
    if (!formData.username.trim()) {
      setError('Username / Login ID is required.');
      return;
    }
    if (!formData.password || formData.password.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient.createUser({
        ...formData,
        username: formData.username.trim().toLowerCase(),
        monthlyIncome: Number(formData.monthlyIncome),
        initialDeposit: Number(formData.initialDeposit),
      });

      setCreatedResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to create user in database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDone = () => {
    if (createdResult?.customer?.id) {
      onUserCreated(createdResult.customer.id);
    }
    setCreatedResult(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Create User & Store in Database</h3>
              <p className="text-xs text-slate-500">
                Register new customer profile, generate banking credentials & store in persistent database
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {createdResult ? (
            /* Success State */
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>User and Credentials Stored in Database!</span>
                </div>
                <p className="text-emerald-700 leading-relaxed">
                  Customer profile, primary account, and login credentials were created and saved to the persistent database file.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="font-bold text-slate-800 text-sm">Stored Database Record Summary:</div>

                <div className="grid grid-cols-2 gap-3 text-slate-700">
                  <div>
                    <span className="text-slate-400">Customer Name:</span>
                    <div className="font-bold text-slate-900">{createdResult.customer.name}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Customer ID:</span>
                    <div className="font-mono font-bold text-blue-600">{createdResult.customer.id}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Login Username:</span>
                    <div className="font-mono font-bold text-slate-900">{createdResult.user.username}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Login Password:</span>
                    <div className="font-mono font-bold text-emerald-700">{createdResult.user.passwordPlainForDemo}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Account Number:</span>
                    <div className="font-mono font-bold text-slate-900">{createdResult.account.maskedAccountNumber}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Opening Balance:</span>
                    <div className="font-bold text-slate-900">
                      ₹{createdResult.account.balance.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Masked PAN:</span>
                    <div className="font-mono text-slate-700">{createdResult.customer.panMasked}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Masked Aadhaar:</span>
                    <div className="font-mono text-slate-700">{createdResult.customer.aadhaarMasked}</div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleDone}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-md transition-colors cursor-pointer"
                >
                  Switch to New Customer Now
                </button>
              </div>
            </div>
          ) : (
            /* Creation Form */
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Full Customer Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Vikram Singhania"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 rounded-xl border border-slate-300 text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Username */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Login ID / Username <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={formData.username}
                      onChange={e => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                      placeholder="e.g. vikram.s"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 rounded-xl border border-slate-300 text-slate-800 font-mono focus:bg-white focus:border-blue-600 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Password Credential <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Enter strong password"
                      className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-300 text-slate-800 font-mono focus:bg-white focus:border-blue-600 focus:outline-hidden pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. vikram@connectbank.in"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 rounded-xl border border-slate-300 text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 rounded-xl border border-slate-300 text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Occupation */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Occupation</label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={formData.occupation}
                      onChange={e => setFormData({ ...formData, occupation: e.target.value })}
                      placeholder="e.g. Lead Architect"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 rounded-xl border border-slate-300 text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Monthly Income */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Monthly Income (₹)</label>
                  <div className="relative">
                    <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="number"
                      value={formData.monthlyIncome}
                      onChange={e => setFormData({ ...formData, monthlyIncome: Number(e.target.value) })}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 rounded-xl border border-slate-300 text-slate-800 font-bold focus:bg-white focus:border-blue-600 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Initial Opening Deposit */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Opening Deposit (₹)</label>
                  <div className="relative">
                    <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="number"
                      value={formData.initialDeposit}
                      onChange={e => setFormData({ ...formData, initialDeposit: Number(e.target.value) })}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 rounded-xl border border-slate-300 text-slate-800 font-bold focus:bg-white focus:border-blue-600 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Account Type */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Primary Account Type</label>
                  <select
                    value={formData.accountType}
                    onChange={e => setFormData({ ...formData, accountType: e.target.value as AccountType })}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-300 text-slate-800 font-medium focus:bg-white focus:border-blue-600 focus:outline-hidden cursor-pointer"
                  >
                    <option value="savings">Savings Account (3.5% p.a.)</option>
                    <option value="current">Current Business Account (0.0%)</option>
                  </select>
                </div>

                {/* City */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">City & State</label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={formData.city}
                      onChange={e => setFormData({ ...formData, city: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 rounded-xl border border-slate-300 text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Writing to Database...' : 'Create & Store in Database'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
