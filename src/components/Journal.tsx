import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Calendar as CalendarIcon, MessageSquare, Trash2, Search } from 'lucide-react';
import type { JournalEntry, Mood } from '../types';
import { deleteJournalEntry, formatStoredDate, loadJournalEntries, parseStoredDate, syncWithCloud } from '../utils/storage';

interface JournalProps {
  onBack: () => void;
}

const moodEmojis: Record<Mood, string> = {
  peaceful: '😇',
  calm: '😌',
  neutral: '😐',
  tired: '😴',
  anxious: '😟',
  sad: '😢',
};

const moodLabels: Record<Mood, string> = {
  peaceful: 'Bình an',
  calm: 'Yên tĩnh',
  neutral: 'Bình thường',
  tired: 'Mệt mỏi',
  anxious: 'Lo âu',
  sad: 'Buồn',
};

export const Journal: React.FC<JournalProps> = ({ onBack }) => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadData = async () => {
      await syncWithCloud();
      const data = loadJournalEntries();
      setEntries(data.sort((a, b) => parseStoredDate(b.date).getTime() - parseStoredDate(a.date).getTime()));
    };

    void loadData();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc muốn xóa ghi chú này?')) {
      await deleteJournalEntry(id);
      setEntries((prev) => prev.filter((entry) => entry.id !== id));
    }
  };

  const filteredEntries = entries.filter((entry) =>
    entry.note.toLowerCase().includes(searchTerm.toLowerCase()) ||
    moodLabels[entry.mood].toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-[#FCF9F3] dark:bg-[#0d0b09] z-50 flex flex-col overflow-hidden">
      <div className="p-6 flex items-center justify-between border-b border-[#E8DFC9] dark:border-white/5 bg-white/50 dark:bg-white/5 backdrop-blur-md">
        <button
          onClick={onBack}
          className="p-3 bg-white/80 dark:bg-white/5 rounded-full shadow-sm cursor-pointer hover:bg-white transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-[#A37B5C] dark:text-[#DECAA4]" />
        </button>
        <h2 className="text-xl font-semibold text-[#4A3C31] dark:text-[#F5EDE0]">Nhật Ký Thiền</h2>
        <div className="w-12 h-12" />
      </div>

      <div className="px-6 py-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B7D6E] dark:text-[#DECAA4]/40" />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Tìm kiếm cảm xúc hoặc ghi chú..."
            className="w-full pl-11 pr-4 py-3 bg-white/80 dark:bg-white/5 border border-[#E8DFC9] dark:border-white/10 rounded-2xl text-sm text-[#4A3C31] dark:text-[#F5EDE0] focus:ring-2 focus:ring-[#A37B5C] outline-none transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-20 custom-scrollbar">
        {filteredEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 opacity-40">
            <MessageSquare className="w-12 h-12 mb-2 text-[#A37B5C]" />
            <p className="text-[#8B7D6E] dark:text-[#DECAA4]">Chưa có ghi chú nào</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredEntries.map((entry) => (
                <motion.div
                  key={entry.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white/80 dark:bg-white/5 p-5 rounded-3xl border border-[#E8DFC9] dark:border-white/10 shadow-sm relative overflow-hidden group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-1">
                        <CalendarIcon className="w-3.5 h-3.5 text-[#A37B5C]" />
                        <span className="text-[11px] font-medium text-[#8B7D6E] dark:text-[#DECAA4]/60 uppercase tracking-wider">
                          {formatStoredDate(entry.date, 'vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{moodEmojis[entry.mood]}</span>
                        <span className="text-sm font-semibold text-[#4A3C31] dark:text-[#F5EDE0]">
                          {moodLabels[entry.mood]}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => void handleDelete(entry.id)}
                      className="p-2 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-full cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-[#5A4D41] dark:text-[#DECAA4]/80 text-[15px] leading-relaxed italic">
                    "{entry.note || 'Không có ghi chú chi tiết.'}"
                  </p>

                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-radial from-[#A37B5C]/10 to-transparent opacity-50 blur-xl pointer-events-none" />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};
