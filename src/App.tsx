/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  NavigationPage,
  PaymentPlanInput,
  ChecklistTask,
  ActivityRecord,
  UserProfile,
} from './types';
import { INITIAL_CHECKLIST, INITIAL_ACTIVITY_HISTORY } from './data/mockData';
import {
  loadStoredPlan,
  saveStoredPlan,
  loadStoredChecklists,
  saveStoredChecklists,
  loadStoredHistory,
  saveStoredHistory,
  loadStoredProfile,
  saveStoredProfile,
  resetAllStoredData,
} from './utils/storage';
import { AppShell } from './components/layout/AppShell';
import { OverviewPage } from './components/pages/OverviewPage';
import { PaymentPlanPage } from './components/pages/PaymentPlanPage';
import { AgentPage } from './components/pages/AgentPage';
import { TransferComparisonPage } from './components/pages/TransferComparisonPage';
import { PaymentVerificationPage } from './components/pages/PaymentVerificationPage';
import { ChecklistPage } from './components/pages/ChecklistPage';
import { HistoryPage } from './components/pages/HistoryPage';
import { SettingsPage } from './components/pages/SettingsPage';

export default function App() {
  const [currentPage, setCurrentPage] = useState<NavigationPage>('overview');
  const [userProfile, setUserProfile] = useState<UserProfile>(loadStoredProfile);
  const [currentPlan, setCurrentPlan] = useState<PaymentPlanInput>(loadStoredPlan);
  const [checklists, setChecklists] = useState<ChecklistTask[]>(loadStoredChecklists);
  const [history, setHistory] = useState<ActivityRecord[]>(loadStoredHistory);
  const [agentPresetPrompt, setAgentPresetPrompt] = useState<string | undefined>(undefined);

  // Sync state changes to localStorage
  useEffect(() => {
    saveStoredProfile(userProfile);
  }, [userProfile]);

  useEffect(() => {
    saveStoredPlan(currentPlan);
  }, [currentPlan]);

  useEffect(() => {
    saveStoredChecklists(checklists);
  }, [checklists]);

  useEffect(() => {
    saveStoredHistory(history);
  }, [history]);

  // Guided demo handler: loads the Bangladesh -> China CNY 8,000 scenario directly into agent
  const handleRunGuidedDemo = () => {
    const demo = loadStoredPlan();
    setCurrentPlan(demo);
    setAgentPresetPrompt(
      `Plan my tuition payment from ${demo.originCountry} to ${demo.destinationCountry} (${demo.tuitionCurrency} ${demo.tuitionAmount} for ${demo.universityName})`
    );
    setCurrentPage('agent');
  };

  const handleUpdateProfile = (newProfile: UserProfile) => {
    setUserProfile(newProfile);
    setCurrentPlan((prev) => ({
      ...prev,
      studentName: newProfile.studentName,
      studentId: newProfile.studentId,
      originCountry: newProfile.originCountry,
    }));
  };

  const handleUpdatePlan = (newPlan: PaymentPlanInput) => {
    setCurrentPlan(newPlan);
    // Add to activity history if newly created or modified
    const existingIndex = history.findIndex((h) => h.university === newPlan.universityName);
    if (existingIndex === -1) {
      const newRecord: ActivityRecord = {
        id: `act-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        university: newPlan.universityName,
        amount: newPlan.tuitionAmount,
        currency: newPlan.tuitionCurrency,
        originCountry: newPlan.originCountry,
        destinationCountry: newPlan.destinationCountry,
        status: 'Plan Created',
        notes: newPlan.notes,
      };
      setHistory((prev) => [newRecord, ...prev]);
    }
  };

  const handleApplyRouteToPlan = (_routeId: string, routeName: string, estimatedCost: number) => {
    setCurrentPlan((prev) => ({
      ...prev,
      selectedRoute: routeName,
    }));
    const newRecord: ActivityRecord = {
      id: `act-route-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      university: currentPlan.universityName,
      amount: currentPlan.tuitionAmount,
      currency: currentPlan.tuitionCurrency,
      originCountry: currentPlan.originCountry,
      destinationCountry: currentPlan.destinationCountry,
      status: 'Route Selected',
      notes: `Applied route: ${routeName} (Est. cost ${estimatedCost.toLocaleString()} ${currentPlan.sourceCurrency})`,
    };
    setHistory((prev) => [newRecord, ...prev]);
  };

  const handleSyncTasksToChecklist = (newTasks: ChecklistTask[]) => {
    setChecklists((prev) => {
      const existingIds = new Set(prev.map((t) => t.id));
      const existingTitles = new Set(prev.map((t) => t.title.toLowerCase().trim()));
      const toAdd = newTasks.filter(
        (t) => !existingIds.has(t.id) && !existingTitles.has(t.title.toLowerCase().trim())
      );
      return [...toAdd, ...prev];
    });
  };

  const handleLogVerification = (record: ActivityRecord) => {
    setHistory((prev) => [record, ...prev]);
  };

  const handleTriggerAgentWithPlan = (plan: PaymentPlanInput) => {
    setCurrentPlan(plan);
    setAgentPresetPrompt(
      `Plan my tuition payment from ${plan.originCountry} to ${plan.destinationCountry} (${plan.tuitionCurrency} ${plan.tuitionAmount} for ${plan.universityName})`
    );
    setCurrentPage('agent');
  };

  const handleTriggerAgentWithPrompt = (prompt: string) => {
    setAgentPresetPrompt(prompt);
    setCurrentPage('agent');
  };

  const handleToggleTask = (id: string) => {
    setChecklists((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleAddTask = (taskData: Omit<ChecklistTask, 'id' | 'source'>) => {
    const newTask: ChecklistTask = {
      ...taskData,
      id: `task-user-${Date.now()}`,
      source: 'user_added',
    };
    setChecklists((prev) => [newTask, ...prev]);
  };

  const handleDeleteTask = (id: string) => {
    setChecklists((prev) => prev.filter((t) => t.id !== id));
  };

  const handleRestoreChecklist = () => {
    setChecklists(INITIAL_CHECKLIST);
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  const handleRestoreHistory = () => {
    setHistory(INITIAL_ACTIVITY_HISTORY);
  };

  const handleResetAllDemoData = () => {
    resetAllStoredData();
    setUserProfile(loadStoredProfile());
    setCurrentPlan(loadStoredPlan());
    setChecklists(loadStoredChecklists());
    setHistory(loadStoredHistory());
    setAgentPresetPrompt(undefined);
  };

  return (
    <AppShell
      currentPage={currentPage}
      onNavigate={setCurrentPage}
      onRunGuidedDemo={handleRunGuidedDemo}
      currentPlan={currentPlan}
      userProfile={userProfile}
    >
      {currentPage === 'overview' && (
        <OverviewPage
          onNavigate={setCurrentPage}
          onSelectPlan={() => {
            setCurrentPage('payment-plan');
          }}
          recentActivities={history}
          currentPlan={currentPlan}
          checklists={checklists}
          onTriggerAgentWithPrompt={handleTriggerAgentWithPrompt}
          userProfile={userProfile}
        />
      )}

      {currentPage === 'payment-plan' && (
        <PaymentPlanPage
          currentPlan={currentPlan}
          onUpdatePlan={handleUpdatePlan}
          onNavigate={setCurrentPage}
          onTriggerAgentWithPlan={handleTriggerAgentWithPlan}
        />
      )}

      {currentPage === 'agent' && (
        <AgentPage
          currentPlan={currentPlan}
          checklists={checklists}
          onNavigate={setCurrentPage}
          onApplyRouteToPlan={handleApplyRouteToPlan}
          onSyncTasksToChecklist={handleSyncTasksToChecklist}
          presetPrompt={agentPresetPrompt}
          onClearPresetPrompt={() => setAgentPresetPrompt(undefined)}
        />
      )}

      {currentPage === 'compare-costs' && (
        <TransferComparisonPage
          currentPlan={currentPlan}
          onUpdatePlan={handleUpdatePlan}
          onNavigate={setCurrentPage}
          onTriggerAgentWithPrompt={handleTriggerAgentWithPrompt}
        />
      )}

      {currentPage === 'verification' && (
        <PaymentVerificationPage
          onNavigate={setCurrentPage}
          defaultUniversityId={currentPlan.universityId || 'zju'}
          currentPlan={currentPlan}
          onAddTasks={handleSyncTasksToChecklist}
          onLogVerification={handleLogVerification}
          onTriggerAgentWithPrompt={handleTriggerAgentWithPrompt}
        />
      )}

      {currentPage === 'checklists' && (
        <ChecklistPage
          tasks={checklists}
          onToggleTask={handleToggleTask}
          onAddTask={handleAddTask}
          onDeleteTask={handleDeleteTask}
          onNavigate={setCurrentPage}
          onRestoreChecklist={handleRestoreChecklist}
          onTriggerAgentWithPrompt={handleTriggerAgentWithPrompt}
        />
      )}

      {currentPage === 'history' && (
        <HistoryPage
          history={history}
          onClearHistory={handleClearHistory}
          onRestoreHistory={handleRestoreHistory}
          onNavigate={setCurrentPage}
        />
      )}

      {currentPage === 'settings' && (
        <SettingsPage
          userProfile={userProfile}
          onUpdateProfile={handleUpdateProfile}
          onResetAllDemoData={handleResetAllDemoData}
        />
      )}
    </AppShell>
  );
}
