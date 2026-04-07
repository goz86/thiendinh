import React, { useEffect, useState } from 'react';
import { ArrowLeft, Users, Clock, Activity, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AdminDashboardProps {
  onBack: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSessions: 0,
    totalMinutes: 0,
    last7Days: [] as number[]
  });
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchAdminStats = async () => {
      setLoading(true);
      
      // Fetch all meditation sessions without filtering
      const { data, error } = await supabase
        .from('meditation_sessions')
        .select('*');
        
      if (error) {
        console.error('Error fetching admin stats:', error);
        setErrorMsg('Không có quyền truy cập dữ liệu toàn cục. Vui lòng kiểm tra lại cấu hình RLS của bảng meditation_sessions trên Supabase (cần cho phép Select đối với admin).');
        setLoading(false);
        return;
      }
      
      if (data) {
        const uniqueUsers = new Set();
        let totalMins = 0;
        
        // Group by day constraint: last 7 days including today
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        
        const dayBuckets = Array(7).fill(0); // [0] = today, [1] = yesterday...
        
        data.forEach(session => {
          if (session.user_id) {
            uniqueUsers.add(session.user_id);
          }
          
          totalMins += Math.floor(session.duration_seconds / 60);
          
          const sessionDate = new Date(session.created_at);
          sessionDate.setHours(0, 0, 0, 0);
          const diffDays = Math.floor((now.getTime() - sessionDate.getTime()) / (1000 * 3600 * 24));
          
          if (diffDays >= 0 && diffDays < 7) {
            dayBuckets[diffDays] += Math.floor(session.duration_seconds / 60);
          }
        });

        setStats({
          totalUsers: uniqueUsers.size,
          totalSessions: data.length,
          totalMinutes: totalMins,
          last7Days: dayBuckets.reverse() // from 6 days ago -> today
        });
      }
      
      setLoading(false);
    };
    
    fetchAdminStats();
  }, []);

  const dayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  const today = new Date().getDay();
  const orderedLabels: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = (today - i + 7) % 7;
    orderedLabels.push(dayLabels[d === 0 ? 6 : d - 1]);
  }

  const maxMinutes = Math.max(...stats.last7Days, 1);

  return (
    <div className="min-h-screen p-6 max-w-3xl mx-auto pt-12 overflow-y-auto pb-20">
      <div className="flex items-center gap-4 mb-10">
        <button
          onClick={onBack}
          className="p-3 bg-white/50 hover:bg-white dark:bg-white/10 dark:hover:bg-white/20 shadow-sm rounded-full transition-all cursor-pointer border border-[#E8DFC9] dark:border-white/10"
        >
          <ArrowLeft className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-[#4A3C31] dark:text-[#F5EDE0]">Bảng Quản Trị Hệ Thống</h1>
          <p className="text-sm text-[#8B7D6E] dark:text-[#B0A090] mt-1">Dữ liệu tổng quan tất cả người dùng</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 gap-4">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-[#8B7D6E] dark:text-[#B0A090]">Đang tải dữ liệu...</p>
        </div>
      ) : errorMsg ? (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-6 rounded-2xl border border-red-200 dark:border-red-900/50">
          <p>{errorMsg}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white/70 dark:bg-white/5 backdrop-blur-md rounded-3xl border border-[#E8DFC9] dark:border-white/10 p-8 flex flex-col justify-center items-center text-center shadow-sm hover:shadow-md transition-all hover:-translate-y-1 group">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-full mb-5 group-hover:scale-110 transition-transform shadow-inner">
                <Users className="w-8 h-8 text-blue-500 dark:text-blue-400" />
              </div>
              <div className="text-5xl font-light font-mono text-[#4A3C31] dark:text-[#F5EDE0]">{stats.totalUsers}</div>
              <div className="text-sm text-[#8B7D6E] dark:text-[#B0A090] mt-3 font-semibold uppercase tracking-wider">Người truy cập</div>
            </div>
            
            <div className="bg-white/70 dark:bg-white/5 backdrop-blur-md rounded-3xl border border-[#E8DFC9] dark:border-white/10 p-8 flex flex-col justify-center items-center text-center shadow-sm hover:shadow-md transition-all hover:-translate-y-1 group">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-full mb-5 group-hover:scale-110 transition-transform shadow-inner">
                <Activity className="w-8 h-8 text-emerald-500 dark:text-emerald-400" />
              </div>
              <div className="text-5xl font-light font-mono text-[#4A3C31] dark:text-[#F5EDE0]">{stats.totalSessions}</div>
              <div className="text-sm text-[#8B7D6E] dark:text-[#B0A090] mt-3 font-semibold uppercase tracking-wider">Tổng phiên thiền</div>
            </div>
            
            <div className="bg-white/70 dark:bg-white/5 backdrop-blur-md rounded-3xl border border-[#E8DFC9] dark:border-white/10 p-8 flex flex-col justify-center items-center text-center shadow-sm hover:shadow-md transition-all hover:-translate-y-1 group">
              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-full mb-5 group-hover:scale-110 transition-transform shadow-inner">
                <Clock className="w-8 h-8 text-indigo-500 dark:text-indigo-400" />
              </div>
              <div className="text-5xl font-light font-mono text-[#4A3C31] dark:text-[#F5EDE0]">{stats.totalMinutes}</div>
              <div className="text-sm text-[#8B7D6E] dark:text-[#B0A090] mt-3 font-semibold uppercase tracking-wider">Tổng phút thiền</div>
            </div>
          </div>

          <div className="bg-white/70 dark:bg-white/5 backdrop-blur-md rounded-3xl border border-[#E8DFC9] dark:border-white/10 p-8 md:p-10 shadow-sm">
            <h3 className="text-lg font-medium text-[#5A4D41] dark:text-[#F5EDE0] mb-10 text-center">Mức độ hoạt động chung (7 ngày qua)</h3>
            <div className="flex items-end justify-between gap-3 md:gap-6 h-56 mt-4">
              {stats.last7Days.map((mins, i) => (
                <div key={i} className="flex flex-col items-center flex-1 gap-3 group relative">
                  <span className="text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400 absolute -top-8 transition-all group-hover:-translate-y-1">
                    {mins > 0 ? mins : ''}
                  </span>
                  <div
                    className="w-full rounded-t-xl transition-all duration-700 ease-out hover:brightness-110 shadow-[inset_0px_2px_10px_rgba(255,255,255,0.4)] dark:shadow-[inset_0px_2px_10px_rgba(255,255,255,0.1)]"
                    style={{
                      height: `${Math.max((mins / maxMinutes) * 100, 2)}%`,
                      background: mins > 0
                        ? 'linear-gradient(to top, #818cf8, #a5b4fc)'
                        : 'rgba(129, 140, 248, 0.1)',
                      minHeight: '8px'
                    }}
                  />
                  <span className="text-xs font-semibold text-[#8B7D6E] dark:text-[#B0A090] mt-2">{orderedLabels[i]}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
