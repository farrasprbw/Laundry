import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onSubmit?: () => void;
  submitText?: string;
  cancelText?: string;
}

export function Modal({ isOpen, onClose, title, children, onSubmit, submitText = 'Simpan', cancelText = 'Batal' }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-scrim/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-lg border border-outline-variant/30 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between shrink-0">
          <h2 className="text-title-lg font-title-lg text-on-surface">{title}</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-outline-variant/20 flex justify-end gap-3 shrink-0 bg-surface-container-lowest rounded-b-2xl">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-outline text-on-surface hover:bg-surface-container-low transition-colors font-label-md text-label-md"
          >
            {cancelText}
          </button>
          {onSubmit && (
            <button 
              onClick={onSubmit}
              className="px-5 py-2.5 rounded-xl bg-primary text-on-primary hover:bg-primary/90 transition-colors shadow-sm font-label-md text-label-md"
            >
              {submitText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
