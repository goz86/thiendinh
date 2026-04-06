import type { MeditationSession as Session } from '../types';

const STORAGE_KEY = 'mindful-meditation-sessions';

export const loadSessions = (): Session[] => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return [];
  try {
    return JSON.parse(saved);
  } catch {
    return [];
  }
};

export const saveSessions = (sessions: Session[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
};

export const addSession = (session: Omit<Session, 'id'>) => {
  const sessions = loadSessions();
  const newSession: Session = {
    ...session,
    id: Date.now().toString(),
  };
  sessions.push(newSession);
  saveSessions(sessions);
};

export const calculateStatsFromSessions = (sessions: Session[]) => {
  const totalMinutes = Math.round(sessions.reduce((sum, s) => sum + s.durationSeconds, 0) / 60);
  const totalSessions = sessions.length;

  // Calculate streak
  let streak = 0;
  const dates = [...new Set(sessions.map(s => s.date))].sort().reverse();
  const today = new Date().toISOString().split('T')[0];
  
  if (dates.length > 0) {
    let currentIdx = dates[0] === today ? 0 : (
      new Date(today).getTime() - new Date(dates[0]).getTime() <= 86400000 ? 0 : -1
    );

    if (currentIdx !== -1) {
      streak = 1;
      for (let i = currentIdx; i < dates.length - 1; i++) {
        const d1 = new Date(dates[i]);
        const d2 = new Date(dates[i + 1]);
        const diff = (d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24);
        if (diff <= 1.1) streak++;
        else break;
      }
    }
  }

  // Favorite technique
  const counts: Record<string, number> = {};
  sessions.forEach(s => {
    counts[s.techniqueName] = (counts[s.techniqueName] || 0) + 1;
  });
  const favoriteTechnique = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Chưa định rõ';

  // Last 7 days minutes
  const last7 = Array(7).fill(0);
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const dayMins = sessions
      .filter(s => s.date === dateStr)
      .reduce((sum, s) => sum + s.durationSeconds, 0) / 60;
    last7[i] = Math.round(dayMins);
  }

  return { totalMinutes, totalSessions, streak, favoriteTechnique, last7 };
};

export const getStats = () => {
  const sessions = loadSessions();
  return calculateStatsFromSessions(sessions);
};
