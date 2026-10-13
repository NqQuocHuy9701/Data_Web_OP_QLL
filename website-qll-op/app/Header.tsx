"use client";

import React from "react";
import ThemeToggle from "./ThemeToggle";

interface HeaderProps {
  theme: "light" | "dark";
  toggleTheme: () => void;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  lastUpdated: string;
  loading: boolean;
  loadingHistory: boolean;
  loginRole: "QLL" | "Admin";
  loadData: () => void;
  loadSlotHistory: (isSilent?: boolean) => void;
  onOpenSidebar?: () => void;
}

export default function Header({
  theme,
  toggleTheme,
  searchTerm,
  setSearchTerm,
  lastUpdated,
  loading,
  loadingHistory,
  loginRole,
  loadData,
  loadSlotHistory,
  onOpenSidebar,
}: HeaderProps) {
  return (
    <header
      className={`h-20 border-b flex items-center justify-between gap-3 px-4 sm:px-8 shrink-0 z-20 transition-colors duration-0 ${
        theme === "dark"
          ? "bg-[#0e1320] border-white/5 shadow-md"
          : "bg-white/90 backdrop-blur-md border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.01)]"
      }`}
    >
      {/* [MOBILE] Nút mở menu — chỉ hiện trên màn hình nhỏ */}
      <button
        type="button"
        onClick={() => onOpenSidebar?.()}
        aria-label="Mở menu"
        className={`lg:hidden shrink-0 p-2 rounded-xl border transition-colors ${
          theme === "dark"
            ? "border-white/10 text-slate-300 hover:bg-white/5"
            : "border-slate-200 text-slate-600 hover:bg-slate-100"
        }`}
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      <div className="flex-1 max-w-xl relative group min-w-0">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <span className="text-slate-400 group-focus-within:text-sky-500 transition-colors">
            🔍
          </span>
        </div>
        <input
          type="text"
          placeholder=""
          className={`w-full pl-12 pr-4 py-2.5 rounded-full focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-colors duration-0 text-sm font-medium ${
            theme === "dark"
              ? "bg-[#151b2b] border border-white/10 text-white placeholder-slate-500 focus:bg-[#1a2235]"
              : "bg-slate-50/80 border border-slate-200 text-slate-700 placeholder-slate-400 hover:bg-white focus:bg-white focus:shadow-sm"
          }`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center scale-[0.6] transform origin-right">
          <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
        </div>

        {lastUpdated && (
          <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline-block">
            Cập nhật lúc:{" "}
            <strong
              className={`transition-colors duration-0 ${theme === "dark" ? "text-slate-300" : "text-slate-600"}`}
            >
              {lastUpdated}
            </strong>
          </span>
        )}

        <button
          onClick={() => {
            loadData();
            if (loginRole === "Admin") loadSlotHistory();
          }}
          disabled={loading || loadingHistory}
          className={`px-6 py-2.5 text-sm font-bold rounded-full shadow-sm transition-colors duration-0 flex items-center gap-2.5 focus:outline-none active:scale-95
                ${
                  loading || loadingHistory
                    ? theme === "dark"
                      ? "bg-white/5 text-slate-500 cursor-not-allowed border border-white/5"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                    : "bg-sky-500 text-white hover:bg-sky-600 border border-sky-500 hover:shadow-[0_4px_15px_rgba(14,165,233,0.3)]"
                }`}
        >
          {loading || loadingHistory ? (
            <>
              <svg
                className="animate-spin h-4 w-4 text-slate-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Updating...
            </>
          ) : (
            <>
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
              </span>
              <span className="relative z-10">Update</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
