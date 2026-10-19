import React, { useState, useEffect } from 'react';
import {
  Settings,
  RotateCcw,
  Globe,
  Bell,
  User,
  Shield,
  Check,
  Cpu,
  Info,
  Key
} from 'lucide-react';
import { UserProfile } from '../../types';
import { CURRENCY_OPTIONS, COUNTRIES } from '../../data/mockData';
import { DemoDisclaimer } from '../common/DemoDisclaimer';

interface SettingsPageProps {
  userProfile?: UserProfile;
  onUpdateProfile?: (profile: UserProfile) => void;
  onResetAllDemoData: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  userProfile,
  onUpdateProfile,
  onResetAllDemoData,
}) => {
  const [studentName, setStudentName] = useState(userProfile?.studentName || 'Farhan Ahmed');
  const [studentId, setStudentId] = useState(userProfile?.studentId || '32401899');
  const [originCountry, setOriginCountry] = useState(userProfile?.originCountry || 'Bangladesh');
  const [preferredCurrency, setPreferredCurrency] = useState(userProfile?.preferredCurrency || 'BDT');
  const [preferredLanguage, setPreferredLanguage] = useState(userProfile?.preferredLanguage || 'en');
  const [emailAlerts, setEmailAlerts] = useState(userProfile?.emailAlerts ?? true);
  const [deadlineReminders, setDeadlineReminders] = useState(userProfile?.deadlineReminders ?? true);
  const [fxRateAlerts, setFxRateAlerts] = useState(userProfile?.fxRateAlerts ?? false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [resetNotice, setResetNotice] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setStudentName(userProfile.studentName);
      setStudentId(userProfile.studentId);
      setOriginCountry(userProfile.originCountry);
      setPreferredCurrency(userProfile.preferredCurrency);
      setPreferredLanguage(userProfile.preferredLanguage);
      setEmailAlerts(userProfile.emailAlerts);
      setDeadlineReminders(userProfile.deadlineReminders);
      setFxRateAlerts(userProfile.fxRateAlerts);
    }
  }, [userProfile]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedProfile: UserProfile = {
      studentName: studentName.trim() || 'Farhan Ahmed',
      studentId: studentId.trim() || '32401899',
      originCountry,
      preferredCurrency,
      preferredLanguage,
      emailAlerts,
      deadlineReminders,
      fxRateAlerts,
    };
    if (onUpdateProfile) {
      onUpdateProfile(updatedProfile);
    }
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleReset = () => {
    onResetAllDemoData();
    setStudentName('Farhan Ahmed');
    setStudentId('32401899');
    setOriginCountry('Bangladesh');
    setPreferredCurrency('BDT');
    setPreferredLanguage('en');
    setEmailAlerts(true);
    setDeadlineReminders(true);
    setFxRateAlerts(false);
    setResetNotice(true);
    setTimeout(() => setResetNotice(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">Prototype Settings & Preferences</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure active student profile parameters, regional defaults, and reset demo data.
        </p>
      </div>

      <DemoDisclaimer compact />

      {savedNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Student profile and session preferences saved and applied across the app!</span>
        </div>
      )}

      {resetNotice && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 text-xs rounded-lg flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-blue-600" />
          <span>Demo data successfully reset to initial competition prototype state.</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Profile Card */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <User className="w-4 h-4 text-blue-600" />
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Active Student Profile</h3>
              <p className="text-[11px] text-slate-500">
                Changes here dynamically update the AI Agent, payment plans, and remittance verification.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Student Full Name</label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="e.g. Farhan Ahmed"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                required
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Student / Applicant ID</label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="e.g. 32401899"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                required
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Origin Country</label>
              <select
                value={originCountry}
                onChange={(e) => setOriginCountry(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Currency & Language */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Globe className="w-4 h-4 text-slate-600" />
            <h3 className="text-sm font-semibold text-slate-900">Regional & Currency Preferences</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Preferred Remittance Source Currency</label>
              <select
                value={preferredCurrency}
                onChange={(e) => setPreferredCurrency(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {CURRENCY_OPTIONS.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} - {c.name} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Interface Language</label>
              <select
                value={preferredLanguage}
                onChange={(e) => setPreferredLanguage(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="en">English (Default)</option>
                <option value="bn">Bengali (বাংলা)</option>
                <option value="zh">Chinese (中文)</option>
                <option value="es">Spanish (Español)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Bell className="w-4 h-4 text-slate-600" />
            <h3 className="text-sm font-semibold text-slate-900">Simulation Alert Preferences</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
              <div>
                <p className="font-medium text-slate-800">Tuition Deadline & Settlement Buffer Reminders</p>
                <p className="text-slate-500 text-[11px]">Notify 5 business days before hard university deposit cutoff</p>
              </div>
              <input
                type="checkbox"
                checked={deadlineReminders}
                onChange={(e) => setDeadlineReminders(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
              <div>
                <p className="font-medium text-slate-800">Email Digest of Payment Instruction Audits</p>
                <p className="text-slate-500 text-[11px]">Send summary report after running Payment Verification</p>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
              <div>
                <p className="font-medium text-slate-800">FX Volatility & Corridor Spread Alerts</p>
                <p className="text-slate-500 text-[11px]">Alert when indicative corridor spread shifts significantly</p>
              </div>
              <input
                type="checkbox"
                checked={fxRateAlerts}
                onChange={(e) => setFxRateAlerts(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
            </div>
          </div>
        </div>

        {/* AI Copilot Architecture & Key Configuration */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Cpu className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-semibold text-slate-900">FeeBridge AI Copilot Configuration</h3>
          </div>
          <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
            <p>
              FeeBridge AI includes a <strong>hybrid dual-engine architecture</strong>:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600 text-[11px]">
              <li>
                <strong>Offline Simulation Copilot (Active by default):</strong> Executes all calculation tools, bank
                instruction checks, and checklist generators right in your browser. No backend required!
              </li>
              <li>
                <strong>FastAPI Backend Agent (Port 8000):</strong> Run{' '}
                <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-800">
                  python -m uvicorn app.main:app --port 8000
                </code>{' '}
                in the <code className="font-mono text-slate-800">backend/</code> directory.
              </li>
              <li>
                <strong>Live LLM Mode:</strong> Set your Claude (<code className="font-mono text-slate-800">ANTHROPIC_API_KEY</code>) or
                OpenAI/Gemini/Groq (<code className="font-mono text-slate-800">OPENAI_COMPAT_API_KEY</code>) key in{' '}
                <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-800">backend/.env</code>. Keys are kept
                strictly on the backend and are never sent to the browser.
              </li>
            </ul>
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-xs transition-colors cursor-pointer"
          >
            Save Profile & Preferences
          </button>
        </div>
      </form>

      {/* Reset Demo Data Card */}
      <div className="bg-white rounded-xl border border-rose-200/90 p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-rose-600" />
          <h3 className="text-sm font-semibold text-rose-900">Reset Demo Data</h3>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Restore the sample scenario (Farhan Ahmed, Bangladesh to China CNY 8,000 for Zhejiang University), reseed the
          initial checklist tasks, restore default activity history, and reset storage.
        </p>
        <button
          onClick={handleReset}
          type="button"
          className="px-4 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset All Demo Data</span>
        </button>
      </div>
    </div>
  );
};
