import React from 'react';
import { Info } from 'lucide-react';

interface DemoDisclaimerProps {
  compact?: boolean;
}

export const DemoDisclaimer: React.FC<DemoDisclaimerProps> = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-slate-500 py-1">
        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span>Exchange rates, fees, and bank records are illustrative simulations for competition prototype demonstration only.</span>
      </div>
    );
  }

  return (
    <div className="p-3.5 rounded-lg border border-slate-200/90 bg-white/70 shadow-xs flex items-start gap-3">
      <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center shrink-0 mt-0.5 text-slate-600">
        <Info className="w-4 h-4" />
      </div>
      <div className="text-xs text-slate-600 space-y-0.5">
        <p className="font-medium text-slate-800">Illustrative Prototype Notice</p>
        <p className="leading-relaxed">
          All foreign exchange rates, transfer fees, processing durations, and university payment records displayed in FeeBridge AI are illustrative mock values designed for prototype demonstration. FeeBridge does not execute financial transactions, remit funds, or replace official university admissions advice.
        </p>
      </div>
    </div>
  );
};
