import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { techniques } from '../data';
import { guidedSessions } from '../data/guidedSessions';
import {
  Wind,
  Moon,
  Brain,
  ChevronRight,
  Plus,
  Heart,
  Zap,
  Leaf,
  Snowflake,
  Flame,
  CloudMoon,
  BarChart3,
  Sun,
  MoonIcon,
  User,
  Shield,
  Bell,
  Disc,
  MessageSquare,
  PenLine,
  Check,
  Flower2,
  Cloud,
  CloudRain,
  BrainCircuit,
  BedSingle,
  Star,
  ChevronLeft,
} from 'lucide-react';
import type { BreathingTechnique, Mood } from '../types';
import { getDailyQuote } from '../data/quotes';
import {
  addJournalEntry,
  getLocalDateTimeString,
  syncWithCloud,
} from '../utils/storage';
import { getUserAvatar, getUserDisplayName, isAdminEmail } from '../utils/auth';
import { loadFavoriteTechniqueIds, subscribeToFavoriteTechnique, toggleFavoriteTechnique } from '../utils/favorites';

interface LibraryProps {
  onSelect: (technique: BreathingTechnique) => void;
  onCustom: () => void;
  onStats: () => void;
  onAuth: () => void;
  onProfile: () => void;
  onAdmin: () => void;
  onMala: () => void;
  onTempleTools: () => void;
  onJournal: () => void;
  user: any;
  darkMode: boolean;
  onToggleDark: () => void;
}

const iconMap: Record<string, React.ReactNode> = {
  box: <Brain className="h-6 w-6 text-[#A37B5C] dark:text-[#DECAA4]" />,
  '478': <Moon className="h-6 w-6 text-[#A37B5C] dark:text-[#DECAA4]" />,
  diaphragmatic: <Wind className="h-6 w-6 text-[#A37B5C] dark:text-[#DECAA4]" />,
  resonant: <Heart className="h-6 w-6 text-[#A37B5C] dark:text-[#DECAA4]" />,
  energizing: <Zap className="h-6 w-6 text-[#A37B5C] dark:text-[#DECAA4]" />,
  calm: <Leaf className="h-6 w-6 text-[#A37B5C] dark:text-[#DECAA4]" />,
  'wim-hof': <Snowflake className="h-6 w-6 text-[#A37B5C] dark:text-[#DECAA4]" />,
  pranayama: <Flame className="h-6 w-6 text-[#A37B5C] dark:text-[#DECAA4]" />,
  sleep: <CloudMoon className="h-6 w-6 text-[#A37B5C] dark:text-[#DECAA4]" />,
  coherent: <Heart className="h-6 w-6 text-[#A37B5C] dark:text-[#DECAA4]" />,
  'physiological-sigh': <Zap className="h-6 w-6 text-[#A37B5C] dark:text-[#DECAA4]" />,
  'alternate-nostril': <Wind className="h-6 w-6 text-[#A37B5C] dark:text-[#DECAA4]" />,
  ocean: <Zap className="h-6 w-6 text-[#A37B5C] dark:text-[#DECAA4]" />,
};

const moodOptions: Array<{ value: Mood; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { value: 'peaceful', label: 'Bình an', icon: Flower2 },
  { value: 'calm', label: 'Hạnh phúc', icon: Leaf },
  { value: 'neutral', label: 'Bình thường', icon: Cloud },
  { value: 'tired', label: 'Hơi mệt', icon: BedSingle },
  { value: 'anxious', label: 'Lo lắng', icon: BrainCircuit },
  { value: 'sad', label: 'Không vui', icon: CloudRain },
];

const cleanText = (value: string) =>
  value
    .replaceAll('沼?', 'ở')
    .replaceAll('Th沼?', 'Thở')
    .replaceAll('B챙nh', 'Bình')
    .replaceAll('T칫nh', 'Tĩnh')
    .replaceAll('Li챗n', 'Liên')
    .replaceAll('Ti梳퓆', 'Tiến')
    .replaceAll('Ti沼뇆', 'Tiện')
    .replaceAll('챠ch', 'ích')
    .replaceAll('h沼?tr沼?', 'hỗ trợ')
    .replaceAll('L梳쬷', 'Lần')
    .replaceAll('Chu沼뾦', 'chuỗi')
    .replaceAll('Nh梳춗 K첵', 'Nhật ký')
    .replaceAll('T梳죓', 'Tạo')
    .replaceAll('Ri챗ng', 'riêng')
    .replaceAll('thi沼걆', 'thiền')
    .replaceAll('Th沼?H沼셮', 'Thở Hộp')
    .replaceAll('Th沼?B沼쩸g', 'Thở Bụng')
    .replaceAll('C퉤 ho횪nh', 'Cơ hoành')
    .replaceAll('Th沼?C沼셬g H튼沼웢g', 'Thở Cộng Hưởng')
    .replaceAll('Th沼?N훱ng L튼沼즢g', 'Thở Năng Lượng')
    .replaceAll('Th沼?T칫nh L梳톘g (2-1)', 'Thở Tĩnh Lặng (2-1)')
    .replaceAll('Th沼?V횪o Gi梳쩭 Ng沼?', 'Thở Vào Giấc Ngủ')
    .replaceAll('Gi첬p ng沼?ngon', 'Giúp ngủ ngon')
    .replaceAll('Th튼 gi찾n s창u', 'Thư giãn sâu')
    .replaceAll('Xoa d沼땥 stress', 'Xoa dịu stress')
    .replaceAll('Ng沼?s창u', 'Ngủ sâu')
    .replaceAll('T훱ng n훱ng l튼沼즢g', 'Tăng năng lượng')
    .replaceAll('C창n b梳켷g n훱ng l튼沼즢g', 'Cân bằng năng lượng')
    .replaceAll('Gi梳즡 lo 창u', 'Giảm lo âu')
    .replaceAll('T tập trung & Bình tĩnh', 'Tập trung & Bình tĩnh');

export const Library: React.FC<LibraryProps> = ({
  onSelect,
  onCustom,
  onStats,
  onAuth,
  onProfile,
  onAdmin,
  onMala,
  onTempleTools,
  onJournal,
  user,
  darkMode,
  onToggleDark,
}) => {
  const [quickMood, setQuickMood] = React.useState<Mood>('peaceful');
  const [quickNote, setQuickNote] = React.useState('');
  const [quickSaved, setQuickSaved] = React.useState(false);
  // Start in the middle of our tripled set for infinite feel
  const [carouselIndex, setCarouselIndex] = useState(guidedSessions.length);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);
  const CARD_WIDTH_TOTAL = 272; // width + gap
  const [favoriteTechniqueIds, setFavoriteTechniqueIds] = React.useState<string[]>(() => loadFavoriteTechniqueIds());
  const quote = getDailyQuote();
  const userName = getUserDisplayName(user);

  React.useEffect(() => {
    if (isCarouselPaused) return;
    const interval = setInterval(() => {
      setCarouselIndex(prev => {
        const next = prev + 1;
        // If we reach the end of the 3rd set, jump back to middle copy
        if (next >= guidedSessions.length * 2) {
          return guidedSessions.length; 
        }
        return next;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [isCarouselPaused, guidedSessions.length]);
  const userAvatar = getUserAvatar(user);
  const orderedTechniques = React.useMemo(() => {
    if (favoriteTechniqueIds.length === 0) return techniques;

    const favoriteSet = new Set(favoriteTechniqueIds);
    const favoriteItems = favoriteTechniqueIds
      .map((favoriteId) => techniques.find((technique) => technique.id === favoriteId))
      .filter((technique): technique is BreathingTechnique => Boolean(technique));
    const otherItems = techniques.filter((technique) => !favoriteSet.has(technique.id));

    return [...favoriteItems, ...otherItems];
  }, [favoriteTechniqueIds]);

  React.useEffect(() => {
    if (user) {
      syncWithCloud();
    }
  }, [user]);

  React.useEffect(() => subscribeToFavoriteTechnique(() => setFavoriteTechniqueIds(loadFavoriteTechniqueIds())), []);

  React.useEffect(() => {
    if (!quickSaved) return undefined;
    const timer = window.setTimeout(() => setQuickSaved(false), 2500);
    return () => window.clearTimeout(timer);
  }, [quickSaved]);

  const handleSaveQuickNote = async () => {
    const note = quickNote.trim();
    if (!note) return;

    await addJournalEntry({
      date: getLocalDateTimeString(new Date()),
      mood: quickMood,
      note,
    });
    setQuickNote('');
    setQuickSaved(true);
  };

  const handleToggleFavorite = (techniqueId: string) => {
    setFavoriteTechniqueIds(toggleFavoriteTechnique(techniqueId));
  };

  return (
    <div className="mx-auto min-h-screen max-w-4xl overflow-y-auto px-4 pb-32 pt-8 sm:px-6 sm:pt-10">
      <div className="mb-8 flex items-center justify-between gap-3">
        <div className="ml-auto flex gap-2">
          {user && isAdminEmail(user.email) && (
            <button
              onClick={onAdmin}
              className="flex items-center justify-center rounded-full border border-[#E8DFC9] bg-white/60 p-3 shadow-sm transition-all hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
              title="Quản trị hệ thống"
            >
              <Shield className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
            </button>
          )}

          <button
            onClick={() => {
              if (user) onProfile();
              else onAuth();
            }}
            className={`relative border shadow-sm transition-all ${
              user
                ? 'flex items-center gap-3 rounded-full border-green-400/30 bg-green-50/40 px-4 py-2.5 dark:bg-green-900/10'
                : 'rounded-full border-[#E8DFC9] bg-white/60 p-3 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10'
            }`}
            title={user ? 'Hồ sơ người dùng' : 'Đăng nhập'}
          >
            {user && <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-green-500 dark:border-[#0d0b09]" />}
            {user ? (
              <>
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-sm dark:bg-black/20">
                  {userAvatar}
                </div>
                <span className="max-w-[120px] truncate text-sm font-medium text-[#4A3C31] dark:text-[#F5EDE0]">{userName}</span>
              </>
            ) : (
              <User className="h-5 w-5 text-[#A37B5C] dark:text-[#DECAA4]" />
            )}
          </button>

          <button
            onClick={onToggleDark}
            className="rounded-full border border-[#E8DFC9] bg-white/60 p-3 shadow-sm transition-all hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
          >
            {darkMode ? <Sun className="h-5 w-5 text-amber-400" /> : <MoonIcon className="h-5 w-5 text-[#A37B5C]" />}
          </button>
        </div>
      </div>

      <div className="mb-8 text-center text-[#5A4D41] dark:text-[#F5EDE0]">
        <Wind className="mx-auto mb-4 h-12 w-12 text-[#C2A385] dark:text-[#DECAA4]" />
        <h1 className="mb-2 text-4xl font-normal">Hơi Thở Chánh Niệm</h1>
        <p className="text-[#8B7D6E] dark:text-[#B0A090]">Chọn một bài thở để nuôi dưỡng tâm trí và cơ thể vững vàng.</p>
      </div>

      <div className="mx-auto mb-10 max-w-xl">
        <div className="rounded-2xl border border-[#E8DFC9] bg-white/50 px-6 py-5 text-center shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5">
          <p className="text-sm italic leading-relaxed text-[#5A4D41] dark:text-[#DECAA4]">"{quote}"</p>
        </div>
      </div>

      <div className="mb-10 relative group">
        <h2 className="mb-4 text-xl font-bold text-[#4A3C31] dark:text-[#F5EDE0]">Thiền Có Hướng Dẫn</h2>
        
        {/* Navigation Arrows for PC */}
        <div className="absolute right-0 top-0 z-10 hidden sm:flex gap-2">
          <button 
            onClick={() => setCarouselIndex(prev => prev - 1)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E8DFC9] bg-white/60 text-[#A37B5C] shadow-sm transition-all hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-[#DECAA4]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button 
            onClick={() => setCarouselIndex(prev => prev + 1)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E8DFC9] bg-white/60 text-[#A37B5C] shadow-sm transition-all hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-[#DECAA4]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        
        {/* Carousel Container */}
        <div 
          className="relative w-full overflow-hidden rounded-[28px]"
          onMouseEnter={() => setIsCarouselPaused(true)}
          onMouseLeave={() => setIsCarouselPaused(false)}
        >
          <motion.div 
            className="flex gap-4 cursor-grab active:cursor-grabbing pb-2"
            drag="x"
            // Allow dragging freely, logic will snap it back
            dragConstraints={{ left: -10000, right: 10000 }}
            animate={{ x: -(carouselIndex * CARD_WIDTH_TOTAL) }}
            transition={{ type: "spring", damping: 30, stiffness: 200 }}
            onUpdate={(latest) => {
              // Seamless wrap around:
              // If we drag beyond the bounds of one full set, jump instantly
              const x = latest.x as number;
              const currentPos = -x / CARD_WIDTH_TOTAL;
              
              if (currentPos >= guidedSessions.length * 2) {
                setCarouselIndex(prev => prev - guidedSessions.length);
              } else if (currentPos <= guidedSessions.length - 1) {
                setCarouselIndex(prev => prev + guidedSessions.length);
              }
            }}
            onDragEnd={(_, info) => {
              const threshold = 50;
              const dragOffset = Math.round(info.offset.x / CARD_WIDTH_TOTAL);
              if (info.offset.x < -threshold) {
                setCarouselIndex(prev => prev + Math.max(1, Math.abs(dragOffset)));
              } else if (info.offset.x > threshold) {
                setCarouselIndex(prev => prev - Math.max(1, Math.abs(dragOffset)));
              }
            }}
          >
            {/* Render items 3 times for seamless looping buffer */}
            {[...guidedSessions, ...guidedSessions, ...guidedSessions].map((session, idx) => (
              <button
                key={`${session.id}-${idx}`}
                onClick={() => {
                  const targetTech = techniques.find(t => t.id === session.techniqueId) || techniques[0];
                  onSelect({ ...targetTech, isGuided: true, guidedSessionId: session.id } as BreathingTechnique & { isGuided?: boolean, guidedSessionId?: string });
                }}
                className={`group relative flex w-64 shrink-0 flex-col items-start rounded-[24px] border border-[#E8DFC9] bg-gradient-to-br from-[#FCF9F3] to-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md dark:border-white/10 dark:from-[#2a2420] dark:to-[#1a1612] text-left ${(idx % guidedSessions.length) === (carouselIndex % guidedSessions.length) ? 'ring-2 ring-[#C2A385]/30' : 'opacity-80 scale-95'}`}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm dark:bg-black/20">
                  {session.icon}
                </div>
                <h3 className="mb-2 text-lg font-bold text-[#4A3C31] dark:text-[#F5EDE0]">{session.name}</h3>
                <p className="mb-4 text-xs leading-relaxed text-[#8B7D6E] dark:text-[#B0A090] line-clamp-2">
                  {session.description}
                </p>
                <div className="mt-auto flex w-full items-center justify-between text-xs font-semibold text-[#A37B5C] dark:text-[#DECAA4]">
                  <span>⏱ {session.totalDuration} phút</span>
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </button>
            ))}
          </motion.div>
        </div>

        {/* Indicators */}
        <div className="mt-4 flex justify-center gap-2">
          {guidedSessions.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCarouselIndex(idx + guidedSessions.length)}
              className={`h-1.5 rounded-full transition-all ${
                (carouselIndex % guidedSessions.length) === idx 
                  ? 'w-6 bg-[#A37B5C]' 
                  : 'w-2 bg-[#E8DFC9] dark:bg-white/10'
              }`}
              aria-label={`Đi đến bài thiền ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#4A3C31] dark:text-[#F5EDE0]">Thở Tự Do</h2>
      </div>
      
      <div id="library-techniques-start" className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {orderedTechniques.map((tech) => (
          <div
            key={tech.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(tech)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onSelect(tech);
              }
            }}
            className="group relative flex cursor-pointer flex-col rounded-2xl border border-[#E8DFC9] bg-white/60 p-6 text-left shadow-[0_4px_20px_-4px_rgba(163,123,92,0.1)] transition-all hover:-translate-y-1 hover:bg-white/90 hover:shadow-[0_8px_30px_-4px_rgba(163,123,92,0.2)] dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 lg:min-h-[348px]"
          >
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handleToggleFavorite(tech.id);
              }}
              className={`absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border transition-all ${
                favoriteTechniqueIds.includes(tech.id)
                  ? 'border-amber-200 bg-amber-50 text-amber-500 shadow-sm dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-300'
                  : 'border-[#F2EAE0] bg-white/90 text-[#C2A385] hover:border-[#D5B393] hover:text-[#A37B5C] dark:border-white/10 dark:bg-white/10 dark:text-[#DECAA4]/70'
              }`}
              aria-label={favoriteTechniqueIds.includes(tech.id) ? 'Bỏ yêu thích' : 'Đánh dấu yêu thích'}
            >
              <Star className="h-4.5 w-4.5" fill={favoriteTechniqueIds.includes(tech.id) ? 'currentColor' : 'none'} />
            </button>

            <div className="mb-3 flex items-center gap-3 pr-12">
              <div className="shrink-0 rounded-xl border border-[#F2EAE0] bg-[#FCF9F3] p-3 shadow-inner dark:border-white/5 dark:bg-white/5">
                {iconMap[tech.id] || <Wind className="h-6 w-6 text-[#A37B5C] dark:text-[#DECAA4]" />}
              </div>
              <span className="inline-block rounded-full border border-[#F2EAE0] bg-[#FCF9F3] px-3 py-1 text-xs font-semibold leading-snug text-[#A37B5C] dark:border-white/5 dark:bg-white/5 dark:text-[#DECAA4]">
                {cleanText(tech.benefit)}
              </span>
            </div>

            <h3 className="mb-2 text-[17px] font-semibold leading-snug text-[#4A3C31] dark:text-[#F5EDE0]">{cleanText(tech.name)}</h3>
            <p className="mb-5 flex-grow text-sm leading-relaxed text-[#8B7D6E] dark:text-[#B0A090]">{cleanText(tech.description)}</p>

            <div className="mt-auto flex items-center justify-between">
              <div className="flex space-x-1 font-mono text-xs font-medium text-[#C2A385] dark:text-[#DECAA4]/70">
                <span>{tech.pattern.inhale}</span>
                <span>-</span>
                <span>{tech.pattern.hold1}</span>
                <span>-</span>
                <span>{tech.pattern.exhale}</span>
                <span>-</span>
                <span>{tech.pattern.hold2}</span>
              </div>
              <ChevronRight className="h-5 w-5 text-[#C2A385] transition-colors group-hover:text-[#A37B5C] dark:text-[#DECAA4]/50 dark:group-hover:text-[#DECAA4]" />
            </div>
          </div>
        ))}

        <button
          onClick={onCustom}
          className="group relative flex min-h-[250px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#DECAA4] bg-white/20 p-6 text-left transition-all hover:border-[#A37B5C] hover:bg-white/60 dark:border-white/15 dark:bg-white/[0.02] dark:hover:border-[#DECAA4] dark:hover:bg-white/5"
        >
          <div className="mb-4 rounded-full bg-[#FCF9F3] p-4 shadow-sm transition-transform group-hover:scale-110 dark:bg-white/5">
            <Plus className="h-8 w-8 text-[#A37B5C] dark:text-[#DECAA4]" />
          </div>
          <h3 className="text-lg font-medium text-[#5A4D41] dark:text-[#F5EDE0]">Tạo bài thở riêng</h3>
          <p className="mt-2 text-center text-sm text-[#8B7D6E] dark:text-[#B0A090]">Thiết lập nhịp thở theo ý bạn</p>
        </button>
      </div>

      <div className="mb-8 mt-16 text-center sm:text-left">
        <h2 className="mb-6 flex items-center justify-center gap-2 text-xl font-medium text-[#4A3C31] dark:text-[#F5EDE0] sm:justify-start">
          <Zap className="h-5 w-5 text-[#A37B5C]" />
          Tiện ích
        </h2>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <button onClick={onTempleTools} className="group flex flex-col items-center rounded-2xl border border-[#E8DFC9] bg-white/40 p-5 backdrop-blur-sm transition-all hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10">
            <div className="mb-3 rounded-xl bg-[#FCF9F3] p-3 transition-transform group-hover:scale-110 dark:bg-white/5">
              <Bell className="h-6 w-6 text-[#A37B5C] dark:text-[#DECAA4]" />
            </div>
            <span className="text-sm font-medium text-[#5A4D41] dark:text-[#F5EDE0]">Gõ mõ, Tụng kinh</span>
            <span className="mt-1 text-center text-xs text-[#8B7D6E] dark:text-[#B0A090]">Gõ tay hoặc tự gõ theo nhịp</span>
          </button>

          <button onClick={onMala} className="group flex flex-col items-center rounded-2xl border border-[#E8DFC9] bg-white/40 p-5 backdrop-blur-sm transition-all hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10">
            <div className="mb-3 rounded-xl bg-[#FCF9F3] p-3 transition-transform group-hover:scale-110 dark:bg-white/5">
              <Disc className="h-6 w-6 text-[#A37B5C] dark:text-[#DECAA4]" />
            </div>
            <span className="text-sm font-medium text-[#5A4D41] dark:text-[#F5EDE0]">Chuỗi hạt</span>
            <span className="mt-1 text-center text-xs text-[#8B7D6E] dark:text-[#B0A090]">Có mục tiêu 27, 54, 108</span>
          </button>

          <button onClick={onJournal} className="group flex flex-col items-center rounded-2xl border border-[#E8DFC9] bg-white/40 p-5 backdrop-blur-sm transition-all hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10">
            <div className="mb-3 rounded-xl bg-[#FCF9F3] p-3 transition-transform group-hover:scale-110 dark:bg-white/5">
              <MessageSquare className="h-6 w-6 text-[#A37B5C] dark:text-[#DECAA4]" />
            </div>
            <span className="text-sm font-medium text-[#5A4D41] dark:text-[#F5EDE0]">Nhật ký</span>
            <span className="mt-1 text-center text-xs text-[#8B7D6E] dark:text-[#B0A090]">Xem lại cảm xúc và ghi chú</span>
          </button>

          <button onClick={onStats} className="group flex flex-col items-center rounded-2xl border border-[#E8DFC9] bg-white/40 p-5 backdrop-blur-sm transition-all hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10">
            <div className="mb-3 rounded-xl bg-[#FCF9F3] p-3 transition-transform group-hover:scale-110 dark:bg-white/5">
              <BarChart3 className="h-6 w-6 text-[#A37B5C] dark:text-[#DECAA4]" />
            </div>
            <span className="text-sm font-medium text-[#5A4D41] dark:text-[#F5EDE0]">Thành tích</span>
            <span className="mt-1 text-center text-xs text-[#8B7D6E] dark:text-[#B0A090]">Xem chuỗi ngày và lịch sử gần đây</span>
          </button>
        </div>
      </div>

      <div className="mb-12 rounded-[28px] border border-[#E8DFC9] bg-white/55 p-5 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-medium text-[#4A3C31] dark:text-[#F5EDE0]">
              <PenLine className="h-5 w-5 text-[#A37B5C]" />
              Tâm trạng của bạn hôm nay như thế nào?
            </h3>
          </div>
          <button
            onClick={onJournal}
            className="rounded-full bg-[#FCF4E7] px-3 py-1.5 text-xs font-medium text-[#A37B5C] transition-colors hover:bg-[#f7ead7] dark:bg-[#241d16] dark:text-[#DECAA4]"
          >
            Mở Nhật ký
          </button>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {moodOptions.map((mood) => (
            <button
              key={mood.value}
              onClick={() => setQuickMood(mood.value)}
              className={`min-h-[42px] rounded-full px-3 py-1.5 text-sm transition-all sm:min-h-0 ${
                quickMood === mood.value
                  ? 'bg-[#5A4D41] text-white shadow-sm'
                  : 'bg-[#FCF9F3] text-[#8B7D6E] hover:bg-white dark:bg-white/5 dark:text-[#DECAA4] dark:hover:bg-white/10'
              }`}
            >
              <span className="inline-flex items-center justify-center gap-2 sm:justify-start">
                <mood.icon className="h-4 w-4" />
                {mood.label}
              </span>
            </button>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <textarea
            value={quickNote}
            onChange={(event) => setQuickNote(event.target.value)}
            placeholder="Ví dụ: Hôm nay mình thở chậm hơn và thấy đầu óc nhẹ hơn một chút."
            rows={4}
            className="w-full rounded-2xl border border-[#E8DFC9] bg-[#FCF9F3] px-4 py-3 text-sm text-[#4A3C31] outline-none transition-all focus:border-[#CDA178] focus:ring-2 focus:ring-[#EBD8C2] dark:border-white/10 dark:bg-white/5 dark:text-[#F5EDE0]"
          />

          <div className="flex flex-col justify-between gap-3">
            <button
              onClick={handleSaveQuickNote}
              disabled={!quickNote.trim()}
              className="inline-flex min-w-[160px] items-center justify-center gap-2 rounded-2xl bg-[#5A4D41] px-4 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-[#4e4238] disabled:cursor-not-allowed disabled:opacity-50"
            >
              
              Lưu ghi chú
            </button>

            <div className={`rounded-2xl border px-4 py-3 text-sm transition-all ${
              quickSaved
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-900/20 dark:text-emerald-300'
                : 'border-[#E8DFC9] bg-[#FCF9F3] text-[#8B7D6E] dark:border-white/10 dark:bg-white/5 dark:text-[#B0A090]'
            }`}>
              {quickSaved ? (
                <span className="inline-flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Đã thêm vào nhật ký của bạn
                </span>
              ) : (
                'Ghi chú lưu nhớ đọc lại nhé :))'
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="pb-32 text-center">
        <p className="text-xs text-[#C2A385] dark:text-[#B0A090]/60">- Bình an và biết ơn -</p>
      </div>
    </div>
  );
};
