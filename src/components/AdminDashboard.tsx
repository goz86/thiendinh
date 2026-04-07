import React, { useEffect, useState } from 'react';
import { ArrowLeft, Users, Clock, Activity, Shield, Calendar, TrendingUp, Award, List } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';

interface AdminDashboardProps {
  onBack: () => void;
}

interface TechniqueStat {
  name: string;
  count: number;
}

interface RecentSession {
  id: string;
  user_id: string;
  technique_name: string;
  duration_seconds: number;
  created_at: string;
  profiles?: {
    email: string;
  };
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSessions: 0,
    totalMinutes: 0,
    avgDuration: 0,
    last7Days: [] as number[],
    techniques: [] as TechniqueStat[],
    recentSessions: [] as RecentSession[]
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      setCurrentUserEmail(session.user.email || null);
      
      if (session.user.email !== 'heeffgh123@gmail.com') {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      
      setIsAdmin(true);
      
      // Fetch meditation sessions with profile emails
      const { data, error } = await supabase
        .from('meditation_sessions')
        .select('*, profiles(email)')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching admin stats:', error);
        setErrorMsg(`Không có quyền truy cập dữ liệu (Lỗi: ${error.code}). Hãy đảm bảo tài khoản ${session.user.email} đã được cấp quyền trong RLS.`);
        setLoading(false);
        return;
      }
      
      if (data) {
        const uniqueUsers = new Set();
        let totalMins = 0;
        const techMap: Record<string, number> = {};
        
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const dayBuckets = Array(7).fill(0);
        
        // Helper to get local date string YYYY-MM-DD
        const getLocalDateString = (d: Date) => {
          return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
        };

        const todayStr = getLocalDateString(new Date());
        
        data.forEach((session: any) => {
          if (session.user_id) uniqueUsers.add(session.user_id);
          totalMins += Math.floor(session.duration_seconds / 60);
          
          // Technique stats
          const techName = session.technique_name || 'Tùy chỉnh';
          techMap[techName] = (techMap[techName] || 0) + 1;
          
          // Day buckets logic using calendar days
          const sessionDate = new Date(session.created_at);
          const sessionDateStr = getLocalDateString(sessionDate);
          
          // Calculate diff by comparing timestamps of midnight local time
          const d1 = new Date(todayStr);
          const d2 = new Date(sessionDateStr);
          const diffDays = Math.round((d1.getTime() - d2.getTime()) / (1000 * 3600 * 24));
          
          if (diffDays >= 0 && diffDays < 7) {
            dayBuckets[diffDays] += 1;
          }
        });

        const techStats = Object.entries(techMap)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setStats({
          totalUsers: uniqueUsers.size,
          totalSessions: data.length,
          totalMinutes: totalMins,
          avgDuration: data.length > 0 ? Math.round(totalMins / data.length) : 0,
          last7Days: dayBuckets.reverse(),
          techniques: techStats,
          recentSessions: data.slice(0, 15) // Show more sessions
        });
      }
      
      setLoading(false);
    };
    
    checkAuthAndFetch();
  }, []);

  if (!loading && isAdmin === false) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-[#FCF9F3] dark:bg-[#0d0b09]">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
          <Shield className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-[#4A3C31] dark:text-[#F5EDE0] mb-2">Truy cập bị từ chối</h1>
        <p className="text-[#8B7D6E] dark:text-[#B0A090] max-w-md mb-4">
          Bạn không có quyền quản trị viên để xem trang này.
        </p>
        <p className="text-xs text-[#A37B5C] font-mono mb-8 bg-white/50 dark:bg-white/5 px-4 py-2 rounded-full border border-[#E8DFC9] dark:border-white/10">
          Email hiện tại: {currentUserEmail || 'Chưa đăng nhập'}
        </p>
        <button
          onClick={onBack}
          className="px-6 py-3 bg-indigo-500 text-white rounded-full hover:bg-indigo-600 transition-all font-medium"
        >
          Quay lại thư viện
        </button>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-[#FCF9F3] dark:bg-[#0d0b09]">
        <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center mb-6">
          <Activity className="w-10 h-10 text-amber-500" />
        </div>
        <h1 className="text-2xl font-bold text-[#4A3C31] dark:text-[#F5EDE0] mb-2">Lỗi truy xuất dữ liệu</h1>
        <p className="text-[#8B7D6E] dark:text-[#B0A090] max-w-lg mb-8">
          {errorMsg}
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-indigo-500 text-white rounded-full hover:bg-indigo-600 transition-all font-medium"
          >
            Thử lại
          </button>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-white dark:bg-white/5 border border-[#E8DFC9] dark:border-white/10 text-[#4A3C31] dark:text-[#F5EDE0] rounded-full hover:bg-gray-50 dark:hover:bg-white/10 transition-all font-medium"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  const dayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  const today = new Date().getDay();
  const orderedLabels: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = (today - i + 7) % 7;
    orderedLabels.push(dayLabels[d === 0 ? 6 : d - 1]);
  }

  const maxSessions = Math.max(...stats.last7Days, 1);

  return (
    <div className="min-h-screen bg-[#FDFCF9] dark:bg-[#0D0B09] transition-colors duration-500">
      <div className="max-w-6xl mx-auto p-6 pt-12 pb-24">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onBack}
              className="p-3 bg-white dark:bg-white/5 shadow-sm rounded-2xl border border-[#E8DFC9] dark:border-white/10"
            >
              <ArrowLeft className="w-5 h-5 text-indigo-500" />
            </motion.button>
            <div>
              <h1 className="text-3xl font-bold text-[#4A3C31] dark:text-[#F5EDE0]">Quản Trị Hệ Thống</h1>
              <p className="text-[#8B7D6E] dark:text-[#B0A090]">Admin Panel — Tên người dùng chi tiết</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-500/20">
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Hệ thống đang trực tuyến</span>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-32 gap-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full"
            />
            <p className="text-[#8B7D6E] dark:text-[#B0A090] animate-pulse">Đang định danh người dùng...</p>
          </div>
        ) : errorMsg ? (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-8 rounded-3xl border border-red-200 dark:border-red-900/50 flex items-center gap-4">
            <Shield className="w-6 h-6 shrink-0" />
            <p>{errorMsg}</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Top Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Tổng người dùng', value: stats.totalUsers, icon: Users, color: 'blue' },
                { label: 'Tổng phiên tập', value: stats.totalSessions, icon: Activity, color: 'emerald' },
                { label: 'Tổng số phút', value: stats.totalMinutes, icon: Clock, color: 'indigo' },
                { label: 'Trung bình/phiên', value: `${stats.avgDuration}m`, icon: TrendingUp, color: 'amber' },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white dark:bg-white/5 p-6 rounded-3xl border border-[#E8DFC9] dark:border-white/10 shadow-sm"
                >
                  <div className={`w-12 h-12 rounded-2xl bg-${item.color}-50 dark:bg-${item.color}-900/20 flex items-center justify-center mb-4`}>
                    <item.icon className="w-6 h-6 text-indigo-500" />
                  </div>
                  <div className="text-3xl font-bold text-[#4A3C31] dark:text-[#F5EDE0]">{item.value}</div>
                  <div className="text-sm text-[#8B7D6E] dark:text-[#B0A090] mt-1">{item.label}</div>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Activity Chart */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="lg:col-span-2 bg-white dark:bg-white/5 p-8 rounded-3xl border border-[#E8DFC9] dark:border-white/10 shadow-sm"
              >
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-500" />
                    Lượt thiền 7 ngày qua
                  </h3>
                </div>
                <div className="flex items-end justify-between gap-4 h-64 px-2">
                  {stats.last7Days.map((count, i) => (
                    <div key={i} className="flex flex-col items-center flex-1 gap-3 group relative">
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-10 bg-indigo-500 text-white text-xs py-1 px-2 rounded-lg transition-all mb-2 pointer-events-none">
                        {count} phiên
                      </div>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max((count / maxSessions) * 100, 5)}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="w-full max-w-[40px] rounded-t-xl bg-gradient-to-t from-indigo-500 to-indigo-300 dark:from-indigo-600 dark:to-indigo-400 relative overflow-hidden group-hover:brightness-110 transition-all shadow-sm"
                      >
                        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </motion.div>
                      <span className="text-xs font-medium text-[#8B7D6E] dark:text-[#B0A090]">{orderedLabels[i]}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Popular Techniques */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-white/5 p-8 rounded-3xl border border-[#E8DFC9] dark:border-white/10 shadow-sm"
              >
                <h3 className="text-lg font-bold flex items-center gap-2 mb-8">
                  <Award className="w-5 h-5 text-amber-500" />
                  Kỹ thuật phổ biến
                </h3>
                <div className="space-y-6">
                  {stats.techniques.map((tech, i) => (
                    <div key={tech.name} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-[#4A3C31] dark:text-[#F5EDE0]">{tech.name}</span>
                        <span className="text-indigo-500 font-bold">{tech.count}</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(tech.count / stats.totalSessions) * 100}%` }}
                          transition={{ duration: 1, delay: i * 0.1 }}
                          className="h-full bg-amber-400 rounded-full"
                        />
                      </div>
                    </div>
                  ))}
                  {stats.techniques.length === 0 && (
                    <p className="text-sm text-[#8B7D6E] italic text-center py-10">Chưa có dữ liệu phân tích</p>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Recent Sessions Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-white/5 rounded-3xl border border-[#E8DFC9] dark:border-white/10 shadow-sm overflow-hidden"
            >
              <div className="p-8 border-b border-[#E8DFC9] dark:border-white/10">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <List className="w-5 h-5 text-emerald-500" />
                  Danh hiệu & Hoạt động thực tế
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 dark:bg-white/[0.02] text-xs uppercase tracking-wider text-[#8B7D6E] dark:text-[#B0A090]">
                      <th className="px-8 py-4 font-semibold">Tên người dùng (Email)</th>
                      <th className="px-8 py-4 font-semibold">Bài thiền</th>
                      <th className="px-8 py-4 font-semibold text-center">Thời lượng</th>
                      <th className="px-8 py-4 font-semibold text-right">Thời điểm</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8DFC9]/50 dark:divide-white/5">
                    {stats.recentSessions.map((session) => (
                      <tr key={session.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01] transition-colors group">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-xs font-bold text-indigo-600">
                              {session.profiles?.email?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-[#4A3C31] dark:text-[#F5EDE0]">
                                {session.profiles?.email || 'Người dùng mới'}
                              </span>
                              <span className="text-[10px] font-mono text-[#8B7D6E] dark:text-[#B0A090]">ID: ...{session.user_id.slice(-6)}</span>
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
                    ))}
                    {stats.recentSessions.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-8 py-20 text-center text-[#8B7D6E] italic">Chưa phát hiện hoạt động nào</td>
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
