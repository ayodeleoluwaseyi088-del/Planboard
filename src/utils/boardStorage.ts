import { PlanBoard, UserPersona } from '../types';
import { INITIAL_BOARD, USER_PERSONAS } from '../mockData';

const BOARDS_STORAGE_KEY = 'planboard_user_boards_v4';
const ACTIVE_BOARD_ID_KEY = 'planboard_active_board_id_v4';
const AUTH_USER_KEY = 'planboard_auth_user_v4';

/**
 * Retrieves all real user boards stored in persistent localStorage.
 * Initializes with INITIAL_BOARD (Seyi's board) if no storage exists yet.
 */
export function getAllStoredBoards(): PlanBoard[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [INITIAL_BOARD];
  }

  try {
    const raw = window.localStorage.getItem(BOARDS_STORAGE_KEY);
    if (!raw) {
      // First-time initialization with the user's primary board
      const initial = [INITIAL_BOARD];
      window.localStorage.setItem(BOARDS_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }

    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }

    // Fallback if empty array
    const fallback = [INITIAL_BOARD];
    window.localStorage.setItem(BOARDS_STORAGE_KEY, JSON.stringify(fallback));
    return fallback;
  } catch (err) {
    console.error('Failed to parse boards from localStorage:', err);
    return [INITIAL_BOARD];
  }
}

/**
 * Saves or updates a single board in the persistent store.
 */
export function saveBoard(board: PlanBoard): void {
  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    const all = getAllStoredBoards();
    const existingIndex = all.findIndex((b) => b.id === board.id);

    let updated: PlanBoard[];
    if (existingIndex >= 0) {
      updated = [...all];
      updated[existingIndex] = board;
    } else {
      updated = [board, ...all];
    }

    window.localStorage.setItem(BOARDS_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save board to localStorage:', err);
  }
}

/**
 * Overwrites all stored boards in the persistent store.
 */
export function saveAllStoredBoards(boards: PlanBoard[]): void {
  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    window.localStorage.setItem(BOARDS_STORAGE_KEY, JSON.stringify(boards));
  } catch (err) {
    console.error('Failed to save all boards to localStorage:', err);
  }
}

/**
 * Deletes a board by ID from persistent storage.
 */
export function deleteStoredBoard(boardId: string): PlanBoard[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];

  try {
    const all = getAllStoredBoards();
    const filtered = all.filter((b) => b.id !== boardId);
    window.localStorage.setItem(BOARDS_STORAGE_KEY, JSON.stringify(filtered));
    return filtered;
  } catch (err) {
    console.error('Failed to delete board from localStorage:', err);
    return [];
  }
}

/**
 * Identifies whether a board is the hardcoded initial mock/dummy template.
 */
export function isDummyBoard(board: PlanBoard | Partial<PlanBoard>): boolean {
  return (
    board.id === INITIAL_BOARD.id ||
    board.id === 'board-seyis-birthday-2026' ||
    board.id === 'board-seyis-birthday' ||
    board.id === 'board-tarkwa-getaway' ||
    board.id === 'board-lagos-dinner'
  );
}

/**
 * Returns only real boards that were actually created by users,
 * strictly filtering out any hardcoded dummy/mock boards.
 */
export function getActualUserBoards(): PlanBoard[] {
  const allBoards = getAllStoredBoards();
  return allBoards.filter((b) => !isDummyBoard(b));
}

/**
 * Filters the user's actual boards based on the authenticated persona.
 * Returns real boards created by the user and boards joined by the user.
 * Strictly no dummy/placeholder data!
 */
export function getUserBoards(user: UserPersona): {
  created: PlanBoard[];
  joined: PlanBoard[];
  all: PlanBoard[];
} {
  const allBoards = getAllStoredBoards();
  const userId = user.id;
  const userNameLower = user.name.trim().toLowerCase();

  const created: PlanBoard[] = [];
  const joined: PlanBoard[] = [];

  for (const b of allBoards) {
    // CRITICAL: Filter out hardcoded dummy/mock board data so only real user boards are displayed!
    if (isDummyBoard(b)) {
      continue;
    }

    const isOwner =
      b.ownerId === userId ||
      (Boolean(b.ownerName) && b.ownerName.trim().toLowerCase() === userNameLower) ||
      b.members?.some(
        (m) =>
          (m.id === userId || (Boolean(m.name) && m.name.trim().toLowerCase() === userNameLower)) &&
          m.role === 'owner'
      );

    if (isOwner) {
      created.push(b);
    } else {
      const isMember = b.members?.some(
        (m) =>
          m.id === userId ||
          (Boolean(m.name) && m.name.trim().toLowerCase() === userNameLower)
      );
      if (isMember) {
        joined.push(b);
      }
    }
  }

  // If a user has created boards, those come first, followed by joined boards
  const all = [...created, ...joined];

  return { created, joined, all };
}

/**
 * Gets the last active board ID from storage.
 */
export function getActiveBoardId(): string | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  return window.localStorage.getItem(ACTIVE_BOARD_ID_KEY);
}

/**
 * Saves the active board ID in storage.
 */
export function saveActiveBoardId(boardId: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  window.localStorage.setItem(ACTIVE_BOARD_ID_KEY, boardId);
}

/**
 * Gets the currently authenticated user persona from storage,
 * defaulting to Seyi (USER_PERSONAS[0]).
 */
export function getStoredAuthUser(): UserPersona {
  if (typeof window === 'undefined' || !window.localStorage) {
    return USER_PERSONAS[0];
  }

  try {
    const raw = window.localStorage.getItem(AUTH_USER_KEY);
    if (!raw) {
      const defaultUser = USER_PERSONAS[0];
      window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(defaultUser));
      return defaultUser;
    }
    const parsed = JSON.parse(raw);
    if (parsed && parsed.id && parsed.name) {
      return parsed;
    }
    return USER_PERSONAS[0];
  } catch {
    return USER_PERSONAS[0];
  }
}

/**
 * Saves the currently authenticated user persona in storage.
 */
export function saveStoredAuthUser(user: UserPersona): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  } catch (err) {
    console.error('Failed to save auth user to localStorage:', err);
  }
}
