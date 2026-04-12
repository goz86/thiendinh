import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Award,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Flame,
  Share2,
  Timer,
  X,
} from 'lucide-react';
import type { JournalEntry, MeditationSession, MeditationStats } from '../types';
import { getUserDisplayName } from '../utils/auth';
import { buildStoryCardSvg, getMoodBreakdown } from '../utils/personalization';
import {
  formatSessionDisplayDateTime,
  loadJournalEntries,
  loadSessions,
  parseStoredDate,
  subscribeToStorageUpdates,
  syncWithCloud,
} from '../utils/storage';
import { calculateStatsFromSessions, getMonthlyHeatmapData } from '../utils/stats';
import { getLocalDateString } from '../utils/dateTime';

interface StatsProps {
  onBack: () => void;
  user?: any;
}

type ShareNotice = { type: 'success' | 'info'; text: string } | null;

type ShareAsset = {
  blob: Blob;
  file: File;
  caption: string;
};

const buildPngFromSvg = async (svgMarkup: string) => {
  const svgBlob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const image = new Image();
    image.decoding = 'async';

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Khong tao duoc anh story.'));
      image.src = svgUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Khong tao duoc canvas story.');
    }

    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const pngBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Khong xuat duoc anh PNG.'));
      }, 'image/png');
    });

    return pngBlob;
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
};

// openShareWindow removed — social share buttons no longer used

export const Stats: React.FC<StatsProps> = ({ onBack, user }) => {
  const [stats, setStats] = useState<MeditationStats | null>(null);
  const [sessions, setSessions] = useState<MeditationSession[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [isPreparingShare, setIsPreparingShare] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareAsset, setShareAsset] = useState<ShareAsset | null>(null);
  const [shareNotice, setShareNotice] = useState<ShareNotice>(null);
  const [supportsSystemShare, setSupportsSystemShare] = useState(false);
  const [heatmapMonth, setHeatmapMonth] = useState(() => new Date().getMonth());
  const [heatmapYear, setHeatmapYear] = useState(() => new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [allSessions, setAllSessions] = useState<MeditationSession[]>([]);

  useEffect(() => {
    const shareNavigator = navigator as Navigator & {
      canShare?: (data?: ShareData) => boolean;
    };
    setSupportsSystemShare(Boolean(shareNavigator.canShare));

    const loadData = async () => {
      await syncWithCloud();
      const sessionData = loadSessions();
      setStats(calculateStatsFromSessions(sessionData));
      setAllSessions(sessionData);
      setSessions(
        [...sessionData]
          .sort((a, b) => parseStoredDate(b.date).getTime() - parseStoredDate(a.date).getTime())
          .slice(0, 5)
      );
      setJournalEntries(loadJournalEntries());
    };

    void loadData();
    const unsubscribe = subscribeToStorageUpdates(() => {
      const sessionData = loadSessions();
      setStats(calculateStatsFromSessions(sessionData));
      setAllSessions(sessionData);
      setSessions(
        [...sessionData]
          .sort((a, b) => parseStoredDate(b.date).getTime() - parseStoredDate(a.date).getTime())
          .slice(0, 5)
      );
      setJournalEntries(loadJournalEntries());
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!shareNotice) return undefined;
    const timer = window.setTimeout(() => setShareNotice(null), 2600);
    return () => window.clearTimeout(timer);
  }, [shareNotice]);

  const moodBreakdown = useMemo(() => getMoodBreakdown(journalEntries, 14), [journalEntries]);

  if (!stats) return null;

  const maxMinutes = Math.max(...stats.dailyHistory.map((point) => point.minutes), 30);
  const dominantMood = [...moodBreakdown].sort((left, right) => right.count - left.count)[0];
  const averageMinutes = stats.sessionCount > 0 ? Math.round(stats.totalDuration / 60 / stats.sessionCount) : 0;
  const shareCaption = `Hôm nay mình đã thiền ${stats.totalMinutes} phút, giữ chuỗi ${stats.streak} ngày và tiếp tục bài ${stats.favoriteTechnique}.`;

  const buildShareAsset = async (): Promise<ShareAsset> => {
    const svgMarkup = buildStoryCardSvg({
      userName: getUserDisplayName(user),
      totalMinutes: stats.totalMinutes,
      streak: stats.streak,
      favoriteTechnique: stats.favoriteTechnique,
      focusWord: 'Thở đều và đi tiếp',
      moodLabel: dominantMood?.count ? dominantMood.label : 'Đang hình thành',
    });

    const pngBlob = await buildPngFromSvg(svgMarkup);
    return {
      blob: pngBlob,
      file: new File([pngBlob], 'thanh-tich-thien.png', { type: 'image/png' }),
      caption: shareCaption,
    };
  };

  const ensureShareAsset = async () => {
    if (shareAsset) return shareAsset;
    const nextAsset = await buildShareAsset();
    setShareAsset(nextAsset);
    return nextAsset;
  };

  const downloadShareImage = async () => {
    const asset = await ensureShareAsset();
    const downloadUrl = URL.createObjectURL(asset.blob);
    const anchor = document.createElement('a');
    anchor.href = downloadUrl;
    anchor.download = asset.file.name;
    anchor.click();
    URL.revokeObjectURL(downloadUrl);
    return asset;
  };

  const copyCaption = async () => {
    try {
      await navigator.clipboard.writeText(shareCaption);
      setShareNotice({ type: 'success', text: 'Đã copy caption để bạn dán khi đăng bài.' });
    } catch {
      setShareNotice({ type: 'info', text: 'Không copy được tự động, bạn hãy giữ để sao chép caption.' });
    }
  };

  const handleOpenShareModal = async () => {
    setIsPreparingShare(true);
    setShowShareModal(true);

    try {
      await ensureShareAsset();
    } catch (error) {
      console.error('Loi khi tao tai san chia se:', error);
      setShareNotice({ type: 'info', text: 'Chưa tạo được ảnh chia sẻ, bạn thử lại giúp mình.' });
    } finally {
      setIsPreparingShare(false);
    }
  };

  const handleSystemShare = async () => {
    try {
      const asset = await ensureShareAsset();
      const shareNavigator = navigator as Navigator & {
        canShare?: (data?: ShareData) => boolean;
      };

      if (shareNavigator.canShare?.({ files: [asset.file] })) {
        await navigator.share({
          title: 'Thành tích thiền của tôi',
          text: asset.caption,
          files: [asset.file],
        });
        return;
      }

      if (shareNavigator.canShare?.()) {
        await navigator.share({
          title: 'Thành tích thiền của tôi',
          text: asset.caption,
          url: window.location.href,
        });
        return;
      }

      setShareNotice({ type: 'info', text: 'Thiết bị này không hỗ trợ chia sẻ hệ thống, bạn dùng các nút bên dưới nhé.' });
    } catch {
      // Keep popup open if user cancels or share fails.
    }
  };

  // Social share helpers removed — popup now only uses system share, download, and copy.

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-[#FCF9F3] dark:bg-[#0d0b09]">
      <div className="flex items-center justify-between border-b border-[#E8DFC9] bg-white/50 p-6 backdrop-blur-md dark:border-white/5 dark:bg-white/5">
        <button
          onClick={onBack}
          className="rounded-full bg-white/80 p-3 shadow-sm transition-colors hover:bg-white dark:bg-white/5"
        >
          <ChevronLeft className="h-6 w-6 text-[#A37B5C] dark:text-[#DECAA4]" />
        </button>
        <h2 className="text-xl font-semibold text-[#4A3C31] dark:text-[#F5EDE0]">Tiến trình tu tập</h2>
        <button
          onClick={() => void handleOpenShareModal()}
          disabled={isPreparingShare}
          className="inline-flex items-center gap-2 rounded-full border border-[#E8DFC9] bg-white/80 px-4 py-2 text-sm font-medium text-[#5A4D41] shadow-sm transition-colors hover:bg-white disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-[#F5EDE0]"
        >
          <Share2 className="h-4 w-4" />
          {isPreparingShare ? 'Đang chuẩn bị' : 'Chia sẻ'}
        </button>
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto px-6 pb-32 pt-4">
        <div className="mx-auto max-w-5xl space-y-8">
          <section className="rounded-[32px] border border-[#E8DFC9] bg-white/75 p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#A37B5C] dark:text-[#DECAA4]">
                  Tiến trình cá nhân
                </p>
                <h3 className="text-3xl font-semibold text-[#4A3C31] dark:text-[#F5EDE0]">Nhịp thở của bạn đang đều hơn</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#7D6A5A] dark:text-[#CDB89A]">
                  Theo dõi chuỗi ngày, tổng thời lượng và những cột mốc bạn đã âm thầm đi qua.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 lg:min-w-[360px]">
                <div className="rounded-3xl border border-[#F0E7DB] bg-[#FCF9F3] p-4 text-center dark:border-white/10 dark:bg-white/5">
                  <Flame className="mx-auto mb-2 h-5 w-5 text-orange-500" />
                  <div className="text-2xl font-bold text-[#4A3C31] dark:text-[#F5EDE0]">{stats.streak}</div>
                  <div className="text-[11px] text-[#8B7D6E] dark:text-[#B0A090]">ngày liền</div>
                </div>
                <div className="rounded-3xl border border-[#F0E7DB] bg-[#FCF9F3] p-4 text-center dark:border-white/10 dark:bg-white/5">
                  <Timer className="mx-auto mb-2 h-5 w-5 text-blue-500" />
                  <div className="text-2xl font-bold text-[#4A3C31] dark:text-[#F5EDE0]">{stats.totalMinutes}</div>
                  <div className="text-[11px] text-[#8B7D6E] dark:text-[#B0A090]">phút</div>
                </div>
                <div className="rounded-3xl border border-[#F0E7DB] bg-[#FCF9F3] p-4 text-center dark:border-white/10 dark:bg-white/5">
                  <Award className="mx-auto mb-2 h-5 w-5 text-amber-500" />
                  <div className="text-2xl font-bold text-[#4A3C31] dark:text-[#F5EDE0]">{stats.badges.length}</div>
                  <div className="text-[11px] text-[#8B7D6E] dark:text-[#B0A090]">huy hiệu</div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[32px] border border-[#E8DFC9] bg-white/75 p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
            <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[#4A3C31] dark:text-[#F5EDE0]/80">7 ngày gần đây</h3>
              <span className="text-[11px] sm:text-xs font-semibold text-[#8B7D6E] dark:text-[#B0A090] truncate">Bài yêu thích: {stats.favoriteTechnique}</span>
            </div>

            <div className="flex flex-col gap-8 md:flex-row md:items-center">
              <div className="flex-1">
                <div className="flex h-36 items-end justify-between gap-1 sm:gap-2 px-1">
                  {stats.dailyHistory.map((day, index) => {
                    const barHeight = day.minutes > 0 ? Math.max((day.minutes / maxMinutes) * 112, 12) : 4;

                    return (
                      <div key={day.label} className="group flex h-full flex-1 flex-col items-center justify-end gap-3">
                        <div className="relative flex h-full w-full items-end justify-center">
                          <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] sm:text-[11px] font-semibold text-[#A37B5C] dark:text-[#DECAA4]">
                            {day.minutes}p
                          </div>
                          <div className="absolute inset-y-0 w-full max-w-[14px] sm:max-w-[16px] rounded-full bg-[#E8DFC9]/35 dark:bg-white/10" />
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${barHeight}px` }}
                            transition={{ duration: 0.8, delay: index * 0.05, ease: 'easeOut' }}
                            className={`relative z-10 w-full max-w-[14px] sm:max-w-[16px] rounded-t-full ${
                              day.minutes > 0
                                ? 'bg-gradient-to-t from-[#A37B5C] to-[#DECAA4] shadow-[0_0_10px_rgba(163,123,92,0.2)]'
                                : 'bg-[#E8DFC9]/40 dark:bg-white/10'
                            }`}
                          />
                        </div>
                        <span className="text-[9px] sm:text-[10px] font-bold text-[#8B7D6E] dark:text-[#DECAA4]/50">{day.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid w-full gap-3 md:w-64">
                <div className="rounded-3xl border border-[#E8DFC9] bg-[#FCF9F3] px-4 py-5 dark:border-white/10 dark:bg-white/5">
                  <div className="text-[11px] font-semibold tracking-[0.08em] text-[#8B7D6E] dark:text-[#B0A090]">Số lần thiền</div>
                  <div className="mt-3 text-[34px] font-bold leading-none text-[#4A3C31] dark:text-[#F5EDE0]">{stats.sessionCount}</div>
                </div>

                <div className="rounded-3xl border border-[#E8DFC9] bg-[#FCF9F3] px-4 py-5 dark:border-white/10 dark:bg-white/5">
                  <div className="text-[11px] font-semibold tracking-[0.08em] text-[#8B7D6E] dark:text-[#B0A090]">Chuỗi ngày</div>
                  <div className="mt-3 text-[30px] font-bold leading-none text-[#4A3C31] dark:text-[#F5EDE0]">{stats.streak} ngày</div>
                </div>

                <div className="rounded-3xl border border-[#E8DFC9] bg-[#FCF9F3] px-4 py-5 dark:border-white/10 dark:bg-white/5">
                  <div className="text-[11px] font-semibold tracking-[0.08em] text-[#8B7D6E] dark:text-[#B0A090]">Trung bình</div>
                  <div className="mt-3 text-[30px] font-bold leading-none text-[#4A3C31] dark:text-[#F5EDE0]">{averageMinutes} phút</div>
                </div>
              </div>
            </div>
          </section>

          {/* Calendar Heatmap */}
          {(() => {
            const WEEKDAY_HEADERS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
            const MONTH_NAMES = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
            const heatmapData = getMonthlyHeatmapData(allSessions, heatmapYear, heatmapMonth);
            const firstDay = new Date(heatmapYear, heatmapMonth, 1).getDay();
            const daysInMonth = new Date(heatmapYear, heatmapMonth + 1, 0).getDate();
            const today = getLocalDateString();
            const isCurrentMonth = heatmapYear === new Date().getFullYear() && heatmapMonth === new Date().getMonth();

            const getHeatColor = (minutes: number) => {
              if (minutes === 0) return 'bg-[#F6F0E8] dark:bg-white/5';
              if (minutes <= 5) return 'bg-[#DECAA4]/30 dark:bg-[#DECAA4]/10';
              if (minutes <= 15) return 'bg-[#DECAA4]/55 dark:bg-[#DECAA4]/25';
              if (minutes <= 30) return 'bg-[#C2A385]/70 dark:bg-[#C2A385]/40';
              return 'bg-[#A37B5C] dark:bg-[#A37B5C]/70';
            };

            const goToPrevMonth = () => {
              if (heatmapMonth === 0) { setHeatmapMonth(11); setHeatmapYear(heatmapYear - 1); }
              else setHeatmapMonth(heatmapMonth - 1);
            };
            const goToNextMonth = () => {
              if (isCurrentMonth) return;
              if (heatmapMonth === 11) { setHeatmapMonth(0); setHeatmapYear(heatmapYear + 1); }
              else setHeatmapMonth(heatmapMonth + 1);
            };

            const selectedDayData = selectedDay ? heatmapData.get(selectedDay) : null;

            return (
              <section className="rounded-[32px] border border-[#E8DFC9] bg-white/75 p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#A37B5C]/10 dark:bg-[#DECAA4]/10">
                      <Calendar className="h-5 w-5 text-[#A37B5C] dark:text-[#DECAA4]" />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-[#F6F0E8] dark:bg-white/5 rounded-full px-2 py-1">
                    <button onClick={goToPrevMonth} className="rounded-full p-1.5 transition-colors hover:bg-white dark:hover:bg-white/10">
                      <ChevronLeft className="h-4 w-4 text-[#A37B5C] dark:text-[#DECAA4]" />
                    </button>
                    <span className="min-w-[100px] text-center text-sm font-bold text-[#4A3C31] dark:text-[#F5EDE0]">
                      {MONTH_NAMES[heatmapMonth]} {heatmapYear}
                    </span>
                    <button onClick={goToNextMonth} disabled={isCurrentMonth} className="rounded-full p-1.5 transition-colors hover:bg-white disabled:opacity-30 dark:hover:bg-white/10">
                      <ChevronRight className="h-4 w-4 text-[#A37B5C] dark:text-[#DECAA4]" />
                    </button>
                  </div>
                </div>

                {/* Weekday headers */}
                <div className="mb-3 grid grid-cols-7 gap-1 px-1">
                  {WEEKDAY_HEADERS.map(d => (
                    <div key={d} className="text-center text-[11px] font-black text-[#8B7D6E]/80 dark:text-[#B0A090]/60 tracking-tighter">{d}</div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1.5">
                  {/* Empty cells for offset */}
                  {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square" />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dateKey = `${heatmapYear}-${String(heatmapMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const data = heatmapData.get(dateKey);
                    const minutes = data?.minutes || 0;
                    const isToday = dateKey === today;
                    const isSelected = dateKey === selectedDay;

                    return (
                      <motion.button
                        key={dateKey}
                        onClick={() => setSelectedDay(isSelected ? null : dateKey)}
                        whileTap={{ scale: 0.9 }}
                        className={`relative aspect-square rounded-xl text-[12px] font-bold transition-all ${getHeatColor(minutes)} ${
                          isToday ? 'ring-2 ring-[#A37B5C] ring-offset-1 dark:ring-[#DECAA4] dark:ring-offset-[#0d0b09]' : ''
                        } ${isSelected ? 'ring-2 ring-[#5A4D41] ring-offset-1 dark:ring-[#F5EDE0] dark:ring-offset-[#0d0b09]' : ''} ${
                          minutes > 20 ? 'text-white dark:text-white' : 'text-[#4A3C31] dark:text-[#DECAA4]'
                        } shadow-sm`}
                      >
                        {day}
                        {minutes > 0 && (
                          <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-current opacity-70" />
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-[#8B7D6E] dark:text-[#B0A090]">Ít</span>
                    {[0, 5, 15, 30, 60].map((m) => (
                      <div key={m} className={`h-3 w-3 rounded-sm ${getHeatColor(m)}`} />
                    ))}
                    <span className="text-[10px] text-[#8B7D6E] dark:text-[#B0A090]">Nhiều</span>
                  </div>
                  <span className="text-[10px] text-[#8B7D6E] dark:text-[#B0A090]">
                    {heatmapData.size} ngày có thiền
                  </span>
                </div>

                {/* Selected day detail */}
                <AnimatePresence>
                  {selectedDay && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 rounded-2xl border border-[#E8DFC9] bg-[#FCF9F3] p-4 dark:border-white/10 dark:bg-white/5">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-[#4A3C31] dark:text-[#F5EDE0]">
                            {new Date(selectedDay + 'T00:00:00').toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}
                          </span>
                          <button onClick={() => setSelectedDay(null)} className="rounded-full p-1 hover:bg-white dark:hover:bg-white/10">
                            <X className="h-3.5 w-3.5 text-[#8B7D6E]" />
                          </button>
                        </div>
                        {selectedDayData ? (
                          <div className="mt-2 space-y-1">
                            <div className="text-xs text-[#8B7D6E] dark:text-[#B0A090]">
                              ⏱ {selectedDayData.minutes} phút thiền
                            </div>
                            <div className="text-xs text-[#8B7D6E] dark:text-[#B0A090]">
                              🧘 {selectedDayData.techniques.join(', ')}
                            </div>
                          </div>
                        ) : (
                          <div className="mt-2 text-xs text-[#8B7D6E] dark:text-[#B0A090]">Chưa thiền ngày này</div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>
            );
          })()}

          <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[32px] border border-[#E8DFC9] bg-white/75 p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
              <h3 className="mb-5 text-sm font-bold uppercase tracking-[0.12em] text-[#4A3C31] dark:text-[#F5EDE0]/80">Huy hiệu</h3>
              <div className="grid grid-cols-3 gap-4">
                {stats.badges.map((badge, index) => (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex flex-col items-center text-center"
                  >
                    <div className="mb-2 flex h-20 w-20 items-center justify-center rounded-full border border-[#E8DFC9] bg-gradient-to-tr from-[#DECAA4]/30 to-[#FCF9F3] text-3xl shadow-md dark:border-white/10 dark:from-[#3a3028] dark:to-[#2a2420]">
                      {badge.icon || '🏅'}
                    </div>
                    <span className="text-[11px] font-bold text-[#4A3C31] dark:text-[#F5EDE0]">{badge.name}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-[#E8DFC9] bg-white/75 p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
              <h3 className="mb-5 text-sm font-bold uppercase tracking-[0.12em] text-[#4A3C31] dark:text-[#F5EDE0]/80">Lịch sử gần đây</h3>
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between rounded-2xl border border-[#E8DFC9] bg-[#FCF9F3] p-4 dark:border-white/10 dark:bg-white/5"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-[#4A3C31] dark:text-[#F5EDE0]">{session.techniqueName}</span>
                      <span className="text-[11px] text-[#8B7D6E] dark:text-[#DECAA4]/50">{formatSessionDisplayDateTime(session)}</span>
                    </div>
                    <span className="text-xs font-bold text-[#A37B5C]">
                      {Math.max(1, Math.floor(session.durationSeconds / 60))} phút
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>

      <AnimatePresence>
        {showShareModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-[#1E1712]/45 p-0 sm:p-4 backdrop-blur-sm"
            onClick={() => setShowShareModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-t-[32px] sm:rounded-[32px] border border-[#E8DFC9] bg-[#FFF9F3] px-5 pb-8 pt-4 shadow-[0_-12px_60px_rgba(74,60,49,0.18)] sm:shadow-[0_25px_80px_rgba(74,60,49,0.18)] dark:border-white/10 dark:bg-[#18120e]"
            >
              {/* Drag handle (mobile feel) */}
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#D9CBBA] dark:bg-white/15 sm:hidden" />

              {/* Header */}
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#4A3C31] dark:text-[#F5EDE0]">Chia sẻ thành tích</h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#E8DFC9] bg-white/80 text-[#7D6A5A] transition-colors hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-[#DECAA4]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Achievement Image Preview */}
              <div className="mb-5 overflow-hidden rounded-3xl border border-[#E8DFC9] bg-gradient-to-b from-[#FFF8F0] to-[#F0DDCA] dark:border-white/10 dark:from-[#1e1814] dark:to-[#15110d]">
                {isPreparingShare ? (
                  <div className="flex h-72 items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E8DFC9] border-t-[#A37B5C]" />
                      <span className="text-sm text-[#8B7D6E] dark:text-[#B0A090]">Đang tạo ảnh thành tích...</span>
                    </div>
                  </div>
                ) : shareAsset ? (
                  <img
                    src={URL.createObjectURL(shareAsset.blob)}
                    alt="Ảnh thành tích thiền"
                    className="mx-auto max-h-80 w-auto object-contain"
                  />
                ) : (
                  <div className="flex h-72 flex-col items-center justify-center gap-4 p-6 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/60 dark:bg-white/5">
                      <Award className="h-8 w-8 text-[#A37B5C]" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-[#4A3C31] dark:text-[#F5EDE0]">{stats.totalMinutes} phút</p>
                      <p className="text-sm text-[#8B7D6E] dark:text-[#B0A090]">🔥 {stats.streak} ngày liên tục</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-3">
                {supportsSystemShare && (
                  <button
                    onClick={() => void handleSystemShare()}
                    className="flex flex-col items-center gap-2.5 rounded-2xl border border-[#E8DFC9] bg-white p-4 transition-all active:scale-95 hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-white/5"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#A37B5C]/10 dark:bg-[#DECAA4]/10">
                      <Share2 className="h-5 w-5 text-[#A37B5C] dark:text-[#DECAA4]" />
                    </div>
                    <span className="text-xs font-semibold text-[#4A3C31] dark:text-[#F5EDE0]">Chia sẻ</span>
                  </button>
                )}

                <button
                  onClick={() => void downloadShareImage()}
                  className="flex flex-col items-center gap-2.5 rounded-2xl border border-[#E8DFC9] bg-white p-4 transition-all active:scale-95 hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-white/5"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#A37B5C]/10 dark:bg-[#DECAA4]/10">
                    <Download className="h-5 w-5 text-[#A37B5C] dark:text-[#DECAA4]" />
                  </div>
                  <span className="text-xs font-semibold text-[#4A3C31] dark:text-[#F5EDE0]">Tải ảnh</span>
                </button>

                <button
                  onClick={() => void copyCaption()}
                  className="flex flex-col items-center gap-2.5 rounded-2xl border border-[#E8DFC9] bg-white p-4 transition-all active:scale-95 hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-white/5"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#A37B5C]/10 dark:bg-[#DECAA4]/10">
                    <Copy className="h-5 w-5 text-[#A37B5C] dark:text-[#DECAA4]" />
                  </div>
                  <span className="text-xs font-semibold text-[#4A3C31] dark:text-[#F5EDE0]">Copy</span>
                </button>
              </div>

              {shareNotice && (
                <div
                  className={`mt-4 flex items-start gap-3 rounded-2xl px-4 py-3 text-sm ${
                    shareNotice.type === 'success'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
                      : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-200'
                  }`}
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{shareNotice.text}</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
