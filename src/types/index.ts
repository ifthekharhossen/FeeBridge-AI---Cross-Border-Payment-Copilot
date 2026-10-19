export type NavigationPage =
  | 'overview'
  | 'payment-plan'
  | 'agent'
  | 'compare-costs'
  | 'verification'
  | 'checklists'
  | 'history'
  | 'settings';

export interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
  flag: string;
}

export interface UniversityMockData {
  id: string;
  name: string;
  country: string;
  city: string;
  officialBeneficiaryName: string;
  officialBankName: string;
  officialAccountNo: string;
  officialSwiftBic: string;
  requiredReferenceFormat: string;
  exampleReference: string;
  acceptedCurrencies: string[];
  depositDeadlineBufferDays: number;
  specialInstructions: string;
}

export interface UserProfile {
  studentName: string;
  studentId: string;
  originCountry: string;
  preferredCurrency: string;
  preferredLanguage: string;
  emailAlerts: boolean;
  deadlineReminders: boolean;
  fxRateAlerts: boolean;
}

export interface PaymentPlanInput {
  originCountry: string;
  destinationCountry: string;
  universityId: string;
  universityName: string;
  tuitionAmount: number;
  tuitionCurrency: string;
  sourceCurrency: string;
  paymentDeadline: string;
  paymentPurpose: 'Tuition Deposit' | 'Full Semester Tuition' | 'Accommodation Fee' | 'Health Insurance & Student Fee';
  studentName: string;
  studentId: string;
  notes?: string;
  selectedRoute?: string;
}

export interface TransferRoute {
  id: string;
  name: string;
  providerType: 'direct_bank' | 'student_fintech' | 'digital_rail';
  badgeTitle: string;
  illustrativeRate: number; // e.g., 1 CNY = 17.70 BDT
  rateInverted: number; // 1 BDT = x CNY
  fixedFeeOriginCurrency: number;
  variableFeePercent: number;
  estimatedOriginCost: number;
  estimatedRecipientAmount: number;
  estimatedDays: string;
  trackingScore: 'Basic' | 'End-to-End' | 'Real-Time';
  intermediaryBankRisk: 'High (Deductions possible)' | 'Zero (Guaranteed gross)' | 'Low';
  isLowestCost?: boolean;
  pros: string[];
  cons: string[];
  recommendedFor: string;
}

export interface VerificationFieldCheck {
  field: string;
  label: string;
  enteredValue: string;
  expectedValue: string;
  status: 'match' | 'missing' | 'mismatch' | 'needs_confirmation';
  explanation: string;
  guidance: string;
}

export interface VerificationResult {
  overallStatus: 'verified' | 'action_required' | 'critical_mismatch';
  matchScore: number; // 0 to 100
  checks: VerificationFieldCheck[];
  summary: string;
  verifiedAt: string;
}

export interface ChecklistTask {
  id: string;
  title: string;
  category: 'verification' | 'financial' | 'documentation' | 'confirmation';
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  requiresExternalConfirmation: boolean;
  details: string;
  dueDate?: string;
  source: 'auto_generated' | 'user_added';
}

export interface AgentToolExecution {
  id: string;
  toolName: 'compare_transfer_costs' | 'check_payment_instructions' | 'create_payment_checklist' | 'calculate_fx_spread';
  label: string;
  status: 'pending' | 'running' | 'completed' | 'flagged';
  timestamp: string;
  inputPayload: Record<string, unknown>;
  outputSummary: string;
  findings: {
    type: 'success' | 'warning' | 'alert' | 'info';
    text: string;
  }[];
}

export interface AgentMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  content: string;
  structuredBreakdown?: {
    summary: string;
    costOverview?: {
      sourceAmount: number;
      sourceCurrency: string;
      targetAmount: number;
      targetCurrency: string;
      estimatedRate: number;
      feeSummary: string;
      routeId?: string;
      routeName?: string;
    };
    verificationFindings?: {
      status: 'pass' | 'warning' | 'mismatch';
      title: string;
      detail: string;
    }[];
    missingItems?: string[];
    actionItems?: string[];
  };
  toolExecutions?: AgentToolExecution[];
}

export interface ActivityRecord {
  id: string;
  date: string;
  university: string;
  amount: number;
  currency: string;
  originCountry: string;
  destinationCountry: string;
  status: 'Plan Created' | 'Verified' | 'Action Needed' | 'Checklist Ready' | 'Route Selected';
  selectedRoute?: string;
  notes?: string;
}
