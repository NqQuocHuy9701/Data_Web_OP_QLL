"use client";

import React, { useMemo } from "react";
import CountdownTimer from "./CountdownTimer";

interface MyDashboardProps {
  slotHistoryData: any[];
  displayName: string;
  completedSlots: Record<string, boolean>;
  checkIsExpired: (timeString: string) => boolean;
  onRequestRecall: (row: any) => void;
  onGoKeepSlot: () => void;
  theme: "light" | "dark";
}

// Dựng chuỗi thời gian "dd/mm/yyyy hh:mm:ss" từ 1 bản ghi slot.
function buildTimeStr(row: any): string {
  if (row.timestamp) {
    const d = new Date(Number(row.timestamp));
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }
  return row["Thời gian"] || "";
}

// Mili-giây còn lại tới hạn 24h (âm nếu đã quá hạn).
function msLeft(timeStr: string): number {
  try {
    const parts = timeStr.split(" ");
    if (parts.length < 2) return 0;
    const dp = parts[0].split("/");
    const tp = parts[1].split(":");
    const logDate = new Date(
      parseInt(dp[2]),
      parseInt(dp[1]) - 1,
      parseInt(dp[0]),
      parseInt(tp[0]),
      parseInt(tp[1]),
      parseInt(tp[2] || "0"),
    );
    return logDate.getTime() + 24 * 60 * 60 * 1000 - Date.now();
  } catch {
    return 0;
  }
}

const TWO_HOURS = 2 * 60 * 60 * 1000;

export default function MyDashboard({
  slotHistoryData,
  displayName,
  completedSlots,
  checkIsExpired,
  onRequestRecall,
  onGoKeepSlot,
  theme,
}: MyDashboardProps) {
  // Chuẩn hóa slot của chính QLL + phân loại trạng thái.
  const mine = useMemo(() => {
    const rows = (slotHistoryData || []).filter(
      (item) => (item.nguoi_giu || item["Người giữ"]) === displayName,
    );

    return rows.map((row, index) => {
      const timeStr = buildTimeStr(row);
      const maLop = row.ma_lop || row["Mã lớp giữ"] || row["Mã lớp"] || "";
      const monHoc = row.mon_hoc || row["Môn học"] || "-";
      const note =
        row.note ||
        row["lưu ý ( mục note của QLL )"] ||
        row["lưu ý"] ||
        "-";
      const rowKey = `${timeStr}-${maLop}-${index}`;
      const isDone = completedSlots[rowKey] || row.is_done;
      const isExpired = checkIsExpired(timeStr);
      const isCancelled = row.is_cancelled === true;
      const active = !isDone && !isExpired && !isCancelled;
      const soon = active && msLeft(timeStr) <= TWO_HOURS;
      return {
        row,
        timeStr,
        maLop,
        monHoc,
        note,
        isDone,
        isExpired,
        isCancelled,
        active,
        soon,
      };
    });
  }, [slotHistoryData, displayName, completedSlots, checkIsExpired]);

  const activeList = mine.filter((m) => m.active);
  const soonList = mine.filter((m) => m.soon);
  const doneCount = mine.filter((m) => m.isDone).length;

  const cardBase =
    theme === "dark"
      ? "bg-[#151b2b] border-white/10"
      : "bg-white border-slate-200";

  return (
    <div className="flex-1 px-5 sm:px-8 pt-5 pb-6 min-h-0 overflow-y-auto custom-scrollbar animate-fade-slide-up">
      {/* Lời chào */}
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div>
          <h2
            className={`text-xl sm:text-2xl font-extrabold ${theme === "dark" ? "text-white" : "text-slate-800"}`}
          >
            👋 Xin chào,{" "}
            <span className="text-sky-500">{displayName || "QLL"}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Tổng quan nhanh các slot bạn đang giữ
          </p>
        </div>
        <button
          onClick={onGoKeepSlot}
          className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-orange-500/30 transition-colors cursor-pointer active:scale-95 flex items-center gap-2"
        >
          📌 Giữ slot mới
        </button>
      </div>

      {/* 3 thẻ KPI cá nhân */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className={`border rounded-2xl py-3 px-4 ${cardBase}`}>
          <p className="text-amber-500 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mb-0.5">
            Đang giữ
          </p>
          <span className="text-2xl font-extrabold text-amber-500">
            {activeList.length}
          </span>
        </div>
        <div className={`border rounded-2xl py-3 px-4 ${cardBase}`}>
          <p className="text-red-500 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mb-0.5">
            Sắp hết hạn
          </p>
          <span className="text-2xl font-extrabold text-red-500">
            {soonList.length}
          </span>
        </div>
        <div className={`border rounded-2xl py-3 px-4 ${cardBase}`}>
          <p className="text-emerald-500 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mb-0.5">
            Đã xếp xong
          </p>
          <span className="text-2xl font-extrabold text-emerald-500">
            {doneCount}
          </span>
        </div>
      </div>

      {/* Khối sắp hết hạn */}
      <div className={`border rounded-3xl p-5 mb-5 ${cardBase}`}>
        <h3
          className={`font-bold flex items-center gap-2 text-sm mb-4 ${theme === "dark" ? "text-white" : "text-slate-800"}`}
        >
          <span className="w-1.5 h-5 bg-red-500 rounded-full"></span>
          ⚠️ Slot sắp hết hạn (dưới 2 giờ)
        </h3>
        {soonList.length > 0 ? (
          <div className="space-y-2">
            {soonList.map((m, i) => (
              <div
                key={m.row.id || i}
                className={`flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border ${
                  theme === "dark"
                    ? "bg-red-900/15 border-red-500/20"
                    : "bg-red-50/60 border-red-100"
                }`}
              >
                <div className="min-w-0">
                  <p className="font-bold text-sky-500 truncate">{m.maLop}</p>
                  <p className="text-xs text-slate-400 truncate">
                    {m.monHoc} · {m.note}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`px-3 py-1.5 border font-bold rounded-xl text-xs inline-flex justify-center min-w-[110px] ${theme === "dark" ? "bg-[#0a0f1c] text-amber-400 border-amber-500/30" : "bg-white text-amber-600 border-amber-200"}`}
                  >
                    <CountdownTimer timeString={m.timeStr} />
                  </span>
                  <button
                    onClick={() => onRequestRecall(m.row)}
                    className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold text-xs shadow-sm transition-colors cursor-pointer active:scale-95"
                  >
                    🔄 Thu hồi
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400 py-4 text-center">
            Không có slot nào sắp hết hạn ✅
          </p>
        )}
      </div>

      {/* Khối đang giữ */}
      <div className={`border rounded-3xl p-5 ${cardBase}`}>
        <h3
          className={`font-bold flex items-center gap-2 text-sm mb-4 ${theme === "dark" ? "text-white" : "text-slate-800"}`}
        >
          <span className="w-1.5 h-5 bg-amber-500 rounded-full"></span>
          🕒 Slot bạn đang giữ ({activeList.length})
        </h3>
        {activeList.length > 0 ? (
          <div className="space-y-2">
            {activeList.map((m, i) => (
              <div
                key={m.row.id || i}
                className={`flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border ${
                  theme === "dark"
                    ? "bg-[#0e1320] border-white/5"
                    : "bg-slate-50/60 border-slate-100"
                }`}
              >
                <div className="min-w-0">
                  <p className="font-bold text-sky-500 truncate">{m.maLop}</p>
                  <p className="text-xs text-slate-400 truncate">
                    {m.monHoc} · {m.note}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`px-3 py-1.5 border font-bold rounded-xl text-xs inline-flex justify-center min-w-[110px] ${theme === "dark" ? "bg-[#0a0f1c] text-amber-400 border-amber-500/30" : "bg-white text-amber-600 border-amber-200"}`}
                  >
                    <CountdownTimer timeString={m.timeStr} />
                  </span>
                  <button
                    onClick={() => onRequestRecall(m.row)}
                    className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold text-xs shadow-sm transition-colors cursor-pointer active:scale-95"
                  >
                    🔄 Thu hồi
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400 py-6 text-center">
            Bạn chưa giữ slot nào đang còn hiệu lực. Bấm "📌 Giữ slot mới" để
            bắt đầu.
          </p>
        )}
      </div>
    </div>
  );
}
