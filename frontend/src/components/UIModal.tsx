import React from 'react';
import { X, AlertCircle, CheckCircle2, Info } from 'lucide-react';

interface UIModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  children: React.ReactNode;
  maxWidth?: string;
}

export const UIModal: React.FC<UIModalProps> = ({
  isOpen,
  onClose,
  title,
  type = 'info',
  children,
  maxWidth = 'max-w-2xl'
}) => {
  if (!isOpen) return null;

  const headerColors = {
    info: 'bg-black dark:bg-zinc-800 text-white',
    success: 'bg-emerald-600 text-white',
    warning: 'bg-amber-500 text-black',
    error: 'bg-red-600 text-white'
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
      <div 
        className={`w-full ${maxWidth} max-h-[90vh] flex flex-col bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[12px_12px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_rgba(255,255,255,0.2)] overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-6 py-4 flex items-center justify-between border-b-4 border-black dark:border-zinc-700 ${headerColors[type]}`}>
          <div className="flex items-center space-x-2">
            {type === 'success' && <CheckCircle2 className="w-5 h-5" />}
            {type === 'error' && <AlertCircle className="w-5 h-5" />}
            {type === 'info' && <Info className="w-5 h-5" />}
            <h3 className="text-lg font-black uppercase tracking-tight">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-black/20 rounded transition"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 text-zinc-900 dark:text-zinc-100">
          {children}
        </div>
      </div>
    </div>
  );
};
