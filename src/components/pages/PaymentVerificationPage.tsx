import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  Info,
  Building,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Copy,
  Check
} from 'lucide-react';
import { UNIVERSITIES } from '../../data/mockData';
import { verifyPaymentDetails } from '../../utils/calculations';
import { VerificationResult, UniversityMockData, NavigationPage, ChecklistTask, ActivityRecord, PaymentPlanInput } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { DemoDisclaimer } from '../common/DemoDisclaimer';

interface PaymentVerificationPageProps {
  onNavigate: (page: NavigationPage) => void;
  defaultUniversityId?: string;
  currentPlan?: PaymentPlanInput;
  onAddTasks?: (tasks: ChecklistTask[]) => void;
  onLogVerification?: (record: ActivityRecord) => void;
  onTriggerAgentWithPrompt?: (prompt: string) => void;
}

export const PaymentVerificationPage: React.FC<PaymentVerificationPageProps> = ({
  onNavigate,
  defaultUniversityId = 'zju',
  currentPlan,
  onAddTasks,
  onLogVerification,
  onTriggerAgentWithPrompt,
}) => {
  const [selectedUnivId, setSelectedUnivId] = useState<string>(defaultUniversityId);
  const activeUniv: UniversityMockData =
    UNIVERSITIES.find((u) => u.id === selectedUnivId) || UNIVERSITIES[0];

  const [verificationToast, setVerificationToast] = useState<string | null>(null);

  // User input form state
  const [enteredBeneficiary, setEnteredBeneficiary] = useState(activeUniv.officialBeneficiaryName);
  const [enteredBank, setEnteredBank] = useState(activeUniv.officialBankName);
  const [enteredAccount, setEnteredAccount] = useState(activeUniv.officialAccountNo);
  const [enteredSwift, setEnteredSwift] = useState(activeUniv.officialSwiftBic);
  const [enteredReference, setEnteredReference] = useState(''); // Default empty to demonstrate the missing reference warning!

  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(() =>
    verifyPaymentDetails(activeUniv, {
      beneficiaryName: activeUniv.officialBeneficiaryName,
      bankName: activeUniv.officialBankName,
      accountNo: activeUniv.officialAccountNo,
      swiftBic: activeUniv.officialSwiftBic,
      reference: '', // demonstrates missing reference
    })
  );

  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleUniversityChange = (id: string) => {
    setSelectedUnivId(id);
    const univ = UNIVERSITIES.find((u) => u.id === id) || UNIVERSITIES[0];
    setEnteredBeneficiary(univ.officialBeneficiaryName);
    setEnteredBank(univ.officialBankName);
    setEnteredAccount(univ.officialAccountNo);
    setEnteredSwift(univ.officialSwiftBic);
    setEnteredReference('');
    setVerificationResult(
      verifyPaymentDetails(univ, {
        beneficiaryName: univ.officialBeneficiaryName,
        bankName: univ.officialBankName,
        accountNo: univ.officialAccountNo,
        swiftBic: univ.officialSwiftBic,
        reference: '',
      })
    );
  };

  const handleRunVerification = (e: React.FormEvent) => {
    e.preventDefault();
    const result = verifyPaymentDetails(activeUniv, {
      beneficiaryName: enteredBeneficiary,
      bankName: enteredBank,
      accountNo: enteredAccount,
      swiftBic: enteredSwift,
      reference: enteredReference,
    });
    setVerificationResult(result);
  };

  const handleLoadValidDemo = () => {
    setEnteredBeneficiary(activeUniv.officialBeneficiaryName);
    setEnteredBank(activeUniv.officialBankName);
    setEnteredAccount(activeUniv.officialAccountNo);
    setEnteredSwift(activeUniv.officialSwiftBic);
    setEnteredReference(activeUniv.exampleReference);
    const res = verifyPaymentDetails(activeUniv, {
      beneficiaryName: activeUniv.officialBeneficiaryName,
      bankName: activeUniv.officialBankName,
      accountNo: activeUniv.officialAccountNo,
      swiftBic: activeUniv.officialSwiftBic,
      reference: activeUniv.exampleReference,
    });
    setVerificationResult(res);
  };

  const handleLoadMissingRefScenario = () => {
    setEnteredBeneficiary(activeUniv.officialBeneficiaryName);
    setEnteredBank(activeUniv.officialBankName);
    setEnteredAccount(activeUniv.officialAccountNo);
    setEnteredSwift(activeUniv.officialSwiftBic);
    setEnteredReference('Tuition Fee Deposit'); // Generic text lacking student ID
    const res = verifyPaymentDetails(activeUniv, {
      beneficiaryName: activeUniv.officialBeneficiaryName,
      bankName: activeUniv.officialBankName,
      accountNo: activeUniv.officialAccountNo,
      swiftBic: activeUniv.officialSwiftBic,
      reference: 'Tuition Fee Deposit',
    });
    setVerificationResult(res);
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleUpdateChecklistWithFindings = () => {
    if (!verificationResult || !onAddTasks) {
      onNavigate('checklists');
      return;
    }
    const problematicChecks = verificationResult.checks.filter(
      (c) => c.status === 'mismatch' || c.status === 'missing' || c.status === 'needs_confirmation'
    );
    if (problematicChecks.length === 0) {
      setVerificationToast('All fields match 100%! No unresolved issues to add to checklist.');
      setTimeout(() => setVerificationToast(null), 3500);
      return;
    }
    const newTasks: ChecklistTask[] = problematicChecks.map((c, idx) => ({
      id: `task-verify-${Date.now()}-${idx}`,
      title: `Resolve ${activeUniv.name} ${c.label} flag`,
      category: 'verification',
      priority: c.status === 'mismatch' ? 'high' : 'medium',
      completed: false,
      requiresExternalConfirmation: true,
      details: `${c.explanation} Guidance: ${c.guidance}`,
      dueDate: currentPlan?.paymentDeadline || '2026-10-25',
      source: 'auto_generated',
    }));
    onAddTasks(newTasks);
    setVerificationToast(`Added ${newTasks.length} verification action items to your checklist!`);
    setTimeout(() => setVerificationToast(null), 3500);
  };

  const handleSaveAuditRecord = () => {
    if (!verificationResult || !onLogVerification) return;
    const isVerified = verificationResult.overallStatus === 'verified';
    const record: ActivityRecord = {
      id: `act-ver-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      university: activeUniv.name,
      amount: currentPlan?.tuitionAmount || 8000,
      currency: currentPlan?.tuitionCurrency || activeUniv.acceptedCurrencies[0] || 'USD',
      originCountry: currentPlan?.originCountry || 'Bangladesh',
      destinationCountry: activeUniv.country,
      status: isVerified ? 'Verified' : 'Action Needed',
      selectedRoute: currentPlan?.selectedRoute || 'Direct Bank Wire (SWIFT)',
      notes: `Instruction check score: ${verificationResult.matchScore}/100. ${verificationResult.summary}`,
    };
    onLogVerification(record);
    setVerificationToast(`Saved verification audit record for ${activeUniv.name} to Activity History.`);
    setTimeout(() => setVerificationToast(null), 3500);
  };

  const handleAskCopilot = () => {
    const prompt = `Review my draft payment instructions for ${activeUniv.name}. Draft reference is "${
      enteredReference || '(empty)'
    }" and receiving bank is "${enteredBank}".`;
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
          <h2 className="text-xl font-bold text-slate-900">Payment Verification Workspace</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare draft wire remittance instructions against verified institutional banking repositories.
          </p>
        </div>

        {/* Quick Scenario Preset Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleLoadMissingRefScenario}
            className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100/80 text-amber-800 border border-amber-200 text-xs font-medium transition-colors cursor-pointer"
          >
            Load Flagged Demo (Missing Ref)
          </button>
          <button
            onClick={handleLoadValidDemo}
            className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 border border-emerald-200 text-xs font-medium transition-colors cursor-pointer"
          >
            Load 100% Match
          </button>
          <button
            onClick={handleAskCopilot}
            className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100/80 text-blue-700 border border-blue-200 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Ask Copilot</span>
          </button>
        </div>
      </div>

      <DemoDisclaimer compact />

      {verificationToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{verificationToast}</span>
        </div>
      )}

      {/* University Selector */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Building className="w-5 h-5 text-blue-600 shrink-0" />
          <div>
            <label className="text-xs font-semibold text-slate-900 block">Select Target University</label>
            <p className="text-[11px] text-slate-500">Cross-checking against mock institutional deposit ledgers</p>
          </div>
        </div>

        <select
          value={selectedUnivId}
          onChange={(e) => handleUniversityChange(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium text-slate-800 min-w-64"
        >
          {UNIVERSITIES.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.country})
            </option>
          ))}
        </select>
      </div>

      {/* Two Column Layout: Official Reference Card & Draft Remittance Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Official Instructions Card (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider block">
              Institutional Baseline Record
            </span>
            <h3 className="text-sm font-bold text-slate-900 mt-0.5">{activeUniv.name}</h3>
            <p className="text-[11px] text-slate-500">Official Admissions & Finance Office Record</p>
          </div>

          <div className="space-y-3 text-xs">
            {/* Beneficiary */}
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
              <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-semibold">
                <span>Beneficiary Name</span>
                <button
                  onClick={() => handleCopy(activeUniv.officialBeneficiaryName, 'ben')}
                  className="text-slate-400 hover:text-slate-600 flex items-center gap-1"
                >
                  {copiedField === 'ben' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
              <p className="font-mono text-slate-800 font-medium text-xs mt-1">
                {activeUniv.officialBeneficiaryName}
              </p>
            </div>

            {/* Receiving Bank */}
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
              <span className="text-slate-400 text-[10px] uppercase font-semibold block">Receiving Bank</span>
              <p className="text-slate-800 font-medium text-xs mt-1">{activeUniv.officialBankName}</p>
            </div>

            {/* Account / IBAN */}
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
              <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-semibold">
                <span>Account / IBAN</span>
                <button
                  onClick={() => handleCopy(activeUniv.officialAccountNo, 'acc')}
                  className="text-slate-400 hover:text-slate-600 flex items-center gap-1"
                >
                  {copiedField === 'acc' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
              <p className="font-mono text-slate-800 font-medium text-xs mt-1">{activeUniv.officialAccountNo}</p>
            </div>

            {/* SWIFT / BIC */}
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
              <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-semibold">
                <span>SWIFT / BIC Code</span>
                <button
                  onClick={() => handleCopy(activeUniv.officialSwiftBic, 'swift')}
                  className="text-slate-400 hover:text-slate-600 flex items-center gap-1"
                >
                  {copiedField === 'swift' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
              <p className="font-mono text-slate-800 font-semibold text-xs mt-1">{activeUniv.officialSwiftBic}</p>
            </div>

            {/* Required Reference Format */}
            <div className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200/80 space-y-1">
              <span className="text-amber-900 text-[10px] uppercase font-semibold block">
                Mandatory Reference Format (Field 70)
              </span>
              <p className="font-mono text-amber-950 font-semibold text-xs">
                {activeUniv.exampleReference}
              </p>
              <p className="text-[10px] text-amber-800">
                Rule: {activeUniv.requiredReferenceFormat}
              </p>
            </div>

            {/* Special Instructions */}
            <div className="p-2.5 rounded-lg bg-blue-50/50 border border-blue-200/60 text-[11px] text-blue-900">
              <span className="font-semibold block mb-0.5">Remittance Regulation Notice:</span>
              <p className="text-blue-800/90 leading-relaxed">{activeUniv.specialInstructions}</p>
            </div>
          </div>
        </div>

        {/* Right Column: Draft Remittance Input & Check Results (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Form */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Draft Remittance Slip</h3>
                <p className="text-xs text-slate-500">Enter the banking details from your bank application form</p>
              </div>
              <span className="text-xs text-slate-400">Step: Verification</span>
            </div>

            <form onSubmit={handleRunVerification} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Beneficiary Name (Account Holder)
                </label>
                <input
                  type="text"
                  value={enteredBeneficiary}
                  onChange={(e) => setEnteredBeneficiary(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                  placeholder="e.g. ZHEJIANG UNIVERSITY INTERNATIONAL COLLEGE"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Receiving Bank Name</label>
                <input
                  type="text"
                  value={enteredBank}
                  onChange={(e) => setEnteredBank(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. BANK OF CHINA, HANGZHOU YUQUAN SUB-BRANCH"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Account Number / IBAN</label>
                  <input
                    type="text"
                    value={enteredAccount}
                    onChange={(e) => setEnteredAccount(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                    placeholder="376658348921"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">SWIFT / BIC Code</label>
                  <input
                    type="text"
                    value={enteredSwift}
                    onChange={(e) => setEnteredSwift(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                    placeholder="BKCHCNBJ920"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-700">
                    Payment Reference / Field 70 (Remittance Info) *
                  </label>
                  <span className="text-[10px] text-amber-600 font-medium">Critical Matching Field</span>
                </div>
                <input
                  type="text"
                  value={enteredReference}
                  onChange={(e) => setEnteredReference(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                  placeholder={`Format: ${activeUniv.requiredReferenceFormat}`}
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium flex items-center gap-2 transition-colors shadow-xs cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Check Details</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEnteredReference(activeUniv.exampleReference);
                  }}
                  className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
                >
                  Insert Sample Reference
                </button>
              </div>
            </form>
          </div>

          {/* Verification Results Panel */}
          {verificationResult && (
            <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900">Audit Findings</h4>
                  <StatusBadge
                    status={
                      verificationResult.overallStatus === 'verified'
                        ? 'verified'
                        : verificationResult.overallStatus === 'action_required'
                        ? 'action_required'
                        : 'critical_mismatch'
                    }
                    label={
                      verificationResult.overallStatus === 'verified'
                        ? '100% Match'
                        : verificationResult.overallStatus === 'action_required'
                        ? 'Action Required'
                        : 'Critical Mismatch'
                    }
                  />
                </div>
                <span className="text-[10px] text-slate-400">
                  Audited at {new Date(verificationResult.verifiedAt).toLocaleTimeString()}
                </span>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                {verificationResult.summary}
              </p>

              {/* Individual field checks */}
              <div className="space-y-2.5">
                {verificationResult.checks.map((check, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border text-xs space-y-1.5 transition-colors ${
                      check.status === 'match'
                        ? 'bg-emerald-50/50 border-emerald-200/70 text-emerald-950'
                        : check.status === 'missing'
                        ? 'bg-amber-50/60 border-amber-200/80 text-amber-950'
                        : check.status === 'mismatch'
                        ? 'bg-rose-50/60 border-rose-200/80 text-rose-950'
                        : 'bg-sky-50/60 border-sky-200/80 text-sky-950'
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold">
                      <div className="flex items-center gap-2">
                        {check.status === 'match' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : check.status === 'missing' ? (
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        ) : check.status === 'mismatch' ? (
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        ) : (
                          <HelpCircle className="w-4 h-4 text-sky-600 shrink-0" />
                        )}
                        <span>{check.label}</span>
                      </div>
                      <StatusBadge status={check.status} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                      <div>
                        <span className="text-slate-500 block">Entered in Draft:</span>
                        <code className="font-mono font-medium text-slate-800 break-all">
                          {check.enteredValue}
                        </code>
                      </div>
                      <div>
                        <span className="text-slate-500 block">University Official Record:</span>
                        <code className="font-mono font-medium text-slate-800 break-all">
                          {check.expectedValue}
                        </code>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-600 pt-1 border-t border-slate-200/50 leading-relaxed">
                      <span className="font-medium">Analysis:</span> {check.explanation}
                    </p>
                    <p className="text-[11px] text-blue-700 font-medium">
                      💡 {check.guidance}
                    </p>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleUpdateChecklistWithFindings}
                  className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Add Unresolved Issues to My Checklist</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleSaveAuditRecord}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                  <span>Save Audit to Activity History</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
