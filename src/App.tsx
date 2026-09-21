import React, { useState, useEffect, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { 
  PlanBoard, 
  UserPersona, 
  BoardMember, 
  DecisionItem, 
  SuggestionItem, 
  TaskItem, 
  ContributionItem, 
  InformationItem, 
  TimelineEntry, 
  ActivityLog,
  ItemPriority,
  MemberRole,
  AttachedPlan,
  PlanSnapshot,
  ParticipantUserStatus,
  ImagePosition,
  SuggestionImageItem,
  DecisionOption
} from './types';
import { INITIAL_BOARD, USER_PERSONAS } from './mockData';
import {
  getAllStoredBoards,
  saveBoard,
  deleteStoredBoard,
  getActiveBoardId,
  saveActiveBoardId,
  getStoredAuthUser,
  saveStoredAuthUser,
} from './utils/boardStorage';
import {
  isPlanMatchingItem,
  getLeadingOption,
  broadcastBoardUpdate,
  setupBoardSyncListener,
} from './utils/planSync';
import { calculateCollectiveFunDecision } from './utils/deciderCollective';

// Components
import { Header } from './components/Header';
import { BoardHeader } from './components/BoardHeader';
import { BoardPlansSection } from './components/BoardPlansSection';
import { DecisionsSection } from './components/DecisionsSection';
import { SuggestionsSection } from './components/SuggestionsSection';
import { ContributionsSection } from './components/ContributionsSection';
import { ParticipantStatusSection } from './components/ParticipantStatusSection';
import { TimelineSection } from './components/TimelineSection';
import { PeopleSection } from './components/PeopleSection';
import { ActivityFeed } from './components/ActivityFeed';
import { FloatingNav } from './components/FloatingNav';
import { BoardSectionTab } from './types';

// Motion and Phosphor icons
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus 
} from '@phosphor-icons/react';

// Modals
import { ShareModal } from './components/ShareModal';
import { FirstTimeJoinModal } from './components/FirstTimeJoinModal';
import { CreatePlanModal } from './components/CreatePlanModal';
import { CreateItemModal } from './components/CreateItemModal';
import { MyPlansModal } from './components/MyPlansModal';
import { AddSuggestionModal } from './components/AddSuggestionModal';
import { BOARD_AVATARS } from './utils/boardAvatars';

export default function App() {
  const [allBoards, setAllBoards] = useState<PlanBoard[]>(() => getAllStoredBoards());
  const [board, setBoard] = useState<PlanBoard>(() => {
    const stored = getAllStoredBoards();
    const activeId = getActiveBoardId();
    if (activeId) {
      const found = stored.find((b) => b.id === activeId);
      if (found) return found;
    }
    return stored[0] || INITIAL_BOARD;
  });
  const [currentPersona, setCurrentPersona] = useState<UserPersona>(() => getStoredAuthUser());

  // Active member on the current board (with board-specific custom name and avatar if configured)
  const currentBoardMember = useMemo(() => {
    return board.members?.find((m) => m.id === currentPersona.id);
  }, [board.members, currentPersona.id]);

  // Board-specific effective persona: ensures that selected custom name and avatar apply specifically to this board
  const effectivePersona: UserPersona = useMemo(() => {
    if (currentBoardMember) {
      return {
        ...currentPersona,
        name: currentBoardMember.name || currentPersona.name,
        avatar: currentBoardMember.avatar || currentPersona.avatar,
        role: currentBoardMember.role || currentPersona.role,
      };
    }
    return currentPersona;
  }, [currentBoardMember, currentPersona]);
  const [activeEvolutionDay, setActiveEvolutionDay] = useState<'day1' | 'day3' | 'day5'>('day3');
  const [activeSection, setActiveSection] = useState<BoardSectionTab>('overview');

  const handleNavigateToSection = (tab: BoardSectionTab) => {
    setActiveSection(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Modals state
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isJoinFlowOpen, setIsJoinFlowOpen] = useState(false);
  const [isCreatePlanOpen, setIsCreatePlanOpen] = useState(false);
  const [isAddPlanModalOpen, setIsAddPlanModalOpen] = useState(false);
  const [isCreateItemOpen, setIsCreateItemOpen] = useState(false);
  const [isAddSuggestionOpen, setIsAddSuggestionOpen] = useState(false);
  const [preselectedPlanIdForSuggestion, setPreselectedPlanIdForSuggestion] = useState<string | undefined>(undefined);
  const [isMyPlansOpen, setIsMyPlansOpen] = useState(false);

  // Authenticated user persona selection handler
  const handleSelectPersona = (persona: UserPersona) => {
    setCurrentPersona(persona);
    saveStoredAuthUser(persona);
  };

  // Delete board handler
  const handleDeleteBoard = (boardId: string) => {
    const remaining = deleteStoredBoard(boardId);
    setAllBoards(remaining);
    if (board.id === boardId) {
      const nextBoard = remaining[0] || INITIAL_BOARD;
      setBoard(nextBoard);
      saveActiveBoardId(nextBoard.id);
    }
  };

  // Persist board updates to storage & update allBoards list
  useEffect(() => {
    saveBoard(board);
    saveActiveBoardId(board.id);
    setAllBoards((prev) => {
      const idx = prev.findIndex((b) => b.id === board.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = board;
        return next;
      }
      return [board, ...prev];
    });
  }, [board]);

  // Check invitation link from URL parameters on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      let targetBoardId =
        urlParams.get('join') ||
        urlParams.get('boardId') ||
        urlParams.get('joinBoard') ||
        urlParams.get('plan');

      if (!targetBoardId && window.location.hash) {
        const hash = window.location.hash;
        if (hash.includes('join/')) {
          targetBoardId = hash.split('join/')[1]?.split('?')[0];
        } else if (hash.includes('join=')) {
          targetBoardId = hash.split('join=')[1]?.split('&')[0];
        }
      }

      if (targetBoardId) {
        const storedBoards = getAllStoredBoards();
        const found = storedBoards.find((b) => b.id === targetBoardId);
        if (found) {
          setBoard(found);
          saveActiveBoardId(found.id);
          setIsJoinFlowOpen(true);
        }
      }
    } catch (err) {
      console.error('Error parsing invitation link board:', err);
    }
  }, []);

  const lastGuestPersonaRef = useRef<UserPersona | null>(null);

  // Real-time synchronization across windows/tabs/users
  const isApplyingRemoteSyncRef = useRef(false);
  const isFirstMountRef = useRef(true);

  useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      return;
    }
    if (isApplyingRemoteSyncRef.current) {
      isApplyingRemoteSyncRef.current = false;
      return;
    }
    broadcastBoardUpdate(board);
  }, [board]);

  useEffect(() => {
    const cleanup = setupBoardSyncListener((syncedBoard: PlanBoard) => {
      isApplyingRemoteSyncRef.current = true;
      setBoard(syncedBoard);
    });
    return cleanup;
  }, []);

  // Helper to add activity
  const addActivity = (actionText: string, badgeEmoji: string = '✨') => {
    const newActivity: ActivityLog = {
      id: `act-${Date.now()}`,
      actorName: effectivePersona.name,
      actorAvatar: effectivePersona.avatar,
      actionText,
      timeAgo: 'Just now',
      badgeEmoji,
    };
    setBoard((prev) => ({
      ...prev,
      recentActivities: [newActivity, ...prev.recentActivities.slice(0, 7)],
    }));
  };

  // Evolution Day Preset Switcher
  const handleSelectEvolutionDay = (day: 'day1' | 'day3' | 'day5') => {
    if (day === activeEvolutionDay) return;
    setActiveEvolutionDay(day);

    if (day === 'day1') {
      // Day 1: Only date is fixed, everything else just opened
      setBoard((prev) => ({
        ...prev,
        daysToGo: 8,
        state: 'new',
        decisions: prev.decisions.map((d) => ({
          ...d,
          status: 'open',
          finalDecision: undefined,
          options: d.options.map((o) => ({ ...o, voteCount: 0, voterIds: [] })),
        })),
        suggestions: prev.suggestions.map((s) => ({
          ...s,
          isSelectedWinner: false,
          heartCount: 0,
          heartedByMemberIds: [],
        })),
        tasks: prev.tasks.map((t) => ({
          ...t,
          status: 'open',
        })),
        plans: prev.plans.map((p) => ({
          ...p,
          status: 'active',
          finalDecision: undefined,
          isSelectedWinner: false,
          currentSelection: p.initialSelection || p.options?.[0]?.label || '',
          location: p.initialSelection || p.location,
        })),
      }));
    } else if (day === 'day3') {
      // Day 3: Mid-planning (The rich interactive state)
      setBoard(INITIAL_BOARD);
    } else if (day === 'day5') {
      // Day 5: Plan Ready! Everything locked in
      confetti({
        particleCount: 100,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#10B981', '#F59E0B', '#3B82F6', '#EC4899'],
      });
      setBoard((prev) => ({
        ...prev,
        daysToGo: 0,
        state: 'ready',
        decisions: prev.decisions.map((d) => ({
          ...d,
          status: 'completed',
          finalDecision: d.finalDecision || `${d.options[0]?.label || 'Choice'} ✓ (Final Choice)`,
        })),
        tasks: prev.tasks.map((t) => ({
          ...t,
          status: 'completed',
        })),
        contributions: prev.contributions.map((c) => ({
          ...c,
          status: 'completed',
          currentAmount: c.targetAmount,
          contributorsPaid: prev.members.map((m) => m.id),
        })),
        plans: prev.plans.map((p) => ({
          ...p,
          status: 'confirmed',
          finalDecision: p.finalDecision || `${p.currentSelection || p.options?.[0]?.label || p.title} ✓ (Confirmed)`,
        })),
      }));
    }
  };

  // 1. Voting on a Decision
  const handleVote = (decisionId: string, optionId: string, customVoterId?: string) => {
    const voterId = customVoterId || currentPersona.id;
    setBoard((prev) => {
      const decision = prev.decisions.find((d) => d.id === decisionId);
      if (!decision) return prev;

      let chosenOptionLabel = '';

      const updatedDecisions = prev.decisions.map((dec) => {
        if (dec.id !== decisionId) return dec;

        const updatedOptions = dec.options.map((opt) => {
          const hasVoted = opt.voterIds.includes(voterId);
          if (opt.id === optionId) {
            chosenOptionLabel = opt.label;
            if (hasVoted) {
              // Unvote
              return {
                ...opt,
                voteCount: Math.max(0, opt.voteCount - 1),
                voterIds: opt.voterIds.filter((id) => id !== voterId),
              };
            } else {
              // Vote
              return {
                ...opt,
                voteCount: opt.voteCount + 1,
                voterIds: [...opt.voterIds, voterId],
              };
            }
          } else if (hasVoted) {
            // Remove previous vote from other options
            return {
              ...opt,
              voteCount: Math.max(0, opt.voteCount - 1),
              voterIds: opt.voterIds.filter((id) => id !== voterId),
            };
          }
          return opt;
        });

        // Compute gamified leader note and auto-finalization
        const sorted = [...updatedOptions].sort((a, b) => b.voteCount - a.voteCount);
        const leader = sorted[0];
        let note = dec.gamifiedNote;
        if (leader && leader.voteCount > 0) {
          note = `${leader.label} is currently leading with ${leader.voteCount} ${leader.voteCount === 1 ? 'vote' : 'votes'}! 🗳️`;
        }

        const totalVotes = updatedOptions.reduce((sum, opt) => sum + opt.voteCount, 0);
        const totalNeeded = prev.members?.length > 0 ? prev.members.length : 1;
        const isVotingFinished = totalVotes >= totalNeeded;

        let isReopenedVal = dec.isReopened;
        let decStatus = dec.status;
        let finalDecText = dec.finalDecision;
        if (isVotingFinished && leader && leader.voteCount > 0) {
          decStatus = 'completed' as const;
          finalDecText = `${leader.label} — ${leader.voteCount} votes`;
          isReopenedVal = false;
        }

        return {
          ...dec,
          options: updatedOptions,
          gamifiedNote: note,
          status: decStatus,
          finalDecision: finalDecText,
          isReopened: isReopenedVal,
        };
      });

      // SYNC TO PLANS & SUGGESTIONS: Update matching plan's options and leading choice in real time!
      const targetDecision = updatedDecisions.find((d) => d.id === decisionId);
      let updatedSuggestions = [...prev.suggestions];

      const updatedPlans = prev.plans.map((plan) => {
        if (isPlanMatchingItem(plan, decision)) {
          const leader = targetDecision ? getLeadingOption(targetDecision.options) : null;
          const totalVotes = (targetDecision?.options || []).reduce((sum, opt) => sum + opt.voteCount, 0);
          const totalNeeded = prev.members?.length > 0 ? prev.members.length : 1;
          const isVotingFinished = totalVotes >= totalNeeded;

          if (isVotingFinished && leader && leader.voteCount > 0) {
            // Check if leader option corresponds to a suggestion for this plan
            const winningSug = prev.suggestions.find(
              (s) =>
                s.id === leader.id.replace(/^opt-/, '') ||
                (leader as any).suggestionId === s.id ||
                ((s.planId === plan.id || isPlanMatchingItem(plan, s)) && s.title.trim().toLowerCase() === leader.label.trim().toLowerCase())
            );

            if (winningSug) {
              // Update suggestions state to mark winning suggestion as winner
              updatedSuggestions = updatedSuggestions.map((s) => {
                if (s.id === winningSug.id) {
                  return { ...s, isSelectedWinner: true, status: 'fixed' as const };
                }
                if (s.planId === winningSug.planId || isPlanMatchingItem(plan, s)) {
                  return { ...s, isSelectedWinner: false, status: 'open' as const };
                }
                return s;
              });

              const snapshotToPreserve: PlanSnapshot = plan.previousPlanSnapshot || {
                currentSelection: plan.currentSelection,
                initialSelection: plan.initialSelection,
                previousSelection: plan.previousSelection,
                location: plan.location,
                imageUrl: plan.imageUrl,
                imagePosition: plan.imagePosition,
                images: plan.images,
                ideaDesc: plan.ideaDesc,
                description: plan.description,
                infoValue: plan.infoValue,
                finalDecision: plan.finalDecision,
                status: plan.status,
                isSelectedWinner: plan.isSelectedWinner,
                decidedSource: plan.decidedSource,
                decidedAt: plan.decidedAt,
              };

              // Auto-replace current Plan selection with the winning suggestion!
              return {
                ...plan,
                previousPlanSnapshot: snapshotToPreserve,
                options: targetDecision?.options || plan.options,
                previousSelection: plan.currentSelection || plan.location,
                currentSelection: winningSug.title,
                location:
                  plan.category.toLowerCase().includes('location') || plan.title.toLowerCase().includes('location')
                    ? winningSug.title
                    : plan.location,
                imageUrl: winningSug.imageUrl || plan.imageUrl,
                imagePosition: winningSug.imagePosition || plan.imagePosition,
                images: winningSug.images || (winningSug.imageUrl ? [{ id: 'img-main', url: winningSug.imageUrl, position: winningSug.imagePosition }] : plan.images),
                ideaDesc: winningSug.description || plan.ideaDesc,
                description: winningSug.description || plan.description,
                infoValue: `${winningSug.title} - ${winningSug.description}`,
                finalDecision: `${winningSug.title} — ${leader.voteCount} ${leader.voteCount === 1 ? 'vote' : 'votes'} (Voted Choice)`,
                status: 'confirmed' as const,
                isSelectedWinner: true,
                appliedSuggestionId: winningSug.id,
                decidedSource: 'voting' as const,
                decidedAt: new Date().toISOString(),
                isReopened: false,
              };
            }

            // Normal voting option without a suggestion
            return {
              ...plan,
              options: targetDecision?.options || plan.options,
              currentSelection: leader.label,
              finalDecision: `${leader.label} — ${leader.voteCount} votes`,
              status: 'confirmed' as const,
              decidedSource: 'voting' as const,
              decidedAt: new Date().toISOString(),
              appliedSuggestionId: undefined,
              isSelectedWinner: false,
              isReopened: false,
              location:
                plan.category.toLowerCase().includes('location') || plan.title.toLowerCase().includes('location')
                  ? leader.label
                  : plan.location,
            };
          }

          const isFinalized = plan.status === 'confirmed' && !!plan.finalDecision;
          // While voting is still active and ongoing, retain the base selection;
          // Plan only updates to the new winner after the round is concluded.
          const currentVal = isFinalized
            ? plan.currentSelection
            : plan.initialSelection || plan.previousSelection || plan.currentSelection;

          return {
            ...plan,
            options: targetDecision?.options || plan.options,
            currentSelection: currentVal,
            location: isFinalized ? plan.location : (plan.initialSelection || plan.previousSelection || plan.location),
          };
        }
        return plan;
      });

      return {
        ...prev,
        decisions: updatedDecisions,
        plans: updatedPlans,
        suggestions: updatedSuggestions,
      };
    });

    addActivity(`voted in a group decision`, '🗳️');
  };

  // 2. Finalize Decision (or Toggle/Undo if already finalized)
  const handleFinalizeDecision = (decisionId: string, optionId: string) => {
    if (currentPersona.role !== 'owner' && currentPersona.role !== 'admin') return;

    const currentDec = board.decisions.find((d) => d.id === decisionId);
    const selectedOption = currentDec?.options.find((o) => o.id === optionId);
    if (!currentDec || !selectedOption) return;

    // Check if this decision is already finalized with this option -> Undo finalization
    const isAlreadyFinalized = currentDec.status === 'completed' && currentDec.finalDecision?.includes(selectedOption.label);

    if (isAlreadyFinalized) {
      setBoard((prev) => {
        const decision = prev.decisions.find((d) => d.id === decisionId);
        if (!decision) return prev;

        const updatedDecisions = prev.decisions.map((d) => {
          if (d.id !== decisionId) return d;
          return {
            ...d,
            status: 'open' as const,
            finalDecision: undefined,
          };
        });

        // Revert matching plan back to active
        const updatedPlans = prev.plans.map((plan) => {
          if (isPlanMatchingItem(plan, decision)) {
            return {
              ...plan,
              status: 'active' as const,
              finalDecision: undefined,
              currentSelection: plan.previousSelection || plan.initialSelection || plan.options?.[0]?.label || '',
              decidedSource: undefined,
              appliedSuggestionId: undefined,
              isSelectedWinner: false,
            };
          }
          return plan;
        });

        const matchingPlan = prev.plans.find((p) => isPlanMatchingItem(p, decision));
        const updatedSuggestions = prev.suggestions.map((s) => {
          if (matchingPlan && (s.planId === matchingPlan.id || isPlanMatchingItem(matchingPlan, s))) {
            return { ...s, isSelectedWinner: false, status: 'open' as const };
          }
          return s;
        });

        return {
          ...prev,
          decisions: updatedDecisions,
          plans: updatedPlans,
          suggestions: updatedSuggestions,
        };
      });

      addActivity(`reverted finalization for "${selectedOption.label}"`, '↩️');
      return;
    }

    setBoard((prev) => {
      const decision = prev.decisions.find((d) => d.id === decisionId);
      const option = decision?.options.find((o) => o.id === optionId) || selectedOption;
      if (!decision || !option) return prev;

      const finalizedText = `${option.label} ✓ (Selected by ${effectivePersona.name})`;

      const updatedDecisions = prev.decisions.map((d) => {
        if (d.id !== decisionId) return d;
        return {
          ...d,
          status: 'completed' as const,
          finalDecision: finalizedText,
        };
      });

      const matchingPlan = prev.plans.find((p) => isPlanMatchingItem(p, decision));
      const winningSug = prev.suggestions.find(
        (s) =>
          s.id === option.id.replace(/^opt-/, '') ||
          (option as any).suggestionId === s.id ||
          (matchingPlan && (s.planId === matchingPlan.id || isPlanMatchingItem(matchingPlan, s)) && s.title.trim().toLowerCase() === option.label.trim().toLowerCase())
      );

      let updatedSuggestions = [...prev.suggestions];
      if (winningSug) {
        updatedSuggestions = updatedSuggestions.map((s) => {
          if (s.id === winningSug.id) {
            return { ...s, isSelectedWinner: true, status: 'fixed' as const };
          }
          if (matchingPlan && (s.planId === matchingPlan.id || isPlanMatchingItem(matchingPlan, s))) {
            return { ...s, isSelectedWinner: false, status: 'open' as const };
          }
          return s;
        });
      }

      // SYNC TO PLANS: Update the corresponding AttachedPlan in board.plans immediately!
      const updatedPlans = prev.plans.map((plan) => {
        if (isPlanMatchingItem(plan, decision)) {
          if (winningSug) {
            const snapshotToPreserve: PlanSnapshot = plan.previousPlanSnapshot || {
              currentSelection: plan.currentSelection,
              initialSelection: plan.initialSelection,
              previousSelection: plan.previousSelection,
              location: plan.location,
              imageUrl: plan.imageUrl,
              imagePosition: plan.imagePosition,
              images: plan.images,
              ideaDesc: plan.ideaDesc,
              description: plan.description,
              infoValue: plan.infoValue,
              finalDecision: plan.finalDecision,
              status: plan.status,
              isSelectedWinner: plan.isSelectedWinner,
              decidedSource: plan.decidedSource,
              decidedAt: plan.decidedAt,
            };

            return {
              ...plan,
              previousPlanSnapshot: snapshotToPreserve,
              previousSelection: plan.currentSelection || plan.location || plan.infoValue,
              currentSelection: winningSug.title,
              finalDecision: finalizedText,
              status: 'confirmed' as const,
              decidedSource: 'voting' as const,
              decidedAt: 'Just now',
              location:
                plan.category.toLowerCase().includes('location') || plan.title.toLowerCase().includes('location')
                  ? winningSug.title
                  : plan.location,
              imageUrl: winningSug.imageUrl || plan.imageUrl,
              imagePosition: winningSug.imagePosition || plan.imagePosition,
              images: winningSug.images || (winningSug.imageUrl ? [{ id: 'img-main', url: winningSug.imageUrl, position: winningSug.imagePosition }] : plan.images),
              ideaDesc: winningSug.description || plan.ideaDesc,
              description: winningSug.description || plan.description,
              infoValue: `${winningSug.title} - ${winningSug.description}`,
              appliedSuggestionId: winningSug.id,
              isSelectedWinner: true,
              options: decision.options,
            };
          }

          return {
            ...plan,
            previousSelection: plan.currentSelection || plan.location || plan.infoValue,
            currentSelection: option.label,
            finalDecision: finalizedText,
            status: 'confirmed' as const,
            decidedSource: 'voting' as const,
            decidedAt: 'Just now',
            location:
              plan.category.toLowerCase().includes('location') || plan.title.toLowerCase().includes('location')
                ? option.label
                : plan.location,
            appliedSuggestionId: undefined,
            isSelectedWinner: false,
            options: decision.options,
          };
        }
        return plan;
      });

      return {
        ...prev,
        decisions: updatedDecisions,
        plans: updatedPlans,
        suggestions: updatedSuggestions,
      };
    });

    addActivity(`finalized decision: "${selectedOption.label}" ✓`, '👑');
  };

  // 3. Reopen Decision (Admin/Owner Action)
  const handleReopenDecision = (decisionId: string) => {
    if (currentPersona.role !== 'owner' && currentPersona.role !== 'admin') return;

    setBoard((prev) => {
      const decision = prev.decisions.find((d) => d.id === decisionId);
      const nextRound = (decision?.decisionRound || 1) + 1;

      const updatedDecisions = prev.decisions.map((d) =>
        d.id === decisionId
          ? {
              ...d,
              status: 'open' as const,
              finalDecision: undefined,
              isReopened: true,
              reopenedAt: new Date().toISOString(),
              decisionRound: nextRound,
              options: d.options.map((opt) => ({
                ...opt,
                voteCount: 0,
                voterIds: [],
              })),
            }
          : d
      );

      // SYNC TO PLANS: Revert matching plan immediately!
      const updatedPlans = prev.plans.map((plan) => {
        if (decision && isPlanMatchingItem(plan, decision)) {
          const snapshot = plan.previousPlanSnapshot;
          const revertedSelection = snapshot?.currentSelection || plan.initialSelection || plan.previousSelection || plan.options?.[0]?.label || '';
          const revertedLocation = snapshot?.location || plan.initialSelection || plan.previousSelection || 'Landmark Beach Private Cabana #4';
          const revertedImageUrl = snapshot ? snapshot.imageUrl : plan.imageUrl;
          const revertedImagePosition = snapshot ? snapshot.imagePosition : plan.imagePosition;
          const revertedImages = snapshot ? snapshot.images : plan.images;
          const revertedDescription = snapshot ? snapshot.description : plan.description;
          const revertedIdeaDesc = snapshot ? snapshot.ideaDesc : plan.ideaDesc;
          const revertedInfoValue = snapshot ? snapshot.infoValue : plan.infoValue;

          return {
            ...plan,
            status: 'active' as const,
            finalDecision: undefined,
            currentSelection: revertedSelection,
            isSelectedWinner: false,
            appliedSuggestionId: undefined,
            decidedSource: undefined,
            isReopened: true,
            reopenedAt: new Date().toISOString(),
            decisionRound: nextRound,
            imageUrl: revertedImageUrl,
            imagePosition: revertedImagePosition,
            images: revertedImages,
            description: revertedDescription,
            ideaDesc: revertedIdeaDesc,
            infoValue: revertedInfoValue,
            options: plan.options?.map((opt) => ({
              ...opt,
              voteCount: 0,
              voterIds: [],
            })),
            location:
              plan.category.toLowerCase().includes('location') || plan.title.toLowerCase().includes('location')
                ? revertedLocation
                : plan.location,
          };
        }
        return plan;
      });

      const matchingPlan = prev.plans.find((p) => decision && isPlanMatchingItem(p, decision));
      const updatedSuggestions = prev.suggestions.map((s) => {
        if (matchingPlan && (s.planId === matchingPlan.id || isPlanMatchingItem(matchingPlan, s))) {
          return { ...s, isSelectedWinner: false, status: 'open' as const };
        }
        return s;
      });

      return {
        ...prev,
        decisions: updatedDecisions,
        plans: updatedPlans,
        suggestions: updatedSuggestions,
      };
    });

    const targetDec = board.decisions.find((d) => d.id === decisionId);
    const roundNumber = (targetDec?.decisionRound || 1) + 1;
    addActivity(`reopened group vote for Round ${roundNumber} 🔄`, '🔄');
  };

  // 4. Toggle Heart on Suggestion
  const handleToggleHeart = (suggestionId: string) => {
    setBoard((prev) => {
      let sugTitle = '';
      const updatedSuggestions = prev.suggestions.map((sug) => {
        if (sug.id !== suggestionId) return sug;
        sugTitle = sug.title;
        const alreadyHearted = sug.heartedByMemberIds.includes(currentPersona.id);
        return {
          ...sug,
          heartCount: alreadyHearted ? sug.heartCount - 1 : sug.heartCount + 1,
          heartedByMemberIds: alreadyHearted
            ? sug.heartedByMemberIds.filter((id) => id !== currentPersona.id)
            : [...sug.heartedByMemberIds, currentPersona.id],
        };
      });

      return {
        ...prev,
        suggestions: updatedSuggestions,
      };
    });

    addActivity(`reacted ❤️ to a location idea`, '❤️');
  };

  // 5. Use Suggestion to Replace Existing Selection (Owner / Assistant Admin Privilege)
  // Reversible: clicking an already selected suggestion undos/reverts and restores previous plan state
  // IMPORTANT: Replacement does NOT lock the plan; the plan remains fully editable!
  const handleSelectAsWinner = (suggestionId: string) => {
    if (currentPersona.role !== 'owner' && currentPersona.role !== 'admin') return;
    const target = board.suggestions.find((s) => s.id === suggestionId);
    if (!target) return;

    const isUndoing = !!target.isSelectedWinner;

    setBoard((prev) => {
      // 1. Update suggestions
      const updatedSuggestions = prev.suggestions.map((s) => {
        if (s.id === suggestionId) {
          return {
            ...s,
            isSelectedWinner: !isUndoing,
            status: !isUndoing ? ('fixed' as const) : ('open' as const),
          };
        }
        // If selecting this suggestion as winner, unset others for the same plan
        if (!isUndoing && s.planId && s.planId === target.planId) {
          return { ...s, isSelectedWinner: false, status: 'open' as const };
        }
        return s;
      });

      // 2. Update the associated plan
      const updatedPlans = prev.plans.map((p) => {
        const matchesPlan =
          p.id === target.planId ||
          p.title.toLowerCase() === (target.planTitle || '').toLowerCase() ||
          isPlanMatchingItem(p, target);

        if (!matchesPlan) return p;

        if (isUndoing) {
          // UNDO / REVERT: Restore the Plan to its previous state/value!
          if (p.previousPlanSnapshot) {
            return {
              ...p,
              currentSelection: p.previousPlanSnapshot.currentSelection,
              location: p.previousPlanSnapshot.location,
              imageUrl: p.previousPlanSnapshot.imageUrl ?? p.imageUrl,
              imagePosition: p.previousPlanSnapshot.imagePosition ?? p.imagePosition,
              images: p.previousPlanSnapshot.images ?? p.images,
              ideaDesc: p.previousPlanSnapshot.ideaDesc,
              description: p.previousPlanSnapshot.description ?? p.description,
              infoValue: p.previousPlanSnapshot.infoValue,
              finalDecision: p.previousPlanSnapshot.finalDecision,
              status: p.previousPlanSnapshot.status ?? ('active' as const),
              isSelectedWinner: p.previousPlanSnapshot.isSelectedWinner ?? false,
              decidedSource: p.previousPlanSnapshot.decidedSource,
              decidedAt: p.previousPlanSnapshot.decidedAt,
              appliedSuggestionId: undefined,
              previousPlanSnapshot: undefined,
            };
          }

          // Fallback if no prior snapshot was saved (e.g. from initial mock state)
          const fallbackVal = p.initialSelection || p.previousSelection || p.title;
          return {
            ...p,
            currentSelection: fallbackVal,
            location: fallbackVal,
            imageUrl: p.imageUrl,
            status: 'active' as const,
            isSelectedWinner: false,
            decidedSource: undefined,
            finalDecision: undefined,
            appliedSuggestionId: undefined,
            previousPlanSnapshot: undefined,
          };
        }

        // USE SUGGESTION:
        // If switching from another suggestion, keep the original pre-suggestion baseline snapshot!
        // If no snapshot exists yet, capture the current plan state right now.
        const snapshotToPreserve: PlanSnapshot = p.previousPlanSnapshot || {
          currentSelection: p.currentSelection,
          initialSelection: p.initialSelection,
          previousSelection: p.previousSelection,
          location: p.location,
          imageUrl: p.imageUrl,
          imagePosition: p.imagePosition,
          images: p.images,
          ideaDesc: p.ideaDesc,
          description: p.description,
          infoValue: p.infoValue,
          finalDecision: p.finalDecision,
          status: p.status,
          isSelectedWinner: p.isSelectedWinner,
          decidedSource: p.decidedSource,
          decidedAt: p.decidedAt,
        };

        return {
          ...p,
          previousPlanSnapshot: snapshotToPreserve,
          appliedSuggestionId: target.id,
          previousSelection: p.currentSelection || p.location,
          currentSelection: target.title,
          location: target.title,
          imageUrl: target.imageUrl || p.imageUrl,
          imagePosition: target.imagePosition || p.imagePosition,
          images: target.images || (target.imageUrl ? [{ id: 'img-main', url: target.imageUrl, position: target.imagePosition }] : p.images),
          ideaDesc: target.description || p.ideaDesc,
          description: target.description || p.description,
          infoValue: `${target.title} - ${target.description}`,
          finalDecision: `${target.title} ✓ (Selected by ${effectivePersona.name})`,
          status: 'confirmed' as const,
          isSelectedWinner: true,
          decidedSource: 'suggestion' as const,
          decidedAt: 'Just now',
        };
      });

      // 3. Update corresponding information item if it exists
      const updatedInfo = prev.information.map((i) => {
        if (i.deciderItemId === target.planId || i.id === `info-${target.planId}`) {
          if (isUndoing) {
            return {
              ...i,
              value: undefined,
              fixedBy: undefined,
            };
          }
          return {
            ...i,
            value: `${target.title} - ${target.description}`,
            fixedBy: effectivePersona.name,
          };
        }
        return i;
      });

      // 4. Update decision finalDecision if applicable
      const matchingPlan = prev.plans.find((p) => p.id === target.planId || isPlanMatchingItem(p, target));
      const updatedDecisions = prev.decisions.map((d) => {
        const matchesDecision =
          d.deciderItemId === target.planId ||
          d.id === `dec-${target.planId}` ||
          (target.planId && d.planId === target.planId) ||
          (matchingPlan && isPlanMatchingItem(matchingPlan, d));

        if (matchesDecision) {
          if (isUndoing) {
            return {
              ...d,
              status: 'open' as const,
              finalDecision: undefined,
            };
          }
          return {
            ...d,
            status: 'completed' as const,
            finalDecision: `${target.title} ✓ (Selected by ${effectivePersona.name})`,
          };
        }
        return d;
      });

      const nextBoard = {
        ...prev,
        suggestions: updatedSuggestions,
        plans: updatedPlans,
        information: updatedInfo,
        decisions: updatedDecisions,
      };

      return nextBoard;
    });

    if (isUndoing) {
      addActivity(
        `undid suggestion "${target.title}" and restored previous selection for ${target.planTitle || 'the plan'} ↩️`,
        '↩️'
      );
    } else {
      addActivity(
        `used suggestion "${target.title}" as current selection for ${target.planTitle || 'the plan'} ✓`,
        '✨'
      );
    }
  };

  // 5b. Put Selected Suggestion Up for Vote (Owner / Assistant Admin Action)
  // Only explicitly selected suggestions become voting options. Other suggestions remain normal.
  const handleTogglePutUpForVote = (suggestionId: string) => {
    if (currentPersona.role !== 'owner' && currentPersona.role !== 'admin') return;

    setBoard((prev) => {
      const sug = prev.suggestions.find((s) => s.id === suggestionId);
      if (!sug) return prev;
      const willBePutUp = !sug.isPutUpForVote;

      const updatedSuggestions = prev.suggestions.map((s) =>
        s.id === suggestionId ? { ...s, isPutUpForVote: willBePutUp } : s
      );

      let updatedDecisions = [...prev.decisions];
      const planMatch = prev.plans.find((p) => p.id === sug.planId || isPlanMatchingItem(p, sug));
      const targetTitle = sug.planTitle || planMatch?.title || 'Plan';

      const newOpt: DecisionOption = {
        id: `opt-${sug.id}`,
        label: sug.title,
        emoji: sug.planEmoji || '💡',
        voteCount: 0,
        voterIds: [],
        suggestionId: sug.id,
      };

      if (willBePutUp) {
        // Find matching decision for this plan
        const existingDecIndex = updatedDecisions.findIndex(
          (d) =>
            d.deciderItemId === sug.planId ||
            d.id === `dec-${sug.planId}` ||
            (planMatch && isPlanMatchingItem(planMatch, d)) ||
            d.title.toLowerCase().includes(targetTitle.toLowerCase())
        );

        if (existingDecIndex >= 0) {
          const existingDec = updatedDecisions[existingDecIndex];
          const hasOption = existingDec.options.some((o) => o.id === newOpt.id || o.label.toLowerCase() === newOpt.label.toLowerCase());
          const updatedOptions = hasOption ? existingDec.options : [...existingDec.options, newOpt];
          updatedDecisions[existingDecIndex] = {
            ...existingDec,
            options: updatedOptions,
            status: 'open',
            finalDecision: undefined,
          };
        } else {
          // Create a new decision for this plan's votes
          updatedDecisions.push({
            id: `dec-${sug.planId || Date.now()}`,
            type: 'decision',
            title: `${targetTitle} Selection`,
            category: `🗳️ ${targetTitle.toUpperCase()}`,
            question: `Vote on ${targetTitle} options`,
            options: [newOpt],
            totalVotesNeeded: prev.members?.length > 0 ? prev.members.length : 1,
            deadlineText: 'Open for group vote',
            priority: 'required',
            status: 'open',
            createdBy: currentPersona.name,
            deciderItemId: sug.planId,
          });
        }
      } else {
        // Remove from decision options
        updatedDecisions = updatedDecisions.map((d) => ({
          ...d,
          options: d.options.filter((o) => o.id !== `opt-${sug.id}` && o.label !== sug.title),
        }));
      }

      // Sync plan options
      const updatedPlans = prev.plans.map((p) => {
        if (p.id === sug.planId || isPlanMatchingItem(p, sug)) {
          const existingOpts = p.options || [];
          if (willBePutUp) {
            if (!existingOpts.some((o) => o.id === newOpt.id || o.label.toLowerCase() === newOpt.label.toLowerCase())) {
              return { ...p, options: [...existingOpts, newOpt] };
            }
          } else {
            return { ...p, options: existingOpts.filter((o) => o.id !== `opt-${sug.id}` && o.label !== sug.title) };
          }
        }
        return p;
      });

      return {
        ...prev,
        suggestions: updatedSuggestions,
        decisions: updatedDecisions,
        plans: updatedPlans,
      };
    });

    const sug = board.suggestions.find((s) => s.id === suggestionId);
    if (sug) {
      addActivity(
        sug.isPutUpForVote
          ? `removed "${sug.title}" from voting poll`
          : `put suggestion "${sug.title}" up for vote for ${sug.planTitle || 'the plan'} 🗳️`,
        '🗳️'
      );
    }
  };

  // 5c. Delete / Remove Individual Suggestion (Owner / Assistant Admin Action)
  // Removing it removes the suggestion without affecting the associated Plan itself!
  const handleDeleteSuggestion = (suggestionId: string) => {
    if (currentPersona.role !== 'owner' && currentPersona.role !== 'admin') return;
    const target = board.suggestions.find((s) => s.id === suggestionId);

    setBoard((prev) => {
      const updatedPlans = prev.plans.map((p) => {
        if (target?.isSelectedWinner && (isPlanMatchingItem(p, target) || p.id === target.planId)) {
          // Revert back to initialSelection or previousSelection
          const revertedSelection = p.initialSelection || p.previousSelection || p.title;
          return {
            ...p,
            status: 'active' as const,
            finalDecision: undefined,
            isSelectedWinner: false,
            currentSelection: revertedSelection,
            location: p.initialSelection || p.previousSelection || 'Landmark Beach Private Cabana #4',
          };
        }
        return p;
      });

      return {
        ...prev,
        suggestions: prev.suggestions.filter((s) => s.id !== suggestionId),
        plans: updatedPlans,
        decisions: prev.decisions.map((d) => ({
          ...d,
          options: d.options.filter((o) => o.id !== `opt-${suggestionId}` && o.label !== target?.title),
        })),
      };
    });

    if (target) {
      addActivity(`removed suggestion "${target.title}" from ${target.planTitle || 'the plan'}`, '🗑️');
    }
  };

  // Update Board Cover Image Position
  const handleUpdateBoardCoverPosition = (newPosition: ImagePosition) => {
    setBoard((prev) => ({
      ...prev,
      coverImagePosition: newPosition,
    }));
    addActivity(`repositioned the board cover image 🖼️`, '🖼️');
  };

  // Update Suggestion Image Position
  const handleUpdateSuggestionPosition = (suggestionId: string, newPosition: ImagePosition, imageIndex: number = 0) => {
    setBoard((prev) => {
      const targetSug = prev.suggestions.find((s) => s.id === suggestionId);
      const updatedSuggestions = prev.suggestions.map((s) => {
        if (s.id !== suggestionId) return s;
        const currentImages = s.images && s.images.length > 0
          ? [...s.images]
          : [{ id: 'img-0', url: s.imageUrl, position: s.imagePosition }];

        if (currentImages[imageIndex]) {
          currentImages[imageIndex] = { ...currentImages[imageIndex], position: newPosition };
        }

        return {
          ...s,
          imageUrl: currentImages[0]?.url || s.imageUrl,
          imagePosition: imageIndex === 0 ? newPosition : s.imagePosition,
          images: currentImages,
        };
      });

      const updatedPlans = prev.plans.map((p) => {
        if (p.appliedSuggestionId === suggestionId || (targetSug?.isSelectedWinner && p.id === targetSug.planId)) {
          const planImages = p.images && p.images.length > 0
            ? [...p.images]
            : (targetSug?.images ? [...targetSug.images] : undefined);
          if (planImages && planImages[imageIndex]) {
            planImages[imageIndex] = { ...planImages[imageIndex], position: newPosition };
          }
          return {
            ...p,
            imagePosition: imageIndex === 0 ? newPosition : p.imagePosition,
            images: planImages,
          };
        }
        return p;
      });

      return {
        ...prev,
        suggestions: updatedSuggestions,
        plans: updatedPlans,
      };
    });
    addActivity(`repositioned suggestion photo 🖼️`, '🖼️');
  };

  // 5d. Add Visual Idea Suggestion (Locked to a plan)
  const handleAddSuggestion = (newSugData: {
    planId: string;
    planTitle: string;
    planEmoji?: string;
    title: string;
    description: string;
    imageUrl: string;
    imagePosition?: ImagePosition;
    images?: SuggestionImageItem[];
    priority?: ItemPriority;
    link?: string;
  }) => {
    const images = newSugData.images && newSugData.images.length > 0
      ? newSugData.images
      : [
          {
            id: `img-${Date.now()}`,
            url: newSugData.imageUrl,
            title: newSugData.title,
            position: newSugData.imagePosition,
          },
        ];

    const newSug: SuggestionItem = {
      id: `sug-${Date.now()}`,
      type: 'suggestion',
      title: newSugData.title,
      category: `${newSugData.planEmoji || '📍'} ${newSugData.planTitle}`,
      description: newSugData.description,
      imageUrl: images[0].url,
      imagePosition: images[0].position || newSugData.imagePosition,
      images: images,
      authorId: currentPersona.id,
      authorName: effectivePersona.name,
      heartCount: 1,
      heartedByMemberIds: [currentPersona.id],
      isSelectedWinner: false,
      isPutUpForVote: false,
      status: 'open',
      priority: newSugData.priority || 'required',
      planId: newSugData.planId,
      planTitle: newSugData.planTitle,
      planEmoji: newSugData.planEmoji,
      link: newSugData.link ? newSugData.link.trim() : undefined,
    };

    setBoard((prev) => ({
      ...prev,
      suggestions: [newSug, ...prev.suggestions],
    }));

    addActivity(
      `suggested visual idea for ${newSugData.planTitle}: "${newSugData.title}" ${
        images.length > 1 ? `(${images.length} photos grouped)` : ''
      } 💡`,
      '💡'
    );
  };

  // 6. Toggle Task Complete
  const handleToggleTaskComplete = (taskId: string) => {
    setBoard((prev) => {
      let taskTitle = '';
      const targetTask = prev.tasks.find((t) => t.id === taskId);
      const isNowCompleted = targetTask?.status !== 'completed';

      const updatedTasks = prev.tasks.map((task) => {
        if (task.id !== taskId) return task;
        taskTitle = task.title;
        return {
          ...task,
          status: isNowCompleted ? ('completed' as const) : ('in_progress' as const),
        };
      });

      // SYNC TO PLANS: update task plan status
      const updatedPlans = prev.plans.map((p) => {
        if (targetTask && isPlanMatchingItem(p, targetTask)) {
          return {
            ...p,
            status: isNowCompleted ? ('confirmed' as const) : ('active' as const),
            assigneeName: targetTask.assigneeName || p.assigneeName,
          };
        }
        return p;
      });

      return {
        ...prev,
        tasks: updatedTasks,
        plans: updatedPlans,
      };
    });

    addActivity(`updated task status ✓`, '🎯');
  };

  // 7. Volunteer for Task
  const handleVolunteerForTask = (taskId: string, customAssigneeId?: string, customAssigneeName?: string) => {
    const assigneeId = customAssigneeId || currentPersona.id;
    const assigneeName = customAssigneeName || effectivePersona.name;

    setBoard((prev) => {
      const targetTask = prev.tasks.find((t) => t.id === taskId);
      const updatedTasks = prev.tasks.map((task) => {
        if (task.id !== taskId) return task;
        return {
          ...task,
          assigneeId,
          assigneeName,
          status: 'in_progress' as const,
        };
      });

      // SYNC TO PLANS: update assignee in plan
      const updatedPlans = prev.plans.map((p) => {
        if (targetTask && isPlanMatchingItem(p, targetTask)) {
          return {
            ...p,
            assigneeId,
            assigneeName,
            currentSelection: `${assigneeName} (Assigned)`,
          };
        }
        return p;
      });

      return {
        ...prev,
        tasks: updatedTasks,
        plans: updatedPlans,
      };
    });

    addActivity(`volunteered for a plan responsibility 🙋`, '🙋');
  };

  // 8. Toggle Payment Contribution
  const handleTogglePaymentPaid = (contribId: string) => {
    setBoard((prev) => {
      const updatedContributions = prev.contributions.map((c) => {
        if (c.id !== contribId) return c;
        const hasPaid = c.contributorsPaid.includes(currentPersona.id);
        const perPerson = 8500;
        const newPaidList = hasPaid
          ? c.contributorsPaid.filter((id) => id !== currentPersona.id)
          : [...c.contributorsPaid, currentPersona.id];
        const newAmount = newPaidList.length * perPerson;

        return {
          ...c,
          contributorsPaid: newPaidList,
          currentAmount: newAmount,
        };
      });

      return {
        ...prev,
        contributions: updatedContributions,
      };
    });

    addActivity(`recorded contribution for ₦8,500 share 💰`, '💰');
  };

  // 9. Add Itinerary Stop
  const handleAddTimelineEntry = (entry: Omit<TimelineEntry, 'id'>) => {
    const newEntry: TimelineEntry = {
      ...entry,
      id: `tl-${Date.now()}`,
    };
    setBoard((prev) => ({
      ...prev,
      timeline: [...prev.timeline, newEntry],
    }));
    addActivity(`added a schedule stop: ${entry.title}`, '⏰');
  };

  // 10. Update Member Role
  const handleUpdateMemberRole = (memberId: string, newRole: MemberRole) => {
    setBoard((prev) => ({
      ...prev,
      members: prev.members.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)),
    }));
  };

  // 11. Assign Responsibility
  const handleAssignResponsibility = (memberId: string, resp: string) => {
    setBoard((prev) => ({
      ...prev,
      members: prev.members.map((m) => (m.id === memberId ? { ...m, responsibility: resp } : m)),
    }));
  };

  // 12. Attached Plans Management (Owner Privilege)
  const handleAddPlan = (newPlan: AttachedPlan) => {
    if (currentPersona.role !== 'owner') return;
    setBoard((prev) => {
      const existingPlans = prev.plans || [];
      // Prevent duplicate plans by ID or exact title
      if (
        existingPlans.some(
          (p) =>
            p.id === newPlan.id ||
            p.title.trim().toLowerCase() === newPlan.title.trim().toLowerCase()
        )
      ) {
        return prev;
      }

      const updatedPlans = newPlan.isPrimary
        ? existingPlans.map((p) => ({ ...p, isPrimary: false }))
        : existingPlans;

      let updatedDecisions = [...prev.decisions];
      let updatedInfo = [...prev.information];
      let updatedTasks = [...prev.tasks];
      let updatedSuggestions = [...prev.suggestions];

      // Automatically register decider item into the corresponding interactive section
      if (newPlan.deciderType === 'voting') {
        const decId = `dec-${newPlan.id}`;
        if (!updatedDecisions.some((d) => d.id === decId || d.deciderItemId === newPlan.id)) {
          updatedDecisions.push({
            id: decId,
            type: 'decision',
            title: newPlan.title,
            category: newPlan.category || 'VOTING',
            question: newPlan.question || `Vote on ${newPlan.title}`,
            priority: newPlan.priority || 'required',
            status: 'open',
            deadlineText: newPlan.deadlineText || 'Voting closes in 2 days',
            options: newPlan.options && newPlan.options.length > 0 ? newPlan.options : [
              { id: `opt-${newPlan.id}-0`, label: 'Option 1', emoji: '🔘', voteCount: 0, voterIds: [] },
              { id: `opt-${newPlan.id}-1`, label: 'Option 2', emoji: '🔘', voteCount: 0, voterIds: [] },
            ],
            totalVotesNeeded: prev.members?.length > 0 ? prev.members.length : 1,
            createdBy: currentPersona.name,
            deciderItemId: newPlan.id,
          });
        }
      } else if (newPlan.deciderType === 'fixed_info') {
        const infoId = `info-${newPlan.id}`;
        if (!updatedInfo.some((i) => i.id === infoId || i.deciderItemId === newPlan.id)) {
          updatedInfo.push({
            id: infoId,
            type: 'information',
            title: newPlan.title,
            category: newPlan.category || 'INFO',
            value: newPlan.infoValue || newPlan.description || `${newPlan.title} guideline fixed.`,
            fixedBy: newPlan.fixedBy || currentPersona.name,
            status: 'fixed',
            priority: newPlan.priority || 'required',
            deciderItemId: newPlan.id,
          });
        }
      } else if (newPlan.deciderType === 'task_duty') {
        const taskId = `task-${newPlan.id}`;
        if (!updatedTasks.some((t) => t.id === taskId || t.deciderItemId === newPlan.id)) {
          updatedTasks.push({
            id: taskId,
            type: 'task',
            title: newPlan.title,
            category: newPlan.category || 'TASK',
            description: newPlan.taskDesc || newPlan.description || `Coordinate ${newPlan.title}`,
            priority: newPlan.priority || 'required',
            status: newPlan.assigneeId ? 'in_progress' : 'open',
            assigneeId: newPlan.assigneeId,
            assigneeName: newPlan.assigneeName,
            deadlineText: newPlan.deadlineText || 'Open for volunteers',
            deciderItemId: newPlan.id,
          });
        }
      } else if (newPlan.deciderType === 'photo_idea') {
        const sugId = `sug-${newPlan.id}`;
        if (!updatedSuggestions.some((s) => s.id === sugId || s.deciderItemId === newPlan.id)) {
          updatedSuggestions.push({
            id: sugId,
            type: 'suggestion',
            title: newPlan.title,
            category: newPlan.category || 'INSPIRATION',
            description: newPlan.ideaDesc || newPlan.description || `Ideas for ${newPlan.title}`,
            imageUrl: newPlan.imageUrl || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
            authorId: currentPersona.id,
            authorName: currentPersona.name,
            heartCount: 0,
            heartedByMemberIds: [],
            isSelectedWinner: false,
            status: 'open',
            priority: newPlan.priority || 'required',
            deciderItemId: newPlan.id,
          });
        }
      }

      const allPlans = [...updatedPlans, newPlan];
      const planWithSchedule = allPlans.find((p) => p.isPrimary && (p.date || p.time || p.dateTime))
        || allPlans.find((p) => p.date || p.time || p.dateTime);
      const hasStructuredTime = Boolean(planWithSchedule?.time && planWithSchedule.hasSpecificTime !== false);

      return {
        ...prev,
        date: planWithSchedule?.date,
        time: planWithSchedule?.time,
        dateTime: planWithSchedule?.dateTime,
        hasSpecificTime: planWithSchedule ? hasStructuredTime : undefined,
        daysToGo: undefined,
        plans: allPlans,
        decisions: updatedDecisions,
        information: updatedInfo,
        tasks: updatedTasks,
        suggestions: updatedSuggestions,
      };
    });
    addActivity(`added plan: ${newPlan.title} (${newPlan.deciderType.replace('_', ' ')}) to this board`, '📋');
  };

  const handleEditPlan = (updatedPlan: AttachedPlan) => {
    if (currentPersona.role !== 'owner') return;
    setBoard((prev) => {
      const existingPlans = prev.plans || [];
      const updatedPlans = existingPlans.map((p) => {
        if (p.id === updatedPlan.id) {
          return updatedPlan;
        }
        if (updatedPlan.isPrimary) {
          return { ...p, isPrimary: false };
        }
        return p;
      });

      // Update linked decisions if applicable
      const updatedDecisions = prev.decisions.map((d) => {
        if (d.deciderItemId === updatedPlan.id || d.id === `dec-${updatedPlan.id}`) {
          return {
            ...d,
            title: updatedPlan.title,
            question: updatedPlan.question || d.question,
            emoji: updatedPlan.emoji,
            priority: updatedPlan.priority || d.priority,
            deadlineText: updatedPlan.deadlineText || d.deadlineText,
            options: updatedPlan.options && updatedPlan.options.length > 0 ? updatedPlan.options : d.options,
          };
        }
        return d;
      });

      // Update linked info if applicable
      const updatedInfo = prev.information.map((i) => {
        if (i.deciderItemId === updatedPlan.id || i.id === `info-${updatedPlan.id}`) {
          return {
            ...i,
            title: updatedPlan.title,
            value: updatedPlan.infoValue || i.value,
            emoji: updatedPlan.emoji,
          };
        }
        return i;
      });

      // Update linked tasks if applicable
      const updatedTasks = prev.tasks.map((t) => {
        if (t.deciderItemId === updatedPlan.id || t.id === `task-${updatedPlan.id}`) {
          return {
            ...t,
            title: updatedPlan.title,
            description: updatedPlan.taskDesc || t.description,
            emoji: updatedPlan.emoji,
            assigneeId: updatedPlan.assigneeId || t.assigneeId,
            assigneeName: updatedPlan.assigneeName || t.assigneeName,
            deadlineText: updatedPlan.deadlineText || t.deadlineText,
          };
        }
        return t;
      });

      // Update linked suggestions if applicable
      const updatedSuggestions = prev.suggestions.map((s) => {
        if (s.deciderItemId === updatedPlan.id || s.id === `sug-${updatedPlan.id}`) {
          return {
            ...s,
            title: updatedPlan.title,
            description: updatedPlan.ideaDesc || s.description,
            imageUrl: updatedPlan.imageUrl || s.imageUrl,
          };
        }
        return s;
      });

      const planWithSchedule = updatedPlans.find((p) => p.isPrimary && (p.date || p.time || p.dateTime))
        || updatedPlans.find((p) => p.date || p.time || p.dateTime);
      const hasStructuredTime = Boolean(planWithSchedule?.time && planWithSchedule.hasSpecificTime !== false);

      return {
        ...prev,
        date: planWithSchedule?.date,
        time: planWithSchedule?.time,
        dateTime: planWithSchedule?.dateTime,
        hasSpecificTime: planWithSchedule ? hasStructuredTime : undefined,
        daysToGo: undefined,
        plans: updatedPlans,
        decisions: updatedDecisions,
        information: updatedInfo,
        tasks: updatedTasks,
        suggestions: updatedSuggestions,
      };
    });
    addActivity(`updated plan: ${updatedPlan.title}`, '✏️');
  };

  const handleRemovePlan = (planId: string) => {
    if (currentPersona.role !== 'owner') return;
    setBoard((prev) => {
      const existingPlans = prev.plans || [];
      const target = existingPlans.find((p) => p.id === planId);
      let updatedPlans = existingPlans.filter((p) => p.id !== planId);
      if (target?.isPrimary && updatedPlans.length > 0) {
        updatedPlans[0] = { ...updatedPlans[0], isPrimary: true };
      }

      const planWithSchedule = updatedPlans.find((p) => p.isPrimary && (p.date || p.time || p.dateTime))
        || updatedPlans.find((p) => p.date || p.time || p.dateTime);
      const hasStructuredTime = Boolean(planWithSchedule?.time && planWithSchedule.hasSpecificTime !== false);

      return {
        ...prev,
        date: planWithSchedule?.date,
        time: planWithSchedule?.time,
        dateTime: planWithSchedule?.dateTime,
        hasSpecificTime: planWithSchedule ? hasStructuredTime : undefined,
        daysToGo: undefined,
        plans: updatedPlans,
        decisions: prev.decisions.filter((d) => d.deciderItemId !== planId && d.id !== `dec-${planId}`),
        information: prev.information.filter((i) => i.deciderItemId !== planId && i.id !== `info-${planId}`),
        tasks: prev.tasks.filter((t) => t.deciderItemId !== planId && t.id !== `task-${planId}`),
        suggestions: prev.suggestions.filter((s) => s.deciderItemId !== planId && s.id !== `sug-${planId}`),
      };
    });
    addActivity(`removed a plan from the board`, '🗑️');
  };

  const handleSetPrimaryPlan = (planId: string) => {
    if (currentPersona.role !== 'owner') return;
    setBoard((prev) => {
      const existingPlans = prev.plans || [];
      const updatedPlans = existingPlans.map((p) => ({
        ...p,
        isPrimary: p.id === planId,
      }));

      const planWithSchedule = updatedPlans.find((p) => p.isPrimary && (p.date || p.time || p.dateTime))
        || updatedPlans.find((p) => p.date || p.time || p.dateTime);
      const hasStructuredTime = Boolean(planWithSchedule?.time && planWithSchedule.hasSpecificTime !== false);

      return {
        ...prev,
        date: planWithSchedule?.date,
        time: planWithSchedule?.time,
        dateTime: planWithSchedule?.dateTime,
        hasSpecificTime: planWithSchedule ? hasStructuredTime : undefined,
        daysToGo: undefined,
        plans: updatedPlans,
      };
    });
    addActivity(`set primary plan on this board`, '⭐');
  };

  // 12e. Update Participant Status for a Plan (Participant Status Decider)
  const handleUpdateParticipantStatus = (planId: string, memberId: string, optionId: string) => {
    setBoard((prev) => {
      const existingPlans = prev.plans || [];
      const updatedPlans = existingPlans.map((p) => {
        if (p.id === planId) {
          const currentStatuses = p.participantStatuses || {};
          const member = prev.members.find((m) => m.id === memberId);
          const option = p.statusOptions?.find((o) => o.id === optionId);
          const newStatus: ParticipantUserStatus = {
            userId: memberId,
            userName: member?.name || 'Member',
            userAvatar: member?.avatar,
            statusOptionId: optionId,
            statusLabel: option?.label || optionId,
            updatedAt: 'Just now',
            updatedBy: effectivePersona.name,
          };

          const newStatuses = {
            ...currentStatuses,
            [memberId]: newStatus,
          };

          // Generate friendly summary for currentSelection
          const recordedEntries = (Object.values(newStatuses) as ParticipantUserStatus[]).filter((s) => !!s.statusLabel);
          const countsByLabel: Record<string, number> = {};
          recordedEntries.forEach((entry) => {
            const lbl = entry.statusLabel || 'Responded';
            countsByLabel[lbl] = (countsByLabel[lbl] || 0) + 1;
          });

          const definedLabels = p.statusOptions?.map((o) => o.label) || Object.keys(countsByLabel);
          const summaryParts: string[] = [];
          definedLabels.forEach((lbl) => {
            if (countsByLabel[lbl]) {
              const lower = lbl.toLowerCase();
              const formatted = lower === 'i will' ? 'attending' : lower;
              summaryParts.push(`${countsByLabel[lbl]} ${formatted}`);
            }
          });

          return {
            ...p,
            participantStatuses: newStatuses,
            currentSelection: summaryParts.join(' · ') || `${recordedEntries.length} responded`,
          };
        }
        return p;
      });

      const nextBoard = {
        ...prev,
        plans: updatedPlans,
      };

      return nextBoard;
    });

    const member = board.members.find((m) => m.id === memberId);
    const plan = (board.plans || []).find((p) => p.id === planId);
    const option = plan?.statusOptions?.find((o) => o.id === optionId);
    addActivity(
      `${currentPersona.id === memberId ? 'marked their status' : `marked ${member?.name}'s status`} as "${option?.label || optionId}" for ${plan?.title || 'plan'}`,
      '👥'
    );
  };

  // 12f. Fun Decider: Record One-Time Selection for Participant
  const handleParticipateFunDecider = (planId: string, option: string) => {
    setBoard((prev) => {
      const targetPlan = prev.plans.find((p) => p.id === planId);
      if (!targetPlan) return prev;

      // Enforce one-time participation per round
      if (targetPlan.participantSelections && targetPlan.participantSelections[currentPersona.id]) {
        return prev;
      }

      const totalMembers = prev.members?.length || 4;
      const currentSelections = { ...(targetPlan.participantSelections || {}) };
      currentSelections[currentPersona.id] = {
        userId: currentPersona.id,
        userName: currentPersona.name,
        userAvatar: currentPersona.avatar,
        option,
        selectedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      const interimPlan: AttachedPlan = {
        ...targetPlan,
        participantSelections: currentSelections,
        totalParticipantsNeeded: totalMembers,
      };

      const tally = calculateCollectiveFunDecision(interimPlan, totalMembers);

      let updatedPlan: AttachedPlan;
      if (tally.isAllCompleted && tally.winner) {
        // All eligible participants have completed their selections!
        // Finalize collective decision based on highest number of selections
        const winningOption = tally.winner.option;
        const winningText = `${winningOption} — ${tally.winner.count} selections`;
        updatedPlan = {
          ...interimPlan,
          status: 'confirmed',
          currentSelection: winningOption,
          wheelWinningOption: winningOption,
          finalDecision: winningText,
          decidedSource: targetPlan.deciderType,
          decidedAt: new Date().toISOString(),
          wheelLastSpunAt: new Date().toISOString(),
          location:
            targetPlan.category.toLowerCase().includes('location') || targetPlan.title.toLowerCase().includes('location')
              ? winningOption
              : targetPlan.location,
        };
      } else {
        // In-progress: update leading option and timestamp
        updatedPlan = {
          ...interimPlan,
          status: 'active',
          currentSelection: tally.leader ? tally.leader.option : targetPlan.currentSelection,
          wheelWinningOption: tally.leader ? tally.leader.option : undefined,
          wheelLastSpunAt: new Date().toISOString(),
        };
      }

      const updatedPlans = prev.plans.map((p) => (p.id === planId ? updatedPlan : p));

      // Synchronize linked decisions if exists
      const updatedDecisions = prev.decisions.map((d) => {
        if (d.deciderItemId === planId || d.id === `dec-${planId}`) {
          if (tally.isAllCompleted && tally.winner) {
            return {
              ...d,
              status: 'completed' as const,
              finalDecision: `${tally.winner.option} — ${tally.winner.count} selections`,
            };
          }
        }
        return d;
      });

      return {
        ...prev,
        plans: updatedPlans,
        decisions: updatedDecisions,
      };
    });

    addActivity(
      `completed their choice for ${board.plans.find((p) => p.id === planId)?.title || 'plan'}: "${option}" 🎯`,
      '🎯'
    );
  };

  // 12g. Fun Decider: Re-open Decision (Admin/Owner Action)
  const handleReopenFunDecider = (planId: string) => {
    if (currentPersona.role !== 'owner' && currentPersona.role !== 'admin') return;

    setBoard((prev) => {
      const targetPlan = prev.plans.find((p) => p.id === planId);
      if (!targetPlan) return prev;

      const nextRound = (targetPlan.decisionRound || 1) + 1;
      const updatedPlans = prev.plans.map((p) => {
        if (p.id !== planId) return p;
        return {
          ...p,
          status: 'active' as const,
          isReopened: true,
          reopenedAt: new Date().toISOString(),
          decisionRound: nextRound,
          participantSelections: {},
          wheelWinningOption: undefined,
          finalDecision: undefined,
          decidedSource: undefined,
          decidedAt: undefined,
          currentSelection: p.deciderType === 'blind_pick' ? '' : (p.initialSelection || p.spinnerOptions?.[0] || ''),
        };
      });

      const updatedDecisions = prev.decisions.map((d) => {
        if (d.deciderItemId === planId || d.id === `dec-${planId}`) {
          return {
            ...d,
            status: 'open' as const,
            finalDecision: undefined,
            winningOption: undefined,
            isReopened: true,
            reopenedAt: new Date().toISOString(),
            decisionRound: nextRound,
            votes: {},
          };
        }
        return d;
      });

      return {
        ...prev,
        plans: updatedPlans,
        decisions: updatedDecisions,
      };
    });

    addActivity(`reopened decision for "${board.plans.find((p) => p.id === planId)?.title || 'plan'}" 🔄`, '🔄');
  };

  // 12h. Fun Decider: Finalize Early (Admin/Owner Action)
  const handleFinalizeFunDecider = (planId: string, winningOption?: string) => {
    if (currentPersona.role !== 'owner' && currentPersona.role !== 'admin') return;

    setBoard((prev) => {
      const targetPlan = prev.plans.find((p) => p.id === planId);
      if (!targetPlan) return prev;

      const tally = calculateCollectiveFunDecision(targetPlan, prev.members?.length || 4);
      const chosen = winningOption || tally.leader?.option || targetPlan.spinnerOptions?.[0] || 'Selected Option';
      const finalizedText = `${chosen} — Finalized by ${currentPersona.name}`;

      const updatedPlans = prev.plans.map((p) => {
        if (p.id !== planId) return p;
        return {
          ...p,
          status: 'confirmed' as const,
          currentSelection: chosen,
          wheelWinningOption: chosen,
          finalDecision: finalizedText,
          decidedSource: p.deciderType,
          decidedAt: new Date().toISOString(),
          isReopened: false,
          location:
            p.category.toLowerCase().includes('location') || p.title.toLowerCase().includes('location')
              ? chosen
              : p.location,
        };
      });

      const updatedDecisions = prev.decisions.map((d) => {
        if (d.deciderItemId === planId || d.id === `dec-${planId}`) {
          return {
            ...d,
            status: 'completed' as const,
            finalDecision: finalizedText,
          };
        }
        return d;
      });

      return {
        ...prev,
        plans: updatedPlans,
        decisions: updatedDecisions,
      };
    });

    addActivity(`finalized decision for "${board.plans.find((p) => p.id === planId)?.title || 'plan'}" 👑`, '👑');
  };

  // 12i. Fun Decider: Undo Finalization / Re-open Decision (Admin/Owner Action)
  const handleUndoFinalizeFunDecider = (planId: string) => {
    if (currentPersona.role !== 'owner' && currentPersona.role !== 'admin') return;

    setBoard((prev) => {
      const targetPlan = prev.plans.find((p) => p.id === planId);
      if (!targetPlan) return prev;

      const tally = calculateCollectiveFunDecision(targetPlan, prev.members?.length || 4);
      // Revert status to 'active', clear finalization locks, but preserve historical participant votes/spins!
      const leadingOption = tally.leader?.option || targetPlan.spinnerOptions?.[0] || '';

      const updatedPlans = prev.plans.map((p) => {
        if (p.id !== planId) return p;
        return {
          ...p,
          status: 'active' as const,
          currentSelection: leadingOption,
          wheelWinningOption: undefined,
          finalDecision: undefined,
          decidedSource: undefined,
          decidedAt: undefined,
          isReopened: true,
        };
      });

      const updatedDecisions = prev.decisions.map((d) => {
        if (d.deciderItemId === planId || d.id === `dec-${planId}`) {
          return {
            ...d,
            status: 'open' as const,
            finalDecision: undefined,
            isReopened: true,
          };
        }
        return d;
      });

      return {
        ...prev,
        plans: updatedPlans,
        decisions: updatedDecisions,
      };
    });

    addActivity(`undid finalization and returned "${board.plans.find((p) => p.id === planId)?.title || 'plan'}" to active decision state ↩️`, '↩️');
  };

  // 13. Create New Plan Board
  const handleCreatePlan = (newBoardData: Partial<PlanBoard>) => {
    const plansToAttach = newBoardData.plans && newBoardData.plans.length > 0
      ? newBoardData.plans
      : [];

    const initialDecisions: DecisionItem[] = [];
    const initialInfo: InformationItem[] = [];
    const initialTasks: TaskItem[] = [];
    const initialSuggestions: SuggestionItem[] = [];

    // Initialize decider items from attached plans
    plansToAttach.forEach((p) => {
      if (p.deciderType === 'voting') {
        initialDecisions.push({
          id: `dec-${p.id}`,
          type: 'decision',
          title: p.title,
          category: p.category || 'VOTING',
          question: p.question || `Vote on ${p.title}`,
          priority: p.priority || 'required',
          status: 'open',
          deadlineText: p.deadlineText || 'Voting closes in 2 days',
          options: p.options || [
            { id: `opt-${p.id}-0`, label: 'Option 1', emoji: '🔘', voteCount: 0, voterIds: [] },
            { id: `opt-${p.id}-1`, label: 'Option 2', emoji: '🔘', voteCount: 0, voterIds: [] },
          ],
          totalVotesNeeded: 1,
          createdBy: currentPersona.name,
          deciderItemId: p.id,
        });
      } else if (p.deciderType === 'fixed_info') {
        initialInfo.push({
          id: `info-${p.id}`,
          type: 'information',
          title: p.title,
          category: p.category || 'INFO',
          value: p.infoValue || p.description || `${p.title} guideline set.`,
          fixedBy: currentPersona.name,
          status: 'fixed',
          priority: p.priority || 'required',
          deciderItemId: p.id,
        });
      } else if (p.deciderType === 'task_duty') {
        initialTasks.push({
          id: `task-${p.id}`,
          type: 'task',
          title: p.title,
          category: p.category || 'TASK',
          description: p.taskDesc || p.description || `Coordinate ${p.title}`,
          priority: p.priority || 'required',
          status: p.assigneeId ? 'in_progress' : 'open',
          assigneeId: p.assigneeId,
          assigneeName: p.assigneeName,
          deadlineText: p.deadlineText || 'Open for volunteers',
          deciderItemId: p.id,
        });
      } else if (p.deciderType === 'photo_idea') {
        initialSuggestions.push({
          id: `sug-${p.id}`,
          type: 'suggestion',
          title: p.title,
          category: p.category || 'INSPIRATION',
          description: p.ideaDesc || p.description || `Ideas for ${p.title}`,
          imageUrl: p.imageUrl || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
          authorId: currentPersona.id,
          authorName: currentPersona.name,
          heartCount: 0,
          heartedByMemberIds: [],
          isSelectedWinner: false,
          status: 'open',
          priority: p.priority || 'required',
          deciderItemId: p.id,
        });
      }
    });

    const planWithSchedule = plansToAttach.find((p) => p.isPrimary && (p.date || p.time || p.dateTime))
      || plansToAttach.find((p) => p.date || p.time || p.dateTime);
    const hasStructuredTime = Boolean(planWithSchedule?.time && planWithSchedule.hasSpecificTime !== false);

    const finalCreatorName = (newBoardData.creatorCustomName && newBoardData.creatorCustomName.trim()) 
      || currentPersona.name;
    const finalCreatorAvatar = newBoardData.creatorCustomAvatar || currentPersona.avatar;

    const newBoard: PlanBoard = {
      id: `board-${Date.now()}`,
      title: newBoardData.title || 'Our New Plan',
      emoji: newBoardData.emoji || '🎉',
      coverImage: newBoardData.coverImage || INITIAL_BOARD.coverImage,
      coverImagePosition: newBoardData.coverImagePosition,
      // Date and Time are purely optional and ONLY populated if an attached plan has it
      date: planWithSchedule?.date,
      time: planWithSchedule?.time,
      dateTime: planWithSchedule?.dateTime,
      hasSpecificTime: planWithSchedule ? hasStructuredTime : undefined,
      daysToGo: undefined,
      endDateTime: undefined,
      state: 'new',
      ownerId: currentPersona.id,
      ownerName: finalCreatorName,
      description: newBoardData.description || 'A collaborative plan built by friends.',
      plans: plansToAttach,
      creatorCustomIdentity: {
        useCustomName: Boolean(newBoardData.useCustomName),
        displayName: finalCreatorName,
        avatar: finalCreatorAvatar,
      },
      members: [
        {
          id: currentPersona.id,
          name: finalCreatorName,
          avatar: finalCreatorAvatar,
          role: 'owner',
          responsibility: 'Plan Creator & Host',
        },
      ],
      decisions: initialDecisions.map((d) => ({ ...d, createdBy: finalCreatorName })),
      suggestions: initialSuggestions.map((s) => ({ ...s, authorName: finalCreatorName })),
      tasks: initialTasks,
      contributions: [],
      information: initialInfo.map((i) => ({ ...i, fixedBy: finalCreatorName })),
      timeline: [],
      recentActivities: [
        {
          id: `act-${Date.now()}`,
          actorName: finalCreatorName,
          actorAvatar: finalCreatorAvatar,
          actionText: `created the plan board: ${newBoardData.title || 'Our New Plan'} with ${plansToAttach.length} plan(s) ✨`,
          timeAgo: 'Just now',
          badgeEmoji: '✨',
        },
      ],
    };

    saveBoard(newBoard);
    saveActiveBoardId(newBoard.id);
    setAllBoards((prev) => [newBoard, ...prev.filter((b) => b.id !== newBoard.id)]);
    setBoard(newBoard);
    setIsCreatePlanOpen(false);
  };

  // 13. Add Planning Item
  const handleAddItem = (item: any) => {
    if (item.type === 'decision') {
      setBoard((prev) => ({
        ...prev,
        decisions: [item, ...prev.decisions],
      }));
    } else if (item.type === 'suggestion') {
      setBoard((prev) => ({
        ...prev,
        suggestions: [item, ...prev.suggestions],
      }));
    } else if (item.type === 'task') {
      setBoard((prev) => ({
        ...prev,
        tasks: [item, ...prev.tasks],
      }));
    } else if (item.type === 'information') {
      setBoard((prev) => ({
        ...prev,
        information: [item, ...prev.information],
      }));
    }
    addActivity(`added a new ${item.type} item: ${item.title}`, '➕');
  };

  // 14. Guest Join Flow Simulation
  const handleJoinAsGuest = (name: string, avatar?: string) => {
    const finalAvatar = avatar || BOARD_AVATARS[0]?.url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Friend';
    const newGuestPersona: UserPersona = {
      id: `user-guest-${Date.now()}`,
      name,
      avatar: finalAvatar,
      role: 'member',
      isGuest: true,
    };

    lastGuestPersonaRef.current = newGuestPersona;
    handleSelectPersona(newGuestPersona);

    // Add to members list if not present, or update existing with the chosen board-specific avatar
    setBoard((prev) => {
      const existingIdx = prev.members.findIndex((m) => m.name.toLowerCase() === name.toLowerCase());
      if (existingIdx >= 0) {
        return {
          ...prev,
          members: prev.members.map((m, idx) =>
            idx === existingIdx
              ? { ...m, avatar: finalAvatar, joinedViaInvite: true }
              : m
          ),
        };
      }

      const newMember: BoardMember = {
        id: newGuestPersona.id,
        name: newGuestPersona.name,
        avatar: finalAvatar,
        role: 'member',
        joinedViaInvite: true,
      };
      return {
        ...prev,
        members: [...prev.members, newMember],
      };
    });

    addActivity(`${name} joined the plan with custom avatar 👋`, '👋');
  };

  // First Action Completed from Guest Join
  const handleFirstActionCompleted = (decisionId: string, optionId: string) => {
    const voterId = lastGuestPersonaRef.current?.id || currentPersona.id;
    handleVote(decisionId, optionId, voterId);
  };

  // Smooth section switching navigation
  const handleScrollToSection = (id: string) => {
    if (id.includes('plan')) {
      handleNavigateToSection('plan');
    } else if (id.includes('decision')) {
      handleNavigateToSection('decisions');
    } else if (id.includes('suggestion')) {
      handleNavigateToSection('suggestions');
    } else if (id.includes('people') || id.includes('responsibilities') || id.includes('timeline')) {
      handleNavigateToSection('people_timeline');
    } else {
      handleNavigateToSection('overview');
    }
  };

  // Filtered decisions & items for current user's "YOUR PART"
  const pendingDecisionsForUser = board.decisions.filter(
    (d) => d.status === 'open' && !d.options.some((opt) => opt.voterIds.includes(currentPersona.id))
  );
  const userResponsibilities = board.tasks.filter(
    (t) => t.assigneeId === currentPersona.id
  );
  const userContribution = board.contributions[0];

  // Full-Page Create Plan Board Experience
  if (isCreatePlanOpen) {
    return (
      <CreatePlanModal
        isOpen={isCreatePlanOpen}
        onClose={() => setIsCreatePlanOpen(false)}
        onCreatePlan={handleCreatePlan}
        currentPersona={currentPersona}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFFFF] flex flex-col selection:bg-amber-100 selection:text-amber-900">
      {/* Simplified Top Navbar: Board Switcher (Left) and Share / Profile (Right) */}
      <Header
        currentBoard={board}
        currentPersona={currentPersona}
        boardPersona={effectivePersona}
        allPersonas={USER_PERSONAS}
        allBoards={allBoards}
        onSelectBoard={(boardId) => {
          const stored = getAllStoredBoards();
          const found = stored.find((b) => b.id === boardId) || allBoards.find((b) => b.id === boardId);
          if (found) {
            setBoard(found);
            saveActiveBoardId(boardId);
          }
        }}
        onSelectPersona={handleSelectPersona}
        onOpenMyPlans={() => setIsMyPlansOpen(true)}
        onOpenCreatePlan={() => setIsCreatePlanOpen(true)}
        onOpenShare={() => setIsShareOpen(true)}
        onOpenJoinFlow={() => setIsJoinFlowOpen(true)}
        onDeleteBoard={handleDeleteBoard}
      />

      {/* Main Board Container with dedicated section views */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-6 pb-28 sm:pb-32">
        <AnimatePresence mode="wait">
          {/* 1. OVERVIEW SECTION */}
          {activeSection === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
              className="space-y-8"
            >
              {/* Main Board Header Banner */}
              <BoardHeader
                board={board}
                currentPersona={effectivePersona}
                onOpenShare={() => setIsShareOpen(true)}
                onOpenPeople={() => handleNavigateToSection('people_timeline')}
                onOpenCreateItem={() => setIsCreateItemOpen(true)}
                onOpenAddPlan={() => {
                  handleNavigateToSection('plan');
                  setIsAddPlanModalOpen(true);
                }}
                onUpdateCoverPosition={handleUpdateBoardCoverPosition}
                activeEvolutionDay={activeEvolutionDay}
                onSelectEvolutionDay={handleSelectEvolutionDay}
              />

              {/* Activity Feed & WhatsApp Integration Card */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <ActivityFeed activities={board.recentActivities} />
                </div>
                <div>
                  <div className="bg-[#EFEAE2] rounded-3xl p-5 border border-[#DFE1E6] shadow-xs">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
                        💬
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-[#1A1B25] uppercase tracking-wider">
                          WhatsApp + Plan Board
                        </h4>
                        <p className="text-[11px] text-[#666D80]">
                          Chat stays the conversation · Board is the source of truth
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-[#353849] mb-3 leading-relaxed">
                      When friends in the group chat ask <em>"What time are we leaving again?"</em> or <em>"Where are we going?"</em>, you don't scroll through 400 messages. Just share the board link.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsShareOpen(true)}
                      className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition cursor-pointer shadow-xs"
                    >
                      Copy WhatsApp Plan Invite
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 2. THE PLAN SECTION: Information Only Source of Truth */}
          {activeSection === 'plan' && (
            <motion.div
              key="plan"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
              className="space-y-6"
            >
              <BoardPlansSection
                board={board}
                currentPersona={effectivePersona}
                onAddPlan={handleAddPlan}
                onEditPlan={handleEditPlan}
                onRemovePlan={handleRemovePlan}
                onSetPrimaryPlan={handleSetPrimaryPlan}
                isAddPlanOpenExternally={isAddPlanModalOpen}
                onCloseExternalAddPlan={() => setIsAddPlanModalOpen(false)}
              />
            </motion.div>
          )}

          {/* 3. DECISION & VOTING SECTION: Action Area */}
          {activeSection === 'decisions' && (
            <motion.div
              key="decisions"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
              className="space-y-6"
            >
              <DecisionsSection
                decisions={board.decisions}
                plans={board.plans}
                tasks={board.tasks}
                currentPersona={effectivePersona}
                allMembers={board.members}
                onVote={handleVote}
                onFinalizeDecision={handleFinalizeDecision}
                onReopenDecision={handleReopenDecision}
                onParticipateFunDecider={handleParticipateFunDecider}
                onReopenFunDecider={handleReopenFunDecider}
                onFinalizeFunDecider={handleFinalizeFunDecider}
                onUndoFinalizeFunDecider={handleUndoFinalizeFunDecider}
                onUpdateParticipantStatus={handleUpdateParticipantStatus}
                onVolunteerForTask={handleVolunteerForTask}
                onToggleTaskComplete={handleToggleTaskComplete}
                onOpenCreateItem={() => setIsCreateItemOpen(true)}
                onRemovePlan={handleRemovePlan}
              />
            </motion.div>
          )}

          {/* 4. VISUAL SUGGESTIONS SECTION */}
          {activeSection === 'suggestions' && (
            <motion.div
              key="suggestions"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
              className="space-y-6"
            >
              <SuggestionsSection
                suggestions={board.suggestions}
                plans={board.plans}
                currentPersona={effectivePersona}
                onToggleHeart={handleToggleHeart}
                onSelectAsWinner={handleSelectAsWinner}
                onTogglePutUpForVote={handleTogglePutUpForVote}
                onDeleteSuggestion={handleDeleteSuggestion}
                onOpenAddSuggestion={(planId?: string) => {
                  setPreselectedPlanIdForSuggestion(planId);
                  setIsAddSuggestionOpen(true);
                }}
                onUpdateSuggestionPosition={handleUpdateSuggestionPosition}
              />
            </motion.div>
          )}

          {/* 5. RESPONSIBILITIES, PEOPLE & TIMELINE SECTION */}
          {activeSection === 'people_timeline' && (
            <motion.div
              key="people_timeline"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
              className="space-y-6"
            >
              <div className="space-y-8">
                {/* 1. People / Participants Section */}
                <PeopleSection
                  members={board.members}
                  currentPersona={effectivePersona}
                  onUpdateMemberRole={handleUpdateMemberRole}
                  onAssignResponsibility={handleAssignResponsibility}
                  onOpenShare={() => setIsShareOpen(true)}
                />

                {/* 2. Participant Status & Check-ins */}
                <ParticipantStatusSection
                  plans={board.plans}
                  members={board.members}
                  currentPersona={effectivePersona}
                  onUpdateStatus={handleUpdateParticipantStatus}
                  onOpenAddPlan={() => {
                    handleNavigateToSection('plan');
                    setIsAddPlanModalOpen(true);
                  }}
                />

                {/* 3. Responsibilities & Money Pool */}
                <ContributionsSection
                  tasks={board.tasks}
                  contributions={board.contributions}
                  currentPersona={effectivePersona}
                  allMembers={board.members}
                  onToggleTaskComplete={handleToggleTaskComplete}
                  onVolunteerForTask={handleVolunteerForTask}
                  onTogglePaymentPaid={handleTogglePaymentPaid}
                  onOpenCreateItem={() => setIsCreateItemOpen(true)}
                />

                {/* 4. Timeline & Itinerary Section */}
                <TimelineSection
                  timeline={board.timeline}
                  currentPersona={effectivePersona}
                  onAddTimelineEntry={handleAddTimelineEntry}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Centralized Floating Navigation Component (Image 1 reference) */}
      <FloatingNav
        activeSection={activeSection}
        onChangeSection={handleNavigateToSection}
        pendingDecisionsCount={pendingDecisionsForUser.length}
        suggestionsCount={board.suggestions.length}
        openTasksCount={board.tasks.filter((t) => t.status !== 'completed').length}
      />

      {/* Modals & Dialogs */}
      <ShareModal
        isOpen={isShareOpen}
        board={board}
        onClose={() => setIsShareOpen(false)}
        onLaunchJoinSimulation={() => setIsJoinFlowOpen(true)}
      />

      <FirstTimeJoinModal
        isOpen={isJoinFlowOpen}
        board={board}
        onClose={() => setIsJoinFlowOpen(false)}
        onJoinAsGuest={handleJoinAsGuest}
        onCompletedFirstAction={handleFirstActionCompleted}
        onVolunteerTask={(taskId) =>
          handleVolunteerForTask(
            taskId,
            lastGuestPersonaRef.current?.id,
            lastGuestPersonaRef.current?.name
          )
        }
        onUpdateParticipantStatus={(planId, optionId) => {
          const guestId = lastGuestPersonaRef.current?.id || currentPersona.id;
          handleUpdateParticipantStatus(planId, guestId, optionId);
        }}
      />

      <CreateItemModal
        isOpen={isCreateItemOpen}
        onClose={() => setIsCreateItemOpen(false)}
        currentPersona={effectivePersona}
        plans={board.plans}
        onAddItem={handleAddItem}
      />

      {isAddSuggestionOpen && (
        <AddSuggestionModal
          isOpen={isAddSuggestionOpen}
          onClose={() => {
            setIsAddSuggestionOpen(false);
            setPreselectedPlanIdForSuggestion(undefined);
          }}
          plans={board.plans}
          preselectedPlanId={preselectedPlanIdForSuggestion}
          currentPersona={effectivePersona}
          onAddSuggestion={handleAddSuggestion}
        />
      )}

      <MyPlansModal
        isOpen={isMyPlansOpen}
        onClose={() => setIsMyPlansOpen(false)}
        currentBoardId={board.id}
        allBoards={allBoards}
        onSelectBoard={(boardId) => {
          const stored = getAllStoredBoards();
          const found = stored.find((b) => b.id === boardId) || allBoards.find((b) => b.id === boardId);
          if (found) {
            setBoard(found);
            saveActiveBoardId(boardId);
          }
        }}
        onOpenCreatePlan={() => {
          setIsMyPlansOpen(false);
          setIsCreatePlanOpen(true);
        }}
        onDeleteBoard={handleDeleteBoard}
        currentPersona={currentPersona}
      />
    </div>
  );
}
