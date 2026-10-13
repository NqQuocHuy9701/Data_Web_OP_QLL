"use client";

import React from "react";

interface ErrorPopupProps {
  errorMessage: string;
  setErrorMessage: (val: string) => void;
  loadData: () => void;
  theme: "light" | "dark";
}

export default function ErrorPopup({
  errorMessage,
  setErrorMessage,
  loadData,
  theme,
}: ErrorPopupProps) {
  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-slide-up">
      <div
        className={`rounded-3xl p-8 w-full max-w-md shadow-2xl border relative text-center transition-colors duration-0 ${
          theme === "dark"
            ? "bg-[#151b2b] border-red-500/30 text-slate-200"
            : "bg-white border-red-200"
        }`}
      >
        {/* Icon báo lỗi */}
        <div className="w-24 h-24 mx-auto mb-5 rounded-full flex items-center justify-center shadow-inner animate-bounce-bitu bg-red-100 dark:bg-red-500/20 text-5xl">
          {errorMessage.includes("trống") ? "📭" : "🚨"}
        </div>

        {/* Tiêu đề lỗi */}
        <h3
          className={`text-2xl font-bold mb-3 ${theme === "dark" ? "text-red-400" : "text-red-600"}`}
        >
          {errorMessage.includes("trống") ? "Dữ liệu trống!" : "Sự cố kết nối!"}
        </h3>

        {/* Chi tiết lỗi */}
        <p
          className={`font-medium text-sm mb-8 leading-relaxed ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}
        >
          {errorMessage}
        </p>

        {/* 2 Nút thao tác */}
        <div className="flex gap-3">
          <button
            onClick={() => setErrorMessage("")}
            className={`flex-1 py-3.5 rounded-2xl font-bold text-sm transition-colors cursor-pointer border ${
              theme === "dark"
                ? "bg-[#0a0f1c] border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/5"
                : "bg-slate-100 hover:bg-slate-200 text-slate-600 border-transparent"
            }`}
          >
            Đóng
          </button>
          <button
            onClick={() => loadData()}
            className="flex-1 py-3.5 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-red-500/30 transition-colors cursor-pointer active:scale-95 flex justify-center items-center gap-2"
          >
            <span>🔄</span> Thử lại ngay
          </button>
        </div>
      </div>
    </div>
  );
}
