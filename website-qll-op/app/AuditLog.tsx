"use client";

import React, { useEffect, useState, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://sehvatktrqtgsnmvebmm.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlaHZhdGt0cnF0Z3NubXZlYm1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5MzE5NzEsImV4cCI6MjEwNjUwNzk3MX0.hmQpRDUxsfP_LSWVE96nFEH85Qqw-z9LG3AQU1VXe0E";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface AuditLogProps {
  theme: "light" | "dark";
}

interface LogRow {
  id: number;
  action: string;
  ma_lop: string | null;
  actor: string | null;
  role: string | null;
  created_at: string;
}

const ACTION_META: Record<
  string,
  { label: string; icon: string; cls: string }
> = {
  hold: { label: "Giữ slot", icon: "📌", cls: "text-sky-500" },
  recall: { label: "Thu hồi", icon: "🔄", cls: "text-rose-500" },
  done: { label: "Chốt xong", icon: "✅", cls: "text-emerald-500" },
};

export default function AuditLog({ theme }: AuditLogProps) {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState("Tất cả");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("id, action, ma_lop, actor, role, created_at")
        .order("id", { ascending: false })
        .limit(300);
      if (!error && data) setLogs(data as LogRow[]);
    } catch (err) {
      console.error("Lỗi tải audit log:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const shown =
    filterAction === "Tất cả"
      ? logs
      : logs.filter((l) => l.action === filterAction);

  const fmtTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleString("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
      });
    } catch {
      return iso;
    }
  };

  const cardBase =
    theme === "dark"
      ? "bg-[#151b2b] border border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.2)]"
      : "bg-white shadow-[0_4px_24px_rgb(0,0,0,0.03)] border border-slate-100";

  return (
    <div className="flex-1 px-5 sm:px-8 pt-5 pb-6 min-h-0 flex flex-col animate-fade-slide-up">
      <div className={`rounded-3xl flex flex-col h-full overflow-hidden ${cardBase}`}>
        <div
          className={`px-6 py-5 border-b flex items-center justify-between flex-wrap gap-3 shrink-0 ${theme === "dark" ? "border-white/5" : "border-slate-100"}`}
        >
          <h3
            className={`font-bold flex items-center gap-3 text-base ${theme === "dark" ? "text-white" : "text-slate-800"}`}
          >
            <span className="w-1.5 h-6 bg-orange-500 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.5)]"></span>
            📜 Nhật ký thao tác
          </h3>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div
              className={`p-1 border rounded-2xl flex items-center gap-1 ${theme === "dark" ? "bg-[#0a0f1c] border-white/10" : "bg-slate-50 border-slate-200"}`}
            >
              {["Tất cả", "hold", "recall", "done"].map((a) => {
                const label =
                  a === "Tất cả" ? "Tất cả" : ACTION_META[a]?.label || a;
                const active = filterAction === a;
                return (
                  <button
                    key={a}
                    onClick={() => setFilterAction(a)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                      active
                        ? "bg-orange-500 text-white shadow-sm"
                        : theme === "dark"
                          ? "text-slate-400 hover:text-white hover:bg-white/5"
                          : "text-slate-600 hover:text-orange-600 hover:bg-white"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <button
              onClick={load}
              className={`p-2 rounded-xl border transition-all ${theme === "dark" ? "border-slate-700 hover:bg-slate-800 text-slate-300" : "border-slate-200 hover:bg-slate-100 text-slate-600"}`}
              title="Làm mới"
            >
              <svg
                className="w-4 h-4 hover:rotate-180 transition-transform duration-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                ></path>
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar relative">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead
              className={`text-[12px] uppercase font-bold tracking-wider sticky top-0 z-20 shadow-sm border-b ${
                theme === "dark"
                  ? "bg-[#1a2235] text-slate-400 border-white/5"
                  : "bg-slate-50 text-slate-400 border-slate-100"
              }`}
            >
              <tr>
                <th className="px-6 py-4">Thời gian</th>
                <th className="px-6 py-4">Hành động</th>
                <th className="px-6 py-4">Mã lớp</th>
                <th className="px-6 py-4">Người thực hiện</th>
                <th className="px-6 py-4">Vai trò</th>
              </tr>
            </thead>
            <tbody
              className={`divide-y ${theme === "dark" ? "divide-white/5" : "divide-slate-50"}`}
            >
              {loading ? (
                Array.from({ length: 6 }).map((_, r) => (
                  <tr key={r} className="animate-pulse">
                    {Array.from({ length: 5 }).map((__, c) => (
                      <td key={c} className="px-6 py-4">
                        <div
                          className={`h-4 rounded ${theme === "dark" ? "bg-white/10" : "bg-slate-200"} w-full`}
                        ></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : shown.length > 0 ? (
                shown.map((l) => {
                  const meta = ACTION_META[l.action] || {
                    label: l.action,
                    icon: "•",
                    cls: "text-slate-500",
                  };
                  return (
                    <tr
                      key={l.id}
                      className={
                        theme === "dark"
                          ? "hover:bg-white/5 text-slate-300"
                          : "hover:bg-slate-50 text-slate-700"
                      }
                    >
                      <td className="px-6 py-3.5 text-slate-500 text-xs">
                        {fmtTime(l.created_at)}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`font-bold ${meta.cls}`}>
                          {meta.icon} {meta.label}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 font-bold text-sky-500">
                        {l.ma_lop || "-"}
                      </td>
                      <td className="px-6 py-3.5 font-semibold text-orange-500">
                        {l.actor || "-"}
                      </td>
                      <td className="px-6 py-3.5">{l.role || "-"}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-24 text-center text-slate-400 font-semibold"
                  >
                    <div className="text-3xl mb-3">📭</div>
                    Chưa có nhật ký thao tác nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
