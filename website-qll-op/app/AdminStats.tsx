"use client";

import React, { useMemo } from "react";

interface AdminStatsProps {
  currentHistoryData: any[];
  filterTeam: string;
  completedSlots: Record<string, boolean>;
  checkIsExpired: (timeString: string) => boolean;
  theme: "light" | "dark";
}

export default function AdminStats({
  currentHistoryData,
  filterTeam,
  completedSlots,
  checkIsExpired,
  theme,
}: AdminStatsProps) {
  // Gom 4 vòng lọc (Tổng / Chờ / Done / Quá hạn) thành 1 lần duyệt.
  // Công thức tính giữ NGUYÊN 100% so với bản gốc trong page.tsx:
  // - lọc theo filterTeam
  // - dựng timeStr từ timestamp hoặc row["Thời gian"]
  // - rowKey = `${timeStr}-${maLop}-${index}` (index trong currentHistoryData)
  // - isDone = completedSlots[rowKey] || row.is_done || row["Trạng thái"]==="Done" || row["Status"]==="Đã xếp xong"
  // - isExpired = checkIsExpired(timeStr)
  const stats = useMemo(() => {
    let total = 0;
    let pending = 0;
    let done = 0;
    let expired = 0;

    currentHistoryData.forEach((row, index) => {
      const teamVal = row.team || row["Team"] || "";
      if (filterTeam !== "Tất cả" && teamVal !== filterTeam) return;

      total += 1;

      let timeStr = "";
      if (row.timestamp) {
        const d = new Date(Number(row.timestamp));
        const pad = (n: number) => n.toString().padStart(2, "0");
        timeStr = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      } else {
        timeStr = row["Thời gian"] || "";
      }

      const maLop = row.ma_lop || row["Mã lớp giữ"] || row["Mã lớp"] || "";
      const rowKey = `${timeStr}-${maLop}-${index}`;
      const isDone =
        completedSlots[rowKey] ||
        row.is_done ||
        row["Trạng thái"] === "Done" ||
        row["Status"] === "Đã xếp xong";
      const isExpired = checkIsExpired(timeStr);

      if (isDone) {
        done += 1;
      } else if (isExpired) {
        expired += 1;
      } else {
        pending += 1;
      }
    });

    return { total, pending, done, expired };
  }, [currentHistoryData, filterTeam, completedSlots, checkIsExpired]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-3 shrink-0">
      <div
        className={`border rounded-2xl py-2.5 px-4 relative overflow-hidden transition-all duration-300 ${
          theme === "dark"
            ? "bg-[#151b2b] border-white/10 shadow-sm"
            : "bg-white border-slate-200 shadow-xs"
        }`}
      >
        <p className="text-sky-500 text-[10px] font-bold uppercase tracking-wider mb-0.5">
          Tổng Số Đơn
        </p>
        <div className="flex items-baseline gap-2">
          <span
            className={`text-xl font-extrabold ${theme === "dark" ? "text-white" : "text-slate-900"}`}
          >
            {stats.total}
          </span>
          <span className="text-slate-400 text-[11px] font-medium">
            yêu cầu
          </span>
        </div>
      </div>

      <div
        className={`border rounded-2xl py-2.5 px-4 relative overflow-hidden transition-all duration-300 ${
          theme === "dark"
            ? "bg-[#151b2b] border-white/10 shadow-sm"
            : "bg-white border-slate-200 shadow-xs"
        }`}
      >
        <p className="text-amber-500 text-[10px] font-bold uppercase tracking-wider mb-0.5">
          Đang Chờ Xử Lý
        </p>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-extrabold text-amber-500">
            {stats.pending}
          </span>
          <span className="text-slate-400 text-[11px] font-medium">
            chờ xếp
          </span>
        </div>
      </div>

      <div
        className={`border rounded-2xl py-2.5 px-4 relative overflow-hidden transition-all duration-300 ${
          theme === "dark"
            ? "bg-[#151b2b] border-white/10 shadow-sm"
            : "bg-white border-slate-200 shadow-xs"
        }`}
      >
        <p className="text-emerald-500 text-[10px] font-bold uppercase tracking-wider mb-0.5">
          Đã Hoàn Thành
        </p>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-extrabold text-emerald-500">
            {stats.done}
          </span>
          <span className="text-slate-400 text-[11px] font-medium">
            đã xong
          </span>
        </div>
      </div>

      <div
        className={`border rounded-2xl py-2.5 px-4 relative overflow-hidden transition-all duration-300 ${
          theme === "dark"
            ? "bg-[#151b2b] border-white/10 shadow-sm"
            : "bg-white border-slate-200 shadow-xs"
        }`}
      >
        <p className="text-red-500 text-[10px] font-bold uppercase tracking-wider mb-0.5">
          Quá Hạn (Nhả Slot)
        </p>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-extrabold text-red-500">
            {stats.expired}
          </span>
          <span className="text-slate-400 text-[11px] font-medium">
            hết hạn
          </span>
        </div>
      </div>
    </div>
  );
}
