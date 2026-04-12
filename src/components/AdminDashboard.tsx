import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Users, Clock, Activity, Shield, Calendar, TrendingUp, Award, List } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { isAdminEmail } from '../utils/auth';
import { fetchSiteVisits } from '../utils/visits';

interface AdminDashboardProps {
  onBack: () => void;
}

interface TechniqueStat {
  name: string;
  count: number;
}

interface RecentSession {
  id: string;
  user_id: string | null;
  visitor_id?: string | null;
  technique_name: string;
  duration_seconds: number;
  created_at: string;
  profiles?: {
    email?: string;
  } | null;
}

interface AdminStats {
  totalUsers: number;
  totalSessions: number;
  totalMinutes: number;
  avgDuration: number;
  totalVisits: number;
  uniqueVisitors7d: number;
  last7Days: number[];
  techniques: TechniqueStat[];
  recentSessions: RecentSession[];
}

const DUPLICATE_SESSION_WINDOW_MS = 90 * 1000;

const EMPTY_STATS: AdminStats = {
  totalUsers: 0,
  totalSessions: 0,
  totalMinutes: 0,
  avgDuration: 0,
  totalVisits: 0,
  uniqueVisitors7d: 0,
  last7Days: [],
  techniques: [],
  recentSessions: [],
};

const getLocalDateString = (date: Date) =>
  `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;

const parseLocalDateString = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const dedupeRecentSessions = (sessions: RecentSession[]) => {
  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return sortedSessions.filter((session, index, allSessions) => {
    const sessionTimestamp = new Date(session.created_at).getTime();

    return !allSessions.slice(0, index).some((previousSession) => {
      const previousActor = previousSession.user_id || previousSession.visitor_id || previousSession.id;
      const currentActor = session.user_id || session.visitor_id || session.id;
      if (previousActor !== currentActor) return false;
      if (previousSession.technique_name !== session.technique_name) return false;
      if (previousSession.duration_seconds !== session.duration_seconds) return false;

      const previousTimestamp = new Date(previousSession.created_at).getTime();
      return Math.abs(previousTimestamp - sessionTimestamp) <= DUPLICATE_SESSION_WINDOW_MS;
    });
  });
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [stats, setStats] = useState<AdminStats>(EMPTY_STATS);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const refreshTimeoutRef = useRef<number | null>(null);

  const fetchDashboard = useCallback(async (showLoading = true) => {
      if (showLoading) {
        setLoading(true);
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setIsAdmin(false);
        if (showLoading) setLoading(false);
        return;
      }

      setCurrentUserEmail(session.user.email || null);

      if (!isAdminEmail(session.user.email)) {
        setIsAdmin(false);
        if (showLoading) setLoading(false);
        return;
      }

      setIsAdmin(true);

      const [
        { data: sessionRows, error: sessionsError },
        { count: profilesCount, error: profilesError },
      ] = await Promise.all([
        supabase
          .from('meditation_sessions')
          .select('id, user_id, visitor_id, technique_name, duration_seconds, created_at, profiles(email)')
          .order('created_at', { ascending: false }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
      ]);
      const data = sessionRows;
      const error = sessionsError ?? { code: 'unknown' };

      if (sessionsError) {
        console.error('Error fetching admin stats:', sessionsError);
        setErrorMessage(
          `Không thể truy cập dữ liệu quản trị lúc này (mã lỗi: ${error.code}). Hãy kiểm tra lại quyền RLS và quan hệ với bảng profiles.`
        );
        if (showLoading) setLoading(false);
        return;
      }

      if (profilesError) {
        console.warn('KhÃ´ng thá»ƒ Ä‘áº¿m profiles, sáº½ fallback theo meditation_sessions:', profilesError);
      }

      const sessions = dedupeRecentSessions((data ?? []) as RecentSession[]);
      let totalVisits = 0;
      let uniqueVisitors7d = 0;
      const uniqueUsers = new Set<string>();
      let totalMinutes = 0;
      const techniqueMap: Record<string, number> = {};
      const dayBuckets = Array(7).fill(0);
      const todayDate = parseLocalDateString(getLocalDateString(new Date()));

      try {
        const visits = await fetchSiteVisits();
        totalVisits = visits.length;
        uniqueVisitors7d = new Set(
          visits
            .filter((visit) => {
              const visitDate = new Date(visit.created_at);
              const dateKey = getLocalDateString(visitDate);
              const diffDays = Math.floor(
                (todayDate.getTime() - parseLocalDateString(dateKey).getTime()) / (1000 * 3600 * 24)
              );
              return diffDays >= 0 && diffDays < 7;
            })
            .map((visit) => visit.visitor_id)
        ).size;
      } catch (visitError) {
        console.warn('Không thể tải thống kê lượt ghé:', visitError);
      }

      sessions.forEach((sessionItem) => {
        if (sessionItem.user_id) uniqueUsers.add(sessionItem.user_id);
        totalMinutes += Math.floor(sessionItem.duration_seconds / 60);

        const techniqueName = sessionItem.technique_name || 'Tùy chỉnh';
        techniqueMap[techniqueName] = (techniqueMap[techniqueName] || 0) + 1;

        const sessionDate = new Date(sessionItem.created_at);
        const dateKey = getLocalDateString(sessionDate);
        const diffDays = Math.floor(
          (todayDate.getTime() - parseLocalDateString(dateKey).getTime()) / (1000 * 3600 * 24)
        );

        if (diffDays >= 0 && diffDays < 7) {
          dayBuckets[diffDays] += 1;
        }
      });

      setStats({
        totalUsers: profilesCount ?? uniqueUsers.size,
        totalSessions: sessions.length,
        totalMinutes,
        avgDuration: sessions.length > 0 ? Math.round(totalMinutes / sessions.length) : 0,
        totalVisits,
        uniqueVisitors7d,
        last7Days: dayBuckets.reverse(),
        techniques: Object.entries(techniqueMap)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5),
        recentSessions: sessions.slice(0, 50),
      });

      setErrorMessage('');
      if (showLoading) setLoading(false);
  }, []);

  useEffect(() => {
    void fetchDashboard(true);
  }, [fetchDashboard]);

  useEffect(() => {
    if (!isAdmin) return undefined;

    const scheduleRefresh = () => {
      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
      }

      refreshTimeoutRef.current = window.setTimeout(() => {
        void fetchDashboard(false);
      }, 350);
    };

    const channel = supabase
      .channel('admin-dashboard-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meditation_sessions' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_visits' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, scheduleRefresh)
      .subscribe();

    const intervalId = window.setInterval(() => {
      void fetchDashboard(false);
    }, 30000);

    return () => {
      window.clearInterval(intervalId);
      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
      void supabase.removeChannel(channel);
    };
  }, [fetchDashboard, isAdmin]);

  const orderedLabels = useMemo(() => {
    const weekdayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    const today = new Date().getDay();
    const labels: string[] = [];

    for (let index = 6; index >= 0; index -= 1) {
      const day = (today - index + 7) % 7;
      labels.push(weekdayLabels[day === 0 ? 6 : day - 1]);
    }

    return labels;
  }, []);

  const maxSessions = Math.max(...stats.last7Days, 1);
  const shouldScrollRecentSessions = stats.recentSessions.length > 20;

  if (!loading && isAdmin === false) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-[#FCF9F3] dark:bg-[#0d0b09]">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
          <Shield className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-[#4A3C31] dark:text-[#F5EDE0] mb-2">Truy cập bị từ chối</h1>
        <p className="text-[#8B7D6E] dark:text-[#B0A090] max-w-md mb-4">Tài khoản hiện tại không có quyền xem trang quản trị.</p>
        <p className="text-xs text-[#A37B5C] font-mono mb-8 bg-white/50 dark:bg-white/5 px-4 py-2 rounded-full border border-[#E8DFC9] dark:border-white/10">
          Email hiện tại: {currentUserEmail || 'Chưa đăng nhập'}
        </p>
        <button onClick={onBack} className="px-6 py-3 bg-indigo-500 text-white rounded-full hover:bg-indigo-600 transition-all font-medium">
          Quay lại thư viện
        </button>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-[#FCF9F3] dark:bg-[#0d0b09]">
        <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center mb-6">
          <Activity className="w-10 h-10 text-amber-500" />
        </div>
        <h1 className="text-2xl font-bold text-[#4A3C31] dark:text-[#F5EDE0] mb-2">Không tải được dữ liệu</h1>
        <p className="text-[#8B7D6E] dark:text-[#B0A090] max-w-lg mb-8">{errorMessage}</p>
        <div className="flex gap-4">
          <button onClick={() => window.location.reload()} className="px-6 py-3 bg-indigo-500 text-white rounded-full hover:bg-indigo-600 transition-all font-medium">
            Thử lại
          </button>
          <button onClick={onBack} className="px-6 py-3 bg-white dark:bg-white/5 border border-[#E8DFC9] dark:border-white/10 text-[#4A3C31] dark:text-[#F5EDE0] rounded-full hover:bg-gray-50 dark:hover:bg-white/10 transition-all font-medium">
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCF9] dark:bg-[#0D0B09] transition-colors duration-500">
      <div className="max-w-6xl mx-auto px-4 pb-16 pt-8 sm:px-6 sm:pb-24 sm:pt-12">
        <div className="mb-8 flex flex-col gap-4 sm:mb-12 md:flex-row md:items-center md:justify-between md:gap-6">
          <div className="flex items-start gap-3 sm:items-center sm:gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onBack}
              className="rounded-2xl border border-[#E8DFC9] bg-white p-3 shadow-sm dark:border-white/10 dark:bg-white/5"
            >
              <ArrowLeft className="w-5 h-5 text-indigo-500" />
            </motion.button>
            <div className="min-w-0">
              <h1 className="text-[2rem] font-bold leading-tight text-[#4A3C31] dark:text-[#F5EDE0] sm:text-3xl">Quản Trị Hệ Thống</h1>
              <p className="mt-1 max-w-xl text-sm leading-6 text-[#8B7D6E] dark:text-[#B0A090] sm:text-base">Theo dõi người dùng, phiên thiền và xu hướng sử dụng.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-2 dark:border-indigo-500/20 dark:bg-indigo-900/20 md:self-auto">
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Hệ thống đang hoạt động</span>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-32 gap-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full"
            />
            <p className="text-[#8B7D6E] dark:text-[#B0A090] animate-pulse">Đang tải dữ liệu quản trị...</p>
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-8">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
              {[
                { label: 'Tổng người dùng', value: stats.totalUsers, icon: Users },
                { label: 'Tổng phiên thiền', value: stats.totalSessions, icon: Activity },
                { label: 'Tổng lượt ghé', value: stats.totalVisits, icon: Calendar },
                { label: 'Khách duy nhất 7 ngày', value: stats.uniqueVisitors7d, icon: Shield },
                { label: 'Tổng số phút', value: stats.totalMinutes, icon: Clock },
                { label: 'Trung bình mỗi phiên', value: `${stats.avgDuration} phút`, icon: TrendingUp },
              ].map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                  className="rounded-[26px] border border-[#E8DFC9] bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5 sm:p-6"
                >
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 sm:mb-4 sm:h-12 sm:w-12">
                    <item.icon className="h-5 w-5 text-indigo-500 sm:h-6 sm:w-6" />
                  </div>
                  <div className="text-[2rem] font-bold leading-none text-[#4A3C31] dark:text-[#F5EDE0] sm:text-3xl">{item.value}</div>
                  <div className="mt-2 text-xs leading-5 text-[#8B7D6E] dark:text-[#B0A090] sm:mt-1 sm:text-sm">{item.label}</div>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:gap-8 lg:grid-cols-3">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-3xl border border-[#E8DFC9] bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5 sm:p-8 lg:col-span-2"
              >
                <div className="mb-5 flex items-center justify-between sm:mb-8">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-500" />
                    Lượt thiền 7 ngày qua
                  </h3>
                </div>

                <div className="flex h-56 items-end justify-between gap-2 px-1 sm:h-64 sm:gap-4 sm:px-2">
                  {stats.last7Days.map((count, index) => {
                    const barHeight = count === 0 ? 0 : Math.max((count / maxSessions) * 176, 14);

                    return (
                      <div key={`${orderedLabels[index]}-${index}`} className="flex h-full flex-1 flex-col items-center justify-end gap-3 group relative">
                        <div className="opacity-0 group-hover:opacity-100 absolute top-0 bg-indigo-500 text-white text-xs py-1 px-2 rounded-lg transition-all pointer-events-none z-10">
                          {count} phiên
                        </div>
                        <div className="flex h-full w-full items-end justify-center">
                          <div className="relative flex h-full w-full max-w-[40px] items-end rounded-xl bg-[#F3EFE7] dark:bg-white/5 overflow-hidden">
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${barHeight}px` }}
                              transition={{ duration: 0.8, ease: 'easeOut' }}
                              className="w-full rounded-t-xl bg-gradient-to-t from-indigo-500 to-indigo-300 dark:from-indigo-600 dark:to-indigo-400 relative overflow-hidden"
                            >
                              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </motion.div>
                          </div>
                        </div>
                        <span className="text-xs font-medium text-[#8B7D6E] dark:text-[#B0A090]">{orderedLabels[index]}</span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-3xl border border-[#E8DFC9] bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5 sm:p-8"
              >
                <h3 className="mb-5 flex items-center gap-2 text-lg font-bold sm:mb-8">
                  <Award className="w-5 h-5 text-amber-500" />
                  Kỹ thuật phổ biến
                </h3>

                <div className="space-y-4 sm:space-y-6">
                  {stats.techniques.map((technique, index) => (
                    <div key={technique.name} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-[#4A3C31] dark:text-[#F5EDE0]">{technique.name}</span>
                        <span className="text-indigo-500 font-bold">{technique.count}</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(technique.count / Math.max(stats.totalSessions, 1)) * 100}%` }}
                          transition={{ duration: 1, delay: index * 0.08 }}
                          className="h-full bg-amber-400 rounded-full"
                        />
                      </div>
                    </div>
                  ))}

                  {stats.techniques.length === 0 && (
                    <p className="text-sm text-[#8B7D6E] italic text-center py-10">Chưa có dữ liệu phân tích.</p>
                  )}
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
                className="overflow-hidden rounded-3xl border border-[#E8DFC9] bg-white shadow-sm dark:border-white/10 dark:bg-white/5"
              >
                <div className="border-b border-[#E8DFC9] p-4 dark:border-white/10 sm:p-8">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <List className="w-5 h-5 text-emerald-500" />
                    Hoạt động gần đây
                  </h3>
                </div>
                <div className="block md:hidden">
                  {stats.recentSessions.length === 0 ? (
                    <div className="px-4 py-12 text-center text-sm italic text-[#8B7D6E] dark:text-[#B0A090]">
                      Chưa có hoạt động nào.
                    </div>
                  ) : (
                    <div className={`${shouldScrollRecentSessions ? 'max-h-[960px] overflow-y-auto' : ''} divide-y divide-[#E8DFC9]/70 dark:divide-white/5`}>
                      {stats.recentSessions.map((session) => {
                        const displayName =
                          session.profiles?.email || (session.user_id ? 'Người dùng mới' : 'Khách ẩn danh');
                        const email =
                          session.profiles?.email ||
                          (session.visitor_id ? `visitor:${session.visitor_id.slice(-8)}` : 'Chưa có email');

                        return (
                          <div key={session.id} className="space-y-4 px-4 py-4">
                            <div className="flex items-start gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-xs font-bold text-indigo-600 dark:bg-indigo-900/30">
                                {displayName.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-[#4A3C31] dark:text-[#F5EDE0]">{displayName}</p>
                                <p className="truncate text-xs text-[#8B7D6E] dark:text-[#B0A090]">{email}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div className="rounded-2xl bg-[#FAF6EF] px-3 py-2 dark:bg-white/[0.03]">
                                <p className="text-[11px] uppercase tracking-wide text-[#8B7D6E] dark:text-[#B0A090]">Bài thiền</p>
                                <p className="mt-1 font-medium text-[#4A3C31] dark:text-[#F5EDE0]">{session.technique_name}</p>
                              </div>
                              <div className="rounded-2xl bg-[#FAF6EF] px-3 py-2 dark:bg-white/[0.03]">
                                <p className="text-[11px] uppercase tracking-wide text-[#8B7D6E] dark:text-[#B0A090]">Thời lượng</p>
                                <p className="mt-1 inline-flex rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                                  {Math.floor(session.duration_seconds / 60)}:{(session.duration_seconds % 60).toString().padStart(2, '0')}
                                </p>
                              </div>
                            </div>
                            <div className="rounded-2xl bg-[#FAF6EF] px-3 py-2 text-sm dark:bg-white/[0.03]">
                              <p className="text-[11px] uppercase tracking-wide text-[#8B7D6E] dark:text-[#B0A090]">Thời điểm</p>
                              <p className="mt-1 font-medium text-[#4A3C31] dark:text-[#F5EDE0]">{new Date(session.created_at).toLocaleDateString('vi-VN')}</p>
                              <p className="text-xs text-[#8B7D6E] dark:text-[#B0A090]">
                                {new Date(session.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className={`${shouldScrollRecentSessions ? 'max-h-[1200px] overflow-y-auto' : ''} hidden overflow-x-auto md:block`}>
                  <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 dark:bg-white/[0.02] text-xs uppercase tracking-wider text-[#8B7D6E] dark:text-[#B0A090]">
                      <th className="px-8 py-4 font-semibold">Người dùng</th>
                      <th className="px-8 py-4 font-semibold">Bài thiền</th>
                      <th className="px-8 py-4 font-semibold text-center">Thời lượng</th>
                      <th className="px-8 py-4 font-semibold text-right">Thời điểm</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8DFC9]/50 dark:divide-white/5">
                    {stats.recentSessions.map((session) => {
                      const displayName =
                        session.profiles?.email || (session.user_id ? 'Người dùng mới' : 'Khách ẩn danh');
                      const email =
                        session.profiles?.email ||
                        (session.visitor_id ? `visitor:${session.visitor_id.slice(-8)}` : 'Chưa có email');

                      return (
                        <tr key={session.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01] transition-colors">
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-xs font-bold text-indigo-600">
                                {displayName.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-[#4A3C31] dark:text-[#F5EDE0]">{displayName}</span>
                                <span className="text-[10px] text-[#8B7D6E] dark:text-[#B0A090]">{email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <span className="text-sm font-medium text-[#4A3C31] dark:text-[#F5EDE0]">{session.technique_name}</span>
                          </td>
                          <td className="px-8 py-5 text-center">
                            <span className="text-xs px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg font-bold whitespace-nowrap">
                              {Math.floor(session.duration_seconds / 60)}:{(session.duration_seconds % 60).toString().padStart(2, '0')}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <div className="flex flex-col items-end">
                              <span className="text-sm text-[#4A3C31] dark:text-[#F5EDE0]">
                                {new Date(session.created_at).toLocaleDateString('vi-VN')}
                              </span>
                              <span className="text-[10px] text-[#8B7D6E] dark:text-[#B0A090]">
                                {new Date(session.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {stats.recentSessions.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-8 py-20 text-center text-[#8B7D6E] italic">
                          Chưa có hoạt động nào.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};
