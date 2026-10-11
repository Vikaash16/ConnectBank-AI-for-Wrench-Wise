/**
 * Layer 3 & Layer 9 - Security Guardrails & PII Protection
 * Protects against prompt injection, cross-customer data leakage, and sensitive PII exposure.
 */

export interface GuardrailCheckResult {
  passed: boolean;
  reason?: string;
  flagType?: 'CROSS_CUSTOMER_VIOLATION' | 'PROMPT_INJECTION' | 'MALICIOUS_INPUT';
  sanitizedPrompt: string;
}

export function maskPII(text: string): string {
  if (!text) return '';

  let sanitized = text;

  // Mask Aadhaar numbers: 12 digits (with optional spaces/dashes)
  sanitized = sanitized.replace(/\b(\d{4})[\s-](\d{4})[\s-](\d{4})\b/g, 'XXXX-XXXX-$3');

  // Mask PAN numbers: 5 letters, 4 digits, 1 letter
  sanitized = sanitized.replace(/\b([A-Z]{5})(\d{4})([A-Z])\b/g, '$1****$3');

  // Mask 14-16 digit Account numbers
  sanitized = sanitized.replace(/\b(\d{6,10})(\d{4})\b/g, 'XXXX-XXXX-$2');

  // Mask 10-digit Indian Mobile Numbers
  sanitized = sanitized.replace(/\b(\+?91[\s-]?)?([6-9]\d{2})\d{5}(\d{2})\b/g, '$1$2XXXXX$3');

  return sanitized;
}

export function evaluateSecurityGuardrails(
  prompt: string,
  authenticatedCustomerId: string
): GuardrailCheckResult {
  const lower = prompt.toLowerCase();

  // 1. Cross-Customer Access Detection
  // Check if user is asking for another seeded customer's data
  const otherCustomerIds = ['cust-1001', 'cust-1002', 'cust-1003'].filter(
    id => id !== authenticatedCustomerId.toLowerCase()
  );

  for (const otherId of otherCustomerIds) {
    if (lower.includes(otherId)) {
      return {
        passed: false,
        reason: `SECURITY ACCESS DENIED: Request explicitly targets external customer record (${otherId.toUpperCase()}). Multi-tenant isolation prevents cross-account visibility.`,
        flagType: 'CROSS_CUSTOMER_VIOLATION',
        sanitizedPrompt: prompt,
      };
    }
  }

  // Cross-customer persona name checks
  const names = [
    { name: 'priya patel', id: 'cust-1002' },
    { name: 'aarav sharma', id: 'cust-1001' },
    { name: 'rajesh kumar', id: 'cust-1003' },
  ];
  for (const { name, id } of names) {
    if (id !== authenticatedCustomerId.toLowerCase() && lower.includes(name)) {
      return {
        passed: false,
        reason: `SECURITY ACCESS DENIED: Request references third-party account holder "${name}". Banking secrecy rules prohibit cross-account disclosure.`,
        flagType: 'CROSS_CUSTOMER_VIOLATION',
        sanitizedPrompt: prompt,
      };
    }
  }

  // 2. Prompt Injection & Malicious Jailbreak Detection
  const injectionPatterns = [
    /ignore (all )?(previous|above) (instructions|directions|rules)/i,
    /you are now in developer mode/i,
    /jailbreak/i,
    /bypass (all )?(security|guardrails|auth)/i,
    /drop\s+table/i,
    /select\s+\*\s+from/i,
    /<script>/i,
    /system\s+prompt/i,
  ];

  for (const pattern of injectionPatterns) {
    if (pattern.test(lower)) {
      return {
        passed: false,
        reason: 'SYSTEM GUARDRAIL INTERVENTION: Prompt contains prohibited instructions or injection patterns. Execution blocked.',
        flagType: 'PROMPT_INJECTION',
        sanitizedPrompt: prompt,
      };
    }
  }

  return {
    passed: true,
    sanitizedPrompt: maskPII(prompt),
  };
}
