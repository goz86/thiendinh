import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Award, Flame, Timer, Activity, TrendingUp, Info } from 'lucide-react';
import { calculateStatsFromSessions, loadSessions } from '../utils/storage';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

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
    setSessions(sessionData.slice(0, 5)); // Just the last 5 for history
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

      <div className="flex-1 overflow-y-auto px-6 pb-24 pt-4 custom-scrollbar">
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
            <span className="text-xs font-semibold text-[#8B7D6E] dark:text-[#DECAA4]/60 uppercase tracking-widest mt-1">Ngày liên tiếp</span>
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
                <span className="text-[9px] text-[#8B7D6E] dark:text-[#DECAA4]/50 mt-0.5">{format(new Date(badge.earnedDate), 'dd/MM/yy')}</span>
              </motion.div>
            ))}
            
            {/* Locked Badges Placeholder */}
            {stats.badges.length < 3 && (
              <div className="flex flex-col items-center opacity-30">
                <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-white/5 border border-dashed border-gray-400 flex items-center justify-center mb-2">
                  <TrendingUp className="w-8 h-8 text-gray-400" />
                </div>
                <span className="text-[10px] text-gray-500 italic">Đang khám phá...</span>
              </div>
            )}
          </div>
        </div>

        {/* Progress Summary Card */}
        <div className="bg-white/80 dark:bg-white/5 p-6 rounded-3xl border border-[#E8DFC9] dark:border-white/10 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#4A3C31] dark:text-[#F5EDE0]/80">Tổng kết</h3>
            <Activity className="w-4 h-4 text-[#A37B5C]" />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-[#F2EAE0] dark:border-white/5">
              <span className="text-sm text-[#8B7D6E] dark:text-[#DECAA4]/60">Số buổi thiền</span>
              <span className="text-sm font-bold text-[#4A3C31] dark:text-[#F5EDE0]">{stats.sessionCount}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-[#F2EAE0] dark:border-white/5">
              <span className="text-sm text-[#8B7D6E] dark:text-[#DECAA4]/60">Kỷ lục chuỗi ngày</span>
              <span className="text-sm font-bold text-[#4A3C31] dark:text-[#F5EDE0]">{stats.streak} ngày</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#8B7D6E] dark:text-[#DECAA4]/60">Thời gian trung bình</span>
              <span className="text-sm font-bold text-[#4A3C31] dark:text-[#F5EDE0]">{stats.sessionCount > 0 ? Math.round(stats.totalDuration / 60 / stats.sessionCount) : 0} phút</span>
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
                    <span className="text-[10px] text-[#8B7D6E] dark:text-[#DECAA4]/50">{format(new Date(s.date), 'dd MMMM yyyy HH:mm', { locale: vi })}</span>
                  </div>
                  <span className="text-xs font-bold text-[#A37B5C]">{Math.floor(s.durationSeconds / 60)} phút</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Aesthetic Bottom Info */}
      <div className="p-8 text-center bg-transparent pointer-events-none absolute bottom-4 w-full">
         <div className="flex items-center justify-center gap-1.5 opacity-40">
           <Info className="w-3.5 h-3.5" />
           <p className="text-[10px] font-medium tracking-wider uppercase text-[#8B7D6E] dark:text-[#DECAA4]">Kiên trì là chìa khóa của sự tỉnh thức</p>
         </div>
      </div>
    </div>
  );
};
