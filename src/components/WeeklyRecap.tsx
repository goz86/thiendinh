import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Flower, Timer, Flame, X } from 'lucide-react';
import type { WeeklyRecapData } from '../utils/weeklyRecap';

interface WeeklyRecapProps {
  data: WeeklyRecapData;
  onClose: () => void;
}

export const WeeklyRecap: React.FC<WeeklyRecapProps> = ({ data, onClose }) => {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] flex items-center justify-center bg-[#1E1712]/50 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-sm overflow-hidden rounded-[32px] border border-[#E8DFC9] bg-gradient-to-b from-[#FFFAF5] to-[#FCF3E8] p-7 shadow-[0_25px_80px_rgba(74,60,49,0.2)] dark:border-white/10 dark:from-[#1a1612] dark:to-[#12100d]"
        >
          {/* Decorative gradient blur */}
          <div className="pointer-events-none absolute -top-16 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-[#DECAA4]/30 blur-3xl dark:bg-[#DECAA4]/10" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-2 text-[#A37B5C] transition-colors hover:bg-white/50 dark:text-[#DECAA4] dark:hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header */}
          <div className="relative mb-6 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 400 }}
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[#E8DFC9] bg-gradient-to-tr from-[#DECAA4]/30 to-[#FCF9F3] shadow-lg dark:border-white/10 dark:from-[#3a3028] dark:to-[#2a2420]"
            >
              <span className="text-3xl">{data.moodEmoji}</span>
            </motion.div>
            <h2 className="text-xl font-bold text-[#4A3C31] dark:text-[#F5EDE0]">
              Tuần vừa rồi của bạn
            </h2>
            <p className="mt-1.5 text-sm text-[#8B7D6E] dark:text-[#B0A090]">
              Cảm xúc chủ đạo: <span className="font-semibold text-[#A37B5C] dark:text-[#DECAA4]">{data.dominantMood}</span>
            </p>
          </div>

          {/* Stats grid */}
          <div className="mb-6 grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-[#F0E7DB] bg-white/60 p-3 text-center dark:border-white/10 dark:bg-white/5">
              <Timer className="mx-auto mb-1.5 h-4 w-4 text-blue-500" />
              <div className="text-xl font-bold text-[#4A3C31] dark:text-[#F5EDE0]">{data.totalMinutes}</div>
              <div className="text-[10px] text-[#8B7D6E] dark:text-[#B0A090]">phút</div>
            </div>
            <div className="rounded-2xl border border-[#F0E7DB] bg-white/60 p-3 text-center dark:border-white/10 dark:bg-white/5">
              <Flower className="mx-auto mb-1.5 h-4 w-4 text-pink-500" />
              <div className="text-xl font-bold text-[#4A3C31] dark:text-[#F5EDE0]">{data.sessionsCount}</div>
              <div className="text-[10px] text-[#8B7D6E] dark:text-[#B0A090]">buổi</div>
            </div>
            <div className="rounded-2xl border border-[#F0E7DB] bg-white/60 p-3 text-center dark:border-white/10 dark:bg-white/5">
              <Flame className="mx-auto mb-1.5 h-4 w-4 text-orange-500" />
              <div className="text-xl font-bold text-[#4A3C31] dark:text-[#F5EDE0]">{data.daysActive}</div>
              <div className="text-[10px] text-[#8B7D6E] dark:text-[#B0A090]">ngày</div>
            </div>
          </div>

          {/* Favorite technique */}
          <div className="mb-6 rounded-2xl border border-[#E8DFC9] bg-[#FCF9F3] p-4 dark:border-white/10 dark:bg-white/5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#8B7D6E] dark:text-[#B0A090]">
              Bài tập yêu thích
            </div>
            <div className="mt-1 text-sm font-bold text-[#4A3C31] dark:text-[#F5EDE0]">{data.topTechnique}</div>
          </div>

          {/* Motivational quote */}
          <p className="mb-6 text-center text-sm italic leading-relaxed text-[#7D6A5A] dark:text-[#CDB89A]">
            "Tiếp tục giữ nhịp thở đều nhé! Mỗi phút thiền đều để lại dấu ấn bình an trong bạn." 🌿
          </p>

          {/* CTA */}
          <button
            onClick={onClose}
            className="w-full rounded-full bg-[#5A4D41] py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:bg-[#4A3C31] active:scale-[0.98]"
          >
            Tiếp tục hành trình
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
