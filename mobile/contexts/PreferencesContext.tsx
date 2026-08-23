import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { PreferencesService } from '../services/preferences';
import {
  UserPreferences,
  DEFAULT_USER_PREFERENCES,
} from '../types/api';

const STORAGE_KEY = '@recipe_wizard_preferences';
const AUTOSAVE_DELAY_MS = 800;

/**
 * Keys holding a string[] that the settings screens edit as a set.
 */
export type PreferenceListKey = keyof Pick<
  UserPreferences,
  'dietaryRestrictions' | 'allergens' | 'dislikes' | 'groceryCategories'
>;

interface PreferencesContextType {
  preferences: UserPreferences;
  loading: boolean;
  /** True while a debounced write is in flight. */
  saving: boolean;
  lastSaved: Date | null;
  setPreference: <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => void;
  toggleListItem: (key: PreferenceListKey, item: string) => void;
  addListItem: (key: PreferenceListKey, item: string) => void;
  removeListItem: (key: PreferenceListKey, item: string) => void;
  reorderList: (key: PreferenceListKey, from: number, to: number) => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(
  undefined
);

/**
 * Single in-memory source of truth for user preferences, shared by the profile
 * hub and every `app/settings/*` sub-screen.
 *
 * Sub-screens used to be sections of one giant profile screen, so they shared
 * state implicitly. Now that they're separate routes, holding the state here
 * avoids the whole class of "navigate back before the debounced write flushed
 * and read a stale value off AsyncStorage" bugs.
 */
export function PreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [preferences, setPreferences] = useState<UserPreferences>({
    ...DEFAULT_USER_PREFERENCES,
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      // Don't leave a pending write to fire against an unmounted tree.
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored && !cancelled) {
          setPreferences({
            ...DEFAULT_USER_PREFERENCES,
            ...JSON.parse(stored),
            updatedAt: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error('Failed to load preferences:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }

      // Pull the latest from the backend without blocking first render. No-op
      // when offline or unauthenticated.
      try {
        const synced = await PreferencesService.syncFromBackend();
        if (synced && !cancelled) setPreferences(synced);
      } catch {
        /* local copy stands */
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback(async (next: UserPreferences) => {
    try {
      if (isMounted.current) setSaving(true);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      if (isMounted.current) setLastSaved(new Date());

      // Mirror to the backend so preferences survive reinstall and sync across
      // devices. Fire-and-forget — the local write is the source of truth here.
      PreferencesService.saveToBackend(next).catch(() => {});
    } catch (error) {
      console.error('Failed to save preferences:', error);
    } finally {
      if (isMounted.current) setSaving(false);
    }
  }, []);

  /**
   * Applies `mutate` to the current preferences and schedules a debounced
   * write. Reads state via the updater form so rapid successive edits (holding
   * a drag, tapping several checkboxes) can't clobber one another.
   */
  const update = useCallback(
    (mutate: (prev: UserPreferences) => UserPreferences) => {
      setPreferences((prev) => {
        const next = { ...mutate(prev), updatedAt: new Date().toISOString() };

        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => persist(next), AUTOSAVE_DELAY_MS);

        return next;
      });
    },
    [persist]
  );

  const setPreference = useCallback(
    <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
      update((prev) => ({ ...prev, [key]: value }));
    },
    [update]
  );

  const toggleListItem = useCallback(
    (key: PreferenceListKey, item: string) => {
      update((prev) => ({
        ...prev,
        [key]: prev[key].includes(item)
          ? prev[key].filter((i) => i !== item)
          : [...prev[key], item],
      }));
    },
    [update]
  );

  const addListItem = useCallback(
    (key: PreferenceListKey, item: string) => {
      const trimmed = item.trim();
      if (!trimmed) return;
      update((prev) =>
        prev[key].includes(trimmed)
          ? prev
          : { ...prev, [key]: [...prev[key], trimmed] }
      );
    },
    [update]
  );

  const removeListItem = useCallback(
    (key: PreferenceListKey, item: string) => {
      update((prev) => ({
        ...prev,
        [key]: prev[key].filter((i) => i !== item),
      }));
    },
    [update]
  );

  const reorderList = useCallback(
    (key: PreferenceListKey, from: number, to: number) => {
      update((prev) => {
        const next = [...prev[key]];
        if (
          from < 0 ||
          to < 0 ||
          from >= next.length ||
          to >= next.length ||
          from === to
        ) {
          return prev;
        }
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        return { ...prev, [key]: next };
      });
    },
    [update]
  );

  return (
    <PreferencesContext.Provider
      value={{
        preferences,
        loading,
        saving,
        lastSaved,
        setPreference,
        toggleListItem,
        addListItem,
        removeListItem,
        reorderList,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}
