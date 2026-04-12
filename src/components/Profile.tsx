import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  User,
  Mail,
  Save,
  LogOut,
  Shield,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Bell,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ACCOUNT_AVATARS, getUserAvatar, getUserDisplayName, isAdminEmail } from '../utils/auth';
import { fetchProfile, syncProfile } from '../utils/profile';
import { getReminderSetting, requestNotificationPermission, toggleReminderSetting } from '../utils/reminders';

interface ProfileProps {
  user: any;
  onBack: () => void;
  onLogout: () => void;
  onUserUpdated: (user: any) => void;
  onAdmin: () => void;
}

type Notice = { type: 'success' | 'error'; text: string } | null;

export const Profile: React.FC<ProfileProps> = ({ user, onBack, onLogout, onUserUpdated, onAdmin }) => {
  const [fullName, setFullName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncingProfile, setIsSyncingProfile] = useState(false);
  const [message, setMessage] = useState<Notice>(null);

  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('06:00');

  useEffect(() => {
    const { enabled, time } = getReminderSetting();
    setReminderEnabled(enabled);
    setReminderTime(time);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      if (!user?.id) return;

      setFullName(getUserDisplayName(user));
      setSelectedAvatar(getUserAvatar(user));
      setIsSyncingProfile(true);

      try {
        await fetchProfile(user.id);
      } catch {
        if (isMounted) {
          setFullName(getUserDisplayName(user));
          setSelectedAvatar(getUserAvatar(user));
        }
      } finally {
        if (isMounted) setIsSyncingProfile(false);
      }
    };

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const nextName = fullName.trim() || getUserDisplayName(user);
    const nextAvatar = selectedAvatar || getUserAvatar(user);

    try {
      const { data, error } = await supabase.auth.updateUser({
        data: {
          full_name: nextName,
          name: nextName,
          avatar: nextAvatar,
        },
      });

      if (error) throw error;

      try {
        await syncProfile({
          id: user.id,
          email: user.email,
        });
      } catch {
        // Best-effort database sync; auth metadata remains the primary source of truth.
      }

      if (data.user) onUserUpdated(data.user);

      // Save reminder settings locally
      toggleReminderSetting(reminderEnabled, reminderTime);
      if (reminderEnabled) {
        await requestNotificationPermission();
      }

      setFullName(nextName);
      setSelectedAvatar(nextAvatar);
      setMessage({ type: 'success', text: 'Hồ sơ đã được cập nhật vào tài khoản.' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || 'Không thể cập nhật hồ sơ lúc này.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#FCF9F3] dark:bg-[#0d0b09] z-50 flex flex-col overflow-hidden">
      <div className="p-6 flex items-center justify-between border-b border-[#E8DFC9] dark:border-white/5 bg-white/50 dark:bg-white/5 backdrop-blur-md">
        <button
          onClick={onBack}
          className="p-3 bg-white/80 dark:bg-white/5 rounded-full shadow-sm cursor-pointer hover:bg-white transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-[#A37B5C] dark:text-[#DECAA4]" />
        </button>
        <h2 className="text-xl font-semibold text-[#4A3C31] dark:text-[#F5EDE0]">Hồ Sơ Người Dùng</h2>
        <div className="w-12 h-12" />
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto space-y-6"
        >
          <div className="bg-white/80 dark:bg-white/5 border border-[#E8DFC9] dark:border-white/10 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#A37B5C]/15 dark:bg-[#DECAA4]/10 flex items-center justify-center text-3xl">
                {selectedAvatar || getUserAvatar(user)}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-[#4A3C31] dark:text-[#F5EDE0]">{fullName || getUserDisplayName(user)}</h3>
                <p className="text-sm text-[#8B7D6E] dark:text-[#B0A090]">{user?.email}</p>
                {isSyncingProfile && (
                  <div className="mt-2 inline-flex items-center gap-2 text-xs text-[#8B7D6E] dark:text-[#B0A090]">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Đang tải hồ sơ...
                  </div>
                )}
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} className="bg-white/80 dark:bg-white/5 border border-[#E8DFC9] dark:border-white/10 rounded-3xl p-6 shadow-sm space-y-5">
            <div>
              <label className="text-sm font-semibold text-[#4A3C31] dark:text-[#F5EDE0] mb-2 block">Tên hiển thị</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A37B5C]" />
                <input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Nhập tên của bạn"
                  className="w-full pl-12 pr-4 py-4 bg-[#FCF9F3] dark:bg-white/5 border border-[#E8DFC9] dark:border-white/10 rounded-2xl text-[#4A3C31] dark:text-[#F5EDE0] focus:ring-2 focus:ring-[#A37B5C] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-[#4A3C31] dark:text-[#F5EDE0] mb-3 block">Chọn avatar cute</label>
              <div className="grid grid-cols-5 gap-3">
                {ACCOUNT_AVATARS.map((avatar) => {
                  const isActive = avatar === selectedAvatar;
                  return (
                    <button
                      key={avatar}
                      type="button"
                      onClick={() => setSelectedAvatar(avatar)}
                      className={`flex h-14 w-full items-center justify-center rounded-2xl border text-2xl transition-all ${
                        isActive
                          ? 'border-[#A37B5C] bg-[#A37B5C]/10 shadow-sm scale-105'
                          : 'border-[#E8DFC9] dark:border-white/10 bg-[#FCF9F3] dark:bg-white/5 hover:bg-white'
                      }`}
                    >
                      {avatar}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-[#4A3C31] dark:text-[#F5EDE0] mb-2 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A37B5C]" />
                <input
                  value={user?.email || ''}
                  readOnly
                  className="w-full pl-12 pr-4 py-4 bg-[#F6F0E8] dark:bg-white/[0.03] border border-[#E8DFC9] dark:border-white/10 rounded-2xl text-[#8B7D6E] dark:text-[#B0A090] outline-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-[#E8DFC9] dark:border-white/10">
              <label className="text-sm font-semibold text-[#4A3C31] dark:text-[#F5EDE0] mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-[#A37B5C]" />
                  <span>Nhắc nhở thiền hàng ngày</span>
                </div>
                <button
                  type="button"
                  onClick={() => setReminderEnabled(!reminderEnabled)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors cursor-pointer ${reminderEnabled ? 'bg-[#A37B5C]' : 'bg-[#E8DFC9] dark:bg-white/10'}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition shadow-sm ${reminderEnabled ? 'translate-x-[22px]' : 'translate-x-1'}`} />
                </button>
              </label>
              
              {reminderEnabled && (
                <div className="mt-3 flex items-center gap-3">
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="flex-1 py-3 px-4 bg-[#FCF9F3] dark:bg-white/5 border border-[#E8DFC9] dark:border-white/10 rounded-xl text-[#4A3C31] dark:text-[#F5EDE0] outline-none"
                  />
                  <p className="text-xs text-[#8B7D6E] dark:text-[#B0A090] max-w-[200px]">
                    Đặt thời gian để nhận thông báo hít thở mỗi ngày.
                  </p>
                </div>
              )}
            </div>

            <AnimatePresence>
              {message && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`rounded-2xl p-4 flex items-start gap-3 ${
                    message.type === 'success'
                      ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                      : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                  }`}
                >
                  {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                  <p className="text-sm">{message.text}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-2xl bg-[#5A4D41] hover:bg-[#4A3C31] text-white font-medium transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </form>

          {isAdminEmail(user?.email) && (
            <button
              onClick={onAdmin}
              className="w-full py-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 font-medium transition-all flex items-center justify-center gap-2"
            >
              <Shield className="w-4 h-4" />
              Mở trang quản trị
            </button>
          )}

          <button
            onClick={onLogout}
            className="w-full py-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-300 font-medium transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Đăng xuất
          </button>
        </motion.div>
      </div>
    </div>
  );
};
