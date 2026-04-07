import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Award, Flame, Timer, Activity } from 'lucide-react';
import { calculateStatsFromSessions, loadSessions } from '../utils/storage';

interface StatsProps {
  onBack: () => void;
}

export const Stats: React.FC<StatsProps> = ({ onBack }) => {
  const [stats, setStats] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    const sessionData = loadSessions();
    const calculated = calculateStatsFromSessions(sessionData);
    setStats(calculated);
    const reversed = [...sessionData].reverse();
    setSessions(reversed.slice(0, 5)); // 5 buổi gần nhất
  }, []);

  if (!stats) return null;

  return (
    <div className="fixed inset-0 bg-[#FCF9F3] dark:bg-[#0d0b09] z-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 flex items-center justify-between border-b border-[#E8DFC9] dark:border-white/5 bg-white/50 dark:bg-white/5 backdrop-blur-md">
        <button 
          onClick={onBack}
          className="p-3 bg-white/80 dark:bg-white/5 rounded-full shadow-sm cursor-pointer hover:bg-white transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-[#A37B5C] dark:text-[#DECAA4]" />
        </button>
        <h2 className="text-xl font-semibold text-[#4A3C31] dark:text-[#F5EDE0]">Tiến Trình Tu Tập</h2>
        <div className="w-12 h-12" /> {/* Spacer */}
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-32 pt-4 custom-scrollbar">
        {/* Core Stats Grid */}
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
            <span className="text-xs font-semibold text-[#8B7D6E] dark:text-[#DECAA4]/60 uppercase tracking-widest mt-1"> Chuỗi ngày liên tiếp</span>
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
            <span className="text-3xl font-bold text-[#4A3C31] dark:text-[#F5EDE0]">{stats.totalMinutes || 0}</span>
            <span className="text-xs font-semibold text-[#8B7D6E] dark:text-[#DECAA4]/60 uppercase tracking-widest mt-1">Tổng số phút</span>
          </motion.div>
        </div>

        {/* Badges Section */}
        <div className="mb-8">
          <h3 className="text-sm font-bold text-[#4A3C31] dark:text-[#F5EDE0]/60 uppercase tracking-[0.2em] mb-4 px-1 flex items-center gap-2">
            <Award className="w-4 h-4 text-[#A37B5C]" />
            Thành Tựu
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {stats.badges.map((badge: any, idx: number) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex flex-col items-center text-center group"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#DECAA4]/30 to-[#FCF9F3] dark:from-[#3a3028] dark:to-[#2a2420] flex items-center justify-center shadow-md border border-[#E8DFC9] dark:border-white/10 mb-2 relative transform transition-transform group-hover:scale-110">
                  <span className="text-3xl">{badge.icon || '🏅'}</span>
                  {/* Outer glow */}
                  <div className="absolute inset-0 rounded-full bg-[#A37B5C]/10 blur-lg -z-10" />
                </div>
                <span className="text-[11px] font-bold text-[#4A3C31] dark:text-[#F5EDE0] whitespace-nowrap">{badge.name}</span>
                <span className="text-[9px] text-[#8B7D6E] dark:text-[#DECAA4]/50 mt-0.5">{new Date(badge.earnedDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: '2-digit' })}</span>
              </motion.div>
            ))}
            
            {/* Locked Badges Placeholder */}
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

        {/* Progress Summary Card - REDESIGNED TO HORIZONTAL WITH BAR CHART */}
        <div className="bg-white/80 dark:bg-white/5 p-6 rounded-3xl border border-[#E8DFC9] dark:border-white/10 shadow-sm mb-8 overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-[#4A3C31] dark:text-[#F5EDE0]/80 uppercase tracking-widest">Phân tích 7 ngày</h3>
            <Activity className="w-4 h-4 text-[#A37B5C]" />
          </div>
          
          <div className="flex flex-col md:flex-row gap-8 items-center">
            {/* Left: Bar Chart */}
            <div className="flex-1 w-full flex items-end justify-between h-36 px-1 gap-1 sm:gap-2">
              {stats.dailyHistory.map((day: any, idx: number) => {
                const maxMins = Math.max(...stats.dailyHistory.map((d: any) => d.minutes), 30);
                const height = (day.minutes / maxMins) * 100;
                return (
                  <div key={idx} className="flex flex-col items-center flex-1 gap-3 group h-full justify-end">
                    <div className="relative w-full flex justify-center items-end h-full">
                      {/* Background Track for the bar */}
                      <div className="absolute inset-y-0 w-full max-w-[16px] bg-[#E8DFC9]/10 dark:bg-white/5 rounded-full" />
                      
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(height, 8)}%` }}
                        transition={{ duration: 0.8, delay: idx * 0.05, ease: "easeOut" }}
                        className={`w-full max-w-[16px] rounded-t-full relative z-10 ${day.minutes > 0 ? 'bg-gradient-to-t from-[#A37B5C] to-[#DECAA4] shadow-[0_0_10px_rgba(163,123,92,0.2)]' : 'bg-[#E8DFC9]/40 dark:bg-white/10'}`}
                      />
                      {/* Tooltip */}
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#4A3C31] dark:bg-[#DECAA4] text-white dark:text-[#4A3C31] text-[9px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 font-bold shadow-sm">
                        {day.minutes} p
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-[#8B7D6E] dark:text-[#DECAA4]/50">{day.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Vertical Divider (Desktop only) */}
            <div className="hidden md:block w-px h-24 bg-[#E8DFC9] dark:bg-white/10" />

            {/* Right: Metrics */}
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
                <span className="text-xs font-bold text-[#4A3C31] dark:text-[#F5EDE0]">{stats.sessionCount > 0 ? Math.round(stats.totalDuration / 60 / stats.sessionCount) : 0} p</span>
              </div>
            </div>
          </div>
        </div>

        {/* History (Optional) */}
        {sessions.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-[#4A3C31] dark:text-[#F5EDE0]/60 uppercase tracking-[0.2em] mb-4 px-1">Lịch sử gần đây</h3>
            <div className="space-y-3">
              {sessions.map(s => (
                <div key={s.id} className="flex items-center justify-between p-4 bg-white/50 dark:bg-white/5 rounded-2xl border border-[#E8DFC9] dark:border-white/10">
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-[#4A3C31] dark:text-[#F5EDE0]">{s.techniqueName}</span>
                    <span className="text-[10px] text-[#8B7D6E] dark:text-[#DECAA4]/50">{new Date(s.date).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <span className="text-xs font-bold text-[#A37B5C]">{Math.floor(s.durationSeconds / 60)} phút</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
