import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, LogIn, UserPlus, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { syncProfile } from '../utils/profile';

interface AuthProps {
  onSuccess: () => void;
  onBack: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onSuccess, onBack }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const getEmailRedirectUrl = () => {
    const configuredUrl = import.meta.env.VITE_PUBLIC_SITE_URL?.trim();
    if (configuredUrl) return configuredUrl;

    if (typeof window !== 'undefined') {
      return window.location.origin;
    }

    return undefined;
  };

  const handleAuth = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onSuccess();
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: getEmailRedirectUrl(),
        },
      });

      if (error) throw error;

      if (data.user?.id && data.user.email) {
        try {
          await syncProfile({
            id: data.user.id,
            email: data.user.email,
          });
        } catch (profileError) {
          console.warn('Không thể đồng bộ profiles sau khi đăng ký:', profileError);
        }
      }

      setMessage({
        type: 'success',
        text: 'Email xác nhận đã được gửi. Vui lòng kiểm tra hộp thư của bạn.',
      });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Có lỗi xảy ra, vui lòng thử lại sau.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-[#FCF9F3] to-[#F2EAE0] dark:from-[#1a1612] dark:to-[#0d0b09]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl border border-[#DECAA4] bg-white/70 p-8 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-white/5"
      >
        <button
          onClick={onBack}
          className="mb-6 p-2 text-[#8B7D6E] transition-colors hover:text-[#4A3C31] dark:text-[#B0A090] dark:hover:text-[#F5EDE0]"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <div className="mb-8 text-center">
          <h2 className="text-3xl font-semibold text-[#4A3C31] dark:text-[#F5EDE0]">
            {isLogin ? 'Chào mừng trở lại' : 'Bắt đầu hành trình'}
          </h2>
          <p className="mt-2 text-[#8B7D6E] dark:text-[#B0A090]">
            {isLogin ? 'Đăng nhập để lưu lại lịch sử thiền' : 'Tạo tài khoản để đồng bộ dữ liệu'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#C2A385]" />
            <input
              type="email"
              placeholder="Email của bạn"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-[#DECAA4] bg-white/50 py-4 pl-12 pr-4 text-[#4A3C31] transition-all focus:outline-none focus:ring-2 focus:ring-[#A37B5C] dark:border-white/10 dark:bg-white/5 dark:text-[#F5EDE0] dark:focus:ring-[#DECAA4]"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#C2A385]" />
            <input
              type="password"
              placeholder="Mật khẩu"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-[#DECAA4] bg-white/50 py-4 pl-12 pr-4 text-[#4A3C31] transition-all focus:outline-none focus:ring-2 focus:ring-[#A37B5C] dark:border-white/10 dark:bg-white/5 dark:text-[#F5EDE0] dark:focus:ring-[#DECAA4]"
            />
          </div>

          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`flex items-start gap-3 rounded-xl p-4 ${
                  message.type === 'error'
                    ? 'bg-red-50 text-red-600 dark:bg-red-900/20'
                    : 'bg-green-50 text-green-600 dark:bg-green-900/20'
                }`}
              >
                {message.type === 'error' ? (
                  <AlertCircle className="h-5 w-5 shrink-0" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                )}
                <p className="text-sm">{message.text}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#5A4D41] py-4 font-medium text-white shadow-lg transition-all hover:bg-[#4A3C31] hover:shadow-xl disabled:opacity-50"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : isLogin ? (
              <>
                <LogIn className="h-5 w-5" /> Đăng nhập
              </>
            ) : (
              <>
                <UserPlus className="h-5 w-5" /> Đăng ký
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setMessage(null);
            }}
            className="font-medium text-[#A37B5C] transition-colors hover:text-[#5A4D41]"
          >
            {isLogin ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Đăng nhập'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
