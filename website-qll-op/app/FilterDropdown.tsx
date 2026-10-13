"use client";

import React from "react";

interface FilterDropdownProps {
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

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpenDropdown(isOpen ? null : dropdownKey)}
        className={`px-3.5 py-2 bg-white border rounded-xl font-semibold text-slate-700 shadow-sm text-xs flex items-center gap-2 transition-all cursor-pointer focus:outline-none ${
          isOpen || currentValue !== "Tất cả"
            ? "border-sky-500 ring-2 ring-sky-500/20 bg-sky-50/30 text-sky-700"
            : "border-slate-200 hover:border-sky-300"
        }`}
      >
        <span>
          {label}: <strong className="font-bold">{currentValue}</strong>
        </span>
        <svg
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

          <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] py-2 z-50 animate-fade-slide-up">
            <div className="max-h-60 overflow-y-auto custom-scrollbar px-1.5 space-y-0.5">
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onChange("Tất cả");
                  setOpenDropdown(null);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                  currentValue === "Tất cả"
                    ? "bg-sky-500 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100"
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
                      isSelected
                        ? "bg-sky-500 text-white shadow-sm"
                        : "text-slate-700 hover:bg-slate-100"
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
