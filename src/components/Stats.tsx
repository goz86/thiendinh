import React from 'react';
import { ArrowLeft, Flame, Clock, Trophy, Heart, Trash2 } from 'lucide-react';
import { loadSessions, saveSessions, calculateStatsFromSessions } from '../utils/storage';
import { supabase } from '../lib/supabase';

interface StatsProps {
  onBack: () => void;
}

export const Stats: React.FC<StatsProps> = ({ onBack }) => {
  const [localSessions] = React.useState(loadSessions());
  const [cloudSessions, setCloudSessions] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [, setUser] = React.useState<any>(null);

  React.useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        setLoading(true);
        const { data } = await supabase
          .from('meditation_sessions')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (data) {
          // Map cloud data to match local structure
          const mappedCloud = data.map(s => ({
            id: s.id,
            date: new Date(s.created_at).toISOString().split('T')[0],
            techniqueId: s.technique_id,
            techniqueName: s.technique_name,
            durationSeconds: s.duration_seconds
          }));
          setCloudSessions(mappedCloud);
        }
        setLoading(false);
      }
    };
    checkUser();
  }, []);

  const sessions = React.useMemo(() => {
    // Basic merge: combine local and cloud, removing duplicates (simplified by using ID or date-duration-name)
    const combined = [...localSessions];
    
    cloudSessions.forEach(cloudS => {
      const exists = combined.find(localS => 
        localS.date === cloudS.date && 
        localS.techniqueId === cloudS.techniqueId && 
        localS.durationSeconds === cloudS.durationSeconds
      );
      if (!exists) {
        combined.push(cloudS);
      }
    });
    
    return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [localSessions, cloudSessions]);

  const stats = React.useMemo(() => calculateStatsFromSessions(sessions), [sessions]);

  const handleClear = async () => {
    if (confirm('Bạn có chắc muốn xoá toàn bộ lịch sử thiền (cửa hàng cục bộ)?')) {
      saveSessions([]);
      window.location.reload(); // Refresh to clear state easily
    }
  };

  const dayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  const today = new Date().getDay();
  const orderedLabels: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = (today - i + 7) % 7;
    orderedLabels.push(dayLabels[d === 0 ? 6 : d - 1]);
  }

  const maxMinutes = Math.max(...stats.last7, 1);

  return (
    <div className="min-h-screen p-6 max-w-2xl mx-auto pt-12">
      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        <button
          onClick={onBack}
          className="p-3 bg-white/50 hover:bg-white dark:bg-white/10 dark:hover:bg-white/20 shadow-sm rounded-full transition-all cursor-pointer border border-[#E8DFC9] dark:border-white/10"
        >
          <ArrowLeft className="w-5 h-5 text-[#A37B5C] dark:text-[#DECAA4]" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-[#4A3C31] dark:text-[#F5EDE0]">Bảng Thống Kê</h1>
          <p className="text-sm text-[#8B7D6E] dark:text-[#B0A090] mt-1">Hành trình thiền định của bạn</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white/60 dark:bg-white/5 backdrop-blur-md rounded-2xl border border-[#E8DFC9] dark:border-white/10 p-5 text-center">
          <Flame className="w-8 h-8 text-orange-400 mx-auto mb-2" />
          <div className="text-3xl font-light font-mono text-[#4A3C31] dark:text-[#F5EDE0]">{stats.streak}</div>
          <div className="text-xs text-[#8B7D6E] dark:text-[#B0A090] mt-1">Ngày liên tiếp</div>
        </div>
        <div className="bg-white/60 dark:bg-white/5 backdrop-blur-md rounded-2xl border border-[#E8DFC9] dark:border-white/10 p-5 text-center">
          <Clock className="w-8 h-8 text-blue-400 mx-auto mb-2" />
          <div className="text-3xl font-light font-mono text-[#4A3C31] dark:text-[#F5EDE0]">{stats.totalMinutes}</div>
          <div className="text-xs text-[#8B7D6E] dark:text-[#B0A090] mt-1">Phút thiền</div>
        </div>
        <div className="bg-white/60 dark:bg-white/5 backdrop-blur-md rounded-2xl border border-[#E8DFC9] dark:border-white/10 p-5 text-center">
          <Trophy className="w-8 h-8 text-amber-400 mx-auto mb-2" />
          <div className="text-3xl font-light font-mono text-[#4A3C31] dark:text-[#F5EDE0]">{stats.totalSessions}</div>
          <div className="text-xs text-[#8B7D6E] dark:text-[#B0A090] mt-1">Số lần thiền</div>
        </div>
        <div className="bg-white/60 dark:bg-white/5 backdrop-blur-md rounded-2xl border border-[#E8DFC9] dark:border-white/10 p-5 text-center">
          <Heart className="w-8 h-8 text-rose-400 mx-auto mb-2" />
          <div className="text-sm font-medium text-[#4A3C31] dark:text-[#F5EDE0] mt-1 break-words">{stats.favoriteTechnique}</div>
          <div className="text-xs text-[#8B7D6E] dark:text-[#B0A090] mt-1">Yêu thích</div>
        </div>
      </div>

      {/* 7-Day Chart */}
      <div className="bg-white/60 dark:bg-white/5 backdrop-blur-md rounded-2xl border border-[#E8DFC9] dark:border-white/10 p-6 mb-8">
        <h3 className="text-sm font-medium text-[#8B7D6E] dark:text-[#B0A090] mb-4">7 ngày gần nhất (phút)</h3>
        <div className="flex items-end justify-between gap-2 h-32">
          {stats.last7.map((mins, i) => (
            <div key={i} className="flex flex-col items-center flex-1 gap-1">
              <span className="text-xs font-mono text-[#A37B5C] dark:text-[#DECAA4]">{mins > 0 ? mins : ''}</span>
              <div
                className="w-full rounded-t-lg transition-all duration-500"
                style={{
                  height: `${Math.max((mins / maxMinutes) * 100, 4)}%`,
                  background: mins > 0
                    ? 'linear-gradient(to top, #C2A385, #A37B5C)'
                    : 'rgba(200,190,175,0.3)',
                  minHeight: '4px'
                }}
              />
              <span className="text-[10px] text-[#8B7D6E] dark:text-[#B0A090]">{orderedLabels[i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="bg-white/60 dark:bg-white/5 backdrop-blur-md rounded-2xl border border-[#E8DFC9] dark:border-white/10 p-6 mb-8">
        <h3 className="text-sm font-medium text-[#8B7D6E] dark:text-[#B0A090] mb-4 flex items-center justify-between">
          <span>Lịch sử gần đây</span>
          {loading && <span className="text-[10px] animate-pulse">Đang tải...</span>}
        </h3>
        {sessions.length === 0 ? (
          <p className="text-sm text-[#C2A385] text-center py-8">Chưa có buổi thiền nào. Hãy bắt đầu nào! 🧘</p>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {[...sessions].reverse().slice(0, 10).map(s => (
              <div key={s.id} className="flex items-center justify-between py-2 border-b border-[#F2EAE0] dark:border-white/5 last:border-0">
                <div>
                  <span className="text-sm font-medium text-[#4A3C31] dark:text-[#F5EDE0]">{s.techniqueName}</span>
                  <span className="text-xs text-[#C2A385] ml-2">{s.date}</span>
                </div>
                <span className="text-sm font-mono text-[#A37B5C] dark:text-[#DECAA4]">
                  {Math.floor(s.durationSeconds / 60)}:{(s.durationSeconds % 60).toString().padStart(2, '0')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Clear button */}
      {sessions.length > 0 && (
        <button
          onClick={handleClear}
          className="flex items-center gap-2 mx-auto text-sm text-red-400 hover:text-red-500 transition-colors cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
          Xoá lịch sử
        </button>
      )}
    </div>
  );
};
