/**
 * ConnectBank AI - KYC & Regulatory Compliance Page
 * RBI Master Direction compliance, periodic re-KYC workflows, and AML screening telemetry.
 */

import React, { useState, useEffect } from 'react';
import { Customer, KYCRecord } from '../types/banking.ts';
import { apiClient } from '../services/apiClient.ts';
import { bankingDB } from '../db/database.ts';
import {
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Upload,
  Video,
  BookOpen,
  Check,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface KYCComplianceProps {
  customer: Customer;
}

export const KYCCompliance: React.FC<KYCComplianceProps> = ({ customer }) => {
  const [kycData, setKycData] = useState<{ kyc: KYCRecord | null; amlScreening?: any } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  useEffect(() => {
    loadKYC();
  }, [customer.id]);

  const loadKYC = async () => {
    const res = await apiClient.getKYC(customer.id);
    setKycData(res);
  };

  const handleSimulateVerification = async () => {
    setIsUpdating(true);
    setTimeout(() => {
      bankingDB.updateKYCStatus(customer.id, {
        status: 'verified',
        addressProofVerified: true,
        videoKycCompleted: true,
        lastVerifiedDate: new Date().toISOString().split('T')[0],
        nextDueDate: '2028-10-11',
        missingRequirements: [],
      });
      loadKYC();
      setIsUpdating(false);
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 5000);
    }, 1200);
  };

  const kyc = kycData?.kyc;
  const aml = kycData?.amlScreening;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          KYC & Regulatory Compliance
        </h1>
        <p className="text-xs md:text-sm text-slate-500 mt-1">
          Reserve Bank of India (RBI) Master Directions, periodic updation timeline, and AML screening for {customer.name}.
        </p>
      </div>

      {updateSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Periodic Video KYC and Address Proof successfully verified and recorded!</span>
        </div>
      )}

      {/* Status Overview Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white ${
              kyc?.status === 'verified' ? 'bg-emerald-600' : 'bg-amber-500'
            }`}
          >
            <FileCheck2 className="w-7 h-7" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Verification Status
            </div>
            <div className="text-base font-extrabold text-slate-900 mt-0.5 capitalize">
              {kyc?.status?.replace('_', ' ')}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Next Due: <strong>{kyc?.nextDueDate}</strong>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Shield className="w-7 h-7" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              AML Watchlist Status
            </div>
            <div className="text-base font-extrabold text-emerald-700 mt-0.5">
              {aml?.regulatoryStatus || 'CLEAR'}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              PEP Check: <strong>{aml?.pepStatus?.replace('_', ' ') || 'CLEAR'}</strong>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <BookOpen className="w-7 h-7" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Governing Framework
            </div>
            <div className="text-base font-extrabold text-slate-900 mt-0.5">
              RBI Master Direction
            </div>
            <div className="text-xs text-slate-500 mt-1">
              V-CIP & Periodic KYC 2026
            </div>
          </div>
        </div>
      </div>

      {/* Document Checklist & Action Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Document Checklist */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Officially Valid Documents (OVD) Checklist</h3>

          <div className="space-y-3">
            {[
              { label: 'Aadhaar e-KYC (Masked)', verified: kyc?.aadhaarVerified, id: customer.aadhaarMasked },
              { label: 'PAN Card Verification', verified: kyc?.panVerified, id: customer.panMasked },
              { label: 'Proof of Address (Utility / GST)', verified: kyc?.addressProofVerified, id: 'Verified in Digilocker' },
              { label: 'Live Video KYC (V-CIP)', verified: kyc?.videoKycCompleted, id: 'Facial Biometric Match' },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-white ${
                      item.verified ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  >
                    {item.verified ? <Check className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900">{item.label}</span>
                    <div className="text-[11px] text-slate-400 font-mono">{item.id}</div>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.verified
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {item.verified ? 'VERIFIED' : 'PENDING'}
                </span>
              </div>
            ))}
          </div>

          {kyc?.missingRequirements && kyc.missingRequirements.length > 0 && (
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs space-y-2">
              <div className="font-bold text-amber-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Pending Compliance Requirements:</span>
              </div>
              <ul className="space-y-1 text-amber-800 pl-5 list-disc">
                {kyc.missingRequirements.map((req, i) => (
                  <li key={i}>{req}</li>
                ))}
              </ul>

              <button
                onClick={handleSimulateVerification}
                disabled={isUpdating}
                className="mt-3 w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Video className="w-4 h-4" />
                <span>{isUpdating ? 'Verifying Digilocker & Video KYC...' : 'Complete Video KYC (V-CIP) Now'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Regulatory Policy Drawer */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">RBI Master Direction Policy Excerpts (RAG)</h3>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <div className="font-bold text-blue-900">Periodic Re-KYC Frequency Standards</div>
              <p className="text-slate-600 leading-relaxed">
                As per Section 38 of RBI Master Direction on KYC: Low-risk customers require re-KYC every 10 years, medium-risk every 8 years, and high-risk entities every 2 years. Commercial entities updating business address or directors must trigger interim re-verification.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <div className="font-bold text-blue-900">Video Customer Identification Process (V-CIP)</div>
              <p className="text-slate-600 leading-relaxed">
                Authorized under RBI circular RBI/DBR/2019-20/70. Regulated entities may undertake live V-CIP with geo-tagging, dynamic OTP, and automated liveness detection for customer convenience.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <div className="font-bold text-blue-900">Anti-Money Laundering (PMLA 2002)</div>
              <p className="text-slate-600 leading-relaxed">
                ConnectBank reports Cash Transactions &gt; ₹10 Lakhs and suspicious transactions (STR) to Financial Intelligence Unit India (FIU-IND) within 7 working days.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
