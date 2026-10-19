import { ActivityRecord, ChecklistTask, PaymentPlanInput, UserProfile } from '../types';
import { INITIAL_ACTIVITY_HISTORY, INITIAL_CHECKLIST } from '../data/mockData';
import { DEFAULT_DEMO_PLAN } from './agentEngine';

const STORAGE_KEYS = {
  PLAN: 'feebridge_current_plan',
  CHECKLISTS: 'feebridge_checklists',
  HISTORY: 'feebridge_activity_history',
  PROFILE: 'feebridge_user_profile',
} as const;

export const DEFAULT_USER_PROFILE: UserProfile = {
  studentName: 'Farhan Ahmed',
  studentId: '32401899',
  originCountry: 'Bangladesh',
  preferredCurrency: 'BDT',
  preferredLanguage: 'en',
  emailAlerts: true,
  deadlineReminders: true,
  fxRateAlerts: false,
};

function safeGetItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return parsed as T;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

function safeSetItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // LocalStorage quota exceeded or disabled in private browsing
  }
}

export function loadStoredPlan(): PaymentPlanInput {
  return safeGetItem<PaymentPlanInput>(STORAGE_KEYS.PLAN, DEFAULT_DEMO_PLAN);
}

export function saveStoredPlan(plan: PaymentPlanInput): void {
  safeSetItem(STORAGE_KEYS.PLAN, plan);
}

export function loadStoredChecklists(): ChecklistTask[] {
  return safeGetItem<ChecklistTask[]>(STORAGE_KEYS.CHECKLISTS, INITIAL_CHECKLIST);
}

export function saveStoredChecklists(tasks: ChecklistTask[]): void {
  safeSetItem(STORAGE_KEYS.CHECKLISTS, tasks);
}

export function loadStoredHistory(): ActivityRecord[] {
  return safeGetItem<ActivityRecord[]>(STORAGE_KEYS.HISTORY, INITIAL_ACTIVITY_HISTORY);
}

export function saveStoredHistory(history: ActivityRecord[]): void {
  safeSetItem(STORAGE_KEYS.HISTORY, history);
}

export function loadStoredProfile(): UserProfile {
  return safeGetItem<UserProfile>(STORAGE_KEYS.PROFILE, DEFAULT_USER_PROFILE);
}

export function saveStoredProfile(profile: UserProfile): void {
  safeSetItem(STORAGE_KEYS.PROFILE, profile);
}

export function resetAllStoredData(): {
  plan: PaymentPlanInput;
  checklists: ChecklistTask[];
  history: ActivityRecord[];
  profile: UserProfile;
} {
  try {
    localStorage.removeItem(STORAGE_KEYS.PLAN);
    localStorage.removeItem(STORAGE_KEYS.CHECKLISTS);
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
    localStorage.removeItem(STORAGE_KEYS.PROFILE);
  } catch {
    // Ignore storage clear errors
  }
  return {
    plan: { ...DEFAULT_DEMO_PLAN },
    checklists: [...INITIAL_CHECKLIST],
    history: [...INITIAL_ACTIVITY_HISTORY],
    profile: { ...DEFAULT_USER_PROFILE },
  };
}
