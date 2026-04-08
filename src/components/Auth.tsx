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

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onSuccess();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: getEmailRedirectUrl(),
          },
        });

        if (error) throw error;

        if (data.user?.id && data.user.email) {
          await syncProfile({
            id: data.user.id,
            email: data.user.email,
          });
        }

        setMessage({ type: 'success', text: 'Kiem tra email cua ban de xac nhan dang ky!' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Co loi xay ra, thu lai sau.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-[#FCF9F3] to-[#F2EAE0] dark:from-[#1a1612] dark:to-[#0d0b09]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/70 dark:bg-white/5 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-[#DECAA4] dark:border-white/10"
      >
        <button
          onClick={onBack}
          className="mb-6 p-2 text-[#8B7D6E] hover:text-[#4A3C31] dark:text-[#B0A090] dark:hover:text-[#F5EDE0] transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-semibold text-[#4A3C31] dark:text-[#F5EDE0]">
            {isLogin ? 'Chao mung tro lai' : 'Bat dau hanh trinh'}
          </h2>
          <p className="text-[#8B7D6E] dark:text-[#B0A090] mt-2">
            {isLogin ? 'Dang nhap de luu lai lich su thien' : 'Tao tai khoan de dong bo du lieu'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#C2A385]" />
            <input
              type="email"
              placeholder="Email cua ban"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white/50 dark:bg-white/5 border border-[#DECAA4] dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#A37B5C] dark:focus:ring-[#DECAA4] transition-all text-[#4A3C31] dark:text-[#F5EDE0]"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#C2A385]" />
            <input
              type="password"
              placeholder="Mat khau"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white/50 dark:bg-white/5 border border-[#DECAA4] dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#A37B5C] dark:focus:ring-[#DECAA4] transition-all text-[#4A3C31] dark:text-[#F5EDE0]"
            />
          </div>

          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`p-4 rounded-xl flex items-start gap-3 ${
                  message.type === 'error'
                    ? 'bg-red-50 text-red-600 dark:bg-red-900/20'
                    : 'bg-green-50 text-green-600 dark:bg-green-900/20'
                }`}
              >
                {message.type === 'error' ? (
                  <AlertCircle className="w-5 h-5 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                )}
                <p className="text-sm">{message.text}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#5A4D41] hover:bg-[#4A3C31] text-white rounded-2xl font-medium transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isLogin ? (
              <>
                <LogIn className="w-5 h-5" /> Dang Nhap
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" /> Dang Ky
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
            className="text-[#A37B5C] hover:text-[#5A4D41] font-medium transition-colors"
          >
            {isLogin ? 'Chua co tai khoan? Dang ky ngay' : 'Da co tai khoan? Dang nhap'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
