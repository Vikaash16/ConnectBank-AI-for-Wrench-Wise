/**
 * ConnectBank AI - User Login & Credential Verification Modal
 * Verifies credentials against the database and establishes active customer session.
 */

import React, { useState, useEffect } from 'react';
import { UserCredential } from '../types/banking.ts';
import { apiClient } from '../services/apiClient.ts';
import {
  LogIn,
  X,
  KeyRound,
  User,
  AlertCircle,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  Database,
  ArrowRight,
} from 'lucide-react';

interface UserLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (customerId: string) => void;
  onOpenCreateUser: () => void;
}

export const UserLoginModal: React.FC<UserLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onOpenCreateUser,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<UserCredential[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadRegisteredUsers();
      setError(null);
    }
  }, [isOpen]);

  const loadRegisteredUsers = async () => {
    try {
      const users = await apiClient.getUsers();
      setAvailableUsers(users);
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await apiClient.loginUser(username.trim(), password);
      if (res.user?.customerId) {
        onLoginSuccess(res.user.customerId);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Invalid username or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutofill = (u: UserCredential) => {
    setUsername(u.username);
    setPassword(u.passwordPlainForDemo || 'Connect@123');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <LogIn className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Sign In with Credentials</h3>
              <p className="text-xs text-slate-500">Database Authentication & Verification</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Username / Login ID</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="e.g. aarav.sharma"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 rounded-xl border border-slate-300 text-slate-800 font-mono focus:bg-white focus:border-blue-600 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Password Credential</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-9 pr-9 py-2 bg-slate-50 rounded-xl border border-slate-300 text-slate-800 font-mono focus:bg-white focus:border-blue-600 focus:outline-hidden"
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md transition-colors cursor-pointer disabled:opacity-50 text-xs"
            >
              {isLoading ? 'Verifying Credentials...' : 'Authenticate & Open Dashboard'}
            </button>
          </form>

          {/* Quick Select from Database */}
          <div className="pt-3 border-t border-slate-100">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Stored Users in Database ({availableUsers.length})</span>
              <span className="text-[10px] text-blue-600 font-normal">Click to autofill</span>
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {availableUsers.map(u => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleAutofill(u)}
                  className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200/80 hover:border-blue-300 transition-all text-xs flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <span className="font-mono font-bold text-slate-800">{u.username}</span>
                    <span className="text-[10px] text-slate-400 ml-2">({u.customerId})</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    {u.passwordPlainForDemo}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Create User Link */}
          <div className="pt-2 text-center text-xs text-slate-500">
            Need a new banking account?{' '}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCreateUser();
              }}
              className="text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
            >
              Create New User & Credentials
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
