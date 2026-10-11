/**
 * Layer 8 - Simulated External Banking Services
 * Mock adapters for CIBIL/Experian Credit Bureau, UIDAI/AML compliance, NPCI UPI switch, and Notification SMS/Push gateways.
 */

export interface CreditBureauReport {
  bureau: 'CIBIL' | 'Experian';
  customerId: string;
  panMasked: string;
  score: number;
  scoreBand: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  activeAccounts: number;
  totalCreditLimit: number;
  currentOutstanding: number;
  creditUtilizationPercent: number;
  onTimePaymentRatio: number;
  recentEnquiriesCount: number;
  generatedAt: string;
  isSimulated: true;
}

export interface AMLScreeningResult {
  service: 'UIDAI_AML_WATCHLIST_SIMULATOR';
  customerId: string;
  pepStatus: 'NOT_PEP' | 'POLITICALLY_EXPOSED';
  sanctionMatch: boolean;
  adverseMediaFound: boolean;
  amlRiskScore: number; // 0-100
  regulatoryStatus: 'PASSED' | 'REVIEW_RECOMMENDED' | 'FLAGGED';
  timestamp: string;
  isSimulated: true;
}

export interface PaymentGatewayHealth {
  network: 'NPCI_UPI_2.0' | 'RBI_NEFT_RTGS' | 'VISA_MASTERCARD_SWITCH';
  status: 'OPERATIONAL' | 'DEGRADED';
  averageLatencyMs: number;
  successRatePercent: number;
  lastTestedAt: string;
  isSimulated: true;
}

export const MockCreditBureau = {
  fetchReport(customerId: string, score: number, panMasked: string): CreditBureauReport {
    let scoreBand: 'Excellent' | 'Good' | 'Fair' | 'Poor' = 'Fair';
    if (score >= 750) scoreBand = 'Excellent';
    else if (score >= 700) scoreBand = 'Good';
    else if (score >= 600) scoreBand = 'Fair';
    else scoreBand = 'Poor';

    return {
      bureau: 'CIBIL',
      customerId,
      panMasked,
      score,
      scoreBand,
      activeAccounts: customerId === 'CUST-1002' ? 3 : 2,
      totalCreditLimit: customerId === 'CUST-1001' ? 750000 : 1500000,
      currentOutstanding: customerId === 'CUST-1001' ? 295400 : 4015000,
      creditUtilizationPercent: customerId === 'CUST-1001' ? 28 : 42,
      onTimePaymentRatio: score >= 750 ? 99.4 : 94.8,
      recentEnquiriesCount: customerId === 'CUST-1002' ? 3 : 1,
      generatedAt: new Date().toISOString(),
      isSimulated: true,
    };
  },
};

export const MockKYCAMLService = {
  screenCustomer(customerId: string): AMLScreeningResult {
    const isMediumRisk = customerId === 'CUST-1002';
    return {
      service: 'UIDAI_AML_WATCHLIST_SIMULATOR',
      customerId,
      pepStatus: 'NOT_PEP',
      sanctionMatch: false,
      adverseMediaFound: false,
      amlRiskScore: isMediumRisk ? 35 : 8,
      regulatoryStatus: isMediumRisk ? 'REVIEW_RECOMMENDED' : 'PASSED',
      timestamp: new Date().toISOString(),
      isSimulated: true,
    };
  },
};

export const MockPaymentGateway = {
  checkNetworkHealth(): PaymentGatewayHealth[] {
    return [
      {
        network: 'NPCI_UPI_2.0',
        status: 'OPERATIONAL',
        averageLatencyMs: 142,
        successRatePercent: 99.82,
        lastTestedAt: new Date().toISOString(),
        isSimulated: true,
      },
      {
        network: 'RBI_NEFT_RTGS',
        status: 'OPERATIONAL',
        averageLatencyMs: 310,
        successRatePercent: 99.95,
        lastTestedAt: new Date().toISOString(),
        isSimulated: true,
      },
      {
        network: 'VISA_MASTERCARD_SWITCH',
        status: 'OPERATIONAL',
        averageLatencyMs: 185,
        successRatePercent: 99.64,
        lastTestedAt: new Date().toISOString(),
        isSimulated: true,
      },
    ];
  },
};

export const MockNotificationService = {
  sendSMS(phone: string, message: string): { status: 'DELIVERED'; messageId: string; timestamp: string } {
    return {
      status: 'DELIVERED',
      messageId: `SMS-${Date.now().toString(36).toUpperCase()}`,
      timestamp: new Date().toISOString(),
    };
  },
};
