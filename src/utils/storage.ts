import { supabase } from '../lib/supabase';
import type { JournalEntry, MeditationSession } from '../types';
import {
  getDateKey,
  getLocalDateTimeString,
  isDateOnlyString,
  parseStoredDate,
} from './dateTime';
import { calculateStatsFromSessions } from './stats';

const SESSIONS_KEY = 'mindful-meditation-sessions';
const JOURNAL_KEY = 'mindful-meditation-journal';

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

export const loadSessions = (): MeditationSession[] => readJson<MeditationSession>(SESSIONS_KEY);

export const saveSessions = (sessions: MeditationSession[]) => {
  writeJson(SESSIONS_KEY, sessions);
};

export const addSession = (session: Omit<MeditationSession, 'id'>) => {
  const sessions = loadSessions();
  const newSession: MeditationSession = {
    ...session,
    id: Date.now().toString(),
  };

  sessions.push(newSession);
  saveSessions(sessions);
  return newSession.id;
};

export const loadJournalEntries = (): JournalEntry[] => readJson<JournalEntry>(JOURNAL_KEY);

export const saveJournalEntries = (entries: JournalEntry[]) => {
  writeJson(JOURNAL_KEY, entries);
};

export const addJournalEntry = (entry: Omit<JournalEntry, 'id'>) => {
  const entries = loadJournalEntries();
  const newEntry: JournalEntry = {
    ...entry,
    id: Date.now().toString(),
  };

  entries.push(newEntry);
  saveJournalEntries(entries);
};

export const deleteJournalEntry = (id: string) => {
  const entries = loadJournalEntries();
  saveJournalEntries(entries.filter((entry) => entry.id !== id));
};

export const getStats = () => calculateStatsFromSessions(loadSessions());

export const syncWithCloud = async (): Promise<boolean> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return false;

    const { data, error } = await supabase
      .from('meditation_sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      if (error) console.error('Lỗi khi đồng bộ dữ liệu thiền:', error);
      return false;
    }

    const localSessions = loadSessions();
    const combinedSessions = [...localSessions];
    let hasUpdates = false;

    data.forEach((session: any) => {
      const cloudTimestamp = new Date(session.created_at);
      const cloudDateTime = getLocalDateTimeString(cloudTimestamp);
      const cloudDateKey = getDateKey(cloudDateTime);

      const exists = combinedSessions.find((localSession) => {
        if (
          localSession.techniqueId !== session.technique_id ||
          localSession.durationSeconds !== session.duration_seconds
        ) {
          return false;
        }

        if (localSession.id === session.id) return true;

        if (getDateKey(localSession.date) !== cloudDateKey) return false;

        if (isDateOnlyString(localSession.date)) return true;

        return Math.abs(parseStoredDate(localSession.date).getTime() - cloudTimestamp.getTime()) < 60_000;
      });

      if (!exists) {
        combinedSessions.push({
          id: session.id,
          date: cloudDateTime,
          techniqueId: session.technique_id,
          techniqueName: session.technique_name,
          durationSeconds: session.duration_seconds,
        });
        hasUpdates = true;
      }
    });

    if (!hasUpdates) return false;

    combinedSessions.sort((a, b) => parseStoredDate(b.date).getTime() - parseStoredDate(a.date).getTime());
    saveSessions(combinedSessions);
    return true;
  } catch (error) {
    console.error('Lỗi khi đồng bộ dữ liệu thiền:', error);
    return false;
  }
};
