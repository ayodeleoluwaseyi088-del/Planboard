export type MemberRole = 'owner' | 'admin' | 'member';

export interface BoardMember {
  id: string;
  name: string;
  avatar: string;
  role: MemberRole;
  responsibility?: string;
  isCurrentUser?: boolean;
}

export type ItemType = 'decision' | 'suggestion' | 'task' | 'contribution' | 'information';
export type ItemPriority = 'required' | 'important' | 'optional';
export type ItemStatus = 'open' | 'in_progress' | 'completed' | 'fixed';

export interface DecisionOption {
  id: string;
  label: string;
  emoji?: string;
  voteCount: number;
  voterIds: string[];
}

export interface DecisionItem {
  id: string;
  type: 'decision';
  title: string;
  category: string; // e.g. "🥤 DRINKS", "🍗 FOOD"
  question: string;
  options: DecisionOption[];
  totalVotesNeeded: number;
  deadlineText: string;
  priority: ItemPriority;
  status: ItemStatus;
  finalDecision?: string; // Set when owner finalizes
  gamifiedNote?: string; // e.g. "Coke is currently winning 👀"
  createdBy: string;
  deciderItemId?: string;
  planId?: string;
  isReopened?: boolean;
  decisionRound?: number;
  reopenedAt?: string;
}

export interface ImagePosition {
  x: number; // 0 to 100 percentage (50 = centered)
  y: number; // 0 to 100 percentage (50 = centered)
  scale?: number; // optional zoom factor >= 1.0 (default 1)
}

export interface SuggestionImageItem {
  id: string;
  url: string;
  position?: ImagePosition;
  title?: string;
}

export interface SuggestionItem {
  id: string;
  type: 'suggestion';
  title: string;
  category: string; // e.g. "📍 LOCATION"
  description: string;
  imageUrl: string;
  imagePosition?: ImagePosition;
  images?: SuggestionImageItem[]; // Grouped images belonging to this single visual suggestion
  authorId: string;
  authorName: string;
  heartCount: number;
  heartedByMemberIds: string[];
  isSelectedWinner?: boolean;
  isPutUpForVote?: boolean;
  status: ItemStatus;
  priority: ItemPriority;
  deciderItemId?: string;
  planId?: string; // ID of the Plan this suggestion is locked to
  planTitle?: string; // Title of the Plan (e.g. "Location", "Music")
  planEmoji?: string; // Emoji of the Plan (e.g. "📍", "🎵")
}

export interface TaskItem {
  id: string;
  type: 'task';
  title: string;
  category: string; // e.g. "🎵 MUSIC", "🚗 TRANSPORTATION"
  description?: string;
  assigneeId?: string;
  assigneeName?: string;
  status: ItemStatus;
  priority: ItemPriority;
  deadlineText?: string;
  deciderItemId?: string;
  planId?: string;
}

export interface ContributionItem {
  id: string;
  type: 'contribution';
  title: string;
  category: string; // e.g. "💰 PAYMENT", "🎂 CAKE"
  targetAmount?: number;
  currentAmount?: number;
  currency?: string;
  contributorsPaid: string[]; // member IDs
  totalContributorsNeeded: number;
  status: ItemStatus;
  priority: ItemPriority;
  deadlineText?: string;
  deciderItemId?: string;
  planId?: string;
}

export interface InformationItem {
  id: string;
  type: 'information';
  title: string;
  category: string; // e.g. "📅 DATE", "📍 MEETING POINT", "👔 DRESS CODE"
  value: string;
  fixedBy: string;
  status: 'fixed';
  priority: ItemPriority;
  deciderItemId?: string;
  planId?: string;
}

export interface TimelineEntry {
  id: string;
  time: string;
  dateTime?: string; // ISO 8601 machine-readable timestamp
  title: string;
  location?: string;
  details?: string;
}

export interface ActivityLog {
  id: string;
  actorName: string;
  actorAvatar: string;
  actionText: string;
  timeAgo: string;
  badgeEmoji?: string;
}

export type PlanStatus = 'active' | 'confirmed' | 'draft' | 'optional';

export type DeciderType = 
  | 'voting' 
  | 'fixed_info' 
  | 'task_duty' 
  | 'photo_idea' 
  | 'participant_status'
  | 'wheel_spinner'
  | 'blind_pick';

export interface ParticipantStatusOption {
  id: string;
  label: string;
  emoji?: string;
  color?: string;
}

export interface ParticipantUserStatus {
  userId: string;
  userName: string;
  userAvatar?: string;
  statusOptionId?: string;
  statusLabel?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface ParticipantFunSelection {
  userId: string;
  userName: string;
  userAvatar?: string;
  option: string;
  selectedAt: string;
}

export interface PlanSnapshot {
  currentSelection?: string;
  initialSelection?: string;
  previousSelection?: string;
  location?: string;
  imageUrl?: string;
  imagePosition?: ImagePosition;
  images?: SuggestionImageItem[];
  ideaDesc?: string;
  description?: string;
  infoValue?: string;
  finalDecision?: string;
  status?: PlanStatus;
  isSelectedWinner?: boolean;
  decidedSource?: 'voting' | 'suggestion' | 'fixed_info' | 'task_duty' | 'manual' | 'wheel_spinner' | 'blind_pick';
  decidedAt?: string;
}

export interface AttachedPlan {
  id: string;
  title: string;
  emoji: string;
  category: string; // e.g. "Location", "Drinks", "Music", "Food", "Theme", "Gift", "Transportation", etc.
  deciderType: DeciderType;
  description?: string;
  
  // Link to section item ID
  deciderItemId?: string;

  // Real-Time Plan State (Single Source of Truth)
  currentSelection?: string;
  initialSelection?: string;
  previousSelection?: string;
  decidedSource?: 'voting' | 'suggestion' | 'fixed_info' | 'task_duty' | 'manual' | 'wheel_spinner' | 'blind_pick';
  decidedAt?: string;

  // Reversible Suggestion Snapshot State
  appliedSuggestionId?: string;
  previousPlanSnapshot?: PlanSnapshot;

  // Decider 1: Voting
  question?: string;
  options?: DecisionOption[];
  deadlineText?: string;
  totalVotesNeeded?: number;
  finalDecision?: string;

  // Decider 2: Fixed Info
  infoValue?: string;
  fixedBy?: string;

  // Decider 3: Task / Duty
  taskDesc?: string;
  assigneeId?: string;
  assigneeName?: string;

  // Decider 4: Photo / Idea
  ideaDesc?: string;
  imageUrl?: string;
  imagePosition?: ImagePosition;
  images?: SuggestionImageItem[];
  heartCount?: number;
  heartedByMemberIds?: string[];
  isSelectedWinner?: boolean;

  // Decider 5: Participant Status (Check-in / Attendance / Payment / Custom status)
  statusQuestion?: string;
  statusOptions?: ParticipantStatusOption[];
  participantStatuses?: Record<string, ParticipantUserStatus>;

  // Deciders 6 & 7: Fun Deciders (Wheel Spinner & Blind Pick)
  spinnerOptions?: string[]; // Segments / cards to pick from
  spinnerQuestion?: string; // Optional custom question
  wheelWinningOption?: string; // Currently chosen winner
  wheelLastSpunAt?: string; // Timestamp when wheel was last spun
  participantSelections?: Record<string, ParticipantFunSelection>; // Individual participant choices (one per participant)
  decisionRound?: number; // Current decision round (e.g. 1, 2)
  isReopened?: boolean; // True if an admin/owner intentionally reopened the decision
  reopenedAt?: string;
  totalParticipantsNeeded?: number; // Total eligible participants needed to finalize (defaults to member count)

  // Plan Details (optional fallback)
  date?: string;
  time?: string;
  dateTime?: string; // ISO 8601 machine-readable timestamp (e.g. "2026-08-20T19:00:00")
  endDateTime?: string; // optional ISO 8601 end timestamp for time ranges
  hasSpecificTime?: boolean; // true if an exact time was chosen, false for date-only
  location?: string;
  estimatedCost?: string;
  status: PlanStatus;
  priority?: ItemPriority;
  isPrimary?: boolean;
}

export type BoardPlan = AttachedPlan;

export type BoardState = 'new' | 'planning' | 'almost_ready' | 'ready' | 'event_day' | 'completed';

export interface PlanBoard {
  id: string;
  title: string;
  emoji: string;
  coverImage: string;
  coverImagePosition?: ImagePosition;
  date?: string;
  time?: string;
  dateTime?: string; // ISO 8601 machine-readable timestamp
  endDateTime?: string;
  hasSpecificTime?: boolean;
  daysToGo?: number;
  state: BoardState;
  ownerId: string;
  ownerName: string;
  description: string;
  members: BoardMember[];
  
  // Attached Plans on this Board
  plans: AttachedPlan[];

  // Sections
  decisions: DecisionItem[];
  suggestions: SuggestionItem[];
  tasks: TaskItem[];
  contributions: ContributionItem[];
  information: InformationItem[];
  timeline: TimelineEntry[];
  recentActivities: ActivityLog[];
}

export interface UserPersona {
  id: string;
  name: string;
  avatar: string;
  role: MemberRole;
  email?: string;
  isGuest?: boolean;
}

export type BoardSectionTab = 'overview' | 'plan' | 'decisions' | 'suggestions' | 'people_timeline';
