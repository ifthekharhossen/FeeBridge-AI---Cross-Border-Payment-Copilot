import React, { useState, useEffect } from 'react';
import {
  ArrowLeftRight,
  TrendingDown,
  Clock,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sparkles,
  ArrowRight,
  Check,
  Building,
  DollarSign
} from 'lucide-react';
import { PaymentPlanInput, TransferRoute, NavigationPage } from '../../types';
import { calculateTransferRoutes, formatCurrency } from '../../utils/calculations';
import { DemoDisclaimer } from '../common/DemoDisclaimer';

interface TransferComparisonPageProps {
  currentPlan: PaymentPlanInput;
  onUpdatePlan: (plan: PaymentPlanInput) => void;
  onNavigate: (page: NavigationPage) => void;
  onTriggerAgentWithPrompt?: (prompt: string) => void;
}

export const TransferComparisonPage: React.FC<TransferComparisonPageProps> = ({
  currentPlan,
  onUpdatePlan,
  onNavigate,
  onTriggerAgentWithPrompt,
}) => {
  const [tuitionAmount, setTuitionAmount] = useState<number>(currentPlan.tuitionAmount || 8000);
  const [selectedRouteId, setSelectedRouteId] = useState<string>(() => {
    if (currentPlan.selectedRoute) {
      if (currentPlan.selectedRoute.includes('FinTech')) return 'student_fintech';
      if (currentPlan.selectedRoute.includes('Digital')) return 'digital_rail';
      if (currentPlan.selectedRoute.includes('Bank') || currentPlan.selectedRoute.includes('SWIFT')) return 'direct_bank';
    }
    return 'student_fintech';
  });
  const [confirmedNotice, setConfirmedNotice] = useState<string | null>(null);

  useEffect(() => {
    if (currentPlan.tuitionAmount) {
      setTuitionAmount(currentPlan.tuitionAmount);
    }
  }, [currentPlan.tuitionAmount]);

  const routes = calculateTransferRoutes(tuitionAmount, currentPlan.tuitionCurrency, currentPlan.sourceCurrency);

  const handleSelectRoute = (route: TransferRoute) => {
    setSelectedRouteId(route.id);
    onUpdatePlan({
      ...currentPlan,
      tuitionAmount: tuitionAmount,
      selectedRoute: route.name,
      notes: `${currentPlan.notes || ''} [Selected Route: ${route.name}]`.trim(),
    });
    setConfirmedNotice(`Selected "${route.name}" for your payment plan.`);
    setTimeout(() => setConfirmedNotice(null), 3000);
  };

  const handleAskAgent = () => {
    const prompt = `Recommend the best transfer route for ${currentPlan.tuitionCurrency} ${tuitionAmount} to ${currentPlan.universityName} from ${currentPlan.originCountry}.`;
    if (onTriggerAgentWithPrompt) {
      onTriggerAgentWithPrompt(prompt);
    }
    onNavigate('agent');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Compare Transfer Costs</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluate foreign exchange spreads, fixed SWIFT fees, and intermediary deduction risk across cross-border payment corridors.
          </p>
        </div>

        <button
          onClick={handleAskAgent}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100/80 border border-blue-200/80 text-xs font-medium transition-colors cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span>Ask Agent to Recommend Route</span>
        </button>
      </div>

      <DemoDisclaimer compact />

      {/* Corridor & Amount Adjuster Bar */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Origin Corridor</span>
            <span className="font-semibold text-slate-800">{currentPlan.originCountry} ({currentPlan.sourceCurrency})</span>
          </div>

          <div className="text-slate-300">
            <ArrowRight className="w-4 h-4" />
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Destination</span>
            <span className="font-semibold text-slate-800">{currentPlan.universityName} ({currentPlan.destinationCountry})</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-slate-600">Tuition Amount:</label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
              {currentPlan.tuitionCurrency}
            </span>
            <input
              type="number"
              value={tuitionAmount}
              onChange={(e) => setTuitionAmount(Math.max(1, Number(e.target.value)))}
              className="pl-12 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-32 font-semibold text-slate-800"
            />
          </div>
        </div>
      </div>

      {confirmedNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{confirmedNotice}</span>
          </div>
          <button
            onClick={() => onNavigate('payment-plan')}
            className="text-xs font-semibold text-emerald-700 underline"
          >
            Go to Plan
          </button>
        </div>
      )}

      {/* 3 Illustrative Route Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {routes.map((route) => {
          const isSelected = selectedRouteId === route.id;
          return (
            <div
              key={route.id}
              className={`rounded-xl border p-5 shadow-xs transition-all relative flex flex-col justify-between ${
                isSelected
                  ? 'bg-blue-50/30 border-blue-600 ring-2 ring-blue-600/20'
                  : 'bg-white border-slate-200/90 hover:border-slate-300'
              }`}
            >
              <div>
                {/* Top badges */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-500">
                    {route.badgeTitle}
                  </span>
                  {route.isLowestCost && (
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                      Lowest Estimated Total
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-slate-900 leading-snug">{route.name}</h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{route.recommendedFor}</p>

                {/* Primary Cost Box */}
                <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-slate-500">Estimated Total Cost:</span>
                    <span className="text-base font-bold text-slate-900">
                      ~{formatCurrency(route.estimatedOriginCost, currentPlan.sourceCurrency)}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between text-[11px]">
                    <span className="text-slate-500">Illustrative Rate:</span>
                    <span className="font-mono text-slate-700">
                      1 {currentPlan.tuitionCurrency} ≈ {route.illustrativeRate} {currentPlan.sourceCurrency}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between text-[11px]">
                    <span className="text-slate-500">Sample Transfer Fee:</span>
                    <span className="text-slate-700">
                      {route.fixedFeeOriginCurrency > 0
                        ? formatCurrency(route.fixedFeeOriginCurrency, currentPlan.sourceCurrency)
                        : 'Included in rate'}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between text-[11px] pt-1 border-t border-slate-200">
                    <span className="text-slate-500">Recipient Receives:</span>
                    <span className="font-semibold text-emerald-700">
                      {formatCurrency(route.estimatedRecipientAmount, currentPlan.tuitionCurrency)}
                    </span>
                  </div>
                </div>

                {/* Metrics: Speed & Deductions */}
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Speed:</span>
                    </span>
                    <span className="font-medium text-slate-800">{route.estimatedDays}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Shield className="w-3.5 h-3.5 text-slate-400" />
                      <span>Intermediary Risk:</span>
                    </span>
                    <span
                      className={`font-medium ${
                        route.intermediaryBankRisk.includes('Zero')
                          ? 'text-emerald-700'
                          : route.intermediaryBankRisk.includes('High')
                          ? 'text-rose-700'
                          : 'text-slate-800'
                      }`}
                    >
                      {route.intermediaryBankRisk}
                    </span>
                  </div>
                </div>

                {/* Pros and Cons */}
                <div className="mt-4 space-y-2 text-[11px]">
                  <div className="space-y-1">
                    {route.pros.map((pro, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-slate-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{pro}</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1 pt-1">
                    {route.cons.map((con, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-slate-500">
                        <span className="text-slate-400 shrink-0 font-bold">•</span>
                        <span>{con}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-5 pt-3 border-t border-slate-100">
                <button
                  onClick={() => handleSelectRoute(route)}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300'
                  }`}
                >
                  {isSelected ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Selected for Payment Plan</span>
                    </>
                  ) : (
                    <span>Use This Route in Plan</span>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparison Matrix Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Corridor Comparison Matrix</h3>
          <p className="text-xs text-slate-500">Feature and risk breakdown for {currentPlan.originCountry} to {currentPlan.destinationCountry}</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-medium uppercase tracking-wider">
                <th className="py-2.5 pr-4">Evaluation Criteria</th>
                <th className="py-2.5 px-4">Student FinTech Rail</th>
                <th className="py-2.5 px-4">Digital Multi-Currency Rail</th>
                <th className="py-2.5 pl-4">Commercial Bank SWIFT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="py-3 pr-4 font-semibold text-slate-900">Exchange Rate Margin</td>
                <td className="py-3 px-4 font-medium text-emerald-700">~1.4% (Direct corridor rate)</td>
                <td className="py-3 px-4 font-medium text-emerald-700">~0.6% + platform variable fee</td>
                <td className="py-3 px-4 font-medium text-rose-700">~2.8% (Retail branch spread)</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-semibold text-slate-900">Intermediary Correspondent Deductions</td>
                <td className="py-3 px-4 text-emerald-700 font-medium">Guaranteed zero deductions</td>
                <td className="py-3 px-4 text-slate-700">Rare (depends on local clearing)</td>
                <td className="py-3 px-4 text-rose-700 font-medium">High risk ($15–$35 en route)</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-semibold text-slate-900">University Ledger Integration</td>
                <td className="py-3 px-4 text-emerald-700 font-medium">Direct automated matching</td>
                <td className="py-3 px-4 text-slate-600">Manual student ID audit</td>
                <td className="py-3 px-4 text-slate-600">Manual SWIFT Field 70 audit</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-semibold text-slate-900">Proof of Payment Documentation</td>
                <td className="py-3 px-4 text-slate-700">Instant PDF payment confirmation</td>
                <td className="py-3 px-4 text-slate-700">Digital transfer tracking receipt</td>
                <td className="py-3 px-4 text-slate-700">SWIFT MT103 telegraphic advice</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-semibold text-slate-900">Estimated Duration</td>
                <td className="py-3 px-4 text-slate-700">1 – 2 business days</td>
                <td className="py-3 px-4 text-slate-700">1 – 3 business days</td>
                <td className="py-3 px-4 text-slate-700">3 – 5 business days</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
