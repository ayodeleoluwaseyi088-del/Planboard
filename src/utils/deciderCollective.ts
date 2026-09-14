import { AttachedPlan, ParticipantFunSelection } from '../types';

export interface CollectiveFunDecisionTally {
  totalEligible: number;
  completedCount: number;
  remainingCount: number;
  isAllCompleted: boolean;
  countsByOption: Record<string, number>;
  selectionsByOption: Record<string, ParticipantFunSelection[]>;
  leader: { option: string; count: number } | null;
  winner: { option: string; count: number } | null;
  isTied: boolean;
  selectionsList: ParticipantFunSelection[];
  percentageCompleted: number;
}

/**
 * Calculates the collective group outcome for Wheel Spinner and Blind Pick deciders.
 * Every participant gets one opportunity to make a selection.
 * When all eligible participants have completed their selection, the final result is
 * determined based on the highest number of selections.
 */
export function calculateCollectiveFunDecision(
  plan: AttachedPlan,
  totalEligibleParticipants: number
): CollectiveFunDecisionTally {
  const selectionsMap = plan.participantSelections || {};
  const selectionsList = Object.values(selectionsMap);
  const completedCount = selectionsList.length;

  const totalEligible = plan.totalParticipantsNeeded && plan.totalParticipantsNeeded > 0
    ? plan.totalParticipantsNeeded
    : Math.max(1, totalEligibleParticipants || 1);

  const remainingCount = Math.max(0, totalEligible - completedCount);
  const isAllCompleted = completedCount >= totalEligible && totalEligible > 0;
  const percentageCompleted = Math.min(100, Math.round((completedCount / totalEligible) * 100));

  // Initialize all defined options with 0 counts
  const options = (plan.spinnerOptions && plan.spinnerOptions.length > 0)
    ? plan.spinnerOptions
    : ['Option 1', 'Option 2'];

  const countsByOption: Record<string, number> = {};
  const selectionsByOption: Record<string, ParticipantFunSelection[]> = {};

  options.forEach((opt) => {
    countsByOption[opt] = 0;
    selectionsByOption[opt] = [];
  });

  // Tally participant selections
  selectionsList.forEach((sel) => {
    const opt = sel.option;
    countsByOption[opt] = (countsByOption[opt] || 0) + 1;
    if (!selectionsByOption[opt]) {
      selectionsByOption[opt] = [];
    }
    selectionsByOption[opt].push(sel);
  });

  // Determine leading option with highest count
  let maxCount = 0;
  let topOptions: string[] = [];

  Object.entries(countsByOption).forEach(([opt, count]) => {
    if (count > maxCount) {
      maxCount = count;
      topOptions = [opt];
    } else if (count === maxCount && maxCount > 0) {
      topOptions.push(opt);
    }
  });

  const isTied = topOptions.length > 1;
  const leader = maxCount > 0 ? { option: topOptions[0], count: maxCount } : null;

  // Determine winner:
  // Either explicitly marked (e.g. owner finalized early or locked in plan.wheelWinningOption)
  // OR when all eligible participants have completed their selection!
  let winner: { option: string; count: number } | null = null;

  if (plan.status === 'confirmed' && plan.wheelWinningOption) {
    winner = {
      option: plan.wheelWinningOption,
      count: countsByOption[plan.wheelWinningOption] || maxCount || 1,
    };
  } else if (isAllCompleted && leader) {
    winner = {
      option: plan.wheelWinningOption || leader.option,
      count: leader.count,
    };
  } else if (plan.status === 'confirmed' && leader) {
    winner = leader;
  }

  return {
    totalEligible,
    completedCount,
    remainingCount,
    isAllCompleted,
    countsByOption,
    selectionsByOption,
    leader,
    winner,
    isTied,
    selectionsList,
    percentageCompleted,
  };
}
