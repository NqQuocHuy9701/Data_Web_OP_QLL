"use client";

import React from "react";

interface FilterDropdownProps {
  theme: "light" | "dark";
  label: string;
  dropdownKey: string;
  currentValue: string;
  options: string[];
  onChange: (val: string) => void;
  formatItem?: (val: string) => string;
  openDropdown: string | null;
  setOpenDropdown: (val: string | null) => void;
}

export default function FilterDropdown({
  theme,
  label,
  dropdownKey,
  currentValue,
  options,
  onChange,
  formatItem,
  openDropdown,
  setOpenDropdown,
}: FilterDropdownProps) {
  const isOpen = openDropdown === dropdownKey;
  const isDark = theme === "dark";
  const isActive = isOpen || currentValue !== "Tất cả";
  const optionStyle = (selected: boolean) => {
    if (selected) return isDark ? "bg-sky-500/20 text-sky-100" : "bg-sky-100 text-sky-800";
    return isDark ? "text-slate-300 hover:bg-white/10 hover:text-slate-100" : "text-slate-700 hover:bg-slate-200/70";
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setOpenDropdown(isOpen ? null : dropdownKey)}
        className={`px-3.5 py-2 border rounded-xl font-semibold shadow-sm text-xs flex items-center gap-2 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 ${
          isDark
            ? isActive
              ? "border-sky-500/60 bg-sky-500/10 text-sky-200"
              : "border-white/10 bg-[#0a0f1c] text-slate-300 hover:border-sky-500/50 hover:text-slate-100"
            : isActive
              ? "border-sky-400 bg-sky-50 text-sky-800"
              : "border-slate-200 bg-slate-50 text-slate-700 hover:border-sky-300"
        }`}
      >
        <span>
          {label}: <strong className="font-bold">{currentValue}</strong>
        </span>
        <svg
          aria-hidden="true"
          className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* 👉 BƯỚC 1: THÊM LỚP NỀN TRONG SUỐT ĐỂ TỰ ĐỘNG ĐÓNG KHI BẤM RA NGOÀI */}
          <div
            className="fixed inset-0 z-40 bg-transparent"
            onClick={() => setOpenDropdown(null)}
          />

          <div className={`absolute right-0 mt-2 w-56 border rounded-2xl shadow-xl py-2 z-50 animate-fade-slide-up ${
            isDark ? "border-white/10 bg-[#1a2235] shadow-black/40" : "border-slate-200 bg-slate-50 shadow-slate-900/15"
          }`}>
            <div className="max-h-60 overflow-y-auto custom-scrollbar px-1.5 space-y-0.5">
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onChange("Tất cả");
                  setOpenDropdown(null);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                  optionStyle(currentValue === "Tất cả")
                }`}
              >
                {label}: Tất cả
              </div>
              {options.map((opt, idx) => {
                const displayVal = formatItem ? formatItem(opt) : opt;
                const isSelected = currentValue === opt;
                return (
                  <div
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange(opt);
                      setOpenDropdown(null);
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors truncate ${
                      optionStyle(isSelected)
                    }`}
                  >
                    {displayVal}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
