import { PlanBoard, UserPersona } from '../types';
import { INITIAL_BOARD, SARAH_WEDDING_BOARD, USER_PERSONAS } from '../mockData';

const BOARDS_STORAGE_KEY = 'planboard_user_boards_v4';
const ACTIVE_BOARD_ID_KEY = 'planboard_active_board_id_v4';
const AUTH_USER_KEY = 'planboard_auth_user_v4';

// In-memory runtime cache to ensure uninterrupted app state even if localStorage quota is exceeded
let inMemoryBoardsCache: PlanBoard[] | null = null;
let inMemoryActiveBoardId: string | null = null;
let inMemoryAuthUser: UserPersona | null = null;

/**
 * Cleans up stale legacy storage keys from previous applet versions to free up quota.
 */
function cleanLegacyStorage(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && (
        (key.startsWith('planboard_') && !key.endsWith('_v4')) ||
        key.startsWith('planboard_backup_') ||
        key.startsWith('pb_temp_')
      )) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => {
      try {
        window.localStorage.removeItem(k);
      } catch {
        // Ignore
      }
    });
  } catch {
    // Ignore error
  }
}

/**
 * Sanitizes board data to prevent localStorage quota exhaustion.
 * - Caps maximum number of stored boards to 10 (most recent first).
 * - For older, non-active boards, limits oversized base64 data URLs (> 80KB)
 *   while preserving valid web URLs.
 */
function sanitizeBoardsForStorage(boards: PlanBoard[], activeId?: string): PlanBoard[] {
  // Keep up to 8 most recently updated boards
  const trimmedBoards = boards.slice(0, 8);

  return trimmedBoards.map((b) => {
    // Active board is preserved with high fidelity
    const isActive = activeId ? b.id === activeId : false;

    let coverImage = b.coverImage;
    if (!isActive && coverImage && coverImage.startsWith('data:image/') && coverImage.length > 80000) {
      coverImage = INITIAL_BOARD.coverImage;
    }

    return {
      ...b,
      coverImage,
      suggestions: b.suggestions?.map((sug) => {
        let imageUrl = sug.imageUrl;
        // If image is a massive uncompressed data URL (> 80KB) in older boards
        if (!isActive && imageUrl && imageUrl.startsWith('data:image/') && imageUrl.length > 80000) {
          imageUrl = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80';
        }

        const images = sug.images?.map((img) => {
          if (!isActive && img.url && img.url.startsWith('data:image/') && img.url.length > 80000) {
            return {
              ...img,
              url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
            };
          }
          return img;
        });

        return {
          ...sug,
          imageUrl,
          images,
        };
      }),
    };
  });
}

/**
 * Safely writes data to storage with multiple fallback recovery tiers.
 */
function safeSetStorageItem(key: string, boards: PlanBoard[]): boolean {
  if (typeof window === 'undefined') return false;

  // Always keep in-memory cache up to date
  inMemoryBoardsCache = boards;

  // Tier 1: Try direct localStorage write
  try {
    if (window.localStorage) {
      window.localStorage.setItem(key, JSON.stringify(boards));
      return true;
    }
  } catch (err: unknown) {
    const errorMsg = String(err);
    const isQuotaError =
      errorMsg.includes('quota') ||
      errorMsg.includes('QuotaExceeded') ||
      (err instanceof DOMException && (err.name === 'QuotaExceededError' || err.code === 22));

    if (isQuotaError) {
      // Tier 2: Cleanup legacy storage and retry with sanitized/compressed boards
      try {
        cleanLegacyStorage();
        const activeId = getActiveBoardId() || boards[0]?.id;
        const sanitized = sanitizeBoardsForStorage(boards, activeId);
        window.localStorage.setItem(key, JSON.stringify(sanitized));
        inMemoryBoardsCache = sanitized;
        return true;
      } catch {
        // Tier 3: If still failing, try saving only the current active board
        try {
          const activeId = getActiveBoardId() || boards[0]?.id;
          const onlyActive = boards.filter((b) => b.id === activeId);
          if (onlyActive.length > 0) {
            window.localStorage.setItem(key, JSON.stringify(onlyActive));
            return true;
          }
        } catch {
          // Tier 4: Fallback to sessionStorage
          try {
            if (window.sessionStorage) {
              window.sessionStorage.setItem(key, JSON.stringify(boards));
              return true;
            }
          } catch {
            // Memory-only fallback remains active
          }
        }
      }
    }
  }

  return false;
}

/**
 * Retrieves all real user boards stored in persistent localStorage.
 * Initializes with INITIAL_BOARD (Seyi's board) if no storage exists yet.
 */
export function getAllStoredBoards(): PlanBoard[] {
  if (inMemoryBoardsCache && inMemoryBoardsCache.length > 0) {
    return inMemoryBoardsCache;
  }

  if (typeof window === 'undefined') {
    return [INITIAL_BOARD];
  }

  // Initial cleanup of old version remnants once
  cleanLegacyStorage();

  try {
    let raw: string | null = null;
    if (window.localStorage) {
      raw = window.localStorage.getItem(BOARDS_STORAGE_KEY);
    }
    if (!raw && window.sessionStorage) {
      raw = window.sessionStorage.getItem(BOARDS_STORAGE_KEY);
    }

    if (!raw) {
      // First-time initialization with the user's primary boards
      const initial = [INITIAL_BOARD, SARAH_WEDDING_BOARD];
      safeSetStorageItem(BOARDS_STORAGE_KEY, initial);
      inMemoryBoardsCache = initial;
      return initial;
    }

    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Ensure SARAH_WEDDING_BOARD is present alongside INITIAL_BOARD if not already saved
      const hasSarah = parsed.some((b: PlanBoard) => b.id === SARAH_WEDDING_BOARD.id);
      const combined = hasSarah ? parsed : [...parsed, SARAH_WEDDING_BOARD];
      inMemoryBoardsCache = combined;
      return combined;
    }

    // Fallback if empty array
    const fallback = [INITIAL_BOARD, SARAH_WEDDING_BOARD];
    safeSetStorageItem(BOARDS_STORAGE_KEY, fallback);
    inMemoryBoardsCache = fallback;
    return fallback;
  } catch (err) {
    console.warn('Recovered from invalid boards storage data:', err);
    inMemoryBoardsCache = [INITIAL_BOARD, SARAH_WEDDING_BOARD];
    return [INITIAL_BOARD, SARAH_WEDDING_BOARD];
  }
}

/**
 * Saves or updates a single board in the persistent store.
 */
export function saveBoard(board: PlanBoard): void {
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

    safeSetStorageItem(BOARDS_STORAGE_KEY, updated);
  } catch (err) {
    console.warn('Recovered board state in memory cache:', err);
  }
}

/**
 * Overwrites all stored boards in the persistent store.
 */
export function saveAllStoredBoards(boards: PlanBoard[]): void {
  try {
    safeSetStorageItem(BOARDS_STORAGE_KEY, boards);
  } catch (err) {
    console.warn('Recovered all boards in memory cache:', err);
  }
}

/**
 * Deletes a board by ID from persistent storage.
 */
export function deleteStoredBoard(boardId: string): PlanBoard[] {
  try {
    const all = getAllStoredBoards();
    const filtered = all.filter((b) => b.id !== boardId);
    safeSetStorageItem(BOARDS_STORAGE_KEY, filtered);
    return filtered;
  } catch (err) {
    console.warn('Recovered board deletion in memory cache:', err);
    return [];
  }
}

/**
 * Identifies whether a board is the hardcoded initial mock/dummy template.
 */
export function isDummyBoard(board: PlanBoard | Partial<PlanBoard>): boolean {
  return (
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
    // Filter out hardcoded dummy/mock board data so only real user boards are displayed!
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

  const all = [...created, ...joined];
  return { created, joined, all };
}

/**
 * Gets the last active board ID from storage.
 */
export function getActiveBoardId(): string | null {
  if (inMemoryActiveBoardId) return inMemoryActiveBoardId;
  if (typeof window === 'undefined') return null;

  try {
    if (window.localStorage) {
      const val = window.localStorage.getItem(ACTIVE_BOARD_ID_KEY);
      if (val) {
        inMemoryActiveBoardId = val;
        return val;
      }
    }
    if (window.sessionStorage) {
      const val = window.sessionStorage.getItem(ACTIVE_BOARD_ID_KEY);
      if (val) {
        inMemoryActiveBoardId = val;
        return val;
      }
    }
  } catch {
    // Ignore
  }
  return null;
}

/**
 * Saves the active board ID in storage.
 */
export function saveActiveBoardId(boardId: string): void {
  inMemoryActiveBoardId = boardId;
  if (typeof window === 'undefined') return;

  try {
    if (window.localStorage) {
      window.localStorage.setItem(ACTIVE_BOARD_ID_KEY, boardId);
    }
  } catch {
    try {
      if (window.sessionStorage) {
        window.sessionStorage.setItem(ACTIVE_BOARD_ID_KEY, boardId);
      }
    } catch {
      // Memory cache is maintained
    }
  }
}

/**
 * Gets the currently authenticated user persona from storage,
 * defaulting to Seyi (USER_PERSONAS[0]).
 */
export function getStoredAuthUser(): UserPersona {
  if (inMemoryAuthUser) return inMemoryAuthUser;
  if (typeof window === 'undefined') {
    return USER_PERSONAS[0];
  }

  try {
    let raw: string | null = null;
    if (window.localStorage) {
      raw = window.localStorage.getItem(AUTH_USER_KEY);
    }
    if (!raw && window.sessionStorage) {
      raw = window.sessionStorage.getItem(AUTH_USER_KEY);
    }

    if (!raw) {
      const defaultUser = USER_PERSONAS[0];
      saveStoredAuthUser(defaultUser);
      inMemoryAuthUser = defaultUser;
      return defaultUser;
    }
    const parsed = JSON.parse(raw);
    if (parsed && parsed.id && parsed.name) {
      inMemoryAuthUser = parsed;
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
  inMemoryAuthUser = user;
  if (typeof window === 'undefined') return;

  try {
    if (window.localStorage) {
      window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    }
  } catch {
    try {
      if (window.sessionStorage) {
        window.sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      }
    } catch {
      // Memory cache is maintained
    }
  }
}
