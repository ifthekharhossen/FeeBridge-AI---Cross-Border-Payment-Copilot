import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  Clock,
  Terminal,
  ExternalLink,
  ShieldCheck,
  RotateCcw,
  Code,
  Check
} from 'lucide-react';
import { AgentMessage, AgentToolExecution, PaymentPlanInput, NavigationPage, ChecklistTask } from '../../types';
import { INITIAL_AGENT_MESSAGE, DEFAULT_DEMO_PLAN } from '../../utils/agentEngine';
import { sendAgentMessage } from '../../api/agentClient';
import { formatCurrency } from '../../utils/calculations';

interface AgentPageProps {
  currentPlan: PaymentPlanInput;
  checklists?: ChecklistTask[];
  onNavigate: (page: NavigationPage) => void;
  onApplyRouteToPlan?: (routeId: string, routeName: string, estimatedCost: number) => void;
  onSyncTasksToChecklist?: (tasks: ChecklistTask[]) => void;
  presetPrompt?: string;
  onClearPresetPrompt?: () => void;
}

export const AgentPage: React.FC<AgentPageProps> = ({
  currentPlan,
  checklists,
  onNavigate,
  onApplyRouteToPlan,
  onSyncTasksToChecklist,
  presetPrompt,
  onClearPresetPrompt,
}) => {
  const [messages, setMessages] = useState<AgentMessage[]>([INITIAL_AGENT_MESSAGE]);
  const [activeToolExecutions, setActiveToolExecutions] = useState<AgentToolExecution[]>([
    {
      id: 'tool-init-1',
      toolName: 'check_payment_instructions',
      label: 'Checking university payment requirements',
      status: 'completed',
      timestamp: 'Initial sync',
      inputPayload: { university: currentPlan.universityName, corridor: `${currentPlan.originCountry} → ${currentPlan.destinationCountry}` },
      outputSummary: 'Verified receiving bank branch. 1 reference check pending.',
      findings: [
        { type: 'success', text: 'Zhejiang University International College account registry verified.' },
        { type: 'warning', text: 'Mandatory reference required in Field 70.' },
      ],
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedToolId, setExpandedToolId] = useState<string | null>(null);
  const [agentMode, setAgentMode] = useState<'llm' | 'demo' | 'demo_fallback' | 'client_simulation'>('client_simulation');
  const [agentProvider, setAgentProvider] = useState<string | null>(null);
  const [latestGeneratedTasks, setLatestGeneratedTasks] = useState<ChecklistTask[]>([]);
  const [appliedRouteNotice, setAppliedRouteNotice] = useState<string | null>(null);
  const [syncedTasksNotice, setSyncedTasksNotice] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const suggestionChips = [
    'Plan my tuition payment',
    'Compare transfer costs',
    'Check payment instructions',
    'Prepare a payment checklist',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isProcessing]);

  // Handle preset prompt if passed from other page (like guided demo)
  useEffect(() => {
    if (presetPrompt) {
      handleUserSubmit(presetPrompt);
      if (onClearPresetPrompt) onClearPresetPrompt();
    }
  }, [presetPrompt]);

  const handleUserSubmit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isProcessing) return;

    const userMsg: AgentMessage = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsProcessing(true);

    // Call the hybrid agent client. The conversation so far and live plan & checklists are sent as context.
    const history = messages.map(({ sender, content }) => ({ sender, content }));
    sendAgentMessage(trimmed, currentPlan, history, checklists || [])
      .then((res) => {
        setAgentMode(res.mode);
        setAgentProvider(res.provider);
        setActiveToolExecutions(res.tools);
        setExpandedToolId(res.tools[0]?.id || null);
        setMessages((prev) => [...prev, res.replyMessage]);
        if (res.checklist && res.checklist.length > 0) {
          setLatestGeneratedTasks(res.checklist);
        }
      })
      .catch((err: unknown) => {
        const errorMsg: AgentMessage = {
          id: `msg-error-${Date.now()}`,
          sender: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          content: `Sorry, I could not complete that request. ${err instanceof Error ? err.message : 'Unknown error.'}`,
        };
        setMessages((prev) => [...prev, errorMsg]);
      })
      .finally(() => setIsProcessing(false));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleUserSubmit(inputValue);
    }
  };

  const handleResetConversation = () => {
    setMessages([INITIAL_AGENT_MESSAGE]);
    setActiveToolExecutions([
      {
        id: 'tool-init-1',
        toolName: 'check_payment_instructions',
        label: 'Checking university payment requirements',
        status: 'completed',
        timestamp: 'Initial sync',
        inputPayload: { university: currentPlan.universityName },
        outputSummary: 'Verified receiving bank branch. 1 reference check pending.',
        findings: [
          { type: 'success', text: 'Zhejiang University International College account registry verified.' },
        ],
      },
    ]);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto h-[calc(100vh-8.5rem)] flex flex-col">
      {/* Header bar */}
      <div className="flex items-center justify-between bg-white px-5 py-3 rounded-xl border border-slate-200/90 shadow-xs shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-900">FeeBridge AI Agent</h2>
              <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                Copilot Engine v2.4
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Coordinating tool execution: FX comparison, bank verification, and compliance checklists
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetConversation}
            className="px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Reset conversation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
          <span className="text-[11px] text-slate-400 border-l border-slate-200 pl-2 hidden md:inline">
            Active: {currentPlan.originCountry} → {currentPlan.destinationCountry}
          </span>
        </div>
      </div>

      {appliedRouteNotice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-3.5 py-2 rounded-lg flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{appliedRouteNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('payment-plan')}
            className="text-[11px] font-semibold text-emerald-700 underline hover:text-emerald-900 cursor-pointer"
          >
            View in Payment Plan &rarr;
          </button>
        </div>
      )}

      {syncedTasksNotice && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 text-xs px-3.5 py-2 rounded-lg flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="font-medium">{syncedTasksNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('checklists')}
            className="text-[11px] font-semibold text-blue-700 underline hover:text-blue-900 cursor-pointer"
          >
            View in My Checklists &rarr;
          </button>
        </div>
      )}

      {/* Main split view: Chat area + Agent Activity panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
        {/* Left Column: Chat conversation (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/90 shadow-xs flex flex-col min-h-0 overflow-hidden">
          {/* Scrollable messages container */}
          <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[88%] sm:max-w-[82%] rounded-xl p-3.5 sm:p-4 text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-50 border border-slate-200/80 text-slate-800'
                  }`}
                >
                  <p className="whitespace-pre-line font-normal">{msg.content}</p>

                  {/* Rich structured breakdown if present */}
                  {msg.structuredBreakdown && (
                    <div className="mt-3.5 space-y-3 pt-3 border-t border-slate-200/80">
                      {/* Summary text */}
                      {msg.structuredBreakdown.summary && (
                        <p className="text-slate-600 leading-relaxed font-normal">
                          {msg.structuredBreakdown.summary}
                        </p>
                      )}

                      {/* Cost Overview Card */}
                      {msg.structuredBreakdown.costOverview && (
                        <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-xs space-y-2">
                          <div className="flex items-center justify-between text-xs font-semibold text-slate-900">
                            <span>Estimated Financial Impact</span>
                            <span className="text-blue-600 font-mono">
                              1 {msg.structuredBreakdown.costOverview.targetCurrency} ≈{' '}
                              {msg.structuredBreakdown.costOverview.estimatedRate}{' '}
                              {msg.structuredBreakdown.costOverview.sourceCurrency}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-600">
                            {msg.structuredBreakdown.costOverview.feeSummary}
                          </div>
                          <div className="pt-1.5 flex items-center justify-between border-t border-slate-100">
                            <span className="text-[11px] text-slate-500">Destination Tuition:</span>
                            <span className="font-semibold text-slate-800">
                              {formatCurrency(
                                msg.structuredBreakdown.costOverview.targetAmount,
                                msg.structuredBreakdown.costOverview.targetCurrency
                              )}
                            </span>
                          </div>

                          {/* Interactive Apply Route button */}
                          {onApplyRouteToPlan && (
                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                              <span className="text-[11px] text-slate-500">Route Selection:</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const co = msg.structuredBreakdown!.costOverview!;
                                  const rName = co.routeName || 'Recommended Transfer Rail';
                                  onApplyRouteToPlan(co.routeId || 'student_fintech', rName, co.sourceAmount);
                                  setAppliedRouteNotice(`Applied "${rName}" to your payment plan!`);
                                  setTimeout(() => setAppliedRouteNotice(null), 3000);
                                }}
                                className="px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-semibold border border-blue-200 flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <Check className="w-3 h-3 text-blue-600" />
                                <span>Apply to Plan</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Verification Findings */}
                      {msg.structuredBreakdown.verificationFindings &&
                        msg.structuredBreakdown.verificationFindings.length > 0 && (
                          <div className="space-y-1.5">
                            <p className="font-semibold text-slate-800 text-[11px] uppercase tracking-wider">
                              Payment Instruction Findings
                            </p>
                            <div className="space-y-1.5">
                              {msg.structuredBreakdown.verificationFindings.map((vf, i) => (
                                <div
                                  key={i}
                                  className={`p-2.5 rounded-lg border text-[11px] flex items-start gap-2 ${
                                    vf.status === 'pass'
                                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                                      : vf.status === 'warning'
                                      ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                                      : 'bg-rose-50/70 border-rose-200 text-rose-900'
                                  }`}
                                >
                                  {vf.status === 'pass' ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                  ) : vf.status === 'warning' ? (
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                                  ) : (
                                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                                  )}
                                  <div>
                                    <span className="font-semibold">{vf.title}: </span>
                                    <span className="font-normal opacity-90">{vf.detail}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Missing Items */}
                      {msg.structuredBreakdown.missingItems &&
                        msg.structuredBreakdown.missingItems.length > 0 && (
                          <div className="p-2.5 rounded-lg bg-amber-50/50 border border-amber-200/80 text-[11px] text-amber-900 space-y-1">
                            <span className="font-semibold flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 text-amber-600" />
                              Items Requiring Attention:
                            </span>
                            <ul className="list-disc pl-4 space-y-0.5 text-amber-800">
                              {msg.structuredBreakdown.missingItems.map((item, idx) => (
                                <li key={idx}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                      {/* Action Items */}
                      {msg.structuredBreakdown.actionItems &&
                        msg.structuredBreakdown.actionItems.length > 0 && (
                          <div className="space-y-1 pt-1">
                            <span className="font-semibold text-slate-800 text-[11px]">
                              Recommended Next Actions (Click to navigate):
                            </span>
                            <div className="space-y-1">
                              {msg.structuredBreakdown.actionItems.map((act, idx) => (
                                <div
                                  key={idx}
                                  onClick={() => {
                                    const a = act.toLowerCase();
                                    if (a.includes('compare') || a.includes('rail') || a.includes('cost') || a.includes('route')) {
                                      onNavigate('compare-costs');
                                    } else if (a.includes('verification') || a.includes('verify') || a.includes('bank') || a.includes('instruction')) {
                                      onNavigate('verification');
                                    } else if (a.includes('checklist') || a.includes('task') || a.includes('endorsement')) {
                                      onNavigate('checklists');
                                    } else if (a.includes('plan')) {
                                      onNavigate('payment-plan');
                                    }
                                  }}
                                  className="flex items-center justify-between p-2 rounded-md bg-white border border-slate-200 text-[11px] text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                                >
                                  <span>{act}</span>
                                  <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Interactive Sync Tasks button if checklist was generated */}
                      {latestGeneratedTasks.length > 0 && onSyncTasksToChecklist && (
                        <div className="p-3 bg-blue-50/90 border border-blue-200/90 rounded-lg flex items-center justify-between text-xs mt-2">
                          <div>
                            <span className="font-semibold text-blue-900 block">Preparation Checklist Ready</span>
                            <span className="text-blue-700 text-[11px]">
                              {latestGeneratedTasks.length} dated milestones generated from your deadline
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              onSyncTasksToChecklist(latestGeneratedTasks);
                              setSyncedTasksNotice(`Synced ${latestGeneratedTasks.length} tasks to My Checklists!`);
                              setTimeout(() => setSyncedTasksNotice(null), 3500);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Sync to My Checklist</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-1 text-[10px] opacity-60 text-right">{msg.timestamp}</div>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isProcessing && (
              <div className="flex gap-3 items-center text-slate-500 text-xs py-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                  <span className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span>Agent executing tools: comparing transfer rails & checking bank instructions...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestion Chips */}
          <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50 flex flex-wrap gap-1.5 shrink-0">
            {suggestionChips.map((chip, idx) => (
              <button
                key={idx}
                disabled={isProcessing}
                onClick={() => handleUserSubmit(chip)}
                className="px-2.5 py-1 rounded-md bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200/90 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Message Composer */}
          <div className="p-3 border-t border-slate-200/90 bg-white shrink-0">
            <div className="relative rounded-lg border border-slate-300 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask FeeBridge (e.g. Plan my tuition payment from Bangladesh to China)..."
                rows={2}
                className="w-full px-3 py-2 text-xs focus:outline-none resize-none bg-transparent"
              />
              <div className="px-3 pb-2 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  Press Enter to send · Shift+Enter for new line
                </span>
                <button
                  onClick={() => handleUserSubmit(inputValue)}
                  disabled={!inputValue.trim() || isProcessing}
                  className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer"
                >
                  <span>Send</span>
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 text-center mt-2">
              FeeBridge AI Agent is a simulated prototype workflow for educational payment preparation.
            </p>
          </div>
        </div>

        {/* Right Column: Agent Activity Panel (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/90 shadow-xs flex flex-col min-h-0 overflow-hidden">
          {/* Panel Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-slate-500" />
              <div>
                <h3 className="text-xs font-semibold text-slate-900">Agent Activity</h3>
                <p className="text-[10px] text-slate-400">Deterministic tool execution pipeline</p>
              </div>
            </div>
            <span
              className={`text-[10px] font-medium px-2 py-0.5 rounded border ${
                agentMode === 'llm'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : agentMode === 'demo'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : agentMode === 'demo_fallback'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-purple-50 text-purple-700 border-purple-200'
              }`}
            >
              {agentMode === 'llm'
                ? `Live AI (${agentProvider || 'LLM'})`
                : agentMode === 'demo'
                ? 'FastAPI Copilot (Deterministic)'
                : agentMode === 'demo_fallback'
                ? 'LLM Fallback (Backend Demo)'
                : 'Offline Simulation Copilot'}
            </span>
          </div>

          {/* Workflow Sequence Steps */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/60 shrink-0">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Workflow Sequence
            </p>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-700">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>1. Understanding payment request</span>
                </span>
                <span className="text-[10px] text-emerald-700 font-medium">Completed</span>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>2. Comparing illustrative transfer costs</span>
                </span>
                <span className="text-[10px] text-emerald-700 font-medium">Completed</span>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>3. Checking university payment requirements</span>
                </span>
                <span className="text-[10px] text-emerald-700 font-medium">Completed</span>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>4. Identifying missing information</span>
                </span>
                <span className="text-[10px] text-amber-700 font-medium">Action Needed</span>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>5. Preparing recommendations</span>
                </span>
                <span className="text-[10px] text-emerald-700 font-medium">Completed</span>
              </div>
            </div>
          </div>

          {/* Tool Executions List */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Tool Invocation Logs
            </p>

            {activeToolExecutions.map((tool) => {
              const isExpanded = expandedToolId === tool.id;
              return (
                <div
                  key={tool.id}
                  className="rounded-lg border border-slate-200/90 bg-white overflow-hidden shadow-2xs"
                >
                  <button
                    onClick={() => setExpandedToolId(isExpanded ? null : tool.id)}
                    className="w-full p-3 text-left flex items-start justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <code className="text-[10px] font-mono font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                          {tool.toolName}
                        </code>
                        <span className="text-[10px] text-slate-400">{tool.timestamp}</span>
                      </div>
                      <p className="text-xs font-medium text-slate-800">{tool.label}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {tool.status === 'completed' ? (
                        <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          Success
                        </span>
                      ) : tool.status === 'flagged' ? (
                        <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                          Flagged
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          Running
                        </span>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {/* Expandable Simulated Tool Body */}
                  {isExpanded && (
                    <div className="px-3 pb-3 pt-1 border-t border-slate-100 bg-slate-50/70 text-xs space-y-2.5">
                      <div>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                          Inputs
                        </span>
                        <pre className="text-[10px] font-mono bg-white p-2 rounded border border-slate-200 text-slate-700 overflow-x-auto">
                          {JSON.stringify(tool.inputPayload, null, 2)}
                        </pre>
                      </div>

                      <div>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                          Output Summary
                        </span>
                        <p className="text-slate-700 bg-white p-2 rounded border border-slate-200 text-[11px] leading-relaxed">
                          {tool.outputSummary}
                        </p>
                      </div>

                      {tool.findings && tool.findings.length > 0 && (
                        <div>
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                            Audited Findings
                          </span>
                          <div className="space-y-1">
                            {tool.findings.map((f, i) => (
                              <div
                                key={i}
                                className={`p-2 rounded text-[11px] flex items-start gap-1.5 ${
                                  f.type === 'success'
                                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-100'
                                    : f.type === 'warning'
                                    ? 'bg-amber-50 text-amber-900 border border-amber-100'
                                    : 'bg-blue-50 text-blue-900 border border-blue-100'
                                }`}
                              >
                                {f.type === 'success' ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                ) : (
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                                )}
                                <span>{f.text}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick action footer */}
          <div className="p-3 border-t border-slate-100 bg-white shrink-0 flex items-center justify-between">
            <button
              onClick={() => onNavigate('verification')}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              <span>Test in Verification Workspace</span>
              <ArrowRight className="w-3 h-3" />
            </button>
            <button
              onClick={() => onNavigate('compare-costs')}
              className="text-xs text-slate-600 hover:text-slate-900 font-medium"
            >
              Compare Routes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
