import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Xác nhận",
  cancelText = "Hủy"
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#1a1612]/40 backdrop-blur-sm z-[100]"
          />
          
          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[101] p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-sm bg-white/80 dark:bg-[#1a1612]/90 backdrop-blur-2xl border border-[#DECAA4] dark:border-white/10 rounded-[2rem] p-8 shadow-2xl pointer-events-auto"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-[#FCF9F3] dark:bg-white/5 rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-[#E8DFC9] dark:border-white/10">
                  <LogOut className="w-8 h-8 text-[#A37B5C] dark:text-[#DECAA4]" />
                </div>
                
                <h3 className="text-xl font-semibold text-[#4A3C31] dark:text-[#F5EDE0] mb-2">{title}</h3>
                <p className="text-[#8B7D6E] dark:text-[#B0A090] mb-8 leading-relaxed">{message}</p>
                
                <div className="grid grid-cols-2 gap-3 w-full">
                  <button
                    onClick={onClose}
                    className="py-4 px-6 bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 text-[#5A4D41] dark:text-[#F5EDE0] rounded-2xl font-medium transition-all border border-[#E8DFC9] dark:border-white/10"
                  >
                    {cancelText}
                  </button>
                  <button
                    onClick={() => {
                      onConfirm();
                      onClose();
                    }}
                    className="py-4 px-6 bg-[#5A4D41] hover:bg-[#4A3C31] text-white rounded-2xl font-medium transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
                  >
                    {confirmText}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
