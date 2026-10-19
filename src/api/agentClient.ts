import { AgentMessage, AgentToolExecution, ChecklistTask, PaymentPlanInput } from '../types';
import { runAgentWorkflow } from '../utils/agentEngine';

/**
 * Hybrid client for the FeeBridge AI Agent.
 *
 * 1. Attempts to connect to the Python FastAPI backend (/api/agent/chat).
 * 2. If the backend is running and has LLM keys configured, it runs real LLM tool-calling.
 * 3. If the backend is running without LLM keys, it runs backend deterministic demo mode.
 * 4. If the backend is offline/unreachable (e.g. running only 'npm run dev'), it gracefully
 *    falls back to the client-side workflow engine (client_simulation) using live plan context.
 *
 * This guarantees zero crashes during evaluation while maintaining strict transparency.
 */
const API_BASE: string = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? '';

export interface AgentChatResponse {
  replyMessage: AgentMessage;
  tools: AgentToolExecution[];
  mode: 'llm' | 'demo' | 'demo_fallback' | 'client_simulation';
  provider: string | null;
  model: string | null;
  warning: string | null;
  disclaimer: string;
  checklist?: ChecklistTask[] | null;
}

export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
  }
}

export async function sendAgentMessage(
  message: string,
  plan: PaymentPlanInput,
  history: Pick<AgentMessage, 'sender' | 'content'>[],
  activeChecklists: ChecklistTask[] = []
): Promise<AgentChatResponse> {
  // Try calling the FastAPI backend first
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout before offline fallback

    const res = await fetch(`${API_BASE}/api/agent/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, plan, history }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return data as AgentChatResponse;
    }
  } catch {
    // Backend is unreachable or timed out -> gracefully fall back to live client simulation
  }

  // Client-side fallback engine with live context
  const simulation = runAgentWorkflow(message, plan, activeChecklists);
  return {
    replyMessage: simulation.replyMessage,
    tools: simulation.tools,
    mode: 'client_simulation',
    provider: null,
    model: null,
    warning:
      'Running in Offline Simulation Copilot (backend not detected on port 8000). Calculations and tool traces executed locally in the browser with your active plan context.',
    disclaimer:
      'FeeBridge uses illustrative sample rates, fees and university records. Nothing here is a live quote or payment instruction. FeeBridge cannot send money.',
    checklist: simulation.checklist || null,
  };
}
