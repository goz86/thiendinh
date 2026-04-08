import type { Badge, MeditationSession, MeditationStats } from '../types';
import { getDateKey, getLocalDateString, parseStoredDate } from './dateTime';

const WEEKDAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export const calculateStatsFromSessions = (sessions: MeditationSession[]): MeditationStats => {
  const sortedAsc = [...sessions].sort(
    (a, b) => parseStoredDate(a.date).getTime() - parseStoredDate(b.date).getTime()
  );

  const totalDuration = sessions.reduce((sum, session) => sum + (session.durationSeconds || 0), 0);
  const totalMinutes = Math.round(totalDuration / 60);
  const sessionCount = sessions.length;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const monthlySessions = sessions.filter((session) => {
    const sessionDate = parseStoredDate(session.date);
    return sessionDate.getMonth() === currentMonth && sessionDate.getFullYear() === currentYear;
  }).length;

  const uniqueDates = [...new Set(sessions.map((session) => getDateKey(session.date)))]
    .filter(Boolean)
    .sort()
    .reverse();

  const today = getLocalDateString();
  let streak = 0;

  if (uniqueDates.length > 0) {
    const lastSessionDate = parseStoredDate(uniqueDates[0]);
    const diffDays = Math.floor(
      (parseStoredDate(today).getTime() - lastSessionDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays <= 1) {
      streak = 1;

      for (let index = 0; index < uniqueDates.length - 1; index += 1) {
        const current = parseStoredDate(uniqueDates[index]);
        const next = parseStoredDate(uniqueDates[index + 1]);
        const gap = Math.round((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24));

        if (gap <= 1) streak += 1;
        else break;
      }
    }
  }

  const techniqueCounts = sessions.reduce<Record<string, number>>((acc, session) => {
    acc[session.techniqueName] = (acc[session.techniqueName] || 0) + 1;
    return acc;
  }, {});

  const favoriteTechnique =
    Object.entries(techniqueCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Chưa xác định';

  const dailyHistory = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));

    const dateKey = getLocalDateString(date);
    const minutes = sessions
      .filter((session) => getDateKey(session.date) === dateKey)
      .reduce((sum, session) => sum + session.durationSeconds, 0) / 60;

    return {
      label: WEEKDAY_LABELS[date.getDay()],
      minutes: Math.round(minutes),
    };
  });

  let accumulatedMinutes = 0;
  let focusDate = today;
  let mindfulnessDate = today;
  let focusReached = false;
  let mindfulnessReached = false;

  for (const session of sortedAsc) {
    accumulatedMinutes += session.durationSeconds / 60;

    if (!focusReached && accumulatedMinutes >= 100) {
      focusDate = session.date;
      focusReached = true;
    }

    if (!mindfulnessReached && accumulatedMinutes >= 500) {
      mindfulnessDate = session.date;
      mindfulnessReached = true;
    }
  }

  const firstLongSession = sortedAsc.find((session) => session.durationSeconds >= 1800);
  const limitBreakDate = firstLongSession?.date || today;

  const badges: Badge[] = [];
  if (sessionCount >= 1) badges.push({ id: 'beginner', name: 'Khởi đầu', description: 'Hoàn thành buổi đầu tiên', earnedDate: sortedAsc[0].date, icon: '🌱' });
  if (sessionCount >= 10) badges.push({ id: 'steady', name: 'Kiên trì', description: 'Hoàn thành 10 buổi thiền', earnedDate: sortedAsc[9].date, icon: '🛡️' });
  if (sessionCount >= 30) badges.push({ id: 'discipline', name: 'Kỷ luật', description: 'Hoàn thành 30 buổi thiền', earnedDate: sortedAsc[29].date, icon: '⚔️' });
  if (streak >= 7) badges.push({ id: 'habit', name: 'Thói quen', description: 'Duy trì chuỗi 7 ngày liên tiếp', earnedDate: today, icon: '⚓' });
  if (totalMinutes >= 100) badges.push({ id: 'focus', name: 'Tập trung', description: 'Đạt 100 phút luyện tập', earnedDate: focusDate, icon: '🎯' });
  if (totalMinutes >= 500) badges.push({ id: 'mindfulness', name: 'Tỉnh thức', description: 'Đạt 500 phút luyện tập', earnedDate: mindfulnessDate, icon: '💎' });
  if (firstLongSession) badges.push({ id: 'limit_break', name: 'Vượt ngưỡng', description: 'Một buổi thiền trên 30 phút', earnedDate: limitBreakDate, icon: '🚀' });

  return {
    totalMinutes,
    sessionCount,
    monthlySessions,
    totalDuration,
    streak,
    favoriteTechnique,
    dailyHistory,
    badges,
  };
};
