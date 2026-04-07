import type { MeditationSession as Session, JournalEntry, Badge } from '../types';
import { supabase } from '../lib/supabase';

const SESSIONS_KEY = 'mindful-meditation-sessions';
const JOURNAL_KEY = 'mindful-meditation-journal';

// Helpers
export const getLocalDateString = (d: Date = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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
  // Always sort a copy by date (oldest first) to identify milestones correctly
  const sortedAsc = [...(sessions || [])].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const totalDuration = (sessions || []).reduce((sum, s) => sum + (s.durationSeconds || 0), 0);
  const totalMinutes = Math.round(totalDuration / 60) || 0;
  const sessionCount = (sessions || []).length || 0;

  // Monthly stats
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const monthlySessions = (sessions || []).filter(s => {
    const sDate = new Date(s.date);
    return sDate.getMonth() === currentMonth && sDate.getFullYear() === currentYear;
  }).length;

  // Calculate streak (Robust for local dates)
  let streak = 0;
  // Normalize dates for unique check
  const dates = [...new Set(sessions.map(s => s.date ? s.date.split('T')[0] : ''))]
    .filter(d => d !== '')
    .sort()
    .reverse();
    
  const today = getLocalDateString();
  
  if (dates.length > 0) {
    const d0 = dates[0];
    const todayDate = new Date(today);
    const lastSessionDate = new Date(d0);
    const diffDays = Math.floor((todayDate.getTime() - lastSessionDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // If last session was today or yesterday, streak continues
    if (diffDays <= 1) {
      streak = 1;
      for (let i = 0; i < dates.length - 1; i++) {
        const d1 = new Date(dates[i]);
        const d2 = new Date(dates[i + 1]);
        const diff = Math.round((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
        if (diff <= 1) streak++;
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

  // Last 7 days minutes with labels (Normalized comparison)
  const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const dailyHistory = Array(7).fill(0).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = getLocalDateString(d);
    const dayLabel = days[d.getDay()];
    const dayMins = sessions
      .filter(s => s.date && s.date.includes(dateStr)) // Match date regardless of full ISO structure
      .reduce((sum, s) => sum + (s.durationSeconds || 0), 0) / 60;
    return { label: dayLabel, minutes: Math.round(dayMins) };
  });

  // Find dates for milestones
  let minutesSum = 0;
  let focusDate = today;
  let mindfulnessDate = today;
  let focusReached = false;
  let mindfulnessReached = false;

  for (const s of sortedAsc) {
    minutesSum += (s.durationSeconds / 60);
    if (!focusReached && minutesSum >= 100) {
      focusDate = s.date;
      focusReached = true;
    }
    if (!mindfulnessReached && minutesSum >= 500) {
      mindfulnessDate = s.date;
      mindfulnessReached = true;
    }
  }

  const firstLongSession = sortedAsc.find(s => s.durationSeconds >= 1800);
  const limitBreakDate = firstLongSession ? firstLongSession.date : today;

  // Badges (Modern Vietnamese)
  const badges: Badge[] = [];
  if (sessionCount >= 1) badges.push({ id: 'beginner', name: 'Khởi đầu', description: 'Hoàn thành buổi đầu tiên', earnedDate: sortedAsc[0].date, icon: '🌱' });
  if (sessionCount >= 10) badges.push({ id: 'steady', name: 'Kiên trì', description: 'Hoàn thành 10 buổi thiền', earnedDate: sortedAsc[9].date, icon: '🛡️' });
  if (sessionCount >= 30) badges.push({ id: 'discipline', name: 'Kỷ luật', description: 'Hoàn thành 30 buổi thiền', earnedDate: sortedAsc[29].date, icon: '⚔️' });
  if (streak >= 7) badges.push({ id: 'habit', name: 'Thói quen', description: 'Duy trì chuỗi 7 ngày liên tiếp', earnedDate: today, icon: '⚓' });
  if (totalMinutes >= 100) badges.push({ id: 'focus', name: 'Tập trung', description: 'Đạt 100 phút luyện tập', earnedDate: focusDate, icon: '🎯' });
  if (totalMinutes >= 500) badges.push({ id: 'mindfulness', name: 'Tỉnh thức', description: 'Đạt 500 phút luyện tập', earnedDate: mindfulnessDate, icon: '💎' });
  
  if (firstLongSession) badges.push({ id: 'limit_break', name: 'Vượt ngưỡng', description: 'Một buổi thiền trên 30 phút', earnedDate: limitBreakDate, icon: '🚀' });

  return { totalMinutes, sessionCount, monthlySessions, totalDuration, streak, favoriteTechnique, dailyHistory, badges };
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
        const sessionDate = new Date(s.created_at);
        const cloudDate = getLocalDateString(sessionDate);
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
