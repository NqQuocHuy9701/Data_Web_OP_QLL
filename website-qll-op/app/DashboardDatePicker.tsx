"use client";

import { useEffect, useId, useRef, useState } from "react";

const dayMs = 86_400_000;
const iso = (time: number) => new Date(time).toISOString().slice(0, 10);
const formatMonth = new Intl.DateTimeFormat("vi-VN", { month: "long", year: "numeric", timeZone: "UTC" });

export default function DashboardDatePicker({ label, value, min, max, onChange, theme, alignEnd }: {
  label: string;
  value: string;
  min: string;
  max: string;
  onChange: (value: string) => void;
  theme: "light" | "dark";
  alignEnd?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(value.slice(0, 7));
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  const dark = theme === "dark";
  const first = new Date(month + "-01T00:00:00Z");
  const previous = new Date(first.getTime());
  previous.setUTCMonth(first.getUTCMonth() - 1);
  const next = new Date(first.getTime());
  next.setUTCMonth(first.getUTCMonth() + 1);
  const lastDay = new Date(next.getTime() - dayMs).getUTCDate();
  const blanks = (first.getUTCDay() + 6) % 7;
  const surface = dark ? "border-white/10 bg-[#151b2b] text-slate-100" : "border-slate-200 bg-white text-slate-900";

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [open]);

  return (
    <div ref={root} className="relative" onKeyDown={(event) => {
      if (open && event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    }}>
      <span id={id + "-label"} className="mb-1 block text-xs font-semibold">{label}</span>
      <button ref={trigger} type="button" aria-labelledby={id + "-label " + id + "-value"} aria-expanded={open}
        aria-controls={id} onClick={() => {
          if (!open) setMonth(value.slice(0, 7));
          setOpen(!open);
        }} className={`flex h-[38px] min-w-32 items-center justify-between gap-2 rounded-xl border px-3 tabular-nums ${surface}`}>
        <span id={id + "-value"}>{value.split("-").reverse().join("/")}</span>
        <svg aria-hidden="true" className="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
          <rect x="4" y="6" width="16" height="14" rx="2" /><path d="M8 3v6m8-6v6M4 11h16" />
        </svg>
      </button>
      {open && (
        <div id={id} role="group" aria-label={label + " · lịch"} className={`absolute top-full z-30 mt-2 w-64 rounded-2xl border p-3 shadow-xl ${surface} ${alignEnd ? "right-0 sm:left-0 sm:right-auto" : "left-0"}`}>
          <div className="mb-2 flex items-center justify-between gap-2">
            <button type="button" className="rounded-md px-2 py-1 text-lg disabled:opacity-30" aria-label="Tháng trước"
              disabled={month <= min.slice(0, 7)} onClick={() => setMonth(iso(previous.getTime()).slice(0, 7))}>‹</button>
            <span className="text-xs font-semibold">{formatMonth.format(first)}</span>
            <button type="button" className="rounded-md px-2 py-1 text-lg disabled:opacity-30" aria-label="Tháng sau"
              disabled={month >= max.slice(0, 7)} onClick={() => setMonth(iso(next.getTime()).slice(0, 7))}>›</button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day) => <span key={day} className="py-1 opacity-70">{day}</span>)}
            {Array.from({ length: blanks }, (_, i) => <span key={`blank-${i}`} />)}
            {Array.from({ length: lastDay }, (_, i) => {
              const date = iso(first.getTime() + i * dayMs);
              return <button key={date} type="button" disabled={date < min || date > max}
                aria-label={date.split("-").reverse().join("/")} aria-pressed={date === value}
                onClick={() => {
                  onChange(date);
                  setOpen(false);
                  trigger.current?.focus();
                }}
                className={`aspect-square rounded-md tabular-nums disabled:opacity-25 ${date === value ? "bg-sky-700 font-semibold text-white" : dark ? "enabled:hover:bg-white/10" : "enabled:hover:bg-sky-50"}`}>
                {i + 1}
              </button>;
            })}
          </div>
        </div>
      )}
    </div>
  );
}
