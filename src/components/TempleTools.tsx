import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Play, Pause, Volume2, Music2, TimerReset } from 'lucide-react';

interface TempleToolsProps {
  onBack: () => void;
}

type ToolType = 'bell' | 'woodblock';

const PRESET_INTERVALS = [
  { label: 'Chậm', value: 3000 },
  { label: 'Vừa', value: 2000 },
  { label: 'Nhanh', value: 1000 },
];

export const TempleTools: React.FC<TempleToolsProps> = ({ onBack }) => {
  const [activeTool, setActiveTool] = useState<ToolType>('woodblock');
  const [autoTap, setAutoTap] = useState(false);
  const [interval, setIntervalTime] = useState(2000);
  const [strikeCount, setStrikeCount] = useState(0);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const autoTapRef = useRef<number | null>(null);

  const playBell = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;
    const frequencies = [220, 442, 770, 1100];

    frequencies.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.2 / (index + 1), now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2 + index);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 2.2 + index);
    });
  }, []);

  const playWoodblock = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'square';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(450, now);
    filter.Q.setValueAtTime(5, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.4, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
  }, []);

  const triggerSound = useCallback((event?: React.MouseEvent | React.TouchEvent) => {
    if (activeTool === 'bell') playBell();
    else playWoodblock();

    setStrikeCount((prev) => prev + 1);

    const id = Date.now();
    const x = event && 'clientX' in event ? event.clientX : window.innerWidth / 2;
    const y = event && 'clientY' in event ? event.clientY : window.innerHeight / 2;

    setRipples((prev) => [...prev, { id, x, y }]);
    window.setTimeout(() => {
      setRipples((prev) => prev.filter((ripple) => ripple.id !== id));
    }, 1000);

    if ('vibrate' in navigator) navigator.vibrate(10);
  }, [activeTool, playBell, playWoodblock]);

  useEffect(() => {
    if (autoTap) {
      autoTapRef.current = window.setInterval(() => {
        triggerSound();
      }, interval);
    } else if (autoTapRef.current) {
      window.clearInterval(autoTapRef.current);
      autoTapRef.current = null;
    }

    return () => {
      if (autoTapRef.current) {
        window.clearInterval(autoTapRef.current);
        autoTapRef.current = null;
      }
    };
  }, [autoTap, interval, triggerSound]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-[#FCF9F3] dark:bg-[#0d0b09]">
      <div className="relative z-20 flex items-center justify-between p-4 sm:p-6">
        <button
          onClick={onBack}
          className="rounded-full bg-white/80 p-3 shadow-sm transition-colors hover:bg-white dark:bg-white/5"
        >
          <ChevronLeft className="h-6 w-6 text-[#A37B5C] dark:text-[#DECAA4]" />
        </button>
        <h3 className="text-lg font-medium text-[#4A3C31] dark:text-[#F5EDE0] sm:text-xl">Chuông và mõ</h3>
        <button
          onClick={() => setStrikeCount(0)}
          className="rounded-full bg-white/80 p-3 shadow-sm transition-colors hover:bg-white dark:bg-white/5"
          title="Đặt lại lượt gõ"
        >
          <TimerReset className="h-5 w-5 text-[#A37B5C] dark:text-[#DECAA4]" />
        </button>
      </div>

      <div className="px-4 pb-4 sm:px-6">
        <div className="mx-auto flex max-w-md items-center justify-between rounded-3xl border border-[#E8DFC9] bg-white/60 px-4 py-3 shadow-sm dark:border-white/10 dark:bg-white/5">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#8B7D6E] dark:text-[#DECAA4]/60">Phiên hiện tại</p>
            <p className="mt-1 text-lg font-semibold text-[#4A3C31] dark:text-[#F5EDE0]">{strikeCount} lượt gõ</p>
          </div>
          <div className="rounded-full bg-[#FCF4E7] px-3 py-1 text-sm font-medium text-[#A37B5C] dark:bg-[#241d16] dark:text-[#DECAA4]">
            {activeTool === 'bell' ? 'Chuông ngân' : 'Mõ đều'}
          </div>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 px-4 sm:mb-6 sm:flex sm:justify-center sm:gap-4 sm:px-6">
        <button
          onClick={() => {
            setActiveTool('woodblock');
            setAutoTap(false);
          }}
          className={`flex min-h-[56px] items-center justify-center gap-2 rounded-full border px-4 py-3 text-sm transition-all sm:px-6 sm:py-2 ${
            activeTool === 'woodblock'
              ? 'border-transparent bg-[#5D2E0C] text-white shadow-lg'
              : 'border-[#E8DFC9] bg-white/60 text-[#8B7D6E] dark:border-white/10 dark:bg-white/5 dark:text-[#DECAA4]'
          }`}
        >
          <Music2 className="h-4 w-4 shrink-0" />
          <span className="text-center leading-tight">Mõ gõ nhịp</span>
        </button>
        <button
          onClick={() => {
            setActiveTool('bell');
            setAutoTap(false);
          }}
          className={`flex min-h-[56px] items-center justify-center gap-2 rounded-full border px-4 py-3 text-sm transition-all sm:px-6 sm:py-2 ${
            activeTool === 'bell'
              ? 'border-transparent bg-[#A37B5C] text-white shadow-lg'
              : 'border-[#E8DFC9] bg-white/60 text-[#8B7D6E] dark:border-white/10 dark:bg-white/5 dark:text-[#DECAA4]'
          }`}
        >
          <Volume2 className="h-4 w-4 shrink-0" />
          <span className="text-center leading-tight">Chuông thiền</span>
        </button>
      </div>

      <div
        className="relative flex flex-1 cursor-pointer select-none flex-col items-center justify-center overflow-hidden touch-none px-4"
        onMouseDown={(event) => !autoTap && triggerSound(event)}
      >
        <AnimatePresence>
          {ripples.map((ripple) => (
            <motion.div
              key={ripple.id}
              initial={{ scale: 0, opacity: 0.5 }}
              animate={{ scale: 4, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="pointer-events-none absolute h-20 w-20 rounded-full border-2 border-[#C2A385]/30"
              style={{ left: ripple.x - 40, top: ripple.y - 40 }}
            />
          ))}
        </AnimatePresence>

        <motion.div
          animate={{
            scale: ripples.length > 0 ? 1.04 : 1,
            rotate: ripples.length > 0 ? (activeTool === 'bell' ? [0, -2, 2, -2, 0] : [0, 1, -1, 0]) : 0,
          }}
          transition={{ duration: 0.1 }}
          className="relative"
        >
          {activeTool === 'woodblock' ? (
            <div className="relative flex h-44 w-44 items-center justify-center rounded-[38%] border-b-8 border-r-4 border-black/20 bg-gradient-to-br from-[#8B4513] to-[#5D2E0C] shadow-[0_20px_50px_rgba(0,0,0,0.3)] sm:h-64 sm:w-64">
              <div className="absolute left-1/4 top-1/2 h-3 w-1/2 rounded-full bg-black/40 blur-[2px] sm:h-4" />
              <div className="absolute left-1/4 top-4 h-1 w-1/2 rounded-full bg-white/10 blur-[1px]" />
            </div>
          ) : (
            <div className="relative">
              <div className="flex h-44 w-44 items-center justify-center rounded-full border-b-4 border-[#8B7D6E] bg-gradient-to-br from-[#DECAA4] via-[#C2A385] to-[#A37B5C] shadow-[0_30px_60px_rgba(163,123,92,0.4)] sm:h-64 sm:w-64">
                <div className="h-36 w-36 rounded-full border-4 border-white/20 sm:h-56 sm:w-56" />
              </div>
              <div className="absolute left-8 top-8 h-8 w-16 rotate-45 bg-white/30 blur-xl sm:left-10 sm:top-10 sm:h-10 sm:w-20" />
            </div>
          )}
        </motion.div>

        <p className="mt-8 text-center text-xs font-medium tracking-[0.2em] text-[#8B7D6E] opacity-70 dark:text-[#B0A090] sm:mt-16 sm:text-sm sm:tracking-[0.25em]">
          {autoTap ? 'Đang tự gõ theo nhịp' : activeTool === 'bell' ? 'Chạm để ngân chuông' : 'Chạm để gõ mõ'}
        </p>
      </div>

      <div className="border-t border-[#E8DFC9] bg-white/40 p-4 backdrop-blur-md dark:border-white/10 dark:bg-white/5 sm:p-6">
        <div className="mx-auto flex max-w-xl flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#5A4D41] dark:text-[#F5EDE0]">Tự gõ theo nhịp</p>
              <p className="text-xs text-[#8B7D6E] dark:text-[#DECAA4]/60">Phù hợp khi muốn giữ tiết tấu ổn định.</p>
            </div>
            <button
              onClick={() => setAutoTap((prev) => !prev)}
              className={`shrink-0 rounded-full p-3 transition-all ${
                autoTap ? 'bg-orange-500 text-white' : 'bg-white/80 text-[#A37B5C] dark:bg-white/10'
              }`}
            >
              {autoTap ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {PRESET_INTERVALS.map((preset) => (
              <button
                key={preset.value}
                onClick={() => setIntervalTime(preset.value)}
                className={`rounded-full px-3 py-1.5 text-sm transition-all ${
                  interval === preset.value
                    ? 'bg-[#5A4D41] text-white shadow-sm'
                    : 'bg-[#FCF9F3] text-[#8B7D6E] hover:bg-white dark:bg-white/5 dark:text-[#DECAA4]'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-[#8B7D6E] dark:text-[#DECAA4]/60">
              <span>Khoảng cách giữa các tiếng</span>
              <span>{(interval / 1000).toFixed(1)} giây</span>
            </div>
            <input
              type="range"
              min="500"
              max="5000"
              step="250"
              value={interval}
              onChange={(event) => setIntervalTime(Number(event.target.value))}
              className="h-1.5 w-full appearance-none rounded-full bg-[#E8DFC9] accent-[#A37B5C] dark:bg-white/10"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
