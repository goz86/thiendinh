import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, RotateCcw, Box, Sparkles, Diamond, Target } from 'lucide-react';
import type { MalaMaterial } from '../types';

interface MalaCounterProps {
  onBack: () => void;
}

interface MalaProgress {
  count: number;
  goal: number;
  material: MalaMaterial;
}

const STORAGE_KEY = 'mindful-mala-progress';
const GOALS = [27, 54, 108];
const BEAD_SOURCE = [0, 1, 2, 3, 4, 5, 6, 7];

const MATERIALS: Array<{
  id: MalaMaterial;
  icon: typeof Box;
  label: string;
}> = [
  { id: 'agarwood', icon: Box, label: 'Gỗ trầm' },
  { id: 'jade', icon: Diamond, label: 'Ngọc bích' },
  { id: 'tiger_eye', icon: Sparkles, label: 'Mắt hổ' },
];

const loadProgress = (): MalaProgress => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { count: 0, goal: 27, material: 'agarwood' };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<MalaProgress>;
    return {
      count: typeof parsed.count === 'number' ? parsed.count : 0,
      goal: GOALS.includes(parsed.goal ?? 0) ? (parsed.goal as number) : 27,
      material: parsed.material && MATERIALS.some((item) => item.id === parsed.material) ? parsed.material : 'agarwood',
    };
  } catch {
    return { count: 0, goal: 27, material: 'agarwood' };
  }
};

export const MalaCounter: React.FC<MalaCounterProps> = ({ onBack }) => {
  const [progress, setProgress] = useState<MalaProgress>(() => loadProgress());
  const [beads, setBeads] = useState<number[]>(BEAD_SOURCE);
  const audioContextRef = useRef<AudioContext | null>(null);

  const { count, goal, material } = progress;
  const remaining = Math.max(goal - count, 0);
  const completion = Math.min((count / goal) * 100, 100);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  const playClack = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    let freq = 800;
    let type: OscillatorType = 'square';
    let decay = 0.05;

    if (material === 'jade') {
      freq = 1200;
      type = 'sine';
      decay = 0.08;
    } else if (material === 'tiger_eye') {
      freq = 600;
      type = 'sawtooth';
      decay = 0.04;
    }

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + decay);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, ctx.currentTime);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + decay);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + decay);
  }, [material]);

  const handleNext = () => {
    const nextCount = count + 1;
    setProgress((prev) => ({ ...prev, count: nextCount }));
    playClack();

    setBeads((prev) => {
      const next = [...prev];
      next.pop();
      return [Math.random(), ...next];
    });

    if ('vibrate' in navigator) {
      if (nextCount === goal) {
        navigator.vibrate([30, 60, 30, 60, 60]);
      } else if (nextCount % 27 === 0) {
        navigator.vibrate([20, 40, 20]);
      } else {
        navigator.vibrate(15);
      }
    }
  };

  const handleReset = () => {
    setProgress((prev) => ({ ...prev, count: 0 }));
    playClack();
    if ('vibrate' in navigator) navigator.vibrate([10, 50, 10]);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-[#FCF9F3] dark:bg-[#0d0b09]">
      <div className="relative z-20 flex items-center justify-between p-6">
        <button
          onClick={onBack}
          className="rounded-full bg-white/80 p-3 shadow-sm transition-colors hover:bg-white dark:bg-white/5"
        >
          <ChevronLeft className="h-6 w-6 text-[#A37B5C] dark:text-[#DECAA4]" />
        </button>

        <div className="flex flex-col items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8B7D6E] dark:text-[#DECAA4]/60">
            Số chuỗi
          </span>
          <div className="min-w-[120px] rounded-2xl border border-[#E8DFC9] bg-white/80 px-6 py-2 text-center shadow-inner dark:border-white/10 dark:bg-white/5">
            <span className="text-2xl font-bold text-[#4A3C31] dark:text-[#F5EDE0]">{count}</span>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="rounded-full bg-white/80 p-3 shadow-sm transition-colors hover:bg-white dark:bg-white/5"
          title="Đặt lại bộ đếm"
        >
          <RotateCcw className="h-5 w-5 text-[#A37B5C] dark:text-[#DECAA4]" />
        </button>
      </div>

      <div className="px-6 pb-2">
        <div className="mx-auto flex max-w-md flex-col gap-3 rounded-3xl border border-[#E8DFC9] bg-white/60 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#8B7D6E] dark:text-[#DECAA4]/60">Mục tiêu hôm nay</p>
              <p className="mt-1 text-sm font-medium text-[#4A3C31] dark:text-[#F5EDE0]">
                {count}/{goal} hạt
              </p>
            </div>
            <div className="rounded-full bg-[#FCF4E7] px-3 py-1 text-sm font-semibold text-[#A37B5C] dark:bg-[#241d16] dark:text-[#DECAA4]">
              Còn {remaining}
            </div>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-[#EFE4D2] dark:bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#CDA178] to-[#8B4513] transition-all duration-300"
              style={{ width: `${completion}%` }}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {GOALS.map((value) => (
              <button
                key={value}
                onClick={() => setProgress((prev) => ({ ...prev, goal: value, count: prev.count > value ? value : prev.count }))}
                className={`rounded-full px-3 py-1.5 text-sm transition-all ${
                  goal === value
                    ? 'bg-[#5A4D41] text-white shadow-sm'
                    : 'bg-[#FCF9F3] text-[#8B7D6E] hover:bg-white dark:bg-white/5 dark:text-[#DECAA4]'
                }`}
              >
                <span className="inline-flex items-center gap-1">
                  <Target className="h-3.5 w-3.5" />
                  {value}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        className="relative flex flex-1 cursor-pointer select-none flex-col items-center justify-center overflow-hidden touch-none"
        onClick={handleNext}
      >
        <div className="absolute left-1/2 h-full w-[2px] -translate-x-1/2 bg-[#A37B5C]/30 dark:bg-[#DECAA4]/20" />

        <div className="flex flex-col items-center gap-6">
          <AnimatePresence initial={false}>
            {beads.map((beadId, index) => (
              <motion.div
                key={beadId}
                layout
                initial={{ opacity: 0, y: -100 }}
                animate={{
                  opacity: index === 0 ? 0.3 : 1,
                  scale: index === 3 ? 1.3 : index > 3 ? 0.9 - (index - 3) * 0.1 : 0.8 + index * 0.1,
                  y: 0,
                }}
                exit={{ opacity: 0, y: 100 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className={`relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full shadow-2xl ${
                  index === 3
                    ? material === 'agarwood'
                      ? 'border-2 border-amber-950/40 bg-gradient-to-br from-[#5D2E0C] to-[#3D1E08]'
                      : material === 'jade'
                        ? 'border-2 border-emerald-950/40 bg-gradient-to-br from-[#2D5A27] to-[#1B3D17]'
                        : 'border-2 border-orange-950/40 bg-gradient-to-br from-[#B8860B] to-[#5D4037]'
                    : material === 'agarwood'
                      ? 'bg-gradient-to-br from-[#8B4513] to-[#5D2E0C] opacity-90'
                      : material === 'jade'
                        ? 'bg-gradient-to-br from-[#4A7C44] to-[#2D5A27] opacity-95'
                        : 'bg-gradient-to-br from-[#DAA520] to-[#B8860B] opacity-90'
                }`}
              >
                {material === 'tiger_eye' && (
                  <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.2)_10px,rgba(0,0,0,0.2)_20px)] opacity-40" />
                )}
                {material === 'jade' && <div className="absolute inset-0 bg-white/10 mix-blend-overlay" />}
                <div className="absolute left-3 top-2 h-4 w-4 rounded-full bg-white/30 blur-[2px]" />
                <div className="absolute bottom-2 right-3 h-6 w-6 rounded-full bg-black/30 blur-md" />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {count > 0 && (
          <div className="pointer-events-none absolute bottom-16">
            <div className="rounded-full bg-[#FCF9F3]/85 px-4 py-2 text-sm font-medium italic tracking-wide text-[#A37B5C] shadow-sm backdrop-blur-sm dark:bg-[#1a1612]/85 dark:text-[#DECAA4]">
              Nam Mô A Di Đà Phật
            </div>
          </div>
        )}

        {count >= goal && (
          <div className="pointer-events-none absolute top-8 rounded-full border border-amber-200 bg-amber-50/90 px-4 py-2 text-sm font-medium text-amber-700 shadow-sm dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-300">
            Đã hoàn thành mục tiêu {goal} hạt
          </div>
        )}
      </div>

      <div className="border-t border-[#E8DFC9] bg-white/50 p-6 backdrop-blur-md dark:border-white/5 dark:bg-black/20">
        <div className="mx-auto flex max-w-xl flex-col gap-4">
          <div className="flex flex-wrap justify-center gap-3 rounded-2xl border border-[#E8DFC9] bg-[#FCF9F3] p-2 shadow-sm dark:border-white/10 dark:bg-white/5">
            {MATERIALS.map((item) => (
              <button
                key={item.id}
                onClick={(event) => {
                  event.stopPropagation();
                  setProgress((prev) => ({ ...prev, material: item.id }));
                }}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm transition-all ${
                  material === item.id
                    ? 'bg-[#5A4D41] text-white shadow-md'
                    : 'text-[#8B7D6E] hover:bg-white dark:text-[#DECAA4] dark:hover:bg-white/10'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </div>

          <p className="text-center text-sm text-[#8B7D6E] opacity-70 dark:text-[#B0A090]">
            Chạm vào màn hình để lần hạt. Tiến độ sẽ được lưu lại cho lần mở sau.
          </p>
        </div>
      </div>
    </div>
  );
};
