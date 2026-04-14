import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ y: 100, opacity: 0, scale: 0.5, rotate: -10 }}
      animate={{ y: 0, opacity: 1, scale: 1, rotate: 0 }}
      exit={{ y: 50, opacity: 0, scale: 0.8, rotate: 5 }}
      transition={{ type: "spring", damping: 15, stiffness: 200 }}
      className="fixed bottom-10 left-0 right-0 mx-auto w-max z-[200] flex items-center gap-4 bg-white dark:bg-[#1E2132] text-main px-6 py-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-2 border-vibrant-pink/20 backdrop-blur-xl"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${type === 'success' ? 'bg-vibrant-pink/10 text-vibrant-pink' : 'bg-vibrant-blue/10 text-vibrant-blue'}`}>
        {type === 'success' ? (
          <CheckCircle2 size={24} />
        ) : (
          <AlertCircle size={24} />
        )}
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-black uppercase tracking-widest opacity-40">System Message</span>
        <span className="text-sm font-bold tracking-tight" style={{ color: 'var(--text-main)' }}>{message}</span>
      </div>
      <button 
        onClick={onClose} 
        className="ml-6 p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
        style={{ color: 'var(--text-muted)' }}
      >
        <X size={16} />
      </button>
    </motion.div>
  );
};

export default Toast;
