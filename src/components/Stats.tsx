import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Award, Flame, Timer, Activity } from 'lucide-react';
import type { MeditationSession, MeditationStats } from '../types';
import {
  formatSessionDisplayDateTime,
  formatStoredDate,
  loadSessions,
  parseStoredDate,
  subscribeToStorageUpdates,
  syncWithCloud,
} from '../utils/storage';
import { calculateStatsFromSessions } from '../utils/stats';

interface StatsProps {
  onBack: () => void;
}

export const Stats: React.FC<StatsProps> = ({ onBack }) => {
  const [stats, setStats] = useState<MeditationStats | null>(null);
  const [sessions, setSessions] = useState<MeditationSession[]>([]);

  useEffect(() => {
    const loadData = async () => {
      await syncWithCloud();
      const sessionData = loadSessions();
      setStats(calculateStatsFromSessions(sessionData));
      setSessions(
        [...sessionData]
          .sort((a, b) => parseStoredDate(b.date).getTime() - parseStoredDate(a.date).getTime())
          .slice(0, 5)
      );
    };

    void loadData();
    const unsubscribe = subscribeToStorageUpdates(() => {
      const sessionData = loadSessions();
      setStats(calculateStatsFromSessions(sessionData));
      setSessions(
        [...sessionData]
          .sort((a, b) => parseStoredDate(b.date).getTime() - parseStoredDate(a.date).getTime())
          .slice(0, 5)
      );
    });

    return unsubscribe;
  }, []);

  if (!stats) return null;

  const maxMinutes = Math.max(...stats.dailyHistory.map((point) => point.minutes), 30);

  return (
    <div className="fixed inset-0 bg-[#FCF9F3] dark:bg-[#0d0b09] z-50 flex flex-col overflow-hidden">
      <div className="p-6 flex items-center justify-between border-b border-[#E8DFC9] dark:border-white/5 bg-white/50 dark:bg-white/5 backdrop-blur-md">
        <button
          onClick={onBack}
          className="p-3 bg-white/80 dark:bg-white/5 rounded-full shadow-sm cursor-pointer hover:bg-white transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-[#A37B5C] dark:text-[#DECAA4]" />
        </button>
        <h2 className="text-xl font-semibold text-[#4A3C31] dark:text-[#F5EDE0]">Tiến Trình Tu Tập</h2>
        <div className="w-12 h-12" />
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-32 pt-4 custom-scrollbar">
        <div className="grid grid-cols-2 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/80 dark:bg-white/5 p-6 rounded-3xl border border-[#E8DFC9] dark:border-white/10 shadow-sm flex flex-col items-center justify-center text-center"
          >
            <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center mb-3">
              <Flame className="w-6 h-6 text-orange-500" />
            </div>
            <span className="text-3xl font-bold text-[#4A3C31] dark:text-[#F5EDE0]">{stats.streak}</span>
            <span className="text-xs font-semibold text-[#8B7D6E] dark:text-[#DECAA4]/60 uppercase tracking-widest mt-1">
              Chuỗi ngày liên tiếp
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white/80 dark:bg-white/5 p-6 rounded-3xl border border-[#E8DFC9] dark:border-white/10 shadow-sm flex flex-col items-center justify-center text-center"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mb-3">
              <Timer className="w-6 h-6 text-blue-500" />
            </div>
            <span className="text-3xl font-bold text-[#4A3C31] dark:text-[#F5EDE0]">{stats.totalMinutes}</span>
            <span className="text-xs font-semibold text-[#8B7D6E] dark:text-[#DECAA4]/60 uppercase tracking-widest mt-1">
              Tổng số phút
            </span>
          </motion.div>
        </div>

        <div className="mb-8">
          <h3 className="text-sm font-bold text-[#4A3C31] dark:text-[#F5EDE0]/60 uppercase tracking-[0.2em] mb-4 px-1 flex items-center gap-2">
            <Award className="w-4 h-4 text-[#A37B5C]" />
            Thành tựu
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {stats.badges.map((badge, index) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className="flex flex-col items-center text-center group"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#DECAA4]/30 to-[#FCF9F3] dark:from-[#3a3028] dark:to-[#2a2420] flex items-center justify-center shadow-md border border-[#E8DFC9] dark:border-white/10 mb-2 relative transform transition-transform group-hover:scale-110">
                  <span className="text-3xl">{badge.icon || '🏅'}</span>
                  <div className="absolute inset-0 rounded-full bg-[#A37B5C]/10 blur-lg -z-10" />
                </div>
                <span className="text-[11px] font-bold text-[#4A3C31] dark:text-[#F5EDE0] whitespace-nowrap">{badge.name}</span>
                <span className="text-[9px] text-[#8B7D6E] dark:text-[#DECAA4]/50 mt-0.5">
                  {formatStoredDate(badge.earnedDate, 'vi-VN', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                </span>
              </motion.div>
            ))}

            {stats.badges.length < 6 && (
              <div className="flex flex-col items-center opacity-20">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-white/5 border border-dashed border-gray-400 flex items-center justify-center mb-2">
                  <Award className="w-6 h-6 text-gray-400" />
                </div>
                <span className="text-[10px] text-gray-500 italic">Tiếp tục tu tập...</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white/80 dark:bg-white/5 p-6 rounded-3xl border border-[#E8DFC9] dark:border-white/10 shadow-sm mb-8 overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-[#4A3C31] dark:text-[#F5EDE0]/80 uppercase tracking-widest">Phân tích 7 ngày</h3>
            <Activity className="w-4 h-4 text-[#A37B5C]" />
          </div>

          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1 w-full">
              <div className="flex h-36 items-end justify-between px-1 gap-1 sm:gap-2">
                {stats.dailyHistory.map((day, index) => {
                  const barHeight = day.minutes > 0 ? Math.max((day.minutes / maxMinutes) * 112, 12) : 4;

                  return (
                    <div key={day.label} className="flex h-full flex-1 flex-col items-center justify-end gap-3 group">
                      <div className="relative flex h-full w-full items-end justify-center">
                        <div className="absolute inset-y-0 w-full max-w-[16px] bg-[#E8DFC9]/35 dark:bg-white/10 rounded-full" />
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${barHeight}px` }}
                          transition={{ duration: 0.8, delay: index * 0.05, ease: 'easeOut' }}
                          className={`w-full max-w-[16px] rounded-t-full relative z-10 ${
                            day.minutes > 0
                              ? 'bg-gradient-to-t from-[#A37B5C] to-[#DECAA4] shadow-[0_0_10px_rgba(163,123,92,0.2)]'
                              : 'bg-[#E8DFC9]/40 dark:bg-white/10'
                          }`}
                        />
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#4A3C31] dark:bg-[#DECAA4] text-white dark:text-[#4A3C31] text-[9px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 font-bold shadow-sm">
                          {day.minutes} phút
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-[#8B7D6E] dark:text-[#DECAA4]/50">{day.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="hidden md:block w-px h-24 bg-[#E8DFC9] dark:bg-white/10" />

            <div className="w-full md:w-48 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-[#F2EAE0] dark:border-white/5">
                <span className="text-[11px] text-[#8B7D6E] dark:text-[#DECAA4]/60">Số lần thiền</span>
                <span className="text-xs font-bold text-[#4A3C31] dark:text-[#F5EDE0]">{stats.sessionCount}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-[#F2EAE0] dark:border-white/5">
                <span className="text-[11px] text-[#8B7D6E] dark:text-[#DECAA4]/60">Chuỗi ngày</span>
                <span className="text-xs font-bold text-[#4A3C31] dark:text-[#F5EDE0]">{stats.streak} ngày</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-[#8B7D6E] dark:text-[#DECAA4]/60">Trung bình</span>
                <span className="text-xs font-bold text-[#4A3C31] dark:text-[#F5EDE0]">
                  {stats.sessionCount > 0 ? Math.round(stats.totalDuration / 60 / stats.sessionCount) : 0} phút
                </span>
              </div>
            </div>
          </div>
        </div>

        {sessions.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-[#4A3C31] dark:text-[#F5EDE0]/60 uppercase tracking-[0.2em] mb-4 px-1">Lịch sử gần đây</h3>
            <div className="space-y-3">
              {sessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 bg-white/50 dark:bg-white/5 rounded-2xl border border-[#E8DFC9] dark:border-white/10">
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-[#4A3C31] dark:text-[#F5EDE0]">{session.techniqueName}</span>
                    <span className="text-[10px] text-[#8B7D6E] dark:text-[#DECAA4]/50">{formatSessionDisplayDateTime(session)}</span>
                  </div>
                  <span className="text-xs font-bold text-[#A37B5C]">{Math.floor(session.durationSeconds / 60)} phút</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
