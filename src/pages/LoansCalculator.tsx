/**
 * ConnectBank AI - Loans & EMI Calculator Page
 * Exact reducing-balance EMI calculations, amortisation schedules, and RBI-aligned eligibility estimation.
 */

import React, { useState, useEffect } from 'react';
import { Customer, Loan, EMICalculationResult, LoanEligibilityResult } from '../types/banking.ts';
import { apiClient } from '../services/apiClient.ts';
import { calculateEMIFormula } from '../tools/bankingTools.ts';
import {
  Calculator,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Percent,
  Calendar,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';

interface LoansCalculatorProps {
  customer: Customer;
}

export const LoansCalculator: React.FC<LoansCalculatorProps> = ({ customer }) => {
  const [loans, setLoans] = useState<Loan[]>([]);

  // EMI Calculator State
  const [calcPrincipal, setCalcPrincipal] = useState<number>(300000);
  const [calcRate, setCalcRate] = useState<number>(10.5);
  const [calcTenure, setCalcTenure] = useState<number>(36);
  const [emiResult, setEmiResult] = useState<EMICalculationResult | null>(null);

  // Loan Eligibility State
  const [elRequestedAmount, setElRequestedAmount] = useState<number>(500000);
  const [elLoanType, setElLoanType] = useState<'personal' | 'home' | 'auto' | 'education'>('personal');
  const [elTenure, setElTenure] = useState<number>(36);
  const [elResult, setElResult] = useState<LoanEligibilityResult | null>(null);
  const [isCheckingEligibility, setIsCheckingEligibility] = useState<boolean>(false);

  useEffect(() => {
    loadLoans();
    runEmiCalculation(calcPrincipal, calcRate, calcTenure);
  }, [customer.id]);

  const loadLoans = async () => {
    const list = await apiClient.getLoans(customer.id);
    setLoans(list);
  };

  const runEmiCalculation = (p: number, r: number, n: number) => {
    try {
      const res = calculateEMIFormula(p, r, n);
      setEmiResult(res);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEmiChange = (p: number, r: number, n: number) => {
    setCalcPrincipal(p);
    setCalcRate(r);
    setCalcTenure(n);
    runEmiCalculation(p, r, n);
  };

  const handleCheckEligibility = async () => {
    setIsCheckingEligibility(true);
    try {
      const res = await apiClient.checkLoanEligibility(customer.id, elRequestedAmount, elLoanType, elTenure);
      setElResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCheckingEligibility(false);
    }
  };

  const formatINR = (val: number) => {
    return val.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Loans & EMI Underwriting Calculator
        </h1>
        <p className="text-xs md:text-sm text-slate-500 mt-1">
          Standard reducing-balance mathematical calculations and preliminary eligibility underwriting for {customer.name}.
        </p>
      </div>

      {/* Existing Active Loans */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900">Current Active Loans</h2>
        {loans.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 text-slate-500 text-xs">
            No active retail loans on file for this customer profile.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {loans.map(loan => (
              <div
                key={loan.id}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 capitalize">
                    {loan.loanType} Loan ({loan.id})
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                    {loan.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400">Original Principal:</span>
                    <div className="font-bold text-slate-900 text-sm">₹{formatINR(loan.principal)}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Monthly EMI:</span>
                    <div className="font-bold text-blue-600 text-sm">₹{formatINR(loan.emiAmount)}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Remaining Balance:</span>
                    <div className="font-bold text-slate-900">₹{formatINR(loan.remainingBalance)}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Annual Rate:</span>
                    <div className="font-bold text-slate-900">{loan.interestRate}% p.a.</div>
                  </div>
                </div>

                {/* Progress */}
                <div>
                  <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                    <span>Repayment Progress</span>
                    <span>
                      {loan.emisPaid} of {loan.totalEmis} instalments ({Math.round((loan.emisPaid / loan.totalEmis) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all"
                      style={{ width: `${(loan.emisPaid / loan.totalEmis) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main 2 Column Grid: EMI Calculator & Eligibility Checker */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* SECTION 1: EMI Calculator */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Calculator className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-bold text-slate-900 text-base">Reducing-Balance EMI Calculator</h3>
              <p className="text-xs text-slate-500">EMI = P × r × (1+r)ⁿ / ((1+r)ⁿ − 1)</p>
            </div>
          </div>

          {/* Calculator Inputs */}
          <div className="space-y-4 text-xs">
            {/* Principal */}
            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Principal Amount (₹)</span>
                <span className="text-blue-600 font-extrabold text-sm">
                  ₹{calcPrincipal.toLocaleString('en-IN')}
                </span>
              </div>
              <input
                type="range"
                min="50000"
                max="5000000"
                step="25000"
                value={calcPrincipal}
                onChange={e => handleEmiChange(Number(e.target.value), calcRate, calcTenure)}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex gap-2 mt-1.5">
                {[100000, 300000, 500000, 1000000, 2500000].map(val => (
                  <button
                    key={val}
                    onClick={() => handleEmiChange(val, calcRate, calcTenure)}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-[10px] text-slate-700 font-medium cursor-pointer"
                  >
                    ₹{(val / 100000).toFixed(val % 100000 === 0 ? 0 : 1)}L
                  </button>
                ))}
              </div>
            </div>

            {/* Interest Rate */}
            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Annual Interest Rate (%)</span>
                <span className="text-blue-600 font-extrabold text-sm">{calcRate}%</span>
              </div>
              <input
                type="range"
                min="5.0"
                max="22.0"
                step="0.25"
                value={calcRate}
                onChange={e => handleEmiChange(calcPrincipal, Number(e.target.value), calcTenure)}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            {/* Tenure */}
            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Tenure ({calcTenure} months / {(calcTenure / 12).toFixed(1)} years)</span>
                <span className="text-blue-600 font-extrabold text-sm">{calcTenure} Mo</span>
              </div>
              <input
                type="range"
                min="6"
                max="240"
                step="6"
                value={calcTenure}
                onChange={e => handleEmiChange(calcPrincipal, calcRate, Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Calculator Output */}
          {emiResult && (
            <div className="p-5 bg-gradient-to-br from-blue-50/80 to-indigo-50/50 rounded-2xl border border-blue-200/80 space-y-4">
              <div className="text-center">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Monthly Equated Instalment (EMI)
                </div>
                <div className="text-3xl font-black text-blue-900 mt-1">
                  ₹{formatINR(emiResult.monthlyEMI)}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">per month</div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-blue-200/60 text-xs">
                <div>
                  <div className="text-slate-500">Total Interest Payable:</div>
                  <div className="font-extrabold text-slate-900 mt-0.5">
                    ₹{formatINR(emiResult.totalInterest)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">Total Payment (P + I):</div>
                  <div className="font-extrabold text-slate-900 mt-0.5">
                    ₹{formatINR(emiResult.totalPayment)}
                  </div>
                </div>
              </div>

              {/* Visual Breakdown Bar */}
              <div>
                <div className="flex justify-between text-[10px] text-slate-500 mb-1 font-semibold">
                  <span>Principal ({( (emiResult.principal / emiResult.totalPayment) * 100 ).toFixed(0)}%)</span>
                  <span>Interest ({( (emiResult.totalInterest / emiResult.totalPayment) * 100 ).toFixed(0)}%)</span>
                </div>
                <div className="h-3 w-full bg-amber-400 rounded-full overflow-hidden flex">
                  <div
                    className="bg-blue-600 h-full"
                    style={{ width: `${(emiResult.principal / emiResult.totalPayment) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 2: Loan Eligibility Estimator */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="font-bold text-slate-900 text-base">Preliminary Loan Eligibility Check</h3>
              <p className="text-xs text-slate-500">Evaluates monthly income, FOIR & CIBIL score</p>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Loan Category</label>
              <select
                value={elLoanType}
                onChange={e => setElLoanType(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 font-medium cursor-pointer"
              >
                <option value="personal">Personal Loan (Prime 11.25%)</option>
                <option value="home">Home Loan (Prime 8.65%)</option>
                <option value="auto">Auto / Vehicle Loan (9.25%)</option>
                <option value="education">Education Loan (9.50%)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Requested Loan Amount (₹)
              </label>
              <input
                type="number"
                value={elRequestedAmount}
                onChange={e => setElRequestedAmount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 font-semibold"
                step="50000"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Requested Tenure ({elTenure} months)
              </label>
              <input
                type="range"
                min="12"
                max={elLoanType === 'home' ? '240' : '60'}
                step="6"
                value={elTenure}
                onChange={e => setElTenure(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            <button
              onClick={handleCheckEligibility}
              disabled={isCheckingEligibility}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isCheckingEligibility ? 'Evaluating Credit Metrics...' : 'Check Simulated Eligibility'}
            </button>
          </div>

          {/* Eligibility Results */}
          {elResult && (
            <div
              className={`p-5 rounded-2xl border text-xs space-y-3 ${
                elResult.eligible
                  ? 'bg-emerald-50/80 border-emerald-200'
                  : 'bg-amber-50/80 border-amber-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {elResult.eligible ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                )}
                <span className="font-extrabold text-sm text-slate-900">
                  {elResult.eligible ? 'Pre-Approved / Eligible' : 'Eligibility Needs Adjustment'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-slate-700">
                <div>
                  Estimated EMI: <strong>₹{formatINR(elResult.estimatedEMI)}/mo</strong>
                </div>
                <div>
                  Max Eligible Amount: <strong>₹{formatINR(elResult.maxEligibleAmount)}</strong>
                </div>
                <div>
                  Projected DTI (FOIR): <strong>{elResult.debtToIncomeRatioPercent}%</strong>
                </div>
                <div>
                  Allowed DTI Limit: <strong>{elResult.maxAllowedDTIPercent}%</strong>
                </div>
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-200/60">
                <div className="font-bold text-slate-800">Underwriting Factors:</div>
                {elResult.factors.map((f, i) => (
                  <div key={i} className="text-slate-600">
                    • {f}
                  </div>
                ))}
              </div>

              {elResult.missingRequirements.length > 0 && (
                <div className="space-y-1 text-amber-900 bg-amber-100/70 p-2.5 rounded-lg">
                  <div className="font-bold">Recommendations:</div>
                  {elResult.missingRequirements.map((r, i) => (
                    <div key={i}>• {r}</div>
                  ))}
                </div>
              )}

              <div className="text-[10px] text-slate-500 italic mt-2">
                *{elResult.disclaimer}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
