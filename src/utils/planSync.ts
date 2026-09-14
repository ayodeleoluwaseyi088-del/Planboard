import { AttachedPlan, DecisionItem, TaskItem, SuggestionItem, InformationItem, ImagePosition, SuggestionImageItem } from '../types';
import { parseDateTimeInput } from './dateTime';
import { calculateCollectiveFunDecision } from './deciderCollective';

/**
 * Checks whether an item from any section (decision, task, suggestion, information)
 * is linked to or belongs to a given AttachedPlan.
 */
export function isPlanMatchingItem(
  plan: AttachedPlan,
  item: { id?: string; title?: string; deciderItemId?: string; planId?: string; type?: string; category?: string }
): boolean {
  if (!plan || !item) return false;

  // 1. Explicit planId link (e.g. suggestions always have planId)
  if (item.planId && item.planId === plan.id) {
    return true;
  }

  // 2. Direct deciderItemId references
  if (plan.deciderItemId && (plan.deciderItemId === item.id || plan.deciderItemId === item.deciderItemId)) {
    return true;
  }
  if (item.deciderItemId && (item.deciderItemId === plan.id || item.deciderItemId === plan.deciderItemId)) {
    return true;
  }

  // 3. ID Prefix matching (e.g. dec-drinks <-> plan-drinks, dec-cake <-> plan-cake)
  if (item.id) {
    if (
      item.id === `dec-${plan.id}` ||
      item.id === `task-${plan.id}` ||
      item.id === `info-${plan.id}` ||
      item.id === `sug-${plan.id}` ||
      plan.id === `plan-${item.id.replace(/^(dec|task|info|sug|tsk)-/, '')}`
    ) {
      return true;
    }
    const cleanItemId = item.id.replace(/^(dec|task|info|sug|tsk)-/, '').toLowerCase();
    const cleanPlanId = plan.id.replace(/^plan-/, '').toLowerCase();
    if (cleanItemId && cleanPlanId && (cleanItemId === cleanPlanId || cleanItemId.includes(cleanPlanId) || cleanPlanId.includes(cleanItemId))) {
      return true;
    }
  }

  // 4. Exact or substring title match
  if (plan.title && item.title) {
    const pTitle = plan.title.trim().toLowerCase();
    const iTitle = item.title.trim().toLowerCase();
    if (pTitle === iTitle) return true;
    if (pTitle.length >= 3 && (iTitle.includes(pTitle) || pTitle.includes(iTitle))) return true;
  }

  // 5. Category matching (strip emojis/spaces)
  if (plan.category && item.category) {
    const pCat = plan.category.replace(/[^\w\s]/gi, '').trim().toLowerCase();
    const iCat = item.category.replace(/[^\w\s]/gi, '').trim().toLowerCase();
    if (pCat && iCat && (pCat === iCat || pCat.includes(iCat) || iCat.includes(pCat))) {
      return true;
    }
  }

  return false;
}

/**
 * Returns the current leading option for a decision or plan options list
 */
export function getLeadingOption(options?: { id: string; label: string; voteCount: number }[]) {
  if (!options || options.length === 0) return null;
  const sorted = [...options].sort((a, b) => b.voteCount - a.voteCount);
  return sorted[0];
}

export interface PlanCurrentTruth {
  value: string;
  isDecided: boolean;
  statusLabel: string;
  sourceType: 'voting' | 'suggestion' | 'fixed_info' | 'task_duty' | 'participant_status' | 'wheel_spinner' | 'blind_pick' | 'manual';
  leadDetail?: string;
  subtext?: string;
  imageUrl?: string;
  imagePosition?: ImagePosition;
  images?: SuggestionImageItem[];
  winningOptionId?: string;
  dateTime?: string;
  date?: string;
  time?: string;
  hasSpecificTime?: boolean;
}

/**
 * Derives the single source of truth for "What is currently decided" for a given Plan.
 * Never shows old or reverted decisions. Always reflects live active state.
 */
export function getPlanCurrentTruth(
  plan: AttachedPlan,
  linkedDecision?: DecisionItem | null,
  linkedSuggestions?: SuggestionItem[]
): PlanCurrentTruth {
  let truth: PlanCurrentTruth;

  // Check if there is an active winning visual suggestion applied to this plan
  const winningSug = linkedSuggestions?.find(s => s.isSelectedWinner);
  if (winningSug && (plan.deciderType === 'photo_idea' || plan.appliedSuggestionId === winningSug.id || plan.isSelectedWinner)) {
    truth = {
      value: winningSug.title,
      isDecided: true,
      statusLabel: 'Current Selection ✓',
      sourceType: 'suggestion',
      subtext: 'Selected from visual ideas',
      imageUrl: winningSug.imageUrl || plan.imageUrl,
      imagePosition: winningSug.imagePosition || plan.imagePosition,
      images: winningSug.images || plan.images,
    };
  } else if (plan.deciderType === 'voting') {
    // 1. Voting decider
    // Check if decision is currently concluded
    const isCompleted = (linkedDecision && linkedDecision.status === 'completed') || (plan.status === 'confirmed' && !!plan.finalDecision);

    if (isCompleted) {
      const rawVal = plan.currentSelection || plan.finalDecision || linkedDecision?.finalDecision || '';
      // Strip trailing " ✓ (...)" if needed for clean display
      const cleanVal = rawVal.replace(/\s*✓.*$/, '').trim();
      truth = {
        value: cleanVal || rawVal || 'Decision Finalized',
        isDecided: true,
        statusLabel: 'Decided ✓',
        sourceType: 'voting',
        subtext: 'Final choice confirmed',
        winningOptionId: linkedDecision?.options?.find(o => rawVal.includes(o.label))?.id,
      };
    } else {
      // Voting is ACTIVE / REOPENED / PENDING
      const activeOptions = linkedDecision?.options || plan.options || [];
      const leader = getLeadingOption(activeOptions);
      const fallbackVal = plan.initialSelection || plan.description || 'Vote in progress';
      const leaderVal = leader && leader.voteCount > 0 ? leader.label : fallbackVal;

      truth = {
        value: leaderVal,
        isDecided: false,
        statusLabel: 'Voting Active',
        sourceType: 'voting',
        leadDetail: leader && leader.voteCount > 0 ? `${leader.voteCount} ${leader.voteCount === 1 ? 'vote' : 'votes'} (in the lead)` : undefined,
        subtext: leader && leader.voteCount > 0 ? `Leading choice (${leader.voteCount} votes)` : 'Open for votes',
        winningOptionId: undefined,
      };
    }
  } else if (plan.deciderType === 'photo_idea') {
    // 2. Photo / Visual Idea decider
    const fallbackVal = plan.currentSelection || plan.location || plan.initialSelection || plan.description || 'Open for visual ideas';
    const isDecided = plan.status === 'confirmed';

    truth = {
      value: fallbackVal,
      isDecided,
      statusLabel: isDecided ? 'Current Selection ✓' : 'Ideas Welcome',
      sourceType: isDecided ? 'manual' : 'suggestion',
      subtext: isDecided ? 'Confirmed selection' : `${linkedSuggestions?.length || 0} ideas submitted`,
      imageUrl: plan.imageUrl,
      imagePosition: plan.imagePosition,
    };
  } else if (plan.deciderType === 'fixed_info') {
    // 3. Fixed Info decider
    truth = {
      value: plan.currentSelection || plan.infoValue || plan.description || 'Fixed Ground Rule',
      isDecided: true,
      statusLabel: 'Fixed Info',
      sourceType: 'fixed_info',
      subtext: plan.fixedBy ? `Set by ${plan.fixedBy}` : 'Fixed ground rule',
    };
  } else if (plan.deciderType === 'task_duty') {
    // 4. Task / Duty decider
    const isDone = plan.status === 'confirmed';
    truth = {
      value: plan.taskDesc || plan.description || plan.title,
      isDecided: !!plan.assigneeName,
      statusLabel: plan.assigneeName ? (isDone ? 'Completed ✓' : 'Assigned') : 'Needs Volunteer',
      sourceType: 'task_duty',
      subtext: plan.assigneeName ? `Assigned to ${plan.assigneeName}` : 'Looking for a volunteer',
    };
  } else if (plan.deciderType === 'participant_status') {
    // 5. Participant Status decider (Check-in, Attendance, Payment)
    const statuses = plan.participantStatuses || {};
    const recordedEntries = Object.values(statuses).filter((s) => !!s.statusLabel);

    if (recordedEntries.length === 0) {
      truth = {
        value: plan.statusQuestion || 'Awaiting participant check-ins',
        isDecided: false,
        statusLabel: 'Status Open',
        sourceType: 'participant_status',
        subtext: 'No member responses yet',
      };
    } else {
      // Count occurrences of each status label
      const countsByLabel: Record<string, number> = {};
      recordedEntries.forEach((entry) => {
        const lbl = entry.statusLabel || 'Responded';
        countsByLabel[lbl] = (countsByLabel[lbl] || 0) + 1;
      });

      // Format summary in the order options are defined by the creator
      const definedLabels = plan.statusOptions?.map((o) => o.label) || Object.keys(countsByLabel);
      const summaryParts: string[] = [];

      definedLabels.forEach((lbl) => {
        if (countsByLabel[lbl]) {
          const count = countsByLabel[lbl];
          const lower = lbl.toLowerCase();
          const formattedLabel = lower === 'i will' ? 'attending' : lbl;
          summaryParts.push(`${count} ${formattedLabel}`);
        }
      });

      Object.keys(countsByLabel).forEach((lbl) => {
        if (!definedLabels.includes(lbl)) {
          summaryParts.push(`${countsByLabel[lbl]} ${lbl}`);
        }
      });

      const summaryText = summaryParts.join(' · ');

      truth = {
        value: summaryText || `${recordedEntries.length} responded`,
        isDecided: recordedEntries.length > 0,
        statusLabel: 'Check-ins Active',
        sourceType: 'participant_status',
        subtext: `${recordedEntries.length} member${recordedEntries.length === 1 ? '' : 's'} responded`,
      };
    }
  } else if (plan.deciderType === 'wheel_spinner') {
    // 6. Fun Decider: Wheel Spinner
    const tally = calculateCollectiveFunDecision(plan, 4);
    const isCompleted = plan.status === 'confirmed' && Boolean(plan.finalDecision);

    if (isCompleted) {
      const winningOpt = tally.winner?.option || plan.currentSelection || plan.finalDecision || 'Choice Finalized';
      const cleanVal = winningOpt.replace(/^[🎡🎴]\s*/, '').replace(/\s*✓.*$/, '').trim();
      const count = tally.winner?.count || tally.completedCount;
      const countNote = count > 0 ? ` (${count} ${count === 1 ? 'selection' : 'selections'})` : '';

      truth = {
        value: cleanVal,
        isDecided: true,
        statusLabel: plan.isReopened ? 'Reopened · Decided ✓' : 'Decided ✓',
        sourceType: 'wheel_spinner',
        subtext: `Final choice${countNote} from ${tally.completedCount} participant${tally.completedCount === 1 ? '' : 's'}`,
      };
    } else if (tally.completedCount > 0) {
      const leadingOpt = tally.leader?.option || '';
      truth = {
        value: leadingOpt
          ? `${leadingOpt} (Leading · ${tally.leader?.count} ${tally.leader?.count === 1 ? 'pick' : 'picks'})`
          : (plan.spinnerQuestion || plan.title),
        isDecided: false,
        statusLabel: plan.isReopened ? `Round ${plan.decisionRound || 2} Active` : `${tally.completedCount}/${tally.totalEligible} Selected`,
        sourceType: 'wheel_spinner',
        leadDetail: tally.leader ? `${tally.leader.count} ${tally.leader.count === 1 ? 'selection' : 'selections'}` : undefined,
        subtext: `${tally.completedCount} of ${tally.totalEligible} participants completed · ${tally.remainingCount} remaining`,
      };
    } else {
      truth = {
        value: plan.spinnerQuestion || plan.question || `Spin to decide ${plan.title}`,
        isDecided: false,
        statusLabel: plan.isReopened ? `Round ${plan.decisionRound || 2} Open` : 'Ready to Spin',
        sourceType: 'wheel_spinner',
        subtext: `0 of ${tally.totalEligible} participants selected · 1 spin per person`,
      };
    }
  } else if (plan.deciderType === 'blind_pick') {
    // 7. Fun Decider: Blind Pick Cards
    const tally = calculateCollectiveFunDecision(plan, 4);
    const isCompleted = plan.status === 'confirmed' && Boolean(plan.finalDecision);

    if (isCompleted) {
      const winningOpt = tally.winner?.option || plan.currentSelection || plan.finalDecision || 'Choice Finalized';
      const cleanVal = winningOpt.replace(/^[🎡🎴]\s*/, '').replace(/\s*✓.*$/, '').trim();
      const count = tally.winner?.count || tally.completedCount;
      const countNote = count > 0 ? ` (${count} ${count === 1 ? 'selection' : 'selections'})` : '';

      truth = {
        value: cleanVal,
        isDecided: true,
        statusLabel: plan.isReopened ? 'Reopened · Decided ✓' : 'Decided ✓',
        sourceType: 'blind_pick',
        subtext: `Final choice${countNote} from ${tally.completedCount} participant${tally.completedCount === 1 ? '' : 's'}`,
      };
    } else if (tally.completedCount > 0) {
      const leadingOpt = tally.leader?.option || '';
      truth = {
        value: leadingOpt
          ? `${leadingOpt} (Leading · ${tally.leader?.count} ${tally.leader?.count === 1 ? 'pick' : 'picks'})`
          : (plan.spinnerQuestion || plan.title),
        isDecided: false,
        statusLabel: plan.isReopened ? `Round ${plan.decisionRound || 2} Active` : `${tally.completedCount}/${tally.totalEligible} Selected`,
        sourceType: 'blind_pick',
        leadDetail: tally.leader ? `${tally.leader.count} ${tally.leader.count === 1 ? 'selection' : 'selections'}` : undefined,
        subtext: `${tally.completedCount} of ${tally.totalEligible} participants completed · ${tally.remainingCount} remaining`,
      };
    } else {
      truth = {
        value: plan.spinnerQuestion || plan.question || `Draw a card to decide ${plan.title}`,
        isDecided: false,
        statusLabel: plan.isReopened ? `Round ${plan.decisionRound || 2} Open` : 'Cards Ready',
        sourceType: 'blind_pick',
        subtext: `0 of ${tally.totalEligible} participants selected · 1 card per person`,
      };
    }
  } else {
    // Fallback
    truth = {
      value: plan.currentSelection || plan.location || plan.title,
      isDecided: plan.status === 'confirmed',
      statusLabel: plan.status === 'confirmed' ? 'Decided ✓' : 'Active',
      sourceType: 'manual',
    };
  }

  // Attach structured date & time
  let parsedIso: string | undefined;
  if (!plan.dateTime && plan.date) {
    const parsed = parseDateTimeInput(`${plan.date}${plan.time ? ' at ' + plan.time : ''}`);
    parsedIso = parsed.structured?.iso;
  }
  truth.dateTime = plan.dateTime || parsedIso;
  truth.date = plan.date;
  truth.time = plan.time;
  truth.hasSpecificTime = plan.hasSpecificTime !== undefined ? plan.hasSpecificTime : Boolean(plan.time);

  return truth;
}

/**
 * Derives the live plan truth directly from the whole PlanBoard object
 */
export function getPlanTruthFromBoard(plan: AttachedPlan, board: any): PlanCurrentTruth {
  const linkedDecision = board?.decisions?.find((d: any) => isPlanMatchingItem(plan, d)) || null;
  const linkedSuggestions = board?.suggestions?.filter((s: any) => isPlanMatchingItem(plan, s)) || [];
  return getPlanCurrentTruth(plan, linkedDecision, linkedSuggestions);
}

/**
 * Cross-Window & Cross-User Real-time Sync helper using BroadcastChannel & storage events
 */
const BROADCAST_CHANNEL_NAME = 'heartboard_realtime_board_sync_v1';
const TAB_CLIENT_ID = typeof crypto !== 'undefined' && crypto.randomUUID 
  ? crypto.randomUUID() 
  : `tab-${Date.now()}-${Math.random().toString(36).slice(2)}`;

let sharedChannel: BroadcastChannel | null = null;
function getSharedBroadcastChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return null;
  if (!sharedChannel) {
    try {
      sharedChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    } catch {
      sharedChannel = null;
    }
  }
  return sharedChannel;
}

let lastBroadcastSerialized = '';
let lastReceivedSerialized = '';

export function broadcastBoardUpdate(board: any) {
  try {
    if (!board) return;
    const serialized = JSON.stringify(board);
    // Do not broadcast if state has not changed from our last broadcast or last received remote state
    if (serialized === lastBroadcastSerialized || serialized === lastReceivedSerialized) {
      return;
    }
    lastBroadcastSerialized = serialized;

    const channel = getSharedBroadcastChannel();
    if (channel) {
      channel.postMessage({
        type: 'BOARD_STATE_UPDATE',
        board,
        clientId: TAB_CLIENT_ID,
        timestamp: Date.now(),
      });
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(
        'heartboard_synced_state',
        JSON.stringify({ board, clientId: TAB_CLIENT_ID, timestamp: Date.now() })
      );
    }
  } catch (e) {
    // silently catch in sandboxes
  }
}

export function setupBoardSyncListener(onSync: (board: any) => void) {
  if (typeof window === 'undefined') return () => {};

  const channel = getSharedBroadcastChannel();
  const handleMessage = (e: MessageEvent) => {
    // CRITICAL: Ignore own broadcast messages!
    if (e.data?.clientId === TAB_CLIENT_ID) {
      return;
    }
    if (e.data?.type === 'BOARD_STATE_UPDATE' && e.data?.board) {
      const serialized = JSON.stringify(e.data.board);
      // Skip if identical to what we already have or just sent
      if (serialized === lastReceivedSerialized || serialized === lastBroadcastSerialized) {
        return;
      }
      lastReceivedSerialized = serialized;
      lastBroadcastSerialized = serialized; // prevent echoing back
      onSync(e.data.board);
    }
  };

  if (channel) {
    channel.addEventListener('message', handleMessage);
  }

  const handleStorage = (e: StorageEvent) => {
    if (e.key === 'heartboard_synced_state' && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        // CRITICAL: Ignore own broadcast messages stored in localStorage!
        if (parsed?.clientId === TAB_CLIENT_ID) {
          return;
        }
        if (parsed?.board) {
          const serialized = JSON.stringify(parsed.board);
          if (serialized === lastReceivedSerialized || serialized === lastBroadcastSerialized) {
            return;
          }
          lastReceivedSerialized = serialized;
          lastBroadcastSerialized = serialized; // prevent echoing back
          onSync(parsed.board);
        }
      } catch (err) {
        // ignore
      }
    }
  };

  window.addEventListener('storage', handleStorage);

  return () => {
    if (channel) {
      channel.removeEventListener('message', handleMessage);
    }
    window.removeEventListener('storage', handleStorage);
  };
}
