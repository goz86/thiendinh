import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Play, Pause, Volume2, Music } from 'lucide-react';

interface TempleToolsProps {
  onBack: () => void;
}

type ToolType = 'bell' | 'woodblock';

export const TempleTools: React.FC<TempleToolsProps> = ({ onBack }) => {
  const [activeTool, setActiveTool] = useState<ToolType>('woodblock');
  const [autoTap, setAutoTap] = useState(false);
  const [interval, setIntervalTime] = useState(2000);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const autoTapRef = useRef<any>(null);

  // Sound Synthesis: High Quality Bell (Chuông)
  const playBell = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;
    
    // Create multiple harmonics for a rich bell sound
    const frequencies = [220, 442, 770, 1100]; // Fundamental + harmonics
    frequencies.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      
      // Different envelope for each harmonic
      const attack = 0.005;
      const decay = 2 + index; // Higher harmonics decay faster
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.2 / (index + 1), now + attack);
      gain.gain.exponentialRampToValueAtTime(0.001, now + decay);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(now + decay + 0.1);
    });
  }, []);

  // Sound Synthesis: Hollow Woodblock (Mõ)
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
    osc.frequency.setValueAtTime(450, now); // Wooden characteristic frequency
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

  const triggerSound = useCallback((e?: React.MouseEvent | React.TouchEvent) => {
    if (activeTool === 'bell') playBell();
    else playWoodblock();

    // Visual ripple effect
    const id = Date.now();
    const x = e && 'clientX' in e ? e.clientX : window.innerWidth / 2;
    const y = e && 'clientY' in e ? e.clientY : window.innerHeight / 2;

    setRipples(prev => [...prev, { id, x, y }]);
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id));
    }, 1000);

    // Haptic feedback
    if ('vibrate' in navigator) navigator.vibrate(10);
  }, [activeTool, playBell, playWoodblock]);

  // Auto-tap logic
  useEffect(() => {
    if (autoTap) {
      autoTapRef.current = setInterval(() => {
        triggerSound();
      }, interval);
    } else {
      if (autoTapRef.current) clearInterval(autoTapRef.current);
    }
    return () => {
      if (autoTapRef.current) clearInterval(autoTapRef.current);
    };
  }, [autoTap, interval, triggerSound]);

  return (
    <div className="fixed inset-0 bg-[#FCF9F3] dark:bg-[#0d0b09] z-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 flex items-center justify-between relative z-20">
        <button 
          onClick={onBack}
          className="p-3 bg-white/80 dark:bg-white/5 rounded-full shadow-sm cursor-pointer hover:bg-white transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-[#A37B5C] dark:text-[#DECAA4]" />
        </button>
        <h3 className="text-xl font-medium text-[#4A3C31] dark:text-[#F5EDE0]">Chuông Mõ</h3>
        <div className="w-12 h-12" /> {/* Spacer */}
      </div>

      {/* Tool Selector */}
      <div className="flex justify-center gap-4 mb-8">
        <button
          onClick={() => { setActiveTool('woodblock'); setAutoTap(false); }}
          className={`px-6 py-2 rounded-full transition-all flex items-center gap-2 border cursor-pointer ${
            activeTool === 'woodblock' 
              ? 'bg-[#5D2E0C] text-white border-transparent shadow-lg' 
              : 'bg-white/60 dark:bg-white/5 text-[#8B7D6E] border-[#E8DFC9] dark:border-white/10'
          }`}
        >
          <Music className="w-4 h-4" />
          Mõ Gỗ
        </button>
        <button
          onClick={() => { setActiveTool('bell'); setAutoTap(false); }}
          className={`px-6 py-2 rounded-full transition-all flex items-center gap-2 border cursor-pointer ${
            activeTool === 'bell' 
              ? 'bg-[#A37B5C] text-white border-transparent shadow-lg' 
              : 'bg-white/60 dark:bg-white/5 text-[#8B7D6E] border-[#E8DFC9] dark:border-white/10'
          }`}
        >
          <Volume2 className="w-4 h-4" />
          Chuông Đại
        </button>
      </div>

      {/* Main interaction area */}
      <div 
        className="flex-1 relative flex flex-col items-center justify-center select-none touch-none overflow-hidden"
        style={{ cursor: 'pointer' }}
        onMouseDown={(e) => !autoTap && triggerSound(e)}
      >
        {/* Ripples */}
        <AnimatePresence>
          {ripples.map(ripple => (
            <motion.div
              key={ripple.id}
              initial={{ scale: 0, opacity: 0.5 }}
              animate={{ scale: 4, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute w-20 h-20 rounded-full border-2 border-[#C2A385]/30 pointer-events-none"
              style={{ left: ripple.x - 40, top: ripple.y - 40 }}
            />
          ))}
        </AnimatePresence>

        {/* The Instrument Visualization */}
        <motion.div
          animate={{ 
            scale: ripples.length > 0 ? 1.05 : 1,
            rotate: ripples.length > 0 ? (activeTool === 'bell' ? [0, -2, 2, -2, 0] : [0, 1, -1, 0]) : 0
          }}
          transition={{ duration: 0.1 }}
          className="relative group"
        >
          {activeTool === 'woodblock' ? (
             <div className="w-64 h-64 bg-gradient-to-br from-[#8B4513] to-[#5D2E0C] rounded-[40%] flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative border-b-8 border-r-4 border-black/20">
               {/* Woodblock mouth */}
               <div className="absolute top-1/2 left-1/4 w-1/2 h-4 bg-black/40 rounded-full blur-[2px]" />
               {/* Texture highlights */}
               <div className="absolute top-4 left-1/4 w-1/2 h-1 bg-white/10 blur-[1px] rounded-full" />
             </div>
          ) : (
             <div className="relative">
               <div className="w-64 h-64 bg-gradient-to-br from-[#DECAA4] via-[#C2A385] to-[#A37B5C] rounded-full flex items-center justify-center shadow-[0_30px_60px_rgba(163,123,92,0.4)] border-b-4 border-[#8B7D6E]">
                 <div className="w-56 h-56 rounded-full border-4 border-white/20" />
               </div>
               {/* Reflection light */}
               <div className="absolute top-10 left-10 w-20 h-10 bg-white/30 blur-xl rotate-45" />
             </div>
          )}
        </motion.div>

        <p className="mt-16 text-[#8B7D6E] dark:text-[#B0A090] font-medium tracking-widest opacity-60">
          CHẠM ĐỂ {activeTool === 'bell' ? 'THỈNH CHUÔNG' : 'GÕ MÕ'}
        </p>
      </div>

      {/* Auto Tap Controls */}
      {activeTool === 'woodblock' && (
        <div className="p-8 bg-white/40 dark:bg-white/5 border-t border-[#E8DFC9] dark:border-white/10 backdrop-blur-md">
          <div className="max-w-md mx-auto space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#5A4D41] dark:text-[#F5EDE0]">Tự động gõ</span>
              <button
                onClick={() => setAutoTap(!autoTap)}
                className={`p-3 rounded-full transition-all ${autoTap ? 'bg-orange-500 text-white' : 'bg-white/80 dark:bg-white/10 text-[#A37B5C]'}`}
              >
                {autoTap ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-[#8B7D6E] dark:text-[#DECAA4]/60">
                <span>Tốc độ</span>
                <span>{interval / 1000}s</span>
              </div>
              <input
                type="range"
                min="500"
                max="5000"
                step="500"
                value={interval}
                onChange={(e) => setIntervalTime(parseInt(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none bg-[#E8DFC9] dark:bg-white/10 accent-[#A37B5C]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
