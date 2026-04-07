import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, RotateCcw } from 'lucide-react';

interface MalaCounterProps {
  onBack: () => void;
}

export const MalaCounter: React.FC<MalaCounterProps> = ({ onBack }) => {
  const [count, setCount] = useState(0);
  const [beads, setBeads] = useState<number[]>([0, 1, 2, 3, 4, 5, 6, 7]); // Visible beads
  const audioContextRef = useRef<AudioContext | null>(null);

  // Sound Synthesis: Wooden Bead "Clack"
  const playClack = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'square';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, ctx.currentTime);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  }, []);

  const handleNext = () => {
    setCount(prev => prev + 1);
    playClack();
    
    // Animate beads sliding down
    setBeads(prev => {
      const next = [...prev];
      next.pop();
      return [Math.random(), ...next]; // Keep it visual
    });

    // Provide haptic feedback if available
    if ('vibrate' in navigator) {
      navigator.vibrate(15);
    }
  };

  const handleReset = () => {
    setCount(0);
    playClack();
    if ('vibrate' in navigator) navigator.vibrate([10, 50, 10]);
  };

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
        <div className="flex flex-col items-center">
          <span className="text-xs uppercase tracking-widest text-[#8B7D6E] dark:text-[#DECAA4]/60 font-semibold mb-1">Số chuỗi</span>
          <div className="px-6 py-2 bg-white/80 dark:bg-white/5 rounded-2xl shadow-inner border border-[#E8DFC9] dark:border-white/10 min-w-[100px] text-center">
            <span className="text-2xl font-mono font-bold text-[#4A3C31] dark:text-[#F5EDE0]">{count}</span>
          </div>
        </div>
        <button 
          onClick={handleReset}
          className="p-3 bg-white/80 dark:bg-white/5 rounded-full shadow-sm cursor-pointer hover:bg-white transition-colors"
          title="Đặt lại"
        >
          <RotateCcw className="w-5 h-5 text-[#A37B5C] dark:text-[#DECAA4]" />
        </button>
      </div>

      {/* Main interaction area */}
      <div 
        className="flex-1 relative flex flex-col items-center justify-center cursor-pointer select-none touch-none"
        onClick={handleNext}
      >
        {/* The String */}
        <div className="absolute w-[2px] h-full bg-[#A37B5C]/30 dark:bg-[#DECAA4]/20 left-1/2 -translate-x-1/2" />
        
        {/* The Beads */}
        <div className="flex flex-col gap-6 items-center">
          <AnimatePresence initial={false}>
            {beads.map((beadId, index) => (
              <motion.div
                key={beadId}
                layout
                initial={{ opacity: 0, y: -100 }}
                animate={{ 
                  opacity: index === 0 ? 0.3 : 1, 
                  scale: index === 3 ? 1.3 : (index > 3 ? 0.9 - (index-3)*0.1 : 0.8 + index*0.1),
                  y: 0 
                }}
                exit={{ opacity: 0, y: 100 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className={`w-16 h-16 rounded-full shadow-xl relative overflow-hidden ${
                   index === 3 
                    ? 'bg-gradient-to-br from-[#8B4513] to-[#5D2E0C] border-2 border-amber-950/20' 
                    : 'bg-gradient-to-br from-[#A0522D] to-[#8B4513] opacity-80'
                }`}
              >
                {/* Highlight/Shine for 3D look */}
                <div className="absolute top-2 left-3 w-4 h-4 bg-white/20 blur-sm rounded-full" />
                <div className="absolute bottom-2 right-3 w-6 h-6 bg-black/20 blur-md rounded-full" />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Floating Text effect on click */}
        <div className="absolute bottom-1/4 transform translate-y-20 pointer-events-none">
           <AnimatePresence>
             {count > 0 && (
               <motion.span
                 key={count}
                 initial={{ opacity: 0, y: 0 }}
                 animate={{ opacity: 0.8, y: -40 }}
                 exit={{ opacity: 0 }}
                 className="text-[#A37B5C] dark:text-[#DECAA4] text-sm font-medium tracking-widest italic"
               >
                 Nam Mô A Di Đà Phật
               </motion.span>
             )}
           </AnimatePresence>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-8 text-center bg-transparent pointer-events-none">
        <p className="text-sm text-[#8B7D6E] dark:text-[#B0A090] opacity-60">Chạm vào bất cứ đâu để lần chuỗi</p>
      </div>
    </div>
  );
};
