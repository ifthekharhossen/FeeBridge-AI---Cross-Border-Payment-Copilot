import React, { useState } from 'react';
import {
  History,
  Trash2,
  RotateCcw,
  ExternalLink,
  Calendar,
  Building,
  Coins,
  ArrowRight,
  X,
  Sparkles,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { ActivityRecord, NavigationPage } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { DemoDisclaimer } from '../common/DemoDisclaimer';
import { formatCurrency } from '../../utils/calculations';

interface HistoryPageProps {
  history: ActivityRecord[];
  onClearHistory: () => void;
  onRestoreHistory: () => void;
  onNavigate: (page: NavigationPage) => void;
  onTriggerAgentWithPrompt?: (prompt: string) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  history,
  onClearHistory,
  onRestoreHistory,
  onNavigate,
  onTriggerAgentWithPrompt,
}) => {
  const [selectedRecord, setSelectedRecord] = useState<ActivityRecord | null>(null);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Activity History</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Log of previously analyzed cross-border student payment plans and verification checks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {history.length > 0 ? (
            <button
              onClick={onClearHistory}
              className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-600 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Clear History</span>
            </button>
          ) : (
            <button
              onClick={onRestoreHistory}
              className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100/80 border border-blue-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Sample History</span>
            </button>
          )}
        </div>
      </div>

      <DemoDisclaimer compact />

      {/* Main Table or Empty State */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        {history.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800">No activity history records</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Analyses you perform in the Payment Plan or AI Agent pages will appear here.
              </p>
            </div>
            <button
              onClick={onRestoreHistory}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium inline-flex items-center gap-2 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Load Competition Sample Data</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-medium uppercase tracking-wider bg-slate-50/50">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">University & Dest.</th>
                  <th className="py-3 px-4">Payment Amount</th>
                  <th className="py-3 px-4">Origin & Rail</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {history.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {record.date}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{record.university}</div>
                      <div className="text-[11px] text-slate-500">{record.destinationCountry}</div>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                      {formatCurrency(record.amount, record.currency)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-800">{record.selectedRoute || 'Direct Bank Wire'}</div>
                      <div className="text-[11px] text-slate-400">From {record.originCountry}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge status={record.status} label={record.status} />
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedRecord(record)}
                        className="px-2.5 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition-colors cursor-pointer"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200/90 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedRecord.university}</h3>
                <p className="text-xs text-slate-500">Analysis Record ID: {selectedRecord.id}</p>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-slate-500">Amount Analyzed:</span>
                  <span className="text-sm font-bold text-slate-900">
                    {formatCurrency(selectedRecord.amount, selectedRecord.currency)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-slate-500">Remittance Corridor:</span>
                  <span className="font-medium text-slate-800">
                    {selectedRecord.originCountry} → {selectedRecord.destinationCountry}
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-slate-500">Selected Rail:</span>
                  <span className="font-medium text-blue-700">{selectedRecord.selectedRoute}</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-slate-500">Audit Status:</span>
                  <StatusBadge status={selectedRecord.status} label={selectedRecord.status} />
                </div>
              </div>

              {selectedRecord.notes && (
                <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-lg text-amber-900">
                  <span className="font-semibold block mb-0.5">Auditor Log:</span>
                  <p className="leading-relaxed text-[11px]">{selectedRecord.notes}</p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  if (onTriggerAgentWithPrompt) {
                    onTriggerAgentWithPrompt(
                      `Explain the payment analysis for ${selectedRecord.university} (${selectedRecord.currency} ${selectedRecord.amount}) from ${selectedRecord.originCountry}.`
                    );
                  }
                  setSelectedRecord(null);
                  onNavigate('agent');
                }}
                className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Discuss with Copilot</span>
              </button>
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
