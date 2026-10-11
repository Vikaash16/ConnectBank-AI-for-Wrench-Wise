/**
 * Layer 7 - ConnectBank AI Regulatory & Policy Knowledge Base
 * Authentic banking guidelines aligned with Reserve Bank of India (RBI) directions.
 */

export interface PolicyDocument {
  id: string;
  category: 'Accounts' | 'Loans' | 'KYC_Compliance' | 'Fraud_Disputes' | 'Consumer_Protection';
  title: string;
  summary: string;
  content: string;
  tags: string[];
  effectiveDate: string;
  referenceAuthority: string;
}

export const BANKING_POLICIES: PolicyDocument[] = [
  {
    id: 'POL-ACC-01',
    category: 'Accounts',
    title: 'ConnectBank Savings Account Features & Interest Calculation',
    summary: 'Daily product balance interest calculation, interest payout schedules, and minimum balance standards.',
    content: `ConnectBank computes savings interest on a daily end-of-day balance basis in accordance with RBI Master Directions. 
Current annual rates: 
- Balances up to ₹1,00,000: 3.00% p.a.
- Balances ₹1,00,000 to ₹10,00,000: 3.50% p.a.
- Senior Citizen Privilege accounts receive an additional +0.50% premium across all tiers.
Interest is credited quarterly on March 31, June 30, September 30, and December 31.
Corporate salary accounts feature zero minimum balance requirement, whereas standard savings accounts require an Average Monthly Balance (AMB) of ₹5,000 in metro centres and ₹2,500 in semi-urban branches.`,
    tags: ['savings', 'interest rate', 'minimum balance', 'payout', 'senior citizen'],
    effectiveDate: '2026-01-01',
    referenceAuthority: 'RBI/DBR/2015-16/19 Master Direction',
  },
  {
    id: 'POL-LOAN-01',
    category: 'Loans',
    title: 'Retail Loan Underwriting & Debt-to-Income (FOIR) Policy',
    summary: 'Eligibility benchmarks for Personal Loans and Home Loans, CIBIL cutoffs, and FOIR capping.',
    content: `ConnectBank evaluates retail loan eligibility on the following objective criteria:
1. Credit Score: Minimum CIBIL score of 700 for Personal Loans; 680 for Home Loans. Scores above 750 unlock prime interest rate discounts (-0.25%).
2. Fixed Obligation to Income Ratio (FOIR / DTI):
   - Monthly net salary below ₹50,000: Max FOIR is 45%.
   - Monthly net salary ₹50,000 to ₹1,50,000: Max FOIR is 50%.
   - Monthly net salary above ₹1,50,000: Max FOIR can extend up to 60%.
3. Personal Loan Cap: Up to 15 times net monthly income, subject to a maximum of ₹25,00,000. Maximum tenure is 60 months.
4. Home Loan Cap: Up to 80% Loan-to-Value (LTV) for loans under ₹75 Lakhs. Maximum tenure is 240 months (20 years).`,
    tags: ['loan eligibility', 'cibil', 'foir', 'dti', 'personal loan', 'home loan', 'tenure'],
    effectiveDate: '2025-11-15',
    referenceAuthority: 'ConnectBank Credit Underwriting Board',
  },
  {
    id: 'POL-EMI-01',
    category: 'Loans',
    title: 'Reducing Balance EMI Calculation & Foreclosure Norms',
    summary: 'Standard mathematical formula for EMI amortisation, interest breakdown, and prepayment fees.',
    content: `All ConnectBank loans operate exclusively on the Reducing Balance method.
The Equated Monthly Instalment (EMI) is computed using the formula:
EMI = P * r * (1 + r)^n / ((1 + r)^n - 1)
Where:
- P = Principal loan amount
- r = Monthly interest rate (Annual interest rate / 12 / 100)
- n = Total tenure in months.
In each instalment, interest is charged only on the outstanding principal balance. As tenure progresses, principal repayment portion increases while the interest component diminishes.
Foreclosure & Part-prepayment: Zero penalty for floating-rate home loans as per RBI mandate. Fixed-rate retail loans carry a nominal 2% prepayment fee after completion of 12 regular instalments.`,
    tags: ['emi formula', 'reducing balance', 'prepayment', 'foreclosure', 'amortisation'],
    effectiveDate: '2025-06-01',
    referenceAuthority: 'RBI/2014-15/121 Regulatory Framework',
  },
  {
    id: 'POL-KYC-01',
    category: 'KYC_Compliance',
    title: 'RBI Master Direction - Know Your Customer (KYC) & Periodic Updation',
    summary: 'Periodic re-KYC frequency, officially valid documents (OVD), and Video KYC standards.',
    content: `Under RBI Master Direction - Know Your Customer (KYC) Direction, 2016 (updated 2026):
1. Periodic KYC Updation Frequency:
   - High-Risk Customers: Once every 2 years.
   - Medium-Risk Customers: Once every 8 years (or 2 years if commercial entity profile alters).
   - Low-Risk Customers: Once every 10 years.
2. Officially Valid Documents (OVD): Passport, Driving Licence, Proof of possession of Aadhaar number, Voter Identity Card, Job card issued by NREGA, or National Population Register letter.
3. Video Customer Identification Process (V-CIP): Permitted for fresh onboarding and periodic re-KYC. Requires live audio-visual interaction, geo-tagging within India, dynamic OTP, and facial matching against PAN/Aadhaar databases.`,
    tags: ['kyc', 'rbi', 're-verification', 'aadhaar', 'pan', 'video kyc', 'ovd', 'periodic'],
    effectiveDate: '2026-01-10',
    referenceAuthority: 'RBI/DBR/2015-16/18 Master Direction KYC',
  },
  {
    id: 'POL-AML-01',
    category: 'KYC_Compliance',
    title: 'Anti-Money Laundering (AML) & Suspicious Transaction Reporting (STR)',
    summary: 'Threshold monitoring, PEP screening, and regulatory filings with Financial Intelligence Unit (FIU-IND).',
    content: `ConnectBank maintains rigorous automated AML monitoring:
1. Cash Transaction Reporting (CTR): Transactions in cash exceeding ₹10,00,000 or equivalent in foreign currency in a single month must be reported.
2. Suspicious Transaction Reporting (STR): Transactions exhibiting unusual velocity, rapid round-tripping, overseas high-risk jurisdictions, or mismatch with stated customer occupation must be flagged within 7 working days to FIU-IND.
3. Politically Exposed Persons (PEPs): Higher tier due diligence and senior management approval required for onboarding.`,
    tags: ['aml', 'str', 'fiu-ind', 'suspicious transaction', 'pep', 'money laundering'],
    effectiveDate: '2025-09-01',
    referenceAuthority: 'PMLA 2002 & FIU-IND Reporting Norms',
  },
  {
    id: 'POL-FRD-01',
    category: 'Fraud_Disputes',
    title: 'Customer Protection - Limiting Liability in Unauthorized Electronic Banking',
    summary: 'RBI Zero-Liability framework, dispute reporting windows, and shadow credit guidelines.',
    content: `Per RBI Circular on Limiting Liability of Customers in Unauthorised Electronic Banking Transactions:
1. Zero Liability of Customer:
   - Contributory fraud/negligence by ConnectBank: Zero liability for customer.
   - Third-party breach where deficiency lies elsewhere: Customer notifies bank within 3 working days of receiving bank alert -> Zero liability.
2. Limited Liability (4 to 7 Working Days):
   - If customer reports delay between 4 to 7 working days: Maximum customer liability capped at ₹5,000 for basic savings accounts, and ₹10,000 for standard accounts / credit cards up to ₹5 Lakh limit.
3. Beyond 7 Working Days:
   - Bank Board approved policy applies.
4. Shadow Credit (Reversal):
   - ConnectBank credits the disputed amount to customer account within 10 working days pending final forensic investigation.`,
    tags: ['fraud', 'unauthorized', 'dispute', 'zero liability', 'rbi', 'card freeze', 'shadow credit'],
    effectiveDate: '2025-04-01',
    referenceAuthority: 'RBI/2017-18/15 DBR.No.Leg.BC.78/09.07.005/2017-18',
  },
  {
    id: 'POL-OMBUD-01',
    category: 'Consumer_Protection',
    title: 'Banking Ombudsman Scheme & Dispute Escalation Matrix',
    summary: 'Internal grievance turnaround times (TAT) and Reserve Bank - Integrated Ombudsman Scheme (RB-IOS).',
    content: `ConnectBank maintains a four-tiered escalation mechanism:
- Level 1: Branch Manager / AI Banking Assistant / Call Center (Resolution within 7 working days).
- Level 2: Principal Nodal Officer (Resolution within 15 working days).
- Level 3: Internal Ombudsman of ConnectBank.
- Level 4: Reserve Bank Integrated Ombudsman Scheme (RB-IOS 2021): Customer can lodge complaint if bank fails to resolve within 30 days or rejects grievance without satisfactory rationale.`,
    tags: ['ombudsman', 'grievance', 'escalation', 'complaint', 'turnaround', 'dispute'],
    effectiveDate: '2025-01-01',
    referenceAuthority: 'RBI Integrated Ombudsman Scheme 2021',
  },
];
