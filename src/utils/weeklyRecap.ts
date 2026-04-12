import type { JournalEntry, MeditationSession, Mood } from '../types';
import { getLocalDateString, parseStoredDate } from './dateTime';

const LAST_RECAP_KEY = 'mindful-last-recap-week';

const MOOD_LABELS: Record<Mood, string> = {
  peaceful: 'Bình an',
  calm: 'Tĩnh tại',
  anxious: 'Lo lắng',
  tired: 'Mệt mỏi',
  sad: 'Buồn',
  neutral: 'Trung tính',
};

const getISOWeekKey = (date: Date = new Date()): string => {
  const d = new Date(date.getTime());
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
};

export const shouldShowWeeklyRecap = (): boolean => {
  const today = new Date();
  // Show on Monday (1) — or any day if never shown for this week
  if (today.getDay() !== 1) return false;

  const currentWeek = getISOWeekKey(today);
  const lastShown = localStorage.getItem(LAST_RECAP_KEY);
  return lastShown !== currentWeek;
};

export const markWeeklyRecapShown = (): void => {
  localStorage.setItem(LAST_RECAP_KEY, getISOWeekKey());
};

export interface WeeklyRecapData {
  totalMinutes: number;
  sessionsCount: number;
  dominantMood: string;
  moodEmoji: string;
  streak: number;
  topTechnique: string;
  daysActive: number;
}

const MOOD_EMOJIS: Record<Mood, string> = {
  peaceful: '🕊️',
  calm: '😌',
  anxious: '😰',
  tired: '😴',
  sad: '😢',
  neutral: '😐',
};

export const buildWeeklyRecap = (
  sessions: MeditationSession[],
  journals: JournalEntry[]
): WeeklyRecapData | null => {
  const now = new Date();
  const lastMonday = new Date(now);
  lastMonday.setDate(now.getDate() - ((now.getDay() + 6) % 7) - 7);
  lastMonday.setHours(0, 0, 0, 0);

  const lastSunday = new Date(lastMonday);
  lastSunday.setDate(lastMonday.getDate() + 6);
  lastSunday.setHours(23, 59, 59, 999);

  const weekSessions = sessions.filter((s) => {
    const d = parseStoredDate(s.date);
    return d >= lastMonday && d <= lastSunday;
  });

  if (weekSessions.length === 0) return null;

  const totalMinutes = Math.round(
    weekSessions.reduce((sum, s) => sum + s.durationSeconds, 0) / 60
  );

  const uniqueDays = new Set(weekSessions.map((s) => getLocalDateString(parseStoredDate(s.date))));

  const techCounts: Record<string, number> = {};
  for (const s of weekSessions) {
    techCounts[s.techniqueName] = (techCounts[s.techniqueName] || 0) + 1;
  }
  const topTechnique =
    Object.entries(techCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Chưa rõ';

  const weekJournals = journals.filter((j) => {
    const d = parseStoredDate(j.date);
    return d >= lastMonday && d <= lastSunday;
  });

  const moodCounts: Record<string, number> = {};
  for (const j of weekJournals) {
    moodCounts[j.mood] = (moodCounts[j.mood] || 0) + 1;
  }
  const topMood = (Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'peaceful') as Mood;

  return {
    totalMinutes,
    sessionsCount: weekSessions.length,
    dominantMood: MOOD_LABELS[topMood] || 'Bình an',
    moodEmoji: MOOD_EMOJIS[topMood] || '🕊️',
    streak: uniqueDays.size,
    topTechnique,
    daysActive: uniqueDays.size,
  };
};
