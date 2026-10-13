"use client";

import React from "react";

interface SlotModalProps {
  theme: "light" | "dark";
  selectedRowForSlot: any;
  inputValue: string;
  setInputValue: (val: string) => void;
  inputError: string;
  setInputError: (val: string) => void;
  setShowModal: (val: boolean) => void;
  handleConfirmKeepSlot: () => void;
  isSubmitting: boolean;
}

export default function SlotModal({
  theme,
  selectedRowForSlot,
  inputValue,
  setInputValue,
  inputError,
  setInputError,
  setShowModal,
  handleConfirmKeepSlot,
  isSubmitting,
}: SlotModalProps) {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-slide-up">
      <div
        className={`rounded-3xl p-6 w-full max-w-md shadow-2xl border relative transition-colors duration-0 ${
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
              Xác nhận Giữ Slot
            </h3>
            <p className="text-xs text-slate-500">
              Mã lớp:{" "}
              <strong className="text-sky-500">
                {selectedRowForSlot?.["Mã lớp"]}
              </strong>
            </p>
          </div>
        </div>

        <div className="space-y-4 my-4">
          <div>
            <label
              className={`block text-xs font-bold uppercase tracking-wider mb-1.5 transition-colors duration-0 ${theme === "dark" ? "text-slate-400" : "text-slate-700"}`}
            >
              Nhập SID hoặc CID học sinh <span className="text-red-500">*</span>
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
              <p className="text-[11px] font-bold text-red-500 mt-1.5">
                {inputError}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => setShowModal(false)}
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
            onClick={handleConfirmKeepSlot}
            disabled={isSubmitting}
            className={`px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-orange-500/30 transition-colors duration-0 cursor-pointer active:scale-95 ${
              isSubmitting ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isSubmitting ? "Đang xử lý..." : "Xác nhận Giữ Slot"}
          </button>
        </div>
      </div>
    </div>
  );
}
