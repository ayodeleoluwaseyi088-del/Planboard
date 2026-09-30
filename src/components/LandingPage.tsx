import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  Check, 
  Calendar, 
  Users, 
  Sparkles, 
  Layers, 
  HelpCircle,
  Share2,
  ShieldCheck,
  Flame,
  CheckCircle2,
  MessageCircle
} from 'lucide-react';
import { PlanBoard, UserPersona } from '../types';
import { INITIAL_BOARD } from '../mockData';
import { DecisionsSection } from './DecisionsSection';
import { SquadlinkLogo } from './SquadlinkLogo';

interface LandingPageProps {
  onOpenCreateBoard: () => void;
  onOpenJoinBoard: () => void;
  onOpenAuthModal: (mode: 'login' | 'signup') => void;
  onSeeBoards: () => void;
  hasBoards: boolean;
  isAuthenticated: boolean;
  currentUser: UserPersona;
  featuredBoard: PlanBoard;
  onLogout?: () => void;
  onVote?: (decisionId: string, optionId: string) => void;
  onFinalizeDecision?: (decisionId: string, optionId: string) => void;
  onReopenDecision?: (decisionId: string) => void;
  onParticipateFunDecider?: (planId: string, option: string) => void;
  onReopenFunDecider?: (planId: string) => void;
  onFinalizeFunDecider?: (planId: string, winningOption?: string) => void;
  onUndoFinalizeFunDecider?: (planId: string) => void;
  onUpdateParticipantStatus?: (planId: string, memberId: string, optionId: string) => void;
  onVolunteerForTask?: (taskId: string, customAssigneeId?: string, customAssigneeName?: string) => void;
  onToggleTaskComplete?: (taskId: string) => void;
  onRemovePlan?: (planId: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenCreateBoard,
  onOpenJoinBoard,
  onOpenAuthModal,
  onSeeBoards,
  hasBoards,
  isAuthenticated,
  currentUser,
  featuredBoard,
  onLogout,
  onVote,
  onFinalizeDecision,
  onReopenDecision,
  onParticipateFunDecider,
  onReopenFunDecider,
  onFinalizeFunDecider,
  onUndoFinalizeFunDecider,
  onUpdateParticipantStatus,
  onVolunteerForTask,
  onToggleTaskComplete,
  onRemovePlan,
}) => {
  // Smooth scroll to anchor helper
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Sticky header scroll listener: change background to white on scroll, return to default when at top
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Local interactive state for Hero Decision section preview
  const [localBoard, setLocalBoard] = useState<PlanBoard>(() => featuredBoard || INITIAL_BOARD);

  useEffect(() => {
    if (featuredBoard) {
      setLocalBoard(featuredBoard);
    }
  }, [featuredBoard]);

  // Integrated decision handlers so users can experience real deciders right on the Home page
  const handleVote = (decisionId: string, optionId: string) => {
    setLocalBoard((prev) => ({
      ...prev,
      decisions: prev.decisions.map((d) => {
        if (d.id !== decisionId) return d;
        return {
          ...d,
          options: d.options.map((opt) => {
            const hasVoted = opt.voterIds.includes(currentUser.id);
            if (opt.id === optionId) {
              return {
                ...opt,
                voteCount: hasVoted ? opt.voteCount - 1 : opt.voteCount + 1,
                voterIds: hasVoted
                  ? opt.voterIds.filter((id) => id !== currentUser.id)
                  : [...opt.voterIds, currentUser.id],
              };
            } else if (hasVoted) {
              return {
                ...opt,
                voteCount: opt.voteCount - 1,
                voterIds: opt.voterIds.filter((id) => id !== currentUser.id),
              };
            }
            return opt;
          }),
        };
      }),
    }));
    if (onVote) {
      onVote(decisionId, optionId);
    }
  };

  const handleFinalizeDecision = (decisionId: string, optionId: string) => {
    setLocalBoard((prev) => ({
      ...prev,
      decisions: prev.decisions.map((d) =>
        d.id === decisionId ? { ...d, status: 'completed', finalizedOptionId: optionId } : d
      ),
    }));
    if (onFinalizeDecision) {
      onFinalizeDecision(decisionId, optionId);
    }
  };

  const handleReopenDecision = (decisionId: string) => {
    setLocalBoard((prev) => ({
      ...prev,
      decisions: prev.decisions.map((d) =>
        d.id === decisionId ? { ...d, status: 'open', finalizedOptionId: undefined } : d
      ),
    }));
    if (onReopenDecision) {
      onReopenDecision(decisionId);
    }
  };

  const handleParticipateFunDecider = (planId: string, option: string) => {
    setLocalBoard((prev) => ({
      ...prev,
      plans: prev.plans.map((p) =>
        p.id === planId ? { ...p, currentSelection: option } : p
      ),
    }));
    if (onParticipateFunDecider) {
      onParticipateFunDecider(planId, option);
    }
  };

  const handleReopenFunDecider = (planId: string) => {
    if (onReopenFunDecider) {
      onReopenFunDecider(planId);
    }
  };

  const handleFinalizeFunDecider = (planId: string, winningOption?: string) => {
    if (onFinalizeFunDecider) {
      onFinalizeFunDecider(planId, winningOption);
    }
  };

  const handleUndoFinalizeFunDecider = (planId: string) => {
    if (onUndoFinalizeFunDecider) {
      onUndoFinalizeFunDecider(planId);
    }
  };

  const handleUpdateParticipantStatus = (planId: string, memberId: string, optionId: string) => {
    setLocalBoard((prev) => ({
      ...prev,
      plans: prev.plans.map((p) => {
        if (p.id !== planId) return p;
        const currentStatuses = { ...(p.participantStatuses || {}) };
        const matchingOpt = p.statusOptions?.find((o) => o.id === optionId);
        currentStatuses[memberId] = {
          userId: memberId,
          userName: currentUser.name,
          userAvatar: currentUser.avatar,
          statusOptionId: optionId,
          statusLabel: matchingOpt?.label || 'Responded',
          updatedAt: 'Just now',
        };
        return {
          ...p,
          participantStatuses: currentStatuses,
        };
      }),
    }));
    if (onUpdateParticipantStatus) {
      onUpdateParticipantStatus(planId, memberId, optionId);
    }
  };

  const handleVolunteerForTask = (taskId: string, customAssigneeId?: string, customAssigneeName?: string) => {
    setLocalBoard((prev) => ({
      ...prev,
      plans: prev.plans.map((p) => {
        if (p.deciderItemId === taskId || p.id === taskId) {
          return {
            ...p,
            assigneeId: customAssigneeId || currentUser.id,
            assigneeName: customAssigneeName || currentUser.name,
          };
        }
        return p;
      }),
    }));
    if (onVolunteerForTask) {
      onVolunteerForTask(taskId, customAssigneeId, customAssigneeName);
    }
  };

  const handleToggleTaskComplete = (taskId: string) => {
    if (onToggleTaskComplete) {
      onToggleTaskComplete(taskId);
    }
  };

  const handleRemovePlan = (planId: string) => {
    setLocalBoard((prev) => ({
      ...prev,
      plans: prev.plans.filter((p) => p.id !== planId),
    }));
    if (onRemovePlan) {
      onRemovePlan(planId);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#1A1B25] selection:bg-amber-100 selection:text-amber-900 font-['Nunito']">
      
      {/* ========================================================
          TOP NAVIGATION BAR (Strict Top Bar Contract: 3 Zones)
          Zone 1: Single text element wordmark
          Zone 2: 4-6 clean text navigation links with hover underlines
          Zone 3: 1-2 primary actions
      ======================================================== */}
      <header 
        className={`sticky top-0 z-40 px-6 sm:px-12 py-3.5 sm:py-4 -mb-[72px] sm:-mb-[80px] transition-all duration-200 ${
          isScrolled 
            ? 'bg-white border-b border-[#ECEFF3] shadow-xs' 
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo Brand: Squadlink strictly matching reference image */}
          <div 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
            className="cursor-pointer select-none"
            title="Squadlink"
          >
            <SquadlinkLogo
              className="flex items-center gap-2.5"
              iconClassName={`w-6 h-6 sm:w-7 sm:h-7 transition-colors duration-200 ${
                isScrolled ? 'text-[#1A1B25]' : 'text-white'
              }`}
              textClassName={`text-xl sm:text-2xl font-black tracking-tight font-['Nunito'] transition-colors duration-200 ${
                isScrolled ? 'text-[#1A1B25]' : 'text-white'
              }`}
            />
          </div>

          {/* Action Button: Create Plan strictly matching reference image */}
          <div className="flex items-center gap-3">
            {hasBoards ? (
              <button
                type="button"
                onClick={onSeeBoards}
                style={
                  isScrolled
                    ? undefined
                    : { backgroundColor: 'rgba(26, 27, 37, 0.15)', color: '#FFFFFF' }
                }
                className={
                  isScrolled
                    ? "h-11 sm:h-12 px-6 sm:px-8 rounded-full font-bold text-sm sm:text-[15px] bg-[#1A1B25] hover:bg-[#272835] text-white active:scale-95 transition-all duration-200 cursor-pointer select-none shadow-xs flex items-center justify-center whitespace-nowrap font-['Nunito']"
                    : "w-[160px] h-[48px] rounded-full font-bold text-sm text-white hover:bg-[rgba(26,27,37,0.25)] active:scale-95 transition-all duration-200 cursor-pointer backdrop-blur-xs select-none shadow-none flex items-center justify-center whitespace-nowrap font-['Nunito']"
                }
              >
                See Boards
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenCreateBoard}
                style={
                  isScrolled
                    ? undefined
                    : { backgroundColor: 'rgba(26, 27, 37, 0.15)', color: '#FFFFFF' }
                }
                className={
                  isScrolled
                    ? "h-11 sm:h-12 px-6 sm:px-8 rounded-full font-bold text-sm sm:text-[15px] bg-[#1A1B25] hover:bg-[#272835] text-white active:scale-95 transition-all duration-200 cursor-pointer select-none shadow-xs flex items-center justify-center whitespace-nowrap font-['Nunito']"
                    : "w-[160px] h-[48px] rounded-full font-bold text-sm text-white hover:bg-[rgba(26,27,37,0.25)] active:scale-95 transition-all duration-200 cursor-pointer backdrop-blur-xs select-none shadow-none flex items-center justify-center whitespace-nowrap font-['Nunito']"
                }
              >
                Create Plan
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================
          1. HERO SECTION (Redesigned strictly per reference)
          - Gradient: #CD1D21 → #FDBF41
          - Button fill: #1A1B25 at 15% opacity, Button text: #FFFFFF
          - Component shown AFTER the button: exact existing DecisionsSection component
      ======================================================== */}
      <section 
        className="relative px-4 sm:px-8 pt-24 sm:pt-32 pb-16 sm:pb-24 overflow-hidden bg-gradient-to-r from-[#CD1D21] to-[#FDBF41]"
        style={{ background: 'linear-gradient(to right, #CD1D21 0%, #FDBF41 100%)' }}
      >
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">

          {/* Hero Main Headline */}
          <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-[130px] xl:text-[180px] font-black text-white tracking-tighter leading-[0.9] max-w-6xl mx-auto text-balance mb-4 sm:mb-6 uppercase">
            SQUADLINK
          </h1>

          {/* Hero Subtitle Description */}
          <p className="text-base sm:text-xl lg:text-[28px] text-white/95 max-w-3xl mx-auto font-normal leading-relaxed lg:leading-[1.4] mb-6 sm:mb-8">
            Plan together, explore options, vote, and decide what’s next — all in one place.
          </p>

          {/* Action Buttons: "Create Board" and "Join Plan" placed horizontally beside each other without vertical stacking */}
          <div className="flex flex-row items-center justify-center gap-3.5 mb-8 sm:mb-12">
            {hasBoards ? (
              <button
                type="button"
                onClick={onSeeBoards}
                style={{ backgroundColor: 'rgba(26, 27, 37, 0.15)', color: '#FFFFFF' }}
                className="w-[160px] h-[48px] rounded-full font-extrabold text-sm sm:text-base hover:bg-[rgba(26,27,37,0.25)] active:scale-95 transition cursor-pointer backdrop-blur-xs select-none shadow-none flex items-center justify-center whitespace-nowrap"
              >
                See Boards
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenCreateBoard}
                style={{ backgroundColor: 'rgba(26, 27, 37, 0.15)', color: '#FFFFFF' }}
                className="w-[160px] h-[48px] rounded-full font-extrabold text-sm sm:text-base hover:bg-[rgba(26,27,37,0.25)] active:scale-95 transition cursor-pointer backdrop-blur-xs select-none shadow-none flex items-center justify-center whitespace-nowrap"
              >
                Create Board
              </button>
            )}

            <button
              type="button"
              onClick={onOpenJoinBoard}
              style={{ backgroundColor: 'rgba(26, 27, 37, 0.15)', color: '#FFFFFF' }}
              className="w-[160px] h-[48px] rounded-full font-extrabold text-sm sm:text-base hover:bg-[rgba(26,27,37,0.25)] active:scale-95 transition cursor-pointer backdrop-blur-xs select-none shadow-none flex items-center justify-center whitespace-nowrap"
            >
              Join Plan
            </button>
          </div>

          {/* Decision Component: The exact existing DecisionsSection component directly after the button */}
          <div className="w-full max-w-2xl mx-auto [&_#decisions-section]:mb-0 [&_#decisions-section_p]:text-white/85">
            <DecisionsSection
              decisions={localBoard.decisions}
              plans={localBoard.plans}
              tasks={localBoard.tasks}
              currentPersona={currentUser}
              allMembers={localBoard.members}
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
              onOpenCreateItem={onOpenCreateBoard}
              onRemovePlan={handleRemovePlan}
            />
          </div>

        </div>
      </section>

      {/* ========================================================
          2. HOW IT WORKS SECTION
          Create a Board → Add Plans → Choose How to Decide → Everyone Participates → See the Final Decision
      ======================================================== */}
      <section id="how-it-works" className="px-4 sm:px-8 py-16 sm:py-24 bg-[#F8F9FB]">
        <div className="max-w-7xl mx-auto space-y-12">
          
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="text-xs font-extrabold text-[#808897] uppercase tracking-wider">
              Simple 5-Step Process
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1A1B25] tracking-tight">
              How Plan Board Works
            </h2>
            <p className="text-sm sm:text-base text-[#666D80] leading-relaxed">
              From the initial idea to the final confirmed plan, your group moves together with clarity and zero friction.
            </p>
          </div>

          {/* 5-Step Timeline Grid */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            
            {/* Step 1 */}
            <div className="bg-white rounded-3xl p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-[#F8F9FB] flex items-center justify-center text-lg font-extrabold text-[#1A1B25]">
                  01
                </div>
                <h3 className="text-base font-extrabold text-[#1A1B25]">
                  Create a Board
                </h3>
                <p className="text-xs text-[#666D80] leading-relaxed">
                  Start a board for your event — a birthday, trip, dinner, wedding, or game night.
                </p>
              </div>
              <div className="pt-2 text-xl">🎉</div>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-3xl p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-[#F8F9FB] flex items-center justify-center text-lg font-extrabold text-[#1A1B25]">
                  02
                </div>
                <h3 className="text-base font-extrabold text-[#1A1B25]">
                  Add Plans
                </h3>
                <p className="text-xs text-[#666D80] leading-relaxed">
                  Add the parts of the event: location, food, transport, budget, and activities.
                </p>
              </div>
              <div className="pt-2 text-xl">📍</div>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-3xl p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-[#F8F9FB] flex items-center justify-center text-lg font-extrabold text-[#1A1B25]">
                  03
                </div>
                <h3 className="text-base font-extrabold text-[#1A1B25]">
                  Choose Decider
                </h3>
                <p className="text-xs text-[#666D80] leading-relaxed">
                  Pick how to decide: Group Vote, Blind Pick, Wheel Spinner, or Attendance Check.
                </p>
              </div>
              <div className="pt-2 text-xl">🎲</div>
            </div>

            {/* Step 4 */}
            <div className="bg-white rounded-3xl p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-[#F8F9FB] flex items-center justify-center text-lg font-extrabold text-[#1A1B25]">
                  04
                </div>
                <h3 className="text-base font-extrabold text-[#1A1B25]">
                  Everyone Participates
                </h3>
                <p className="text-xs text-[#666D80] leading-relaxed">
                  Friends join via link without mandatory signup and cast votes or flip cards.
                </p>
              </div>
              <div className="pt-2 text-xl">👥</div>
            </div>

            {/* Step 5 */}
            <div className="bg-white rounded-3xl p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-[#F8F9FB] flex items-center justify-center text-lg font-extrabold text-[#1A1B25]">
                  05
                </div>
                <h3 className="text-base font-extrabold text-[#1A1B25]">
                  Final Decision
                </h3>
                <p className="text-xs text-[#666D80] leading-relaxed">
                  Outcome automatically locks in on deadline, updating the board source of truth.
                </p>
              </div>
              <div className="pt-2 text-xl">🏆</div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================
          BUILT FOR GROUPS
          Members can join through a shared link and participate
          without needing to create their own board.
      ======================================================== */}
      <section id="built-for-groups" className="px-4 sm:px-8 py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="text-xs font-extrabold text-[#808897] uppercase tracking-wider">
              Zero Signup Roadblocks
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1A1B25] tracking-tight">
              Built for Groups & Shared Links
            </h2>
            <p className="text-sm sm:text-base text-[#666D80] leading-relaxed">
              When you share a board link with your group, your friends don't have to fill out registration forms or create an account to participate.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1 */}
            <div className="bg-[#F8F9FB] rounded-3xl p-6 sm:p-7 space-y-4 shadow-none">
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-2xl shadow-2xs">
                🔗
              </div>
              <h3 className="text-lg font-extrabold text-[#1A1B25]">
                One Shared Link
              </h3>
              <p className="text-xs sm:text-sm text-[#666D80] leading-relaxed">
                Drop your board link in WhatsApp, Telegram, or iMessage. Anyone with the link enters immediately.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-[#F8F9FB] rounded-3xl p-6 sm:p-7 space-y-4 shadow-none">
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-2xl shadow-2xs">
                🎭
              </div>
              <h3 className="text-lg font-extrabold text-[#1A1B25]">
                Custom Name & Avatar
              </h3>
              <p className="text-xs sm:text-sm text-[#666D80] leading-relaxed">
                Guests choose their display name and board avatar in 10 seconds, then start voting and participating.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-[#F8F9FB] rounded-3xl p-6 sm:p-7 space-y-4 shadow-none">
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-2xl shadow-2xs">
                🛡️
              </div>
              <h3 className="text-lg font-extrabold text-[#1A1B25]">
                Organizer Controls
              </h3>
              <p className="text-xs sm:text-sm text-[#666D80] leading-relaxed">
                The board creator stays in control to finalize choices, edit plans, assign tasks, or reopen votes as host.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================
          7. FINAL CTA
          Simple conversion section:
          “Have something to decide?”
          - Create a Board
          - Join a Board
      ======================================================== */}
      <section className="px-4 sm:px-8 py-20 sm:py-28 bg-[#1A1B25] text-white text-center">
        <div className="max-w-3xl mx-auto space-y-7">
          
          <span className="text-4xl" role="img" aria-label="Celebrate">
            🎉
          </span>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Have something to decide?
          </h2>

          <p className="text-base sm:text-lg text-gray-300 max-w-xl mx-auto leading-relaxed font-normal">
            Start a board for your friends in seconds, attach your plans, and reach the final decision together.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-3">
            {hasBoards ? (
              <button
                type="button"
                onClick={onSeeBoards}
                className="w-full sm:w-auto px-9 py-4.5 rounded-full bg-white text-[#1A1B25] hover:bg-gray-100 font-black text-sm sm:text-base transition cursor-pointer shadow-sm active:scale-[0.99] flex items-center justify-center gap-2"
              >
                <span>See Boards</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenCreateBoard}
                className="w-full sm:w-auto px-9 py-4.5 rounded-full bg-white text-[#1A1B25] hover:bg-gray-100 font-black text-sm sm:text-base transition cursor-pointer shadow-sm active:scale-[0.99] flex items-center justify-center gap-2"
              >
                <span>Create a Board</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}

            <button
              type="button"
              onClick={onOpenJoinBoard}
              className="w-full sm:w-auto px-8 py-4.5 rounded-full bg-[#272835] hover:bg-[#353849] text-white font-bold text-sm sm:text-base transition cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Join a Board</span>
              <Users className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          <p className="text-xs text-gray-400 pt-2 font-medium">
            Hosts log in or create an account to save boards · Friends join and participate freely via link.
          </p>

        </div>
      </section>

      {/* ========================================================
          QUIET FOOTER
      ======================================================== */}
      <footer className="border-t border-[#ECEFF3] px-6 sm:px-12 py-8 bg-white text-xs text-[#808897]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-[#1A1B25]">
            <span>📋</span>
            <span>Plan Board</span>
            <span className="text-[#808897] font-normal">· Collaborative event planning and decision platform</span>
          </div>

          <div className="flex items-center gap-6 font-semibold">
            <button
              type="button"
              onClick={() => scrollToSection('how-it-works')}
              className="hover:text-[#1A1B25] transition"
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('built-for-groups')}
              className="hover:text-[#1A1B25] transition"
            >
              Built for Groups
            </button>
            {hasBoards ? (
              <button
                type="button"
                onClick={onSeeBoards}
                className="hover:text-[#1A1B25] transition font-bold"
              >
                See Boards
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenCreateBoard}
                className="hover:text-[#1A1B25] transition font-bold"
              >
                Create Board
              </button>
            )}
          </div>
        </div>
      </footer>

    </div>
  );
};
