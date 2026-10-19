import React from 'react';
import {
  LayoutDashboard,
  FilePlus,
  Bot,
  ArrowLeftRight,
  ShieldCheck,
  CheckSquare,
  History,
  Settings,
  Sparkles,
  ChevronRight,
  User,
  GraduationCap
} from 'lucide-react';
import { NavigationPage, PaymentPlanInput, UserProfile } from '../../types';
import { getInitials } from './Topbar';

interface SidebarProps {
  currentPage: NavigationPage;
  onNavigate: (page: NavigationPage) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  currentPlan?: PaymentPlanInput;
  userProfile?: UserProfile;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  isOpenMobile,
  onCloseMobile,
  currentPlan,
  userProfile,
}) => {
  const navItems: { id: NavigationPage; label: string; icon: React.FC<{ className?: string }>; badge?: string }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'payment-plan', label: 'New Payment Plan', icon: FilePlus },
    { id: 'agent', label: 'FeeBridge AI Agent', icon: Bot, badge: 'Copilot' },
    { id: 'compare-costs', label: 'Compare Transfer Costs', icon: ArrowLeftRight },
    { id: 'verification', label: 'Payment Verification', icon: ShieldCheck },
    { id: 'checklists', label: 'My Checklists', icon: CheckSquare },
    { id: 'history', label: 'Activity History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (page: NavigationPage) => {
    onNavigate(page);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200/90 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 px-5 flex items-center gap-3 border-b border-slate-100">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-900 text-base tracking-tight">FeeBridge</span>
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">AI</span>
            </div>
            <p className="text-[11px] text-slate-500 font-normal leading-none mt-0.5">Cross-Border Payment Copilot</p>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 py-4 px-3 overflow-y-auto space-y-1">
          <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Main Menu
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-medium text-blue-600 bg-blue-100/70 px-1.5 py-0.2 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Prototype banner & Demo Student profile */}
        <div className="p-3 border-t border-slate-100 space-y-2">
          {/* Prototype Mode Indicator */}
          <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-medium text-slate-700">Prototype Mode</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">FinTech Demo</span>
          </div>

          {/* Student Profile Card */}
          <div
            onClick={() => handleNavClick('settings')}
            className="p-2.5 rounded-lg bg-slate-50/70 hover:bg-slate-100 border border-slate-100 flex items-center gap-3 transition-colors cursor-pointer"
            title="Edit student profile & preferences"
          >
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-xs shrink-0">
              {getInitials(userProfile?.studentName || currentPlan?.studentName)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-800 truncate">
                  {userProfile?.studentName || currentPlan?.studentName || 'Demo Student'}
                </p>
                <span className="text-[10px] text-slate-400">
                  {currentPlan ? `${currentPlan.sourceCurrency} → ${currentPlan.tuitionCurrency}` : 'BD → CN'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate">
                {currentPlan?.universityName ? `${currentPlan.universityName}` : 'Zhejiang University'}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
