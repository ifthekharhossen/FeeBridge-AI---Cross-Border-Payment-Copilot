import { AgentMessage, AgentToolExecution, ChecklistTask, PaymentPlanInput } from '../types';
import { calculateTransferRoutes, formatCurrency } from './calculations';
import { UNIVERSITIES } from '../data/mockData';

export const INITIAL_AGENT_MESSAGE: AgentMessage = {
  id: 'msg-init-001',
  sender: 'assistant',
  timestamp: 'Just now',
  content:
    "Hi! I'm FeeBridge, your student payment copilot. I can help you compare estimated transfer costs, check university payment instructions, and prepare a payment checklist. What payment are you planning?",
};

export const DEFAULT_DEMO_PLAN: PaymentPlanInput = {
  originCountry: 'Bangladesh',
  destinationCountry: 'China',
  universityId: 'zju',
  universityName: 'Zhejiang University',
  tuitionAmount: 8000,
  tuitionCurrency: 'CNY',
  sourceCurrency: 'BDT',
  paymentDeadline: '2026-10-28',
  paymentPurpose: 'Tuition Deposit',
  studentName: 'Farhan Ahmed',
  studentId: '32401899',
  notes: 'Admitted for Autumn semester. Need to confirm deposit to receive JW202 visa document.',
};

/**
 * Builds dynamic checklist tasks calculated backwards from deadline and university buffer days.
 */
function generateDynamicChecklist(
  plan: PaymentPlanInput,
  uni: (typeof UNIVERSITIES)[0]
): ChecklistTask[] {
  const deadlineStr = plan.paymentDeadline || '2026-10-28';
  const deadlineDate = new Date(deadlineStr);
  const isValidDate = !isNaN(deadlineDate.getTime());
  const baseDate = isValidDate ? deadlineDate : new Date('2026-10-28');

  const subtractDays = (d: Date, days: number): string => {
    const copy = new Date(d);
    copy.setDate(copy.getDate() - days);
    return copy.toISOString().split('T')[0];
  };

  const buffer = uni.depositDeadlineBufferDays || 5;

  return [
    {
      id: `task-gen-${Date.now()}-1`,
      title: `Verify ${uni.name} Beneficiary & SWIFT (${uni.officialSwiftBic})`,
      category: 'verification',
      priority: 'high',
      completed: true,
      requiresExternalConfirmation: false,
      details: `Cross-check against official invoice: ${uni.officialBeneficiaryName}, Account ${uni.officialAccountNo}, Bank ${uni.officialBankName}.`,
      dueDate: subtractDays(baseDate, buffer + 4),
      source: 'auto_generated',
    },
    {
      id: `task-gen-${Date.now()}-2`,
      title: `Ensure Reference Field 70 contains required format: ${uni.exampleReference}`,
      category: 'verification',
      priority: 'high',
      completed: false,
      requiresExternalConfirmation: true,
      details: `University mandate: ${uni.requiredReferenceFormat}. ${uni.specialInstructions}`,
      dueDate: subtractDays(baseDate, buffer + 3),
      source: 'auto_generated',
    },
    {
      id: `task-gen-${Date.now()}-3`,
      title: `Lock in exchange rate with chosen transfer provider (${plan.sourceCurrency} → ${plan.tuitionCurrency})`,
      category: 'financial',
      priority: 'medium',
      completed: false,
      requiresExternalConfirmation: false,
      details: `Obtain official quote and lock 48-hour gross settlement quote for ${formatCurrency(plan.tuitionAmount, plan.tuitionCurrency)}.`,
      dueDate: subtractDays(baseDate, buffer + 2),
      source: 'auto_generated',
    },
    {
      id: `task-gen-${Date.now()}-4`,
      title: `${plan.originCountry} Central Bank / Outward Remittance Endorsement`,
      category: 'documentation',
      priority: 'high',
      completed: false,
      requiresExternalConfirmation: true,
      details: `Submit student admission invoice, passport, and student file documentation to authorised dealer bank in ${plan.originCountry}.`,
      dueDate: subtractDays(baseDate, buffer + 1),
      source: 'auto_generated',
    },
    {
      id: `task-gen-${Date.now()}-5`,
      title: `Initiate wire transfer before recommended cutoff (${subtractDays(baseDate, buffer)})`,
      category: 'financial',
      priority: 'high',
      completed: false,
      requiresExternalConfirmation: true,
      details: `Ensure telegraphic charge code is set to 'OUR' so correspondent banks do not deduct fees from tuition.`,
      dueDate: subtractDays(baseDate, buffer),
      source: 'auto_generated',
    },
    {
      id: `task-gen-${Date.now()}-6`,
      title: `Obtain official SWIFT MT103 confirmation receipt`,
      category: 'financial',
      priority: 'high',
      completed: false,
      requiresExternalConfirmation: true,
      details: `Request telegraphic confirmation copy from remitting institution once funds are dispatched.`,
      dueDate: subtractDays(baseDate, 2),
      source: 'auto_generated',
    },
    {
      id: `task-gen-${Date.now()}-7`,
      title: `Submit receipt to ${uni.name} International Admissions Portal`,
      category: 'confirmation',
      priority: 'medium',
      completed: false,
      requiresExternalConfirmation: true,
      details: `Upload MT103/provider payment slip for admissions ledger reconciliation before the ${deadlineStr} deadline.`,
      dueDate: deadlineStr,
      source: 'auto_generated',
    },
  ];
}

export function runAgentWorkflow(
  userQuery: string,
  plan: PaymentPlanInput = DEFAULT_DEMO_PLAN,
  activeChecklists: ChecklistTask[] = []
): {
  replyMessage: AgentMessage;
  tools: AgentToolExecution[];
  checklist?: ChecklistTask[];
} {
  const queryLower = userQuery.toLowerCase().trim();
  const routes = calculateTransferRoutes(plan.tuitionAmount, plan.tuitionCurrency, plan.sourceCurrency);
  const bestRoute = routes.find((r) => r.isLowestCost) || routes[0];
  const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Locate the actual university record from the active plan
  const matchedUni =
    UNIVERSITIES.find(
      (u) =>
        u.id.toLowerCase() === (plan.universityId || '').toLowerCase() ||
        u.name.toLowerCase() === (plan.universityName || '').toLowerCase()
    ) || UNIVERSITIES[0];

  const studentDisplayName = plan.studentName || 'Student';
  const studentDisplayId = plan.studentId || 'Not Assigned';
  const formattedAmount = formatCurrency(plan.tuitionAmount, plan.tuitionCurrency);
  const generatedTasks = generateDynamicChecklist(plan, matchedUni);

  // Check intent categories
  const isCostQuery =
    queryLower.includes('compare') ||
    queryLower.includes('cost') ||
    queryLower.includes('fee') ||
    queryLower.includes('rate') ||
    queryLower.includes('cheapest') ||
    queryLower.includes('rail') ||
    queryLower.includes('bdt') ||
    queryLower.includes('usd') ||
    queryLower.includes('spread');

  const isInstructionQuery =
    queryLower.includes('instruction') ||
    queryLower.includes('verify') ||
    queryLower.includes('bank') ||
    queryLower.includes('swift') ||
    queryLower.includes('bic') ||
    queryLower.includes('field 70') ||
    queryLower.includes('reference') ||
    queryLower.includes('beneficiary') ||
    queryLower.includes('account');

  const isChecklistQuery =
    queryLower.includes('checklist') ||
    queryLower.includes('task') ||
    queryLower.includes('prepare') ||
    queryLower.includes('steps') ||
    queryLower.includes('deadline') ||
    queryLower.includes('todo');

  const isStudentContextQuery =
    queryLower.includes('who') ||
    queryLower.includes('student') ||
    queryLower.includes('my plan') ||
    queryLower.includes('current plan') ||
    queryLower.includes('profile');

  const isFullPlanQuery =
    queryLower.includes('plan') ||
    queryLower.includes('tuition') ||
    queryLower.includes('deposit') ||
    queryLower.includes('everything') ||
    queryLower.includes(plan.originCountry.toLowerCase()) ||
    queryLower.includes(plan.destinationCountry.toLowerCase()) ||
    queryLower.includes(matchedUni.name.toLowerCase()) ||
    (!isCostQuery && !isInstructionQuery && !isChecklistQuery && !isStudentContextQuery);

  // 1. FULL PAYMENT PLAN WORKFLOW (Default / Primary)
  if (isFullPlanQuery && !isCostQuery && !isInstructionQuery && !isChecklistQuery && !isStudentContextQuery) {
    const tools: AgentToolExecution[] = [
      {
        id: `tool-${Date.now()}-1`,
        toolName: 'compare_transfer_costs',
        label: 'Evaluating payment rail costs & exchange rate',
        status: 'completed',
        timestamp: nowStr,
        inputPayload: {
          origin: plan.originCountry,
          destination: plan.destinationCountry,
          amount: plan.tuitionAmount,
          tuitionCurrency: plan.tuitionCurrency,
          sourceCurrency: plan.sourceCurrency,
        },
        outputSummary: `Compared 3 rails for ${formattedAmount}. Best value: ${bestRoute.name} (~${formatCurrency(
          bestRoute.estimatedOriginCost,
          plan.sourceCurrency
        )}).`,
        findings: [
          {
            type: 'success',
            text: `Identified 3 transfer channels from ${plan.originCountry} to ${plan.destinationCountry}.`,
          },
          {
            type: 'info',
            text: `${bestRoute.name} offers guaranteed gross settlement, avoiding unexpected tuition shortfalls.`,
          },
        ],
      },
      {
        id: `tool-${Date.now()}-2`,
        toolName: 'check_payment_instructions',
        label: `Auditing ${matchedUni.name} payment credentials`,
        status: 'flagged',
        timestamp: nowStr,
        inputPayload: {
          university: matchedUni.name,
          beneficiary: matchedUni.officialBeneficiaryName,
          swift: matchedUni.officialSwiftBic,
          requiredFormat: matchedUni.requiredReferenceFormat,
        },
        outputSummary: `Verified ${matchedUni.officialBankName}. Flagged 1 mandatory reference requirement.`,
        findings: [
          {
            type: 'success',
            text: `Beneficiary and SWIFT BIC (${matchedUni.officialSwiftBic}) match official institutional repository.`,
          },
          {
            type: 'warning',
            text: `Remittance reference (Field 70) must strictly follow: ${matchedUni.exampleReference}.`,
          },
        ],
      },
      {
        id: `tool-${Date.now()}-3`,
        toolName: 'create_payment_checklist',
        label: 'Generating dated compliance milestones',
        status: 'completed',
        timestamp: nowStr,
        inputPayload: {
          deadline: plan.paymentDeadline,
          universityBufferDays: matchedUni.depositDeadlineBufferDays,
          originCountry: plan.originCountry,
        },
        outputSummary: `Formulated ${generatedTasks.length} preparation tasks with verification checkpoints.`,
        findings: [
          {
            type: 'info',
            text: `Recommended dispatch date: at least ${matchedUni.depositDeadlineBufferDays} business days before ${plan.paymentDeadline}.`,
          },
          {
            type: 'success',
            text: `Included ${plan.originCountry} outward educational foreign exchange documentation steps.`,
          },
        ],
      },
    ];

    const replyMessage: AgentMessage = {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      timestamp: nowStr,
      content: `I've prepared a complete cross-border payment plan for **${formattedAmount}** to **${matchedUni.name}** for **${studentDisplayName}** (ID: ${studentDisplayId}). All calculations use your active corridor (${plan.originCountry} → ${plan.destinationCountry}).`,
      structuredBreakdown: {
        summary: `Payment plan evaluated for ${studentDisplayName}. We compared 3 transfer rails, verified official instructions for ${matchedUni.name}, and generated an actionable preparation checklist. All figures are illustrative planning estimates.`,
        costOverview: {
          targetAmount: plan.tuitionAmount,
          targetCurrency: plan.tuitionCurrency,
          sourceAmount: bestRoute.estimatedOriginCost,
          sourceCurrency: plan.sourceCurrency,
          estimatedRate: bestRoute.illustrativeRate,
          feeSummary: `${bestRoute.name}: Est. Total ~${formatCurrency(
            bestRoute.estimatedOriginCost,
            plan.sourceCurrency
          )} (Illustrative rate: 1 ${plan.tuitionCurrency} ≈ ${bestRoute.illustrativeRate} ${plan.sourceCurrency})`,
          routeId: bestRoute.id,
          routeName: bestRoute.name,
        },
        verificationFindings: [
          {
            status: 'pass',
            title: `Beneficiary & SWIFT (${matchedUni.officialSwiftBic}) Confirmed`,
            detail: `${matchedUni.officialBeneficiaryName} · ${matchedUni.officialBankName}.`,
          },
          {
            status: 'warning',
            title: `Field 70 Reference Mandate`,
            detail: `Format required: ${matchedUni.requiredReferenceFormat} (e.g. ${matchedUni.exampleReference}). Omission causes manual reconciliation delays.`,
          },
          {
            status: 'warning',
            title: `Intermediary Deduction Alert`,
            detail: `Direct commercial bank wires en route to ${matchedUni.country} can incur intermediary charges unless charge code 'OUR' is explicitly selected.`,
          },
        ],
        missingItems: [
          `Verified Student ID (${studentDisplayId}) included in draft payment reference`,
          `Admission offer letter / student file endorsement from remitting bank in ${plan.originCountry}`,
          `Minimum buffer of ${matchedUni.depositDeadlineBufferDays} business days before the ${plan.paymentDeadline} deadline`,
        ],
        actionItems: [
          `Review the 3 compared rails in "Compare Transfer Costs" (cheapest: ${bestRoute.name})`,
          `Verify your draft wire slip against official credentials in "Payment Verification"`,
          `Track compliance milestones in "My Checklists" or sync the tasks generated below`,
        ],
      },
      toolExecutions: tools,
    };

    return { replyMessage, tools, checklist: generatedTasks };
  }

  // 2. TRANSFER COST COMPARISON WORKFLOW
  if (isCostQuery) {
    const tools: AgentToolExecution[] = [
      {
        id: `tool-${Date.now()}-1`,
        toolName: 'compare_transfer_costs',
        label: `Calculating transfer rail costs for ${formattedAmount}`,
        status: 'completed',
        timestamp: nowStr,
        inputPayload: {
          amount: plan.tuitionAmount,
          tuitionCurrency: plan.tuitionCurrency,
          sourceCurrency: plan.sourceCurrency,
          corridor: `${plan.originCountry} → ${plan.destinationCountry}`,
        },
        outputSummary: `Compared Student FinTech, Digital Multi-Currency, and Commercial Bank Wire.`,
        findings: [
          {
            type: 'success',
            text: `Lowest estimated total: ${bestRoute.name} at ~${formatCurrency(
              bestRoute.estimatedOriginCost,
              plan.sourceCurrency
            )}.`,
          },
          {
            type: 'warning',
            text: `Traditional SWIFT involves higher fixed fees (${formatCurrency(
              routes.find((r) => r.id === 'direct_bank')?.fixedFeeOriginCurrency || 0,
              plan.sourceCurrency
            )}) plus potential intermediary bank deductions.`,
          },
        ],
      },
    ];

    const replyMessage: AgentMessage = {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      timestamp: nowStr,
      content: `Here is the transfer cost breakdown for sending **${formattedAmount}** to **${matchedUni.name}** paying in **${plan.sourceCurrency}**:`,
      structuredBreakdown: {
        summary: `Evaluated 3 remittance rails from ${plan.originCountry} to ${plan.destinationCountry}. Rates and spreads are illustrative planning benchmarks.`,
        costOverview: {
          targetAmount: plan.tuitionAmount,
          targetCurrency: plan.tuitionCurrency,
          sourceAmount: bestRoute.estimatedOriginCost,
          sourceCurrency: plan.sourceCurrency,
          estimatedRate: bestRoute.illustrativeRate,
          feeSummary: `Lowest estimated route: ${bestRoute.name} (~${formatCurrency(
            bestRoute.estimatedOriginCost,
            plan.sourceCurrency
          )})`,
          routeId: bestRoute.id,
          routeName: bestRoute.name,
        },
        verificationFindings: routes.map((route) => ({
          status: route.isLowestCost ? 'pass' : 'warning',
          title: route.name,
          detail: `Est. Total: ~${formatCurrency(route.estimatedOriginCost, plan.sourceCurrency)} | Rate: 1 ${
            plan.tuitionCurrency
          } ≈ ${route.illustrativeRate} ${plan.sourceCurrency} | ${route.estimatedDays} | Intermediary risk: ${
            route.intermediaryBankRisk
          }`,
        })),
        actionItems: [
          `Select "${bestRoute.name}" in Compare Transfer Costs to apply it to your payment plan`,
          `Check whether your local bank allows educational remittance in ${plan.tuitionCurrency} directly`,
        ],
      },
      toolExecutions: tools,
    };

    return { replyMessage, tools };
  }

  // 3. PAYMENT INSTRUCTIONS VERIFICATION WORKFLOW
  if (isInstructionQuery) {
    const tools: AgentToolExecution[] = [
      {
        id: `tool-${Date.now()}-1`,
        toolName: 'check_payment_instructions',
        label: `Auditing official bank coordinates for ${matchedUni.name}`,
        status: 'completed',
        timestamp: nowStr,
        inputPayload: {
          university: matchedUni.name,
          country: matchedUni.country,
          beneficiary: matchedUni.officialBeneficiaryName,
          accountNo: matchedUni.officialAccountNo,
          swift: matchedUni.officialSwiftBic,
        },
        outputSummary: `Verified deposit repository coordinates. Flagged mandatory student reference requirement.`,
        findings: [
          {
            type: 'success',
            text: `Institutional accounts: ${matchedUni.officialBeneficiaryName} at ${matchedUni.officialBankName}.`,
          },
          {
            type: 'warning',
            text: `Mandatory Field 70 reference: ${matchedUni.requiredReferenceFormat}.`,
          },
        ],
      },
    ];

    const replyMessage: AgentMessage = {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      timestamp: nowStr,
      content: `Here are the verified institutional wire instructions for **${matchedUni.name}**:`,
      structuredBreakdown: {
        summary: `Institution: ${matchedUni.name} (${matchedUni.city}, ${matchedUni.country}). Direct telegraphic transfer coordinates:`,
        verificationFindings: [
          {
            status: 'pass',
            title: `Official Beneficiary: ${matchedUni.officialBeneficiaryName}`,
            detail: `Account / IBAN: ${matchedUni.officialAccountNo}`,
          },
          {
            status: 'pass',
            title: `Receiving Bank & SWIFT/BIC`,
            detail: `${matchedUni.officialBankName} · SWIFT: ${matchedUni.officialSwiftBic}`,
          },
          {
            status: 'warning',
            title: `Payment Reference Mandate (Field 70)`,
            detail: `Strictly required: ${matchedUni.requiredReferenceFormat} (e.g. ${matchedUni.exampleReference}). ${matchedUni.specialInstructions}`,
          },
        ],
        missingItems: [
          `Ensure remitting bank does not truncate Field 70`,
          `Verify that student ID "${studentDisplayId}" is clearly stamped on the payment confirmation`,
        ],
        actionItems: [
          `Open the "Payment Verification" workspace to test your exact draft wire slip`,
          `Instruct your bank teller to set charge code to "OUR" to protect against deductions`,
        ],
      },
      toolExecutions: tools,
    };

    return { replyMessage, tools };
  }

  // 4. CHECKLIST / DEADLINE WORKFLOW
  if (isChecklistQuery) {
    const totalCount = activeChecklists.length || generatedTasks.length;
    const completedCount = activeChecklists.filter((t) => t.completed).length;
    const pendingTasks = activeChecklists.filter((t) => !t.completed);

    const tools: AgentToolExecution[] = [
      {
        id: `tool-${Date.now()}-1`,
        toolName: 'create_payment_checklist',
        label: `Auditing preparation readiness for deadline: ${plan.paymentDeadline}`,
        status: 'completed',
        timestamp: nowStr,
        inputPayload: {
          deadline: plan.paymentDeadline,
          universityBufferDays: matchedUni.depositDeadlineBufferDays,
          currentTaskCount: totalCount,
          completedTaskCount: completedCount,
        },
        outputSummary: `Evaluated checklist. ${completedCount}/${totalCount} tasks completed. ${pendingTasks.length} pending.`,
        findings: [
          {
            type: completedCount > 0 ? 'success' : 'info',
            text: `Progress: ${completedCount} of ${totalCount} milestones completed.`,
          },
          {
            type: 'warning',
            text: `Allow at least ${matchedUni.depositDeadlineBufferDays} days for university ledger allocation before ${plan.paymentDeadline}.`,
          },
        ],
      },
    ];

    const replyMessage: AgentMessage = {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      timestamp: nowStr,
      content: `Here is your payment preparation status for **${matchedUni.name}** (Target deadline: **${plan.paymentDeadline}**):`,
      structuredBreakdown: {
        summary: `Payment deadline is ${plan.paymentDeadline}. You currently have ${completedCount} of ${totalCount} milestones completed.`,
        verificationFindings: [
          {
            status: completedCount > 0 ? 'pass' : 'warning',
            title: `Preparation Readiness (${completedCount}/${totalCount} completed)`,
            detail:
              pendingTasks.length > 0
                ? `Next priority task: "${pendingTasks[0].title}".`
                : 'All current checklist milestones are completed!',
          },
          {
            status: 'warning',
            title: `University Settlement Buffer`,
            detail: `${matchedUni.name} recommends initiating telegraphic transfers at least ${matchedUni.depositDeadlineBufferDays} business days prior to deadline to clear international clearing holds.`,
          },
        ],
        actionItems: (pendingTasks.length > 0 ? pendingTasks : generatedTasks)
          .slice(0, 5)
          .map((t) => `${t.title} (Due: ${t.dueDate || 'Prior to deadline'})`),
      },
      toolExecutions: tools,
    };

    return { replyMessage, tools, checklist: generatedTasks };
  }

  // 5. STUDENT CONTEXT / GENERAL INQUIRY WORKFLOW
  const tools: AgentToolExecution[] = [
    {
      id: `tool-${Date.now()}-1`,
      toolName: 'check_payment_instructions',
      label: `Retrieving active student profile context`,
      status: 'completed',
      timestamp: nowStr,
      inputPayload: {
        student: studentDisplayName,
        id: studentDisplayId,
        university: matchedUni.name,
        amount: formattedAmount,
        corridor: `${plan.originCountry} → ${plan.destinationCountry}`,
      },
      outputSummary: `Loaded active student plan parameters.`,
      findings: [
        {
          type: 'info',
          text: `Active Plan: ${studentDisplayName} (${studentDisplayId}) paying ${formattedAmount} to ${matchedUni.name}.`,
        },
      ],
    },
  ];

  const replyMessage: AgentMessage = {
    id: `msg-${Date.now()}`,
    sender: 'assistant',
    timestamp: nowStr,
    content: `You are currently planning a payment of **${formattedAmount}** to **${matchedUni.name}** for **${studentDisplayName}** (Student ID: ${studentDisplayId}). How can I assist you with this transfer?`,
    structuredBreakdown: {
      summary: `Active student profile: ${studentDisplayName} (ID: ${studentDisplayId}) | Corridor: ${plan.originCountry} (${plan.sourceCurrency}) → ${plan.destinationCountry} (${matchedUni.name}) | Purpose: ${plan.paymentPurpose} | Deadline: ${plan.paymentDeadline}.`,
      verificationFindings: [
        {
          status: 'pass',
          title: `Current Payment Plan Loaded`,
          detail: `${formattedAmount} to ${matchedUni.name} due by ${plan.paymentDeadline}.`,
        },
        {
          status: 'pass',
          title: `Best Transfer Rail`,
          detail: `${bestRoute.name} estimated at ~${formatCurrency(
            bestRoute.estimatedOriginCost,
            plan.sourceCurrency
          )}.`,
        },
      ],
      actionItems: [
        'Ask "Plan my tuition payment" for a complete end-to-end breakdown',
        'Ask "Compare transfer costs" to see fee markups and transit times',
        'Ask "Check payment instructions" to inspect official bank account details',
        'Ask "Prepare a payment checklist" to review your milestones',
      ],
    },
    toolExecutions: tools,
  };

  return { replyMessage, tools, checklist: generatedTasks };
}
