
import React from 'react';
import {
  ArrowRight,
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  CreditCard,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

import {
  NavigationPage,
  ActivityRecord,
  PaymentPlanInput,
  ChecklistTask,
  UserProfile,
} from '../../types';

import { DemoDisclaimer } from '../common/DemoDisclaimer';
import { StatusBadge } from '../common/StatusBadge';
import { formatCurrency, calculateTransferRoutes } from '../../utils/calculations';

interface OverviewPageProps {
  onNavigate: (page: NavigationPage) => void;
  onSelectPlan: (planId?: string) => void;
  recentActivities: ActivityRecord[];
  currentPlan: PaymentPlanInput;
  checklists: ChecklistTask[];
  onTriggerAgentWithPrompt?: (prompt: string) => void;
  userProfile?: UserProfile;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  onNavigate,
  onSelectPlan,
  recentActivities,
  currentPlan,
  checklists,
  onTriggerAgentWithPrompt,
  userProfile,
}) => {
  // Calculate checklist progress dynamically.
  const completedTasks = checklists.filter(
    (task) => task.completed
  ).length;

  const totalTasks = checklists.length;

  const checklistProgress =
    totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;

  // Calculate outstanding verification tasks from checklist data.
  const outstandingVerificationItems = checklists.filter(
    (task) =>
      task.category === 'verification' && !task.completed
  ).length;

  const routes = calculateTransferRoutes(
    currentPlan.tuitionAmount,
    currentPlan.tuitionCurrency,
    currentPlan.sourceCurrency
  );
  const bestRoute = routes.find((r) => r.isLowestCost) || routes[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner Disclaimer */}
      <DemoDisclaimer />

      {/* Hero Welcome Section */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="max-w-3xl space-y-3 relative z-10">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <span>Welcome, {userProfile?.studentName || currentPlan.studentName || 'Student'}</span>
            <span aria-hidden="true">·</span>
            <span className="text-blue-600 font-semibold">
              {currentPlan.universityName || 'Autumn 2026 Intake'}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Your international payments, made clearer.
          </h2>

          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            FeeBridge AI helps international students prepare
            high-value tuition payments with greater clarity and
            fewer costly mistakes. Compare transfer rails, verify
            university bank credentials, and follow actionable
            compliance checklists before initiating funds.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('payment-plan')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors shadow-xs cursor-pointer"
            >
              <span>Create Payment Plan</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate('verification')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm border border-slate-300 transition-colors shadow-xs cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-slate-500" />
              <span>Check Payment Instructions</span>
            </button>

            <button
              onClick={() => {
                if (onTriggerAgentWithPrompt) {
                  onTriggerAgentWithPrompt(`Help me plan my tuition payment of ${currentPlan.tuitionCurrency} ${currentPlan.tuitionAmount} for ${currentPlan.universityName}`);
                } else {
                  onNavigate('agent');
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium text-sm border border-slate-200 transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Open AI Copilot</span>
            </button>
          </div>
        </div>
      </div>

      {/* Four Dynamic Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Payment Plans */}
        <div
          onClick={() => onNavigate('payment-plan')}
          className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs hover:border-slate-300 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Active Payment Plans
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">
              {recentActivities.length}{' '}
              {recentActivities.length === 1 ? 'Plan' : 'Plans'}
            </div>

            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span>
                {currentPlan.universityName || 'Your university'}
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-blue-600 font-medium">
                Autumn Term
              </span>
            </p>
          </div>
        </div>

        {/* Card 2: Estimated Upcoming Tuition */}
        <div
          onClick={() => onNavigate('compare-costs')}
          className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs hover:border-slate-300 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Estimated Upcoming Tuition
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">
              {formatCurrency(
                currentPlan.tuitionAmount,
                currentPlan.tuitionCurrency
              )}
            </div>

            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span>
                {currentPlan.universityName || 'Current university'}
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-teal-600 font-medium">
                ~{formatCurrency(bestRoute.estimatedOriginCost, currentPlan.sourceCurrency)} ({currentPlan.selectedRoute || bestRoute.name})
              </span>
            </p>
          </div>
        </div>

        {/* Card 3: Outstanding Verification Items */}
        <div
          onClick={() => onNavigate('verification')}
          className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs hover:border-slate-300 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Outstanding Verification
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">
              {outstandingVerificationItems}{' '}
              {outstandingVerificationItems === 1 ? 'Item' : 'Items'}
            </div>

            <p className="text-xs text-amber-600 font-medium mt-1">
              {outstandingVerificationItems > 0
                ? 'Verification tasks need attention'
                : 'No outstanding verification tasks'}
            </p>
          </div>
        </div>

        {/* Card 4: Completed Checklists */}
        <div
          onClick={() => onNavigate('checklists')}
          className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs hover:border-slate-300 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Completed Checklists
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">
              {completedTasks} of {totalTasks} Done
            </div>

            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
              <div
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${checklistProgress}%` }}
              />
            </div>

            <p className="text-xs text-slate-500 mt-1">
              {checklistProgress}% complete
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Payment Plans & Next Steps */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Payment Plans Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Recent Payment Plans
              </h3>
              <p className="text-xs text-slate-500">
                Active and prepared tuition transfer plans
              </p>
            </div>

            <button
              onClick={() => onNavigate('history')}
              className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>View History</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-medium uppercase tracking-wider">
                  <th className="py-2.5 pr-4">
                    University &amp; Dest.
                  </th>
                  <th className="py-2.5 px-4">Amount</th>
                  <th className="py-2.5 px-4">Due Date</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 pl-4 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-slate-700">
                {recentActivities.length > 0 ? (
                  recentActivities.map((plan) => (
                    <tr
                      key={plan.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-3 pr-4">
                        <div className="font-medium text-slate-900">
                          {plan.university}
                        </div>

                        <div className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                          <span>{plan.destinationCountry}</span>
                          <span aria-hidden="true">·</span>
                          <span>From {plan.originCountry}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {formatCurrency(plan.amount, plan.currency)}
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {plan.date}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <StatusBadge
                          status={plan.status}
                          label={plan.status}
                        />
                      </td>

                      <td className="py-3 pl-4 text-right">
                        <button
                          onClick={() => {
                            if (onTriggerAgentWithPrompt) {
                              onTriggerAgentWithPrompt(
                                `Tell me about the payment analysis for ${plan.university} (${plan.currency} ${plan.amount}) from ${plan.originCountry}.`
                              );
                            } else {
                              onSelectPlan(plan.id);
                              onNavigate('agent');
                            }
                          }}
                          className="text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100/70 px-2.5 py-1.5 rounded transition-colors cursor-pointer"
                        >
                          Ask Copilot
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-8 text-center text-slate-500"
                    >
                      No payment plans yet. Create a payment plan
                      to see it here.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Next Steps */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">
                Next Steps
              </h3>
              <span className="text-xs text-slate-400">
                Priority checks
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div
                onClick={() => onNavigate('verification')}
                className="p-3 rounded-lg border border-amber-200/80 bg-amber-50/40 cursor-pointer hover:bg-amber-50/70 transition-colors"
              >
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />

                  <div>
                    <p className="font-semibold text-amber-900">
                      Format Reference in Remittance
                    </p>
                    <p className="text-amber-800/80 mt-0.5 leading-relaxed">
                      {currentPlan.universityName ||
                        'Your university'}{' '}
                      may require a specific remittance reference.
                      Confirm the official format before sending funds.
                    </p>
                  </div>
                </div>
              </div>

              <div
                onClick={() => onNavigate('checklists')}
                className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 cursor-pointer hover:bg-slate-100/60 transition-colors"
              >
                <div className="flex items-start gap-2.5">
                  <FileText className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />

                  <div>
                    <p className="font-semibold text-slate-800">
                      Bank Student File Endorsement
                    </p>
                    <p className="text-slate-600 mt-0.5 leading-relaxed">
                      Review the required student-file and bank
                      documentation checklist before arranging your
                      educational remittance.
                    </p>
                  </div>
                </div>
              </div>

              <div
                onClick={() => onNavigate('compare-costs')}
                className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 cursor-pointer hover:bg-slate-100/60 transition-colors"
              >
                <div className="flex items-start gap-2.5">
                  <TrendingUp className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />

                  <div>
                    <p className="font-semibold text-slate-800">
                      Compare Transfer Routes
                    </p>
                    <p className="text-slate-600 mt-0.5 leading-relaxed">
                      Compare estimated fees, exchange rates, and
                      intermediary deduction risks before choosing
                      a transfer route.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100">
            <button
              onClick={() => onNavigate('checklists')}
              className="w-full py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium text-xs border border-slate-200 flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>
                View Full Checklist (
                {Math.max(totalTasks - completedTasks, 0)} Remaining)
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* How FeeBridge Works: 3-step section */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
        <div className="max-w-2xl">
          <h3 className="text-base font-semibold text-slate-900">
            How FeeBridge Works
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            A three-pillar workflow to safeguard high-value student
            tuition remittances
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {/* Step 1 */}
          <div className="space-y-2 border-l-2 border-blue-500 pl-4 py-1">
            <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
              Step 1
            </div>
            <h4 className="text-sm font-semibold text-slate-900">
              1. Plan &amp; Compare
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Input university and tuition amounts. Transparently
              evaluate exchange rate markups, fixed wire fees, and
              intermediary deduction risks across different rails.
            </p>
          </div>

          {/* Step 2 */}
          <div className="space-y-2 border-l-2 border-teal-500 pl-4 py-1">
            <div className="text-xs font-semibold text-teal-600 uppercase tracking-wider">
              Step 2
            </div>
            <h4 className="text-sm font-semibold text-slate-900">
              2. Verify Instructions
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Cross-check beneficiary titles, SWIFT BIC codes, and
              mandatory payment references against available
              institutional information before dispatching funds.
            </p>
          </div>

          {/* Step 3 */}
          <div className="space-y-2 border-l-2 border-indigo-500 pl-4 py-1">
            <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
              Step 3
            </div>
            <h4 className="text-sm font-semibold text-slate-900">
              3. Prepare &amp; Confirm
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Follow a compliance checklist covering bank
              documentation, payment records, and university
              confirmation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
