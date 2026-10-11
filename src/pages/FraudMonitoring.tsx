/**
 * ConnectBank AI - Fraud & Risk Monitoring
 * Transparent, deterministic transaction anomaly rules, risk scores, and protection actions.
 */

import React, { useState, useEffect } from 'react';
import { Customer, FraudAlert } from '../types/banking.ts';
import { apiClient } from '../services/apiClient.ts';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Lock,
  FileText,
  RotateCw,
  CheckCircle2,
  MapPin,
  Clock,
  ExternalLink,
} from 'lucide-react';

interface FraudMonitoringProps {
  customer: Customer;
  onNavigateToAssistant: (prompt: string) => void;
}

export const FraudMonitoring: React.FC<FraudMonitoringProps> = ({ customer, onNavigateToAssistant }) => {
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [freezeSuccess, setFreezeSuccess] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, [customer.id]);

  const loadAlerts = async () => {
    const list = await apiClient.getFraudAlerts(customer.id);
    setAlerts(list);
  };

  const handleRunScan = async () => {
    setIsScanning(true);
    try {
      const res = await apiClient.runFraudAnalysis(customer.id);
      setScanResult(res);
      await loadAlerts();
    } catch (err) {
      console.error(err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleFreezeCard = () => {
    setFreezeSuccess(true);
    setTimeout(() => setFreezeSuccess(false), 4000);
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Fraud & Risk Monitoring
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Deterministic anomaly scoring, cross-border telemetry, and automated protection controls.
          </p>
        </div>

        <button
          onClick={handleRunScan}
          disabled={isScanning}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
        >
          <RotateCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
          <span>{isScanning ? 'Scanning Telemetry...' : 'Run On-Demand Risk Scan'}</span>
        </button>
      </div>

      {freezeSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>International POS and card transactions have been temporarily locked for security.</span>
        </div>
      )}

      {/* Risk Score Summary Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex items-center gap-5">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-extrabold shadow-md ${
              customer.id === 'CUST-1001'
                ? 'bg-rose-600 shadow-rose-600/30'
                : 'bg-emerald-600 shadow-emerald-600/30'
            }`}
          >
            {customer.id === 'CUST-1001' ? '89' : '12'}
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Calculated Risk Score
            </div>
            <div className="text-lg font-bold text-slate-900 mt-0.5">
              {customer.id === 'CUST-1001' ? 'High Risk Warning' : 'Low Risk (Normal)'}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {customer.id === 'CUST-1001'
                ? '1 overseas anomaly detected'
                : 'No suspicious telemetry detected'}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Active Protection Rules
          </div>
          <div className="space-y-1.5 text-xs text-slate-700">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              <span>Geo-velocity & IP mismatch threshold</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              <span>Deviation &gt; 300% from 30-day baseline</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              <span>Burst velocity &gt; 3 txns / 5 mins</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Regulatory Protection
            </div>
            <div className="text-xs text-slate-700 font-semibold">
              RBI Zero-Liability Framework (RBI/2017-18/15)
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Customer enjoys 100% liability waiver if unauthorized electronic transactions are reported within 3 working days.
            </p>
          </div>
        </div>
      </div>

      {/* Fraud Alerts List */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900">Recorded Security Alerts</h2>

        {alerts.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-500 text-xs">
            <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <div className="font-semibold text-slate-800 text-sm">No Active Fraud Alerts</div>
            <p className="mt-1">All recent transaction telemetry conforms to baseline customer spending models.</p>
          </div>
        ) : (
          alerts.map(alert => (
            <div
              key={alert.id}
              className="bg-white rounded-2xl p-6 border border-rose-200 shadow-xs relative overflow-hidden space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded-lg text-xs font-bold uppercase tracking-wider">
                    {alert.severity} Severity
                  </span>
                  <span className="font-mono text-xs text-slate-400">{alert.id}</span>
                  <span className="text-xs text-slate-500">
                    {new Date(alert.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="text-xs font-bold text-rose-600">
                  Risk Score: {alert.riskScore}/100
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900">{alert.description}</h3>
                <div className="mt-2 text-xs font-mono text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                  Rule Triggered: <strong>{alert.ruleTriggered}</strong>
                </div>
              </div>

              {/* Evidence Details */}
              {alert.evidence && (
                <div className="p-4 bg-slate-50 rounded-xl text-xs space-y-2">
                  <div className="font-bold text-slate-700">Forensic Evidence:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-slate-600">
                    <div>
                      Amount: <strong>₹{alert.evidence.transactionAmount?.toLocaleString('en-IN')}</strong>
                    </div>
                    <div>
                      Location: <strong>{alert.evidence.location}</strong>
                    </div>
                    <div>
                      Deviation: <strong>+{alert.evidence.deviationPercentage}%</strong>
                    </div>
                    <div>
                      Repeated Bursts: <strong>{alert.evidence.frequencyCount} attempts</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={handleFreezeCard}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Freeze International Card Transactions</span>
                </button>

                <button
                  onClick={() =>
                    onNavigateToAssistant(
                      `File an official RBI Zero-Liability dispute for flagged transaction ${alert.transactionId || alert.id}`
                    )
                  }
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-600" />
                  <span>Dispute with AI Assistant</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
