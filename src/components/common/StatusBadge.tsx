import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, HelpCircle, Clock } from 'lucide-react';

export type StatusType =
  | 'match'
  | 'mismatch'
  | 'missing'
  | 'needs_confirmation'
  | 'verified'
  | 'action_required'
  | 'critical_mismatch'
  | 'completed'
  | 'pending'
  | 'Plan Created'
  | 'Verified'
  | 'Action Needed'
  | 'Checklist Ready'
  | 'Route Selected';

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, showIcon = true }) => {
  switch (status) {
    case 'match':
    case 'verified':
    case 'Verified':
    case 'completed':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
          {showIcon && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
          <span>{label || 'Verified Match'}</span>
        </span>
      );

    case 'missing':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700">
          {showIcon && <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
          <span>{label || 'Missing Value'}</span>
        </span>
      );

    case 'mismatch':
    case 'critical_mismatch':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-700">
          {showIcon && <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
          <span>{label || 'Critical Mismatch'}</span>
        </span>
      );

    case 'needs_confirmation':
    case 'action_required':
    case 'Action Needed':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-700">
          {showIcon && <HelpCircle className="w-3.5 h-3.5 text-sky-600 shrink-0" />}
          <span>{label || 'Needs Confirmation'}</span>
        </span>
      );

    case 'Plan Created':
    case 'Checklist Ready':
    case 'Route Selected':
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
          {showIcon && <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
          <span>{label || status}</span>
        </span>
      );

    default:
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
          <span>{label || status}</span>
        </span>
      );
  }
};
