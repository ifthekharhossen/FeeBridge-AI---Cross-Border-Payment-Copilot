import React, { useState } from 'react';
import {
  CheckSquare,
  Square,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Calendar,
  Trash2,
  RotateCcw
} from 'lucide-react';
import { ChecklistTask, NavigationPage } from '../../types';
import { DemoDisclaimer } from '../common/DemoDisclaimer';

interface ChecklistPageProps {
  tasks: ChecklistTask[];
  onToggleTask: (id: string) => void;
  onAddTask: (task: Omit<ChecklistTask, 'id' | 'source'>) => void;
  onDeleteTask: (id: string) => void;
  onNavigate: (page: NavigationPage) => void;
  onRestoreChecklist?: () => void;
  onTriggerAgentWithPrompt?: (prompt: string) => void;
}

export const ChecklistPage: React.FC<ChecklistPageProps> = ({
  tasks,
  onToggleTask,
  onAddTask,
  onDeleteTask,
  onNavigate,
  onRestoreChecklist,
  onTriggerAgentWithPrompt,
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'external'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<ChecklistTask['category']>('verification');
  const [newPriority, setNewPriority] = useState<ChecklistTask['priority']>('medium');
  const [newDetails, setNewDetails] = useState('');
  const [newRequiresExternal, setNewRequiresExternal] = useState(false);

  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.completed).length;
  const percentComplete = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const externalCount = tasks.filter((t) => t.requiresExternalConfirmation && !t.completed).length;

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'pending') return !t.completed;
    if (filter === 'completed') return t.completed;
    if (filter === 'external') return t.requiresExternalConfirmation && !t.completed;
    return true;
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onAddTask({
      title: newTitle.trim(),
      category: newCategory,
      priority: newPriority,
      completed: false,
      requiresExternalConfirmation: newRequiresExternal,
      details: newDetails.trim() || 'Custom checklist task added by student.',
      dueDate: '2026-10-27',
    });

    setNewTitle('');
    setNewDetails('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">My Payment Checklist</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit milestones to ensure wire compliance, exchange rate lock-in, and admissions ledger confirmation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (onTriggerAgentWithPrompt) {
                onTriggerAgentWithPrompt(`Review my payment checklist. I currently have ${completedCount} of ${totalCount} milestones completed.`);
              }
              onNavigate('agent');
            }}
            className="px-3.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100/80 border border-blue-200/80 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Review with Copilot</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Custom Task</span>
          </button>
        </div>
      </div>

      <DemoDisclaimer compact />

      {/* Progress & Summary Bar */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">Preparation Readiness</span>
              <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                {percentComplete}% Ready
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {completedCount} of {totalCount} completed · {externalCount} awaiting external bank / university clearance
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="text-right">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Completed</span>
              <span className="font-bold text-emerald-700">{completedCount}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">External Gates</span>
              <span className="font-bold text-amber-700">{externalCount}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total</span>
              <span className="font-bold text-slate-800">{totalCount}</span>
            </div>
          </div>
        </div>

        {/* Visual Progress Track */}
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${percentComplete}%` }}
          />
        </div>
      </div>

      {/* Filter Tabs (Interactive Functional Buttons) */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg max-w-fit text-xs font-medium">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
            filter === 'all'
              ? 'bg-white text-slate-900 shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          All Tasks ({tasks.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
            filter === 'pending'
              ? 'bg-white text-slate-900 shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Pending ({tasks.filter((t) => !t.completed).length})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
            filter === 'completed'
              ? 'bg-white text-slate-900 shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Completed ({completedCount})
        </button>
        <button
          onClick={() => setFilter('external')}
          className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
            filter === 'external'
              ? 'bg-white text-slate-900 shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          External Confirmation ({externalCount})
        </button>
      </div>

      {/* Task List */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {filteredTasks.length === 0 ? (
          <div className="p-8 text-center text-slate-400 space-y-2">
            <CheckCircle2 className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-xs font-medium text-slate-600">No tasks in this view</p>
            <p className="text-[11px]">Select another filter or add a custom task above.</p>
            {onRestoreChecklist && tasks.length === 0 && (
              <div className="pt-2">
                <button
                  onClick={onRestoreChecklist}
                  className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore Sample Checklist</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`p-4 transition-colors flex items-start gap-3.5 hover:bg-slate-50/70 ${
                task.completed ? 'bg-slate-50/40' : ''
              }`}
            >
              {/* Checkbox */}
              <button
                onClick={() => onToggleTask(task.id)}
                className="mt-0.5 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer shrink-0"
                aria-label={`Mark "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
              >
                {task.completed ? (
                  <CheckSquare className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Square className="w-5 h-5 text-slate-300 hover:text-slate-400" />
                )}
              </button>

              {/* Task Details */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4
                    className={`text-xs font-semibold ${
                      task.completed ? 'line-through text-slate-400' : 'text-slate-900'
                    }`}
                  >
                    {task.title}
                  </h4>

                  {/* Metadata labels */}
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                    {task.category}
                  </span>

                  {task.requiresExternalConfirmation && (
                    <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/60">
                      External Gate
                    </span>
                  )}

                  {task.priority === 'high' && !task.completed && (
                    <span className="text-[10px] font-medium text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded">
                      High Priority
                    </span>
                  )}
                </div>

                <p
                  className={`text-xs leading-relaxed ${
                    task.completed ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  {task.details}
                </p>

                {task.dueDate && (
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-0.5">
                    <Calendar className="w-3 h-3" />
                    <span>Target Date: {task.dueDate}</span>
                  </div>
                )}
              </div>

              {/* Delete button if user added */}
              {task.source === 'user_added' && (
                <button
                  onClick={() => onDeleteTask(task.id)}
                  className="text-slate-300 hover:text-rose-600 p-1 transition-colors"
                  title="Delete task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200/90 max-w-md w-full p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Add Custom Payment Task</h3>
              <p className="text-xs text-slate-500">Track an institution or country-specific requirement</p>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Task Title *</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Request bank endorsement stamp on invoice"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as ChecklistTask['category'])}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="verification">Verification</option>
                    <option value="financial">Financial / FX</option>
                    <option value="documentation">Documentation</option>
                    <option value="confirmation">Confirmation</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as ChecklistTask['priority'])}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Details & Instructions</label>
                <textarea
                  value={newDetails}
                  onChange={(e) => setNewDetails(e.target.value)}
                  rows={2}
                  placeholder="Notes or requirements for completing this step..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="reqExt"
                  checked={newRequiresExternal}
                  onChange={(e) => setNewRequiresExternal(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="reqExt" className="text-slate-700 font-medium">
                  Requires external confirmation (bank, university, or embassy)
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
