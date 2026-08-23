/**
 * Durable queue for shopping-list check-offs made while offline.
 *
 * Ticking items off is the one thing people do standing in a supermarket,
 * which is exactly where signal is worst. Before this existed, an offline
 * toggle updated local state only and the next refetch silently reverted it.
 *
 * Only the checked flag is queued. Deletes and quantity edits still fail loudly
 * with a toast when offline, which is annoying but never loses data.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiError, apiService } from './api';
import { ShoppingListItem } from '../types/api';

const PENDING_CHECKS_KEY = '@RecipeWizard:shoppingListPendingChecks';

/** itemId -> the checked state the user last chose for it. */
type PendingChecks = Record<string, boolean>;

async function load(): Promise<PendingChecks> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_CHECKS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

async function save(pending: PendingChecks): Promise<void> {
  try {
    if (Object.keys(pending).length === 0) {
      await AsyncStorage.removeItem(PENDING_CHECKS_KEY);
    } else {
      await AsyncStorage.setItem(PENDING_CHECKS_KEY, JSON.stringify(pending));
    }
  } catch {
    // A failed write means this toggle won't survive a cold start. The
    // in-memory state is still correct, so there's nothing useful to tell
    // the user here.
  }
}

/**
 * Record a check-off that hasn't reached the server. Keyed by item, so
 * toggling the same item repeatedly collapses to its final state.
 */
export async function queueCheck(itemId: string, isChecked: boolean): Promise<void> {
  const pending = await load();
  pending[itemId] = isChecked;
  await save(pending);
}

async function forget(itemId: string): Promise<void> {
  const pending = await load();
  if (itemId in pending) {
    delete pending[itemId];
    await save(pending);
  }
}

export async function hasPendingChecks(): Promise<boolean> {
  return Object.keys(await load()).length > 0;
}

/**
 * Overlay queued check-offs onto a list fetched from the server, so a refetch
 * never appears to undo work that simply hasn't synced yet.
 */
export async function applyPendingChecks(items: ShoppingListItem[]): Promise<ShoppingListItem[]> {
  const pending = await load();
  if (Object.keys(pending).length === 0) return items;

  return items.map(item =>
    item.id in pending ? { ...item, isChecked: pending[item.id] } : item
  );
}

/**
 * Replay queued check-offs against the server. Returns true if anything was
 * sent, so the caller knows whether a refetch is worthwhile.
 *
 * Stops at the first network failure and leaves the rest queued — a flush that
 * can't reach the server shouldn't burn through the whole queue retrying.
 */
export async function flushPendingChecks(): Promise<boolean> {
  const pending = await load();
  const itemIds = Object.keys(pending);
  if (itemIds.length === 0) return false;

  let sentAnything = false;

  for (const itemId of itemIds) {
    try {
      await apiService.updateShoppingListItem(itemId, pending[itemId]);
      await forget(itemId);
      sentAnything = true;
    } catch (error) {
      // The item is gone server-side (deleted on another device, or the whole
      // list was cleared) — the queued toggle can never apply, so drop it.
      if (error instanceof ApiError && error.status === 404) {
        await forget(itemId);
        continue;
      }
      // Anything else is treated as "still offline": keep the remainder.
      break;
    }
  }

  return sentAnything;
}

/** Drop the queue entirely — used when the list it referred to is gone. */
export async function clearPendingChecks(): Promise<void> {
  await save({});
}
