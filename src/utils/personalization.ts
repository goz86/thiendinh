import { techniques } from '../data';
import type { JournalEntry, MeditationSession, Mood } from '../types';
import { parseStoredDate } from './dateTime';

type GoalProgress = {
  label: string;
  current: number;
  target: number;
  unit: string;
};

export type PersonalRoadmap = {
  title: string;
  summary: string;
  recommendedTechniqueId: string;
  recommendedReason: string;
  focusWord: string;
  goals: GoalProgress[];
};

export type MoodBreakdownItem = {
  mood: Mood;
  label: string;
  count: number;
  share: number;
};

export type MilestoneCard = {
  id: string;
  title: string;
  detail: string;
  unlocked: boolean;
  valueLabel: string;
};

const MOOD_LABELS: Record<Mood, string> = {
  peaceful: 'Bình an',
  calm: 'Lắng dịu',
  neutral: 'Bình thường',
  tired: 'Hơi mệt',
  anxious: 'Lo lắng',
  sad: 'Không vui',
};

const RECOMMENDATION_BY_MOOD: Record<Mood, { techniqueId: string; reason: string; focusWord: string }> = {
  peaceful: {
    techniqueId: 'resonant',
    reason: 'Bạn đang khá ổn định, bài cộng hưởng giúp giữ nhịp đều và nuôi cảm giác an yên lâu hơn.',
    focusWord: 'Duy trì sự an yên',
  },
  calm: {
    techniqueId: 'pranayama',
    reason: 'Trạng thái lắng dịu phù hợp với một bài cân bằng hơi thở sâu để tăng độ tập trung.',
    focusWord: 'Đi sâu hơn vào tập trung',
  },
  neutral: {
    techniqueId: 'box',
    reason: 'Khi tâm trạng trung tính, box breathing là điểm vào dễ nhất để gom sự chú ý.',
    focusWord: 'Ổn định nhịp sống',
  },
  tired: {
    techniqueId: 'energizing',
    reason: 'Bạn có dấu hiệu mệt, nhịp thở ngắn gọn sẽ giúp lấy lại sự tỉnh táo trước.',
    focusWord: 'Hồi lại năng lượng',
  },
  anxious: {
    techniqueId: '478',
    reason: 'Hơi thở ra dài của 4-7-8 thường hợp lúc cơ thể đang căng hoặc khó thả lỏng.',
    focusWord: 'Giảm căng thẳng thần kinh',
  },
  sad: {
    techniqueId: 'diaphragmatic',
    reason: 'Thở bụng chậm và sâu là lựa chọn dịu nhất khi bạn cần quay lại với thân thể.',
    focusWord: 'Ôm lại chính mình',
  },
};

const clampPercent = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

const getLatestMood = (journalEntries: JournalEntry[]): Mood => {
  if (journalEntries.length === 0) return 'neutral';

  return [...journalEntries]
    .sort((a, b) => parseStoredDate(b.date).getTime() - parseStoredDate(a.date).getTime())[0]
    .mood;
};

export const getMoodBreakdown = (journalEntries: JournalEntry[], limit = 14): MoodBreakdownItem[] => {
  const recentEntries = [...journalEntries]
    .sort((a, b) => parseStoredDate(b.date).getTime() - parseStoredDate(a.date).getTime())
    .slice(0, limit);

  const total = recentEntries.length || 1;

  return (Object.keys(MOOD_LABELS) as Mood[]).map((mood) => {
    const count = recentEntries.filter((entry) => entry.mood === mood).length;
    return {
      mood,
      label: MOOD_LABELS[mood],
      count,
      share: count / total,
    };
  });
};

export const getMilestoneCards = (sessions: MeditationSession[]): MilestoneCard[] => {
  const totalMinutes = Math.round(sessions.reduce((sum, session) => sum + session.durationSeconds, 0) / 60);
  const sessionCount = sessions.length;
  const last7DaysMinutes = sessions
    .filter((session) => Date.now() - parseStoredDate(session.date).getTime() <= 7 * 24 * 60 * 60 * 1000)
    .reduce((sum, session) => sum + session.durationSeconds, 0) / 60;

  return [
    {
      id: 'first-step',
      title: 'Bắt đầu hành trình',
      detail: 'Hoàn thành buổi thiền đầu tiên để mở lộ trình riêng cho bạn.',
      unlocked: sessionCount >= 1,
      valueLabel: `${sessionCount}/1 buổi`,
    },
    {
      id: 'habit-loop',
      title: 'Xây nhịp đều 7 ngày',
      detail: 'Tích lũy ít nhất 60 phút trong 7 ngày gần nhất để tạo nền vững.',
      unlocked: last7DaysMinutes >= 60,
      valueLabel: `${Math.round(last7DaysMinutes)}/60 phút`,
    },
    {
      id: 'depth',
      title: 'Đi vào chiều sâu',
      detail: 'Đạt 300 phút tổng để thấy rõ thay đổi về nhịp thở và sự chú ý.',
      unlocked: totalMinutes >= 300,
      valueLabel: `${totalMinutes}/300 phút`,
    },
  ];
};

export const buildPersonalRoadmap = (
  sessions: MeditationSession[],
  journalEntries: JournalEntry[],
  favoriteTechniqueId: string | null
): PersonalRoadmap => {
  const latestMood = getLatestMood(journalEntries);
  const baseRecommendation = RECOMMENDATION_BY_MOOD[latestMood];
  const recommendedTechnique =
    techniques.find((technique) => technique.id === favoriteTechniqueId) ??
    techniques.find((technique) => technique.id === baseRecommendation.techniqueId) ??
    techniques[0];

  const totalMinutes = Math.round(sessions.reduce((sum, session) => sum + session.durationSeconds, 0) / 60);
  const sessionsThisWeek = sessions.filter(
    (session) => Date.now() - parseStoredDate(session.date).getTime() <= 7 * 24 * 60 * 60 * 1000
  ).length;
  const journalCount = journalEntries.length;

  const weeklyGoalTarget = Math.max(5, Math.min(12, sessionsThisWeek + 3));
  const minuteGoalTarget = Math.max(60, Math.ceil((totalMinutes + 60) / 30) * 30);
  const reflectionGoalTarget = Math.max(3, Math.min(7, journalCount + 2));

  return {
    title: favoriteTechniqueId
      ? 'Lộ trình cá nhân của bạn đang nghiêng về bài yêu thích'
      : 'Lộ trình cá nhân hôm nay đã sẵn sàng',
    summary: favoriteTechniqueId
      ? `App ưu tiên ${recommendedTechnique.name} và sẽ gợi ý thêm theo cảm xúc gần đây của bạn.`
      : `Dựa trên các phiên gần đây và nhật ký cảm xúc, hôm nay bạn nên bắt đầu với ${recommendedTechnique.name}.`,
    recommendedTechniqueId: recommendedTechnique.id,
    recommendedReason:
      favoriteTechniqueId && recommendedTechnique.id === favoriteTechniqueId
        ? `Bạn đã chọn bài này là yêu thích, nên mình đẩy nó lên đầu để bạn vào phiên thật nhanh.`
        : baseRecommendation.reason,
    focusWord: baseRecommendation.focusWord,
    goals: [
      {
        label: 'Buổi thiền tuần này',
        current: sessionsThisWeek,
        target: weeklyGoalTarget,
        unit: 'buổi',
      },
      {
        label: 'Tổng phút tích lũy',
        current: totalMinutes,
        target: minuteGoalTarget,
        unit: 'phút',
      },
      {
        label: 'Ngày có ghi chú',
        current: journalCount,
        target: reflectionGoalTarget,
        unit: 'lần',
      },
    ],
  };
};

const escapeXml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

export const buildStoryCardSvg = (params: {
  userName: string;
  totalMinutes: number;
  streak: number;
  favoriteTechnique: string;
  focusWord: string;
  moodLabel: string;
}) => {
  const { userName, totalMinutes, streak, favoriteTechnique, focusWord, moodLabel } = params;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920" fill="none">
      <defs>
        <linearGradient id="bg" x1="120" y1="60" x2="940" y2="1820" gradientUnits="userSpaceOnUse">
          <stop stop-color="#FFF8F0"/>
          <stop offset="0.55" stop-color="#F6E9D7"/>
          <stop offset="1" stop-color="#E4C8A6"/>
        </linearGradient>
        <radialGradient id="glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(540 540) rotate(90) scale(620 480)">
          <stop stop-color="#FFFFFF" stop-opacity="0.9"/>
          <stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="1080" height="1920" fill="url(#bg)"/>
      <rect width="1080" height="1920" fill="url(#glow)"/>
      <g opacity="0.22" stroke="#B98B63" stroke-width="2">
        <path d="M40 170C180 110 350 120 480 190C610 260 760 300 1020 220"/>
        <path d="M80 290C280 230 450 250 620 320C790 390 920 410 1060 360"/>
        <path d="M0 1540C210 1460 400 1500 560 1580C720 1660 870 1700 1080 1610"/>
      </g>
      <text x="540" y="188" text-anchor="middle" fill="#8F6445" font-size="44" font-family="Georgia, serif">Hơi Thở Chánh Niệm</text>
      <text x="540" y="278" text-anchor="middle" fill="#4A3C31" font-size="78" font-weight="700" font-family="Arial, sans-serif">${escapeXml(
        userName
      )}</text>
      <text x="540" y="346" text-anchor="middle" fill="#9A7659" font-size="34" font-family="Arial, sans-serif">Hành trình hôm nay: ${escapeXml(
        focusWord
      )}</text>

      <rect x="120" y="470" width="840" height="980" rx="56" fill="rgba(255,255,255,0.56)" stroke="#E6D6C2" stroke-width="2"/>
      <text x="180" y="580" fill="#9A7659" font-size="28" font-family="Arial, sans-serif">Tổng phút tích lũy</text>
      <text x="180" y="682" fill="#4A3C31" font-size="108" font-weight="700" font-family="Arial, sans-serif">${totalMinutes}</text>
      <text x="180" y="740" fill="#9A7659" font-size="34" font-family="Arial, sans-serif">phút thiền</text>

      <text x="180" y="890" fill="#9A7659" font-size="28" font-family="Arial, sans-serif">Chuỗi hiện tại</text>
      <text x="180" y="972" fill="#4A3C31" font-size="80" font-weight="700" font-family="Arial, sans-serif">${streak} ngày</text>

      <text x="180" y="1110" fill="#9A7659" font-size="28" font-family="Arial, sans-serif">Bài thở gắn bó nhất</text>
      <text x="180" y="1188" fill="#4A3C31" font-size="52" font-weight="700" font-family="Arial, sans-serif">${escapeXml(
        favoriteTechnique
      )}</text>

      <text x="180" y="1320" fill="#9A7659" font-size="28" font-family="Arial, sans-serif">Cảm xúc gần đây</text>
      <text x="180" y="1388" fill="#4A3C31" font-size="46" font-weight="700" font-family="Arial, sans-serif">${escapeXml(
        moodLabel
      )}</text>

      <rect x="180" y="1524" width="312" height="76" rx="38" fill="#5A4D41"/>
      <text x="336" y="1573" text-anchor="middle" fill="#FFF8F0" font-size="28" font-weight="700" font-family="Arial, sans-serif">Tiếp tục thở đều</text>
      <text x="540" y="1780" text-anchor="middle" fill="#8F6445" font-size="34" font-family="Georgia, serif">Mỗi ngày một hơi thở vững hơn</text>
    </svg>
  `.trim();
};

export const getGoalProgressPercent = (goal: GoalProgress) => clampPercent((goal.current / goal.target) * 100);

export const getMoodLabel = (mood: Mood) => MOOD_LABELS[mood];
