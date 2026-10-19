import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Building,
  Globe,
  Coins,
  ArrowRight,
  ShieldCheck,
  CheckSquare,
  Sparkles,
  AlertTriangle,
  Info,
  CheckCircle2,
  DollarSign,
  Check
} from 'lucide-react';
import { PaymentPlanInput, NavigationPage } from '../../types';
import { UNIVERSITIES, COUNTRIES, CURRENCY_OPTIONS } from '../../data/mockData';
import { getIllustrativeRate, formatCurrency, calculateTransferRoutes } from '../../utils/calculations';
import { DemoDisclaimer } from '../common/DemoDisclaimer';

interface PaymentPlanPageProps {
  currentPlan: PaymentPlanInput;
  onUpdatePlan: (plan: PaymentPlanInput) => void;
  onNavigate: (page: NavigationPage) => void;
  onTriggerAgentWithPlan: (plan: PaymentPlanInput) => void;
}

export const PaymentPlanPage: React.FC<PaymentPlanPageProps> = ({
  currentPlan,
  onUpdatePlan,
  onNavigate,
  onTriggerAgentWithPlan,
}) => {
  const [formData, setFormData] = useState<PaymentPlanInput>(currentPlan);
  const [hasAnalyzed, setHasAnalyzed] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setFormData(currentPlan);
  }, [currentPlan]);

  const handleUniversityChange = (univId: string) => {
    const selected = UNIVERSITIES.find((u) => u.id === univId);
    if (selected) {
      const defaultDest = selected.country;
      const defaultCur = selected.acceptedCurrencies[0] || 'USD';
      setFormData((prev) => ({
        ...prev,
        universityId: selected.id,
        universityName: selected.name,
        destinationCountry: defaultDest,
        tuitionCurrency: defaultCur,
      }));
    }
  };

  const handleValidateAndAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formData.universityName) errors.universityName = 'Please select a destination university';
    if (!formData.tuitionAmount || formData.tuitionAmount <= 0) errors.tuitionAmount = 'Tuition amount must be greater than 0';
    if (!formData.paymentDeadline) errors.paymentDeadline = 'Please select a payment deadline';

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setHasAnalyzed(true);
      onUpdatePlan(formData);
      setSaveNotice(`Payment plan for ${formData.universityName} saved successfully!`);
      setTimeout(() => setSaveNotice(null), 3500);
    }, 300);
  };

  // Calculations for the current form state
  const routes = calculateTransferRoutes(
    formData.tuitionAmount || 8000,
    formData.tuitionCurrency,
    formData.sourceCurrency
  );
  const bestRoute = routes.find((r) => r.isLowestCost) || routes[0];
  const illustrativeRate = getIllustrativeRate(formData.sourceCurrency, formData.tuitionCurrency);
  const baseCostInSource = (formData.tuitionAmount || 8000) * illustrativeRate;
  const sampleFee = bestRoute.fixedFeeOriginCurrency;
  const estimatedTotal = bestRoute.estimatedOriginCost;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">New Payment Plan</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure tuition parameters to calculate estimated foreign exchange costs and identify required documentation.
          </p>
        </div>

        <button
          onClick={() => {
            onTriggerAgentWithPlan(formData);
            onNavigate('agent');
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100/80 border border-blue-200/80 text-xs font-medium transition-colors"
        >
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span>Analyze with FeeBridge Copilot</span>
        </button>
      </div>

      <DemoDisclaimer compact />

      {saveNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveNotice}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form: 7 Columns */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs">
          <form onSubmit={handleValidateAndAnalyze} className="space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-semibold text-slate-900">1. Student & University Details</h3>
              <p className="text-xs text-slate-500">Destination institution and remit origin</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Origin Country */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Student's Current Country (Origin)
                </label>
                <select
                  value={formData.originCountry}
                  onChange={(e) => {
                    const country = COUNTRIES.find((c) => c.name === e.target.value);
                    setFormData((prev) => ({
                      ...prev,
                      originCountry: e.target.value,
                      sourceCurrency: country ? country.defaultCurrency : prev.sourceCurrency,
                    }));
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Destination University */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Destination University *
                </label>
                <select
                  value={formData.universityId}
                  onChange={(e) => handleUniversityChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {UNIVERSITIES.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.country})
                    </option>
                  ))}
                </select>
                {validationErrors.universityName && (
                  <p className="text-[11px] text-rose-600 mt-1">{validationErrors.universityName}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Student Full Name</label>
                <input
                  type="text"
                  value={formData.studentName}
                  onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                  placeholder="e.g. Farhan Ahmed"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Student / Applicant ID</label>
                <input
                  type="text"
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  placeholder="e.g. 32401899"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="border-b border-slate-100 pb-3 pt-2">
              <h3 className="text-sm font-semibold text-slate-900">2. Financial & Payment Scope</h3>
              <p className="text-xs text-slate-500">Amounts, currency pairing, and institutional due date</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Tuition Amount */}
              <div className="sm:col-span-1">
                <label className="block text-xs font-medium text-slate-700 mb-1">Tuition Amount *</label>
                <input
                  type="number"
                  value={formData.tuitionAmount}
                  onChange={(e) => setFormData({ ...formData, tuitionAmount: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  placeholder="8000"
                />
                {validationErrors.tuitionAmount && (
                  <p className="text-[11px] text-rose-600 mt-1">{validationErrors.tuitionAmount}</p>
                )}
              </div>

              {/* Tuition Currency */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Tuition Currency</label>
                <select
                  value={formData.tuitionCurrency}
                  onChange={(e) => setFormData({ ...formData, tuitionCurrency: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {CURRENCY_OPTIONS.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} - {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Source Currency */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Source Currency</label>
                <select
                  value={formData.sourceCurrency}
                  onChange={(e) => setFormData({ ...formData, sourceCurrency: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {CURRENCY_OPTIONS.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} - {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Payment Deadline */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Payment Deadline *</label>
                <input
                  type="date"
                  value={formData.paymentDeadline}
                  onChange={(e) => setFormData({ ...formData, paymentDeadline: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
                {validationErrors.paymentDeadline && (
                  <p className="text-[11px] text-rose-600 mt-1">{validationErrors.paymentDeadline}</p>
                )}
              </div>

              {/* Payment Purpose */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Payment Purpose</label>
                <select
                  value={formData.paymentPurpose}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      paymentPurpose: e.target.value as PaymentPlanInput['paymentPurpose'],
                    })
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="Tuition Deposit">Tuition Deposit (Admission Acceptance)</option>
                  <option value="Full Semester Tuition">Full Semester Tuition</option>
                  <option value="Accommodation Fee">On-Campus Accommodation Fee</option>
                  <option value="Health Insurance & Student Fee">Health Insurance & Student Fee</option>
                </select>
              </div>
            </div>

            {/* Optional Notes */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Remittance Notes & Verification Instructions (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                placeholder="e.g. Admitted for Autumn intake. Bank of China Hangzhou receiving branch specified on offer letter."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isAnalyzing}
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Analyzing Payment Parameters...</span>
                  </>
                ) : (
                  <>
                    <span>Analyze Payment</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Output: 5 Columns (Simulated Analysis Result) */}
        <div className="lg:col-span-5 space-y-4">
          {hasAnalyzed ? (
            <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Analysis Breakdown</h3>
                  <p className="text-xs text-slate-500">Calculated with local deterministic model</p>
                </div>
                <span className="text-[11px] font-mono font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  Status: Ready
                </span>
              </div>

              {/* Financial Summary Box */}
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-500">Requested Tuition</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {formatCurrency(formData.tuitionAmount, formData.tuitionCurrency)}
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-500">Illustrative Exchange Rate</span>
                  <span className="text-xs font-mono text-slate-700">
                    1 {formData.tuitionCurrency} ≈ {illustrativeRate} {formData.sourceCurrency}
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-500">Sample Transfer / Network Fee</span>
                  <span className="text-xs text-slate-700">
                    {sampleFee > 0 ? formatCurrency(sampleFee, formData.sourceCurrency) : 'Included in rail'}
                  </span>
                </div>

                <div className="border-t border-slate-200 pt-2 flex items-baseline justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-900">Estimated Total Cost</span>
                    <p className="text-[10px] text-slate-400">Via recommended student rail</p>
                  </div>
                  <span className="text-lg font-bold text-blue-700">
                    ~{formatCurrency(estimatedTotal, formData.sourceCurrency)}
                  </span>
                </div>
              </div>

              {/* Important Assumptions */}
              <div className="space-y-1.5 text-xs text-slate-600">
                <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-600" />
                  <span>Key Remittance Assumptions</span>
                </p>
                <ul className="space-y-1 pl-5 list-disc text-slate-500 text-[11px] leading-relaxed">
                  <li>Remittance will be initiated from an authorized dealer bank in {formData.originCountry}.</li>
                  <li>Beneficiary receiving account is set up for inbound telegraphic transfer in {formData.tuitionCurrency}.</li>
                  <li>No additional intermediary bank deductions occur if routed via student rail.</li>
                </ul>
              </div>

              {/* Missing Information / Flags */}
              <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200/70 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Missing Information & Verification Flags</span>
                </div>
                <div className="text-xs text-amber-800 space-y-1 leading-relaxed pl-5 list-disc">
                  <p>
                    • Reference format{' '}
                    <code className="font-mono bg-white px-1 rounded text-[11px]">
                      {UNIVERSITIES.find((u) => u.id === formData.universityId)?.exampleReference || 'INST-ID-NAME'}
                    </code>{' '}
                    mandated for Field 70.
                  </p>
                  <p>
                    • {UNIVERSITIES.find((u) => u.id === formData.universityId)?.specialInstructions ||
                      'Confirm outward educational remittance guidelines with your bank.'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  onClick={() => onNavigate('verification')}
                  className="w-full py-2 px-3 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-slate-500" />
                  <span>Verify Payment Instructions</span>
                </button>

                <button
                  onClick={() => onNavigate('checklists')}
                  className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <CheckSquare className="w-4 h-4" />
                  <span>Generate Payment Checklist</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-400 text-center leading-normal">
                Displayed rates and fees are illustrative simulations for planning only.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-400 space-y-2">
              <Coins className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-medium text-slate-600">No payment plan analyzed yet</p>
              <p className="text-[11px]">Fill in the details on the left and click "Analyze Payment" to view breakdown.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
