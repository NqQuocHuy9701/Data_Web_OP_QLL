"use client";

import React from "react";

interface ConfirmDialogProps {
  open: boolean;
  theme: "light" | "dark";
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  theme,
  title = "Xác nhận",
  message,
  confirmText = "Xác nhận",
  cancelText = "Hủy bỏ",
  pending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
      <div
        className={`rounded-3xl p-6 w-full max-w-md shadow-2xl border relative motion-safe:transition-colors motion-safe:animate-[class-schedule-enter_180ms_ease-out] ${
          theme === "dark"
            ? "bg-[#151b2b] border-white/10 text-slate-200"
            : "bg-white border-slate-100"
        }`}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${
              theme === "dark"
                ? "bg-rose-500/20 text-rose-400"
                : "bg-rose-50 text-rose-500"
            }`}
          >
            🔄
          </div>
          <h3
            className={`text-lg font-bold ${theme === "dark" ? "text-white" : "text-slate-800"}`}
          >
            {title}
          </h3>
        </div>

        <p
          className={`text-sm leading-relaxed mb-6 ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}
        >
          {message}
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs cursor-pointer border transition-colors ${
              theme === "dark"
                ? "bg-[#0a0f1c] border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/5"
                : "bg-slate-100 hover:bg-slate-200 text-slate-600 border-transparent"
            }`}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            aria-busy={pending}
            className="inline-grid place-items-center px-5 py-2.5 bg-rose-500 enabled:hover:bg-rose-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-rose-500/30 motion-safe:transition-colors enabled:cursor-pointer disabled:opacity-75"
          >
            <span className={pending ? "invisible [grid-area:1/1]" : "[grid-area:1/1]"}>{confirmText}</span>
            {pending && (
              <span className="flex items-center gap-1 [grid-area:1/1]">
                <span aria-hidden="true" className="size-3 rounded-full border border-white/50 border-t-white motion-safe:animate-spin" />
                Chờ…
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
