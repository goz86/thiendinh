import React, { useState } from 'react';
import { ArrowLeft, Play, Minus, Plus } from 'lucide-react';
import type { BreathingTechnique } from '../types';

interface CustomFormProps {
  onStart: (technique: BreathingTechnique) => void;
  onBack: () => void;
}

const StepControl: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  subtitle: string;
}> = ({ label, value, min, max, onChange, subtitle }) => {
  return (
    <div className="flex flex-col items-center gap-1 sm:gap-3 p-3 sm:p-6 bg-white/50 dark:bg-white/5 backdrop-blur-md rounded-2xl border border-[#E8DFC9] dark:border-white/10 shadow-sm">
      <span className="text-xs sm:text-sm font-medium text-[#8B7D6E] dark:text-[#B0A090]">{label}</span>
      <div className="flex items-center gap-1.5 sm:gap-4">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="w-7 h-7 sm:w-10 sm:h-10 flex-shrink-0 flex items-center justify-center rounded-full bg-[#FCF9F3] dark:bg-white/5 border border-[#DECAA4] dark:border-white/10 text-[#A37B5C] dark:text-[#DECAA4] hover:bg-white dark:hover:bg-white/10 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
        </button>
        <span className="text-3xl sm:text-5xl font-light font-mono text-[#4A3C31] dark:text-[#F5EDE0] w-8 sm:w-16 text-center">{value}</span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="w-7 h-7 sm:w-10 sm:h-10 flex-shrink-0 flex items-center justify-center rounded-full bg-[#FCF9F3] dark:bg-white/5 border border-[#DECAA4] dark:border-white/10 text-[#A37B5C] dark:text-[#DECAA4] hover:bg-white dark:hover:bg-white/10 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
        </button>
      </div>
      <span className="text-[10px] sm:text-xs text-[#C2A385] dark:text-[#B0A090] mt-1 sm:mt-0">{subtitle}</span>
    </div>
  );
};

export const CustomForm: React.FC<CustomFormProps> = ({ onStart, onBack }) => {
  const [inhale, setInhale] = useState(4);
  const [hold, setHold] = useState(4);
  const [exhale, setExhale] = useState(4);

  const totalCycle = inhale + hold + exhale;

  const handleStart = () => {
    onStart({
      id: 'custom',
      name: 'Nhịp Thở Tuỳ Chỉnh',
      description: `Nhịp thở ${inhale}-${hold}-${exhale} do bạn tự thiết lập.`,
      benefit: 'Cá nhân hoá',
      pattern: { inhale, hold1: hold, exhale, hold2: 0 },
      color: 'bg-[#B08A63]'
    });
  };

  return (
    <div className="min-h-screen p-6 max-w-2xl mx-auto pt-12 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        <button
          onClick={onBack}
          className="p-3 bg-white/50 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 shadow-sm rounded-full transition-all cursor-pointer border border-[#E8DFC9] dark:border-white/10"
        >
          <ArrowLeft className="w-5 h-5 text-[#A37B5C] dark:text-[#DECAA4]" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-[#4A3C31] dark:text-[#F5EDE0]">Tạo Bài Tập Riêng</h1>
          <p className="text-sm text-[#8B7D6E] dark:text-[#B0A090] mt-1">Thiết lập nhịp thở theo ý bạn</p>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-8">
        <StepControl label="Hít vào" value={inhale} min={1} max={15} onChange={setInhale} subtitle="giây" />
        <StepControl label="Giữ hơi" value={hold} min={0} max={20} onChange={setHold} subtitle="giây" />
        <StepControl label="Thở ra" value={exhale} min={1} max={20} onChange={setExhale} subtitle="giây" />
      </div>

      {/* Preview */}
      <div className="bg-white/60 dark:bg-white/5 backdrop-blur-md rounded-2xl border border-[#E8DFC9] dark:border-white/10 p-6 mb-8 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-[#8B7D6E] dark:text-[#B0A090]">Tổng quan một chu kỳ</span>
          <span className="text-sm font-mono text-[#A37B5C] dark:text-[#DECAA4]">{totalCycle} giây</span>
        </div>

        <div className="flex rounded-full overflow-hidden h-3 gap-[2px]">
          <div className="bg-[#A37B5C] rounded-l-full transition-all duration-300" style={{ flex: inhale }} />
          {hold > 0 && <div className="bg-[#DECAA4] transition-all duration-300" style={{ flex: hold }} />}
          <div className="bg-[#8BA6B8] rounded-r-full transition-all duration-300" style={{ flex: exhale }} />
        </div>

        <div className="flex mt-2 text-xs">
          <div style={{ flex: inhale }} className="text-[#A37B5C] dark:text-[#DECAA4] font-medium">Hít {inhale}s</div>
          {hold > 0 && <div style={{ flex: hold }} className="text-[#C2A385] dark:text-[#B0A090] text-center font-medium">Giữ hơi {hold}s</div>}
          <div style={{ flex: exhale }} className="text-[#8BA6B8] text-right font-medium">Thở {exhale}s</div>
        </div>
      </div>

      {/* Suggestions */}
      <div className="mb-8">
        <span className="text-sm font-medium text-[#8B7D6E] dark:text-[#B0A090] mb-3 block">Gợi ý nhanh</span>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Thư giãn', i: 4, h: 0, e: 8 },
            { label: 'Cân bằng', i: 4, h: 4, e: 4 },
            { label: 'Năng lượng', i: 2, h: 0, e: 2 },
            { label: 'Ngủ sâu', i: 4, h: 7, e: 8 },
            { label: 'Tĩnh lặng', i: 6, h: 0, e: 10 },
          ].map(s => (
            <button
              key={s.label}
              onClick={() => { setInhale(s.i); setHold(s.h); setExhale(s.e); }}
              className="px-4 py-2 rounded-full bg-[#FCF9F3] dark:bg-white/5 border border-[#E8DFC9] dark:border-white/10 text-sm text-[#5A4D41] dark:text-[#DECAA4] hover:bg-white dark:hover:bg-white/10 hover:border-[#C2A385] transition-all cursor-pointer"
            >
              {s.label} ({s.i}-{s.h}-{s.e})
            </button>
          ))}
        </div>
      </div>

      {/* Start */}
      <button
        onClick={handleStart}
        className="w-full py-4 bg-[#5A4D41] text-white rounded-full font-medium hover:bg-[#4A3C31] transition-all shadow-[0_8px_20px_rgba(90,77,65,0.2)] hover:shadow-[0_10px_25px_rgba(90,77,65,0.3)] cursor-pointer text-lg flex items-center justify-center gap-3"
      >
        <Play className="w-5 h-5" />
        Bắt Đầu Thở
      </button>
    </div>
  );
};
