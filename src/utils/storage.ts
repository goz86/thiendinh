import type { MeditationSession as Session, JournalEntry, Badge } from '../types';
import { supabase } from '../lib/supabase';

const SESSIONS_KEY = 'mindful-meditation-sessions';
const JOURNAL_KEY = 'mindful-meditation-journal';

// Sessions
export const loadSessions = (): Session[] => {
  const saved = localStorage.getItem(SESSIONS_KEY);
  if (!saved) return [];
  try {
    return JSON.parse(saved);
  } catch {
    return [];
  }
};

export const saveSessions = (sessions: Session[]) => {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
};

export const addSession = (session: Omit<Session, 'id'>) => {
  const sessions = loadSessions();
  const newSession: Session = {
    ...session,
    id: Date.now().toString(),
  };
  sessions.push(newSession);
  saveSessions(sessions);
  return newSession.id;
};

// Journal
export const loadJournalEntries = (): JournalEntry[] => {
  const saved = localStorage.getItem(JOURNAL_KEY);
  if (!saved) return [];
  try {
    return JSON.parse(saved);
  } catch {
    return [];
  }
};

export const saveJournalEntries = (entries: JournalEntry[]) => {
  localStorage.setItem(JOURNAL_KEY, JSON.stringify(entries));
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

// Badges & Stats
export const calculateStatsFromSessions = (sessions: Session[]) => {
  const totalMinutes = Math.round((sessions || []).reduce((sum, s) => sum + (s.durationSeconds || 0), 0) / 60) || 0;
  const totalSessions = (sessions || []).length || 0;

  // Calculate streak
  let streak = 0;
  const dates = [...new Set(sessions.map(s => s.date))].sort().reverse();
  const today = new Date().toISOString().split('T')[0];
  
  if (dates.length > 0) {
    const d0 = dates[0];
    const todayDate = new Date(today);
    const lastSessionDate = new Date(d0);
    const diffDays = (todayDate.getTime() - lastSessionDate.getTime()) / (1000 * 60 * 60 * 24);
    
    // If last session was today or yesterday, streak continues
    if (diffDays <= 1) {
      streak = 1;
      for (let i = 0; i < dates.length - 1; i++) {
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
      .reduce((sum, s) => sum + (s.durationSeconds || 0), 0) / 60;
    last7[i] = Math.round(dayMins);
  }

  // Badges
  const badges: Badge[] = [];
  if (totalSessions >= 1) badges.push({ id: 'beginner', name: 'Sơ tâm', description: 'Hoàn thành buổi thiền đầu tiên', earnedDate: sessions[0].date });
  if (totalSessions >= 10) badges.push({ id: 'steady', name: 'Tâm bất biến', description: 'Hoàn thành 10 buổi thiền', earnedDate: sessions[9].date });
  if (streak >= 3) badges.push({ id: 'persistence_3', name: 'Kiên trì', description: 'Duy trì chuỗi 3 ngày thiền', earnedDate: today });
  if (streak >= 7) badges.push({ id: 'zen_master', name: 'Thiền sư', description: 'Duy trì chuỗi 7 ngày thiền', earnedDate: today });
  if (totalMinutes >= 100) badges.push({ id: 'stillness', name: 'Tỉnh lặng', description: 'Đạt 100 phút thiền định', earnedDate: today });

  return { totalMinutes, totalSessions, streak, favoriteTechnique, last7, badges };
};

export const getStats = () => {
  const sessions = loadSessions();
  return calculateStatsFromSessions(sessions);
};

export const syncWithCloud = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data } = await supabase
      .from('meditation_sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      const local = loadSessions();
      const combined = [...local];
      let updated = false;

      data.forEach((s: any) => {
        const cloudDate = new Date(s.created_at).toISOString().split('T')[0];
        const exists = combined.find((localS: Session) => 
          localS.date === cloudDate && 
          localS.techniqueId === s.technique_id && 
          localS.durationSeconds === s.duration_seconds
        );
        if (!exists) {
          combined.push({
            id: s.id,
            date: cloudDate,
            techniqueId: s.technique_id,
            techniqueName: s.technique_name,
            durationSeconds: s.duration_seconds
          });
          updated = true;
        }
      });

      if (updated) {
        combined.sort((a: Session, b: Session) => new Date(b.date).getTime() - new Date(a.date).getTime());
        saveSessions(combined);
        return true;
      }
    }
  } catch (error) {
    console.error('Lỗi khi đồng bộ dữ liệu:', error);
  }
  return false;
};

export const deleteJournalEntry = (id: string): void => {
  const entries = loadJournalEntries();
  const filtered = entries.filter(e => e.id !== id);
  saveJournalEntries(filtered);
};
