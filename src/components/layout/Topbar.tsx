import React, { useState } from 'react';
import {
  Menu,
  Bell,
  Search,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  X
} from 'lucide-react';
import { NavigationPage, UserProfile, PaymentPlanInput } from '../../types';
import { COUNTRIES } from '../../data/mockData';

export function getInitials(name?: string): string {
  if (!name || !name.trim()) return 'ST';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'ST';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function getCountryCode(countryName?: string): string {
  if (!countryName) return 'BD';
  const found = COUNTRIES.find(
    (c) => c.name.toLowerCase() === countryName.trim().toLowerCase()
  );
  if (found) return found.code;
  if (countryName.length <= 3) return countryName.toUpperCase();
  return countryName.slice(0, 2).toUpperCase();
}

interface TopbarProps {
  currentPage: NavigationPage;
  onNavigate: (page: NavigationPage) => void;
  onOpenMobileMenu: () => void;
  onRunGuidedDemo: () => void;
  userProfile?: UserProfile;
  currentPlan?: PaymentPlanInput;
}

export const Topbar: React.FC<TopbarProps> = ({
  currentPage,
  onNavigate,
  onOpenMobileMenu,
  onRunGuidedDemo,
  userProfile,
  currentPlan,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(2);

  const displayName = userProfile?.studentName || currentPlan?.studentName || 'Farhan Ahmed';
  const originCountry = userProfile?.originCountry || currentPlan?.originCountry || 'Bangladesh';
  const initials = getInitials(displayName);
  const countryCode = getCountryCode(originCountry);

  const pageTitles: Record<NavigationPage, { title: string; breadcrumb: string }> = {
    overview: { title: 'Overview Dashboard', breadcrumb: 'Dashboard' },
    'payment-plan': { title: 'New Payment Plan', breadcrumb: 'Payment Preparation' },
    agent: { title: 'FeeBridge AI Agent', breadcrumb: 'AI Copilot' },
    'compare-costs': { title: 'Compare Transfer Costs', breadcrumb: 'FX & Rail Comparison' },
    verification: { title: 'Payment Verification', breadcrumb: 'University Instructions' },
    checklists: { title: 'My Checklists', breadcrumb: 'Action Tracker' },
    history: { title: 'Activity History', breadcrumb: 'Past Analyses' },
    settings: { title: 'Settings', breadcrumb: 'Preferences' },
  };

  const { title, breadcrumb } = pageTitles[currentPage] || { title: 'FeeBridge AI', breadcrumb: 'App' };

  return (
    <header className="h-16 bg-white border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Mobile trigger & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:block">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-normal">
            <span>FeeBridge</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-slate-700 font-medium">{breadcrumb}</span>
          </div>
          <h1 className="text-base font-semibold text-slate-900 leading-tight">{title}</h1>
        </div>

        <div className="sm:hidden">
          <h1 className="text-sm font-semibold text-slate-900">{title}</h1>
        </div>
      </div>

      {/* Right controls: Guided demo trigger, search, notifications, profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Demo Scenario Trigger */}
        <button
          onClick={onRunGuidedDemo}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100/80 text-blue-700 text-xs font-medium border border-blue-200/80 transition-colors cursor-pointer"
          title="Preload Bangladesh to China (¥8,000) Competition Demo"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Quick Demo: BD → China (¥8,000)</span>
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (!showNotifications) setUnreadCount(0);
            }}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 relative"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-lg border border-slate-200/90 py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-slate-800">Notifications</h3>
                  <p className="text-[11px] text-slate-500">Live payment verification alerts</p>
                </div>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 text-xs">
                <div
                  onClick={() => {
                    onNavigate('verification');
                    setShowNotifications(false);
                  }}
                  className="p-3 hover:bg-slate-50 cursor-pointer flex items-start gap-2.5 transition-colors"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-800">Payment Reference Required</p>
                    <p className="text-slate-500 mt-0.5 leading-relaxed">
                      Zhejiang University requires Student ID <span className="font-mono">32401899</span> in Field 70 before remittance dispatch.
                    </p>
                    <span className="text-[10px] text-slate-400 mt-1 inline-block">10 minutes ago</span>
                  </div>
                </div>

                <div
                  onClick={() => {
                    onNavigate('compare-costs');
                    setShowNotifications(false);
                  }}
                  className="p-3 hover:bg-slate-50 cursor-pointer flex items-start gap-2.5 transition-colors"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-800">FinTech Rail Recommended</p>
                    <p className="text-slate-500 mt-0.5 leading-relaxed">
                      Zero intermediary deduction rail selected for CNY 8,000 tuition.
                    </p>
                    <span className="text-[10px] text-slate-400 mt-1 inline-block">1 hour ago</span>
                  </div>
                </div>
              </div>

              <div className="px-4 py-2 border-t border-slate-100 text-center">
                <button
                  onClick={() => {
                    onNavigate('agent');
                    setShowNotifications(false);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1"
                >
                  Ask FeeBridge Copilot <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User avatar indicator */}
        <div
          onClick={() => onNavigate('settings')}
          className="flex items-center gap-2 pl-2 border-l border-slate-200 cursor-pointer hover:opacity-85 transition-opacity"
          title="View & Edit Student Profile (Settings)"
        >
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-semibold text-xs shadow-xs">
            {initials}
          </div>
          <div className="hidden xl:block text-left">
            <p className="text-xs font-medium text-slate-800 leading-tight">{displayName}</p>
            <p className="text-[10px] text-slate-500 leading-tight">Student · {countryCode}</p>
          </div>
        </div>
      </div>
    </header>
  );
};
