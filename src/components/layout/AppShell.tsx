import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { NavigationPage, PaymentPlanInput, UserProfile } from '../../types';

interface AppShellProps {
  currentPage: NavigationPage;
  onNavigate: (page: NavigationPage) => void;
  onRunGuidedDemo: () => void;
  children: React.ReactNode;
  currentPlan?: PaymentPlanInput;
  userProfile?: UserProfile;
}

export const AppShell: React.FC<AppShellProps> = ({
  currentPage,
  onNavigate,
  onRunGuidedDemo,
  children,
  currentPlan,
  userProfile,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex">
      {/* Sidebar navigation */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={onNavigate}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        currentPlan={currentPlan}
        userProfile={userProfile}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top bar header */}
        <Topbar
          currentPage={currentPage}
          onNavigate={onNavigate}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onRunGuidedDemo={onRunGuidedDemo}
          userProfile={userProfile}
          currentPlan={currentPlan}
        />

        {/* Page body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
