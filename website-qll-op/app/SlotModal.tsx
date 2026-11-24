"use client";

import React, { useImperativeHandle, useState } from "react";

type SlotActionMode = "hold" | "add-class";
type SlotRow = Record<string, unknown>;

export interface SlotModalHandle {
  open: (row: SlotRow, actionMode: SlotActionMode) => void;
  close: () => void;
}

interface SlotModalProps {
  ref: React.Ref<SlotModalHandle>;
  theme: "light" | "dark";
  onConfirm: (row: SlotRow, actionMode: SlotActionMode, sidCid: string) => Promise<string | void>;
  isSubmitting: boolean;
}

export default function SlotModal({
  ref,
  theme,
  onConfirm,
  isSubmitting,
}: SlotModalProps) {
  const [selection, setSelection] = useState<{ row: SlotRow; actionMode: SlotActionMode } | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [inputError, setInputError] = useState("");

  useImperativeHandle(ref, () => ({
    open(row, actionMode) {
      setInputValue("");
      setInputError("");
      setSelection({ row, actionMode });
    },
    close() {
      setSelection(null);
    },
  }), []);

  if (!selection) return null;
  const { row, actionMode } = selection;
  const actionLabel = actionMode === "hold" ? "Giữ Slot" : "Add lớp";

  async function confirm() {
    const sidCid = inputValue.trim();
    if (!sidCid) {
      setInputError("Vui lòng nhập SID hoặc CID!");
      return;
    }
    if (!/^\d+$/.test(sidCid)) {
      setInputError("SID hoặc CID chỉ được phép chứa các chữ số!");
      return;
    }
    if (sidCid.length > 8) {
      setInputError("Tối đa form 8 số!");
      return;
    }
    const error = await onConfirm(row, actionMode, sidCid);
    if (error) setInputError(error);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 backdrop-blur-sm" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-slate-900/60 ops-dialog-overlay" />
      <div
        className={`ops-dialog-panel ${actionMode === "add-class" ? "ops-book-panel" : ""} rounded-3xl p-6 w-full max-w-md shadow-2xl border relative ${
          theme === "dark"
            ? "bg-[#151b2b] border-white/10 text-slate-200"
            : "bg-white border-slate-100"
        }`}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold transition-colors duration-0 ${theme === "dark" ? "bg-orange-500/20 text-orange-400" : "bg-orange-50 text-orange-500"}`}
          >
            📌
          </div>
          <div>
            <h3
              className={`text-lg font-bold transition-colors duration-0 ${theme === "dark" ? "text-white" : "text-slate-800"}`}
            >
              {actionMode === "hold" ? "Xác nhận Giữ Slot" : "Thêm HS vào lớp"}
            </h3>
            <p className="text-xs text-slate-500">
              Mã lớp:{" "}
              <strong className="text-sky-500">
                {String(row["Mã lớp"] ?? "")}
              </strong>
            </p>
          </div>
        </div>

        <div className="space-y-4 my-4">
          <div>
            <label
              className={`block text-xs font-bold uppercase tracking-wider mb-1.5 transition-colors duration-0 ${theme === "dark" ? "text-slate-400" : "text-slate-700"}`}
            >
              {actionMode === "hold" ? "Nhập SID hoặc CID học sinh" : "Nhập SID học sinh"}{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              maxLength={8}
              placeholder=""
              value={inputValue}
              onChange={(e) => {
                const val = e.target.value;
                if (/^\d*$/.test(val) && val.length <= 8) {
                  setInputValue(val);
                  setInputError("");
                }
              }}
              className={`w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 font-bold text-sm transition-colors duration-0 ${
                theme === "dark"
                  ? "bg-[#0a0f1c] border-white/10 text-white"
                  : "bg-slate-50 border-slate-200 text-slate-800"
              }`}
              autoFocus
            />
            {inputError && (
              <p role="alert" className="text-[11px] font-bold text-red-500 mt-1.5">
                {inputError}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => setSelection(null)}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-colors duration-0 cursor-pointer border ${
              theme === "dark"
                ? "bg-[#0a0f1c] border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/5"
                : "bg-slate-100 hover:bg-slate-200 text-slate-600 border-transparent"
            }`}
          >
            Hủy bỏ
          </button>
          {/* [TỐI ƯU V3] Khóa nút bấm khi đang Submitting */}
          <button
            type="button"
            onClick={confirm}
            disabled={isSubmitting}
            className={`ops-action px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-full font-bold text-xs shadow-lg shadow-orange-500/30 cursor-pointer ${
              isSubmitting ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <span aria-hidden="true" className="ops-action-icon inline-block mr-1.5">✓</span>
            {isSubmitting ? "Đang xử lý..." : `Xác nhận ${actionLabel}`}
          </button>
        </div>
      </div>
    </div>
  );
}
