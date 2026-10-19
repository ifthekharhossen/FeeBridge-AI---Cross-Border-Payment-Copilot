import { BASE_FX_RATES } from '../data/mockData';
import { TransferRoute, VerificationResult, VerificationFieldCheck, UniversityMockData } from '../types';

/**
 * Returns illustrative exchange rate: 1 targetCurrency = how many sourceCurrency
 * For example: 1 CNY = ~17.65 BDT
 */
export function getIllustrativeRate(sourceCurrency: string, targetCurrency: string): number {
  if (sourceCurrency === targetCurrency) return 1.0;
  
  const sourcePerUsd = BASE_FX_RATES[sourceCurrency] || 1.0;
  const targetPerUsd = BASE_FX_RATES[targetCurrency] || 1.0;
  
  // Rate: 1 target = (sourcePerUsd / targetPerUsd)
  const baseRate = sourcePerUsd / targetPerUsd;
  return Number(baseRate.toFixed(4));
}

export function formatCurrency(amount: number, currency: string): string {
  try {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    });
    return formatter.format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  }
}

export function formatNumber(val: number): string {
  return val.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

export function calculateTransferRoutes(
  tuitionAmount: number,
  tuitionCurrency: string,
  sourceCurrency: string
): TransferRoute[] {
  const baseRate = getIllustrativeRate(sourceCurrency, tuitionCurrency);

  // Route 1: Traditional University Bank Wire (SWIFT)
  // Retail bank FX markup approx +2.8%, fixed wire dispatch fee
  const bankFxRate = baseRate * 1.028;
  const bankFixedFee = sourceCurrency === 'BDT' ? 2600 : sourceCurrency === 'USD' ? 30 : 25;
  const bankOriginTuition = tuitionAmount * bankFxRate;
  const bankTotalOrigin = Math.round(bankOriginTuition + bankFixedFee);

  // Route 2: International Student FinTech Rail (Flywire / Convera style)
  // Tailored student corridor markup ~1.4%, zero fixed wire fee, guaranteed gross settlement
  const studentFxRate = baseRate * 1.014;
  const studentFixedFee = 0;
  const studentOriginTuition = tuitionAmount * studentFxRate;
  const studentTotalOrigin = Math.round(studentOriginTuition + studentFixedFee);

  // Route 3: Digital Multi-Currency Transfer Rail (e.g. Wise style)
  // Tight FX markup ~0.6%, combined network fee 0.75%
  const digitalFxRate = baseRate * 1.006;
  const digitalFixedFee = sourceCurrency === 'BDT' ? 850 : 10;
  const digitalPercentFee = (tuitionAmount * digitalFxRate) * 0.0075;
  const digitalTotalOrigin = Math.round(tuitionAmount * digitalFxRate + digitalFixedFee + digitalPercentFee);

  const routes: TransferRoute[] = [
    {
      id: 'student_fintech',
      name: 'International Student FinTech Rail',
      providerType: 'student_fintech',
      badgeTitle: 'University Integrated',
      illustrativeRate: Number(studentFxRate.toFixed(4)),
      rateInverted: Number((1 / studentFxRate).toFixed(6)),
      fixedFeeOriginCurrency: studentFixedFee,
      variableFeePercent: 1.4,
      estimatedOriginCost: studentTotalOrigin,
      estimatedRecipientAmount: tuitionAmount,
      estimatedDays: '1 – 2 business days',
      trackingScore: 'End-to-End',
      intermediaryBankRisk: 'Zero (Guaranteed gross)',
      pros: [
        'Direct integration with university admissions ledger',
        'Guaranteed zero intermediary correspondent deductions',
        'Official university confirmation receipt provided automatically',
      ],
      cons: [
        'Requires payment within 48-hour locked quote window',
      ],
      recommendedFor: 'Best for peace-of-mind tuition matching and avoiding short-payment holds.',
    },
    {
      id: 'digital_rail',
      name: 'Digital Multi-Currency Rail',
      providerType: 'digital_rail',
      badgeTitle: 'Competitive Rate',
      illustrativeRate: Number(digitalFxRate.toFixed(4)),
      rateInverted: Number((1 / digitalFxRate).toFixed(6)),
      fixedFeeOriginCurrency: Math.round(digitalFixedFee + digitalPercentFee),
      variableFeePercent: 0.75,
      estimatedOriginCost: digitalTotalOrigin,
      estimatedRecipientAmount: tuitionAmount,
      estimatedDays: '1 – 3 business days',
      trackingScore: 'Real-Time',
      intermediaryBankRisk: 'Low',
      pros: [
        'Transparent mid-market benchmarked exchange rates',
        'Live tracking portal with status notifications',
      ],
      cons: [
        'Must ensure sender name exactly matches university student name',
        'Local payout partner varies by destination region',
      ],
      recommendedFor: 'Cost-conscious students sending funds with pre-verified bank accounts.',
    },
    {
      id: 'direct_bank',
      name: 'Commercial Bank Direct Wire (SWIFT)',
      providerType: 'direct_bank',
      badgeTitle: 'Traditional SWIFT',
      illustrativeRate: Number(bankFxRate.toFixed(4)),
      rateInverted: Number((1 / bankFxRate).toFixed(6)),
      fixedFeeOriginCurrency: bankFixedFee,
      variableFeePercent: 2.8,
      estimatedOriginCost: bankTotalOrigin,
      estimatedRecipientAmount: tuitionAmount,
      estimatedDays: '3 – 5 business days',
      trackingScore: 'Basic',
      intermediaryBankRisk: 'High (Deductions possible)',
      pros: [
        'Supported by nearly all physical high-street bank branches',
        'Direct bank-to-bank SWIFT MT103 telegraphic message generated',
      ],
      cons: [
        'Higher retail exchange rate markup',
        'Intermediary correspondent banks may deduct $15–$35 en route',
        'Manual student ID matching by university finance office required',
      ],
      recommendedFor: 'Students who must pay over the counter using physical cash or local bank loans.',
    },
  ];

  // Find lowest total cost
  let lowestCost = Infinity;
  let lowestIndex = -1;
  routes.forEach((r, idx) => {
    if (r.estimatedOriginCost < lowestCost) {
      lowestCost = r.estimatedOriginCost;
      lowestIndex = idx;
    }
  });

  if (lowestIndex !== -1) {
    routes[lowestIndex].isLowestCost = true;
  }

  return routes;
}

export function verifyPaymentDetails(
  university: UniversityMockData,
  entered: {
    beneficiaryName: string;
    bankName: string;
    accountNo: string;
    swiftBic: string;
    reference: string;
  }
): VerificationResult {
  const checks: VerificationFieldCheck[] = [];

  // 1. Beneficiary Name Check
  const normEnteredBeneficiary = entered.beneficiaryName.trim().toUpperCase();
  const normExpectedBeneficiary = university.officialBeneficiaryName.trim().toUpperCase();
  
  if (!entered.beneficiaryName.trim()) {
    checks.push({
      field: 'beneficiaryName',
      label: 'Beneficiary Name',
      enteredValue: '(Empty)',
      expectedValue: university.officialBeneficiaryName,
      status: 'missing',
      explanation: 'Beneficiary name was left blank.',
      guidance: 'Must match official university accounts name letter-for-letter to pass AML screening.',
    });
  } else if (normEnteredBeneficiary === normExpectedBeneficiary) {
    checks.push({
      field: 'beneficiaryName',
      label: 'Beneficiary Name',
      enteredValue: entered.beneficiaryName,
      expectedValue: university.officialBeneficiaryName,
      status: 'match',
      explanation: 'Exact match with university institutional receiving account.',
      guidance: 'Verified against institution banking registry.',
    });
  } else if (normExpectedBeneficiary.includes(normEnteredBeneficiary) || normEnteredBeneficiary.includes('UNIVERSITY')) {
    checks.push({
      field: 'beneficiaryName',
      label: 'Beneficiary Name',
      enteredValue: entered.beneficiaryName,
      expectedValue: university.officialBeneficiaryName,
      status: 'needs_confirmation',
      explanation: 'Close match, but formatting or department suffix differs from official title.',
      guidance: `Recommend updating to: "${university.officialBeneficiaryName}".`,
    });
  } else {
    checks.push({
      field: 'beneficiaryName',
      label: 'Beneficiary Name',
      enteredValue: entered.beneficiaryName,
      expectedValue: university.officialBeneficiaryName,
      status: 'mismatch',
      explanation: 'Beneficiary name does not match the official university receiving entity.',
      guidance: 'Risk of wire rejection. Always verify with official tuition invoice.',
    });
  }

  // 2. Bank Name Check
  const normEnteredBank = entered.bankName.trim().toUpperCase();
  const normExpectedBank = university.officialBankName.trim().toUpperCase();
  if (!entered.bankName.trim()) {
    checks.push({
      field: 'bankName',
      label: 'Receiving Bank Name',
      enteredValue: '(Empty)',
      expectedValue: university.officialBankName,
      status: 'missing',
      explanation: 'Receiving bank name was not provided.',
      guidance: `University receiving bank is ${university.officialBankName}.`,
    });
  } else if (normEnteredBank.split(' ')[0] === normExpectedBank.split(' ')[0]) {
    checks.push({
      field: 'bankName',
      label: 'Receiving Bank Name',
      enteredValue: entered.bankName,
      expectedValue: university.officialBankName,
      status: 'match',
      explanation: 'Confirmed receiving financial institution.',
      guidance: 'Branch routing aligned with destination clearing hub.',
    });
  } else {
    checks.push({
      field: 'bankName',
      label: 'Receiving Bank Name',
      enteredValue: entered.bankName,
      expectedValue: university.officialBankName,
      status: 'mismatch',
      explanation: 'Entered bank differs from official university deposit institution.',
      guidance: `Verify branch details on official admission letter. Expected: ${university.officialBankName}`,
    });
  }

  // 3. Account / IBAN Check
  const cleanEnteredAcc = entered.accountNo.replace(/\s+/g, '');
  const cleanExpectedAcc = university.officialAccountNo.replace(/\s+/g, '');
  if (!cleanEnteredAcc) {
    checks.push({
      field: 'accountNo',
      label: 'Account / IBAN',
      enteredValue: '(Empty)',
      expectedValue: university.officialAccountNo,
      status: 'missing',
      explanation: 'Account or IBAN number is required.',
      guidance: 'Account number must be exact digit match.',
    });
  } else if (cleanEnteredAcc === cleanExpectedAcc) {
    checks.push({
      field: 'accountNo',
      label: 'Account / IBAN',
      enteredValue: entered.accountNo,
      expectedValue: university.officialAccountNo,
      status: 'match',
      explanation: 'Account number matches official tuition collection ledger.',
      guidance: 'Confirmed safe for telegraphic transfer.',
    });
  } else {
    checks.push({
      field: 'accountNo',
      label: 'Account / IBAN',
      enteredValue: entered.accountNo,
      expectedValue: university.officialAccountNo,
      status: 'mismatch',
      explanation: 'Account number does not match official instructions.',
      guidance: `Critical mismatch! Verify against official invoice: ${university.officialAccountNo}`,
    });
  }

  // 4. SWIFT / BIC Check
  const normEnteredSwift = entered.swiftBic.replace(/\s+/g, '').toUpperCase();
  const normExpectedSwift = university.officialSwiftBic.replace(/\s+/g, '').toUpperCase();
  if (!normEnteredSwift) {
    checks.push({
      field: 'swiftBic',
      label: 'SWIFT / BIC Code',
      enteredValue: '(Empty)',
      expectedValue: university.officialSwiftBic,
      status: 'missing',
      explanation: 'SWIFT code is missing.',
      guidance: 'International transfers cannot route without valid 8 or 11 character SWIFT code.',
    });
  } else if (normEnteredSwift === normExpectedSwift) {
    checks.push({
      field: 'swiftBic',
      label: 'SWIFT / BIC Code',
      enteredValue: entered.swiftBic,
      expectedValue: university.officialSwiftBic,
      status: 'match',
      explanation: 'SWIFT / BIC code confirmed and valid for international clearing.',
      guidance: 'Direct telegraphic endpoint verified.',
    });
  } else {
    checks.push({
      field: 'swiftBic',
      label: 'SWIFT / BIC Code',
      enteredValue: entered.swiftBic,
      expectedValue: university.officialSwiftBic,
      status: 'mismatch',
      explanation: 'SWIFT code does not match university bank registry.',
      guidance: `Expected: ${university.officialSwiftBic}. Incorrect code may cause funds to bounce.`,
    });
  }

  // 5. Payment Reference / Student ID Check (CRITICAL)
  const ref = entered.reference.trim();
  if (!ref) {
    checks.push({
      field: 'reference',
      label: 'Payment Reference (Field 70)',
      enteredValue: '(Empty)',
      expectedValue: university.exampleReference,
      status: 'missing',
      explanation: 'CRITICAL: No payment reference provided.',
      guidance: `Without a formatted reference like "${university.exampleReference}", the university finance desk cannot identify who sent the funds. Your tuition hold will not clear!`,
    });
  } else if (ref.includes('-') && ref.length >= 8) {
    // Check if looks structured
    checks.push({
      field: 'reference',
      label: 'Payment Reference (Field 70)',
      enteredValue: entered.reference,
      expectedValue: university.exampleReference,
      status: 'match',
      explanation: 'Reference contains required structure with identifiers.',
      guidance: 'Ensure your remitting bank copies this verbatim into Field 70 (Remittance Information).',
    });
  } else {
    checks.push({
      field: 'reference',
      label: 'Payment Reference (Field 70)',
      enteredValue: entered.reference,
      expectedValue: university.exampleReference,
      status: 'needs_confirmation',
      explanation: 'Reference is present but missing standard student identifier format.',
      guidance: `Required format: ${university.requiredReferenceFormat}. Recommended: "${university.exampleReference}".`,
    });
  }

  // Determine overall status
  const hasMismatch = checks.some((c) => c.status === 'mismatch');
  const hasMissing = checks.some((c) => c.status === 'missing');
  const hasNeedsConf = checks.some((c) => c.status === 'needs_confirmation');
  
  let overallStatus: 'verified' | 'action_required' | 'critical_mismatch' = 'verified';
  let matchScore = 100;
  
  if (hasMismatch) {
    overallStatus = 'critical_mismatch';
    matchScore = 40;
  } else if (hasMissing || hasNeedsConf) {
    overallStatus = 'action_required';
    matchScore = 75;
  }

  let summary = 'All primary banking fields match university official records.';
  if (overallStatus === 'critical_mismatch') {
    summary = 'Critical mismatches detected. Do not proceed until beneficiary and account number are reconciled.';
  } else if (overallStatus === 'action_required') {
    summary = 'Action required: Complete missing reference code to avoid unallocated deposit delays.';
  }

  return {
    overallStatus,
    matchScore,
    checks,
    summary,
    verifiedAt: new Date().toISOString(),
  };
}
