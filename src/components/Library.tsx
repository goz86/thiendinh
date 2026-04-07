import React from 'react';
import { techniques } from '../data';
import { Wind, Moon, Brain, ChevronRight, Plus, Heart, Zap, Leaf, Snowflake, Flame, CloudMoon, BarChart3, Sun, MoonIcon, User, Shield, Bell, Disc, MessageSquare } from 'lucide-react';
import type { BreathingTechnique } from '../types';
import { getDailyQuote } from '../data/quotes';
import { getStats, syncWithCloud } from '../utils/storage';
import { ConfirmModal } from './ConfirmModal';

interface LibraryProps {
  onSelect: (technique: BreathingTechnique) => void;
  onCustom: () => void;
  onStats: () => void;
  onAuth: () => void;
  onLogout: () => void;
  onAdmin: () => void;
  onMala: () => void;
  onTempleTools: () => void;
  onJournal: () => void;
  user: any;
  darkMode: boolean;
  onToggleDark: () => void;
}

const iconMap: Record<string, React.ReactNode> = {
  box: <Brain className="w-6 h-6 text-[#A37B5C] dark:text-[#DECAA4]" />,
  '478': <Moon className="w-6 h-6 text-[#A37B5C] dark:text-[#DECAA4]" />,
  diaphragmatic: <Wind className="w-6 h-6 text-[#A37B5C] dark:text-[#DECAA4]" />,
  resonant: <Heart className="w-6 h-6 text-[#A37B5C] dark:text-[#DECAA4]" />,
  energizing: <Zap className="w-6 h-6 text-[#A37B5C] dark:text-[#DECAA4]" />,
  calm: <Leaf className="w-6 h-6 text-[#A37B5C] dark:text-[#DECAA4]" />,
  'wim-hof': <Snowflake className="w-6 h-6 text-[#A37B5C] dark:text-[#DECAA4]" />,
  pranayama: <Flame className="w-6 h-6 text-[#A37B5C] dark:text-[#DECAA4]" />,
  sleep: <CloudMoon className="w-6 h-6 text-[#A37B5C] dark:text-[#DECAA4]" />,
};

export const Library: React.FC<LibraryProps> = ({ onSelect, onCustom, onStats, onAuth, onLogout, onAdmin, onMala, onTempleTools, onJournal, user, darkMode, onToggleDark }) => {
  const [isLogoutModalOpen, setIsLogoutModalOpen] = React.useState(false);
  const [stats, setStats] = React.useState(getStats());
  const quote = getDailyQuote();

  React.useEffect(() => {
    setStats(getStats());
    
    if (user) {
      syncWithCloud().then((updated) => {
        if (updated) {
          setStats(getStats());
        }
      });
    }
  }, [user]);

  return (
    <div className="min-h-screen p-6 max-w-4xl mx-auto pt-10 overflow-y-auto pb-20">
      {/* Top bar */}
      <div className="flex justify-between items-center mb-8 gap-3">
        <button
          onClick={onStats}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white/60 dark:bg-white/5 backdrop-blur-md border border-[#E8DFC9] dark:border-white/10 rounded-full hover:bg-white dark:hover:bg-white/10 transition-all cursor-pointer shadow-sm"
        >
          <BarChart3 className="w-4 h-4 text-[#A37B5C] dark:text-[#DECAA4]" />
          <span className="text-sm text-[#5A4D41] dark:text-[#F5EDE0] font-medium">{stats.totalSessions} buổi</span>
          {stats.streak > 0 && (
            <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300 px-2 py-0.5 rounded-full font-medium">🔥 {stats.streak}</span>
          )}
        </button>
        
        <div className="flex gap-2">
          {user && user.email === 'heeffgh123@gmail.com' && (
            <button
              onClick={onAdmin}
              className="p-3 bg-white/60 dark:bg-white/5 backdrop-blur-md border border-[#E8DFC9] dark:border-white/10 rounded-full hover:bg-white dark:hover:bg-white/10 transition-all cursor-pointer shadow-sm flex items-center justify-center"
              title="Quản trị hệ thống"
            >
              <Shield className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
            </button>
          )}
          <button
            onClick={() => {
              if (user) {
                setIsLogoutModalOpen(true);
              } else {
                onAuth();
              }
            }}
            className={`p-3 backdrop-blur-md border rounded-full transition-all cursor-pointer shadow-sm relative group ${
              user ? 'border-green-400/30 bg-green-50/40 dark:bg-green-900/10' : 'bg-white/60 dark:bg-white/5 border-[#E8DFC9] dark:border-white/10 hover:bg-white dark:hover:bg-white/10'
            }`}
            title={user ? 'Đăng xuất' : 'Đăng nhập'}
          >
            {user && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-[#0d0b09] rounded-full" />
            )}
            {user ? (
              <div className="w-5 h-5 flex items-center justify-center text-[10px] font-black text-green-700 dark:text-green-400 tracking-tighter">
                {user.email?.split('@')[0].substring(0, 2).toUpperCase()}
              </div>
            ) : (
              <User className="w-5 h-5 text-[#A37B5C] dark:text-[#DECAA4]" />
            )}
          </button>
          
          <button
            onClick={onToggleDark}
            className="p-3 bg-white/60 dark:bg-white/5 backdrop-blur-md border border-[#E8DFC9] dark:border-white/10 rounded-full hover:bg-white dark:hover:bg-white/10 transition-all cursor-pointer shadow-sm"
          >
            {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <MoonIcon className="w-5 h-5 text-[#A37B5C]" />}
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="mb-8 text-center text-[#5A4D41] dark:text-[#F5EDE0]">
        <Wind className="w-12 h-12 mx-auto text-[#C2A385] dark:text-[#DECAA4] mb-4" />
        <h1 className="text-4xl font-normal mb-2">Hơi Thở Chánh Niệm</h1>
        <p className="text-[#8B7D6E] dark:text-[#B0A090]">Chọn một bài tập thở để kết nối lại với tâm trí và cơ thể bạn.</p>
      </div>

      {/* Daily Quote */}
      <div className="mb-10 mx-auto max-w-xl">
        <div className="bg-white/50 dark:bg-white/5 backdrop-blur-md border border-[#E8DFC9] dark:border-white/10 rounded-2xl px-6 py-5 text-center shadow-sm">
          <p className="text-sm text-[#5A4D41] dark:text-[#DECAA4] italic leading-relaxed">"{quote}"</p>
        </div>
      </div>

      {/* Technique Grid */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {techniques.map(tech => (
          <button
            key={tech.id}
            onClick={() => onSelect(tech)}
            className="group relative flex flex-col text-left p-6 bg-white/60 dark:bg-white/5 backdrop-blur-md hover:bg-white/90 dark:hover:bg-white/10 border border-[#E8DFC9] dark:border-white/10 rounded-2xl transition-all hover:-translate-y-1 shadow-[0_4px_20px_-4px_rgba(163,123,92,0.1)] hover:shadow-[0_8px_30px_-4px_rgba(163,123,92,0.2)] cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-[#FCF9F3] dark:bg-white/5 rounded-xl shadow-inner border border-[#F2EAE0] dark:border-white/5">
                {iconMap[tech.id] || <Wind className="w-6 h-6 text-[#A37B5C] dark:text-[#DECAA4]" />}
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#FCF9F3] dark:bg-white/5 text-[#A37B5C] dark:text-[#DECAA4] border border-[#F2EAE0] dark:border-white/5">
                {tech.benefit}
              </span>
            </div>
            
            <h3 className="text-lg font-medium mb-2 text-[#4A3C31] dark:text-[#F5EDE0]">{tech.name}</h3>
            <p className="text-sm text-[#8B7D6E] dark:text-[#B0A090] mb-5 flex-grow leading-relaxed">{tech.description}</p>
            
            <div className="flex items-center justify-between mt-auto">
              <div className="flex space-x-1 text-xs text-[#C2A385] dark:text-[#DECAA4]/70 font-mono font-medium">
                <span>{tech.pattern.inhale}</span>
                <span>-</span>
                <span>{tech.pattern.hold1}</span>
                <span>-</span>
                <span>{tech.pattern.exhale}</span>
                <span>-</span>
                <span>{tech.pattern.hold2}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-[#C2A385] dark:text-[#DECAA4]/50 group-hover:text-[#A37B5C] dark:group-hover:text-[#DECAA4] transition-colors" />
            </div>
          </button>
        ))}

        {/* Custom */}
        <button
          onClick={onCustom}
          className="group relative flex flex-col text-left p-6 border-2 border-dashed border-[#DECAA4] dark:border-white/15 hover:border-[#A37B5C] dark:hover:border-[#DECAA4] rounded-2xl transition-all bg-white/20 dark:bg-white/[0.02] hover:bg-white/60 dark:hover:bg-white/5 cursor-pointer items-center justify-center min-h-[250px]"
        >
          <div className="p-4 bg-[#FCF9F3] dark:bg-white/5 rounded-full mb-4 group-hover:scale-110 transition-transform shadow-sm">
            <Plus className="w-8 h-8 text-[#A37B5C] dark:text-[#DECAA4]" />
          </div>
          <h3 className="text-lg font-medium text-[#5A4D41] dark:text-[#F5EDE0]">Tạo Bài Tập Riêng</h3>
          <p className="text-sm text-[#8B7D6E] dark:text-[#B0A090] mt-2 text-center">Thiết lập nhịp thở theo ý bạn</p>
        </button>
      </div>

      {/* Utilities Section */}
      <div className="mt-16 mb-8 text-center sm:text-left">
        <h2 className="text-xl font-medium text-[#4A3C31] dark:text-[#F5EDE0] mb-6 flex items-center justify-center sm:justify-start gap-2">
          <Zap className="w-5 h-5 text-[#A37B5C]" />
          Tiện ích bổ trợ
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <button
            onClick={onTempleTools}
            className="flex flex-col items-center p-5 bg-white/40 dark:bg-white/5 backdrop-blur-sm border border-[#E8DFC9] dark:border-white/10 rounded-2xl hover:bg-white dark:hover:bg-white/10 transition-all cursor-pointer group"
          >
            <div className="p-3 bg-[#FCF9F3] dark:bg-white/5 rounded-xl mb-3 group-hover:scale-110 transition-transform">
              <Bell className="w-6 h-6 text-[#A37B5C] dark:text-[#DECAA4]" />
            </div>
            <span className="text-sm font-medium text-[#5A4D41] dark:text-[#F5EDE0]">Chuông Mõ</span>
          </button>
          
          <button
            onClick={onMala}
            className="flex flex-col items-center p-5 bg-white/40 dark:bg-white/5 backdrop-blur-sm border border-[#E8DFC9] dark:border-white/10 rounded-2xl hover:bg-white dark:hover:bg-white/10 transition-all cursor-pointer group"
          >
            <div className="p-3 bg-[#FCF9F3] dark:bg-white/5 rounded-xl mb-3 group-hover:scale-110 transition-transform">
              <Disc className="w-6 h-6 text-[#A37B5C] dark:text-[#DECAA4]" />
            </div>
            <span className="text-sm font-medium text-[#5A4D41] dark:text-[#F5EDE0]">Lần Chuỗi Hạt</span>
          </button>

          <button
            onClick={onJournal}
            className="flex flex-col items-center p-5 bg-white/40 dark:bg-white/5 backdrop-blur-sm border border-[#E8DFC9] dark:border-white/10 rounded-2xl hover:bg-white dark:hover:bg-white/10 transition-all cursor-pointer group"
          >
            <div className="p-3 bg-[#FCF9F3] dark:bg-white/5 rounded-xl mb-3 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-6 h-6 text-[#A37B5C] dark:text-[#DECAA4]" />
            </div>
            <span className="text-sm font-medium text-[#5A4D41] dark:text-[#F5EDE0]">Nhật Ký</span>
          </button>
          
          <button
            onClick={onStats}
            className="flex flex-col items-center p-5 bg-white/40 dark:bg-white/5 backdrop-blur-sm border border-[#E8DFC9] dark:border-white/10 rounded-2xl hover:bg-white dark:hover:bg-white/10 transition-all cursor-pointer group"
          >
            <div className="p-3 bg-[#FCF9F3] dark:bg-white/5 rounded-xl mb-3 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-6 h-6 text-[#A37B5C] dark:text-[#DECAA4]" />
            </div>
            <span className="text-sm font-medium text-[#5A4D41] dark:text-[#F5EDE0]">Thành Tựu</span>
          </button>
        </div>
      </div>

      {/* PWA Install hint */}
      <div className="mt-10 text-center">
        <p className="text-xs text-[#C2A385] dark:text-[#B0A090]/60">Thiền Định — © 2026 — goz ☁️</p>
      </div>
      <ConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={onLogout}
        title="Đăng xuất"
        message="Bạn có chắc chắn muốn đăng xuất? Lịch sử thiền của bạn sẽ vẫn được lưu an toàn trên đám mây."
        confirmText="Đăng xuất"
        cancelText="Để sau"
      />
    </div>
  );
};
