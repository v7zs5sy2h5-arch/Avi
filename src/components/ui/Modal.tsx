"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/30 animate-[fadeIn_150ms_ease-out]"
        onClick={onClose}
      />
      <div className="relative w-full sm:max-w-md max-h-[85vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-bg border border-border-soft p-5 shadow-xl animate-[slideUp_180ms_ease-out]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-lg text-text">{title}</h2>
          <button
            onClick={onClose}
            aria-label="סגירה"
            className="h-9 w-9 flex items-center justify-center rounded-full text-text-muted hover:bg-surface-soft"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(24px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
      `}</style>
    </div>
  );
}
