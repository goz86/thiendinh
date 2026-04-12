import { supabase } from '../lib/supabase';
import type { JournalEntry, MeditationSession, Mood } from '../types';
import {
  getLocalDateTimeString,
  parseStoredDate,
} from './dateTime';
import { calculateStatsFromSessions } from './stats';
import { getVisitorId } from './visits';

const SESSIONS_KEY = 'mindful-meditation-sessions';
const JOURNAL_KEY = 'mindful-meditation-journal';
const STORAGE_SCOPE_KEY = 'mindful-storage-scope';
const JOURNAL_TABLE = 'journal_entries';
const STORAGE_UPDATED_EVENT = 'mindful-storage-updated';

type CloudSessionRow = {
  id: string;
  created_at: string;
  user_id: string | null;
  visitor_id: string | null;
  technique_id: string;
  technique_name: string;
  duration_seconds: number;
};

type CloudJournalRow = {
  id: string;
  created_at: string;
  mood: Mood;
  note: string;
  session_id: string | null;
};

export {
  formatSessionDisplayDateTime,
  formatStoredDate,
  formatStoredDateTime,
  getDateKey,
  getLocalDateString,
  getLocalDateTimeString,
  isDateOnlyString,
  parseStoredDate,
} from './dateTime';

export { calculateStatsFromSessions } from './stats';

const readJson = <T,>(key: string): T[] => {
  const raw = localStorage.getItem(key);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
};

const writeJson = <T,>(key: string, value: T[]) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const notifyStorageUpdated = () => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(STORAGE_UPDATED_EVENT));
};

const getStorageScope = () => localStorage.getItem(STORAGE_SCOPE_KEY) || 'guest';

const getScopedKey = (baseKey: string) => `${baseKey}:${getStorageScope()}`;

const migrateLegacyDataIfNeeded = (legacyKey: string, scopedKey: string) => {
  if (localStorage.getItem(scopedKey)) return;

  const legacyRaw = localStorage.getItem(legacyKey);
  if (!legacyRaw) return;

  localStorage.setItem(scopedKey, legacyRaw);
};

export const setActiveStorageScope = (scope: string | null | undefined) => {
  const normalizedScope = scope?.trim() || 'guest';
  localStorage.setItem(STORAGE_SCOPE_KEY, normalizedScope);

  migrateLegacyDataIfNeeded(SESSIONS_KEY, getScopedKey(SESSIONS_KEY));
  migrateLegacyDataIfNeeded(JOURNAL_KEY, getScopedKey(JOURNAL_KEY));
};

const generateId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const isMissingTableError = (error: unknown, tableName: string) =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  (error as { code?: string }).code === 'PGRST205' &&
  'message' in error &&
  String((error as { message?: string }).message).includes(`public.${tableName}`);

const getCurrentUser = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
};

const isSameSession = (localSession: MeditationSession, cloudSession: CloudSessionRow) => {
  if (
    localSession.techniqueId !== cloudSession.technique_id ||
    localSession.durationSeconds !== cloudSession.duration_seconds
  ) {
    return false;
  }

  if (localSession.id === cloudSession.id) return true;

  const localDate = parseStoredDate(localSession.date);
  const cloudDate = new Date(cloudSession.created_at);

  return Math.abs(localDate.getTime() - cloudDate.getTime()) < 60_000;
};

const isSameJournalEntry = (localEntry: JournalEntry, cloudEntry: CloudJournalRow) => {
  if (localEntry.id === cloudEntry.id) return true;
  if (localEntry.mood !== cloudEntry.mood) return false;
  if (localEntry.note.trim() !== cloudEntry.note.trim()) return false;
  if ((localEntry.sessionId ?? null) !== cloudEntry.session_id) return false;

  const localDate = parseStoredDate(localEntry.date);
  const cloudDate = new Date(cloudEntry.created_at);

  return Math.abs(localDate.getTime() - cloudDate.getTime()) < 60_000;
};

const insertSessionToCloud = async (session: MeditationSession, userId?: string | null) => {
  const visitorId = getVisitorId();
  const { error } = await supabase.from('meditation_sessions').insert({
    user_id: userId || null,
    visitor_id: visitorId,
    technique_id: session.techniqueId,
    technique_name: session.techniqueName,
    duration_seconds: session.durationSeconds,
    created_at: parseStoredDate(session.date).toISOString(),
  });

  if (error) {
    console.error('Loi khi luu phien thien len Supabase:', error);
  }
};

const insertJournalToCloud = async (entry: JournalEntry, userId: string) => {
  const { error } = await supabase.from(JOURNAL_TABLE).upsert({
    id: entry.id,
    user_id: userId,
    mood: entry.mood,
    note: entry.note,
    session_id: entry.sessionId ?? null,
    created_at: parseStoredDate(entry.date).toISOString(),
  });

  if (error) {
    if (isMissingTableError(error, JOURNAL_TABLE)) {
      console.warn(`Bang public.${JOURNAL_TABLE} chua ton tai tren Supabase.`);
      return;
    }

    console.error('Loi khi luu nhat ky len Supabase:', error);
  }
};

const deleteJournalFromCloud = async (id: string, userId: string) => {
  const { error } = await supabase.from(JOURNAL_TABLE).delete().eq('id', id).eq('user_id', userId);

  if (error && !isMissingTableError(error, JOURNAL_TABLE)) {
    console.error('Loi khi xoa nhat ky tren Supabase:', error);
  }
};

export const loadSessions = (): MeditationSession[] => {
  const scopedKey = getScopedKey(SESSIONS_KEY);
  migrateLegacyDataIfNeeded(SESSIONS_KEY, scopedKey);
  return readJson<MeditationSession>(scopedKey);
};

export const saveSessions = (sessions: MeditationSession[]) => {
  writeJson(getScopedKey(SESSIONS_KEY), sessions);
  notifyStorageUpdated();
};

export const addSession = async (session: Omit<MeditationSession, 'id'>) => {
  const sessions = loadSessions();
  const newSession: MeditationSession = {
    ...session,
    id: generateId(),
  };

  sessions.push(newSession);
  saveSessions(sessions);

  try {
    const user = await getCurrentUser();
    await insertSessionToCloud(newSession, user?.id ?? null);
  } catch (error) {
    console.error('Loi khi dong bo phien thien:', error);
  }

  return newSession.id;
};

export const loadJournalEntries = (): JournalEntry[] => {
  const scopedKey = getScopedKey(JOURNAL_KEY);
  migrateLegacyDataIfNeeded(JOURNAL_KEY, scopedKey);
  return readJson<JournalEntry>(scopedKey);
};

export const saveJournalEntries = (entries: JournalEntry[]) => {
  writeJson(getScopedKey(JOURNAL_KEY), entries);
  notifyStorageUpdated();
};

export const addJournalEntry = async (entry: Omit<JournalEntry, 'id'>) => {
  const entries = loadJournalEntries();
  const newEntry: JournalEntry = {
    ...entry,
    id: generateId(),
  };

  entries.push(newEntry);
  saveJournalEntries(entries);

  try {
    const user = await getCurrentUser();
    if (user) {
      await insertJournalToCloud(newEntry, user.id);
    }
  } catch (error) {
    console.error('Loi khi dong bo nhat ky:', error);
  }

  return newEntry.id;
};

export const deleteJournalEntry = async (id: string) => {
  const entries = loadJournalEntries();
  saveJournalEntries(entries.filter((entry) => entry.id !== id));

  try {
    const user = await getCurrentUser();
    if (user) {
      await deleteJournalFromCloud(id, user.id);
    }
  } catch (error) {
    console.error('Loi khi xoa nhat ky:', error);
  }
};

export const getStats = () => calculateStatsFromSessions(loadSessions());

export const syncWithCloud = async (): Promise<boolean> => {
  try {
    const user = await getCurrentUser();
    if (!user) return false;

    const [{ data: sessionRows, error: sessionError }, { data: journalRows, error: journalError }] =
      await Promise.all([
        supabase
          .from('meditation_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from(JOURNAL_TABLE)
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
      ]);

    if (sessionError || !sessionRows) {
      if (sessionError) {
        console.error('Loi khi tai du lieu phien thien:', sessionError);
      }
      return false;
    }

    if (journalError && !isMissingTableError(journalError, JOURNAL_TABLE)) {
      console.error('Loi khi tai du lieu nhat ky:', journalError);
    }

    const cloudSessions = (sessionRows ?? []) as CloudSessionRow[];
    const cloudJournals = (journalRows ?? []) as CloudJournalRow[];
    const localSessions = loadSessions();
    const localJournalEntries = loadJournalEntries();
    let didChange = false;

    for (const localSession of localSessions) {
      if (!cloudSessions.some((cloudSession) => isSameSession(localSession, cloudSession))) {
        await insertSessionToCloud(localSession, user.id);
      }
    }

    if (!journalError || !isMissingTableError(journalError, JOURNAL_TABLE)) {
      for (const localEntry of localJournalEntries) {
        if (!cloudJournals.some((cloudEntry) => isSameJournalEntry(localEntry, cloudEntry))) {
          await insertJournalToCloud(localEntry, user.id);
        }
      }
    }

    const mergedSessions = [...localSessions];
    cloudSessions.forEach((cloudSession) => {
      if (!mergedSessions.some((localSession) => isSameSession(localSession, cloudSession))) {
        mergedSessions.push({
          id: cloudSession.id,
          date: getLocalDateTimeString(new Date(cloudSession.created_at)),
          techniqueId: cloudSession.technique_id,
          techniqueName: cloudSession.technique_name,
          durationSeconds: cloudSession.duration_seconds,
        });
        didChange = true;
      }
    });

    if (didChange) {
      mergedSessions.sort((a, b) => parseStoredDate(b.date).getTime() - parseStoredDate(a.date).getTime());
      saveSessions(mergedSessions);
    }

    if (!journalError || !isMissingTableError(journalError, JOURNAL_TABLE)) {
      const mergedEntries = [...localJournalEntries];
      let journalChanged = false;

      cloudJournals.forEach((cloudEntry) => {
        if (!mergedEntries.some((localEntry) => isSameJournalEntry(localEntry, cloudEntry))) {
          mergedEntries.push({
            id: cloudEntry.id,
            date: getLocalDateTimeString(new Date(cloudEntry.created_at)),
            mood: cloudEntry.mood,
            note: cloudEntry.note,
            sessionId: cloudEntry.session_id ?? undefined,
          });
          journalChanged = true;
        }
      });

      if (journalChanged) {
        mergedEntries.sort((a, b) => parseStoredDate(b.date).getTime() - parseStoredDate(a.date).getTime());
        saveJournalEntries(mergedEntries);
        didChange = true;
      }
    }

    return didChange;
  } catch (error) {
    console.error('Loi khi dong bo du lieu:', error);
    return false;
  }
};

export const subscribeToStorageUpdates = (callback: () => void) => {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const handler = () => callback();
  window.addEventListener(STORAGE_UPDATED_EVENT, handler);
  window.addEventListener('storage', handler);

  return () => {
    window.removeEventListener(STORAGE_UPDATED_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
};
