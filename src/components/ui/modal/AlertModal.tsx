import React, { useEffect } from 'react';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  variant?: 'success' | 'error' | 'warning' | 'info';
}

const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  variant = 'info'
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  const variants = {
    success: {
      gradient: 'from-emerald-500 via-green-500 to-teal-500',
      glow: 'shadow-emerald-500/50',
      ring: 'ring-emerald-400/30',
      icon: (
        <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" className="stroke-white/30" strokeWidth="1.5" />
          <path className="stroke-white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4" />
        </svg>
      )
    },
    error: {
      gradient: 'from-rose-500 via-red-500 to-pink-500',
      glow: 'shadow-rose-500/50',
      ring: 'ring-rose-400/30',
      icon: (
        <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" className="stroke-white/30" strokeWidth="1.5" />
          <path className="stroke-white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 9l-6 6m0-6l6 6" />
        </svg>
      )
    },
    warning: {
      gradient: 'from-amber-500 via-yellow-500 to-orange-500',
      glow: 'shadow-amber-500/50',
      ring: 'ring-amber-400/30',
      icon: (
        <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24">
          <path className="stroke-white/30" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 2L2 20h20L12 2z" />
          <path className="stroke-white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v4m0 4h.01" />
        </svg>
      )
    },
    info: {
      gradient: 'from-blue-500 via-cyan-500 to-sky-500',
      glow: 'shadow-blue-500/50',
      ring: 'ring-blue-400/30',
      icon: (
        <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" className="stroke-white/30" strokeWidth="1.5" />
          <path className="stroke-white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 16v-4m0-4h.01" />
        </svg>
      )
    }
  };

  const style = variants[variant];

  return (
    <div 
      className="fixed inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/70 backdrop-blur-md flex items-center justify-center z-[99999] p-4 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Effect */}
        <div className={`absolute inset-0 bg-gradient-to-r ${style.gradient} opacity-20 blur-3xl rounded-3xl`} />
        
        {/* Main Card */}
        <div className={`relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl ${style.glow} ring-1 ${style.ring} overflow-hidden`}>
          {/* Header with Icon */}
          <div className="relative pt-12 pb-8 px-8 text-center">
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0" style={{
                backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
                backgroundSize: '32px 32px'
              }} />
            </div>
            
            {/* Icon Container */}
            <div className="relative inline-flex mb-6">
              <div className={`absolute inset-0 bg-gradient-to-r ${style.gradient} blur-xl opacity-60 animate-pulse`} />
              <div className={`relative bg-gradient-to-br ${style.gradient} p-4 rounded-2xl shadow-xl`}>
                {style.icon}
              </div>
            </div>
            
            {/* Title */}
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              {title}
            </h3>
            
            {/* Message */}
            <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed max-w-md mx-auto">
              {message}
            </p>
          </div>
          
          {/* Footer */}
          <div className="px-8 pb-8">
            <button
              onClick={onClose}
              className={`w-full bg-gradient-to-r ${style.gradient} hover:opacity-90 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200`}
            >
              ตรวจสอบแล้ว
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
