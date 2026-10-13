"use client";

import React from "react";
import CountdownTimer from "./CountdownTimer";

interface HistoryTableProps {
  theme: "light" | "dark";
  openDropdown: string | null;
  setOpenDropdown: (val: string | null) => void;
  filterTeam: string;
  setFilterTeam: (val: string) => void;
  filterHistoryStatus: string;
  setFilterHistoryStatus: (val: string) => void;
  slotHistoryData: any[];
  currentHistoryData: any[];
  completedSlots: Record<string, boolean>;
  checkIsExpired: (timeString: string) => boolean;
  handleMarkAsDone: (dbId: string) => void;
  loadingHistory: boolean;
  currentPage: number;
  setCurrentPage: (updater: (p: number) => number) => void;
  historyTotalPages: number;
}

export default function HistoryTable({
  theme,
  openDropdown,
  setOpenDropdown,
  filterTeam,
  setFilterTeam,
  filterHistoryStatus,
  setFilterHistoryStatus,
  slotHistoryData,
  currentHistoryData,
  completedSlots,
  checkIsExpired,
  handleMarkAsDone,
  loadingHistory,
  currentPage,
  setCurrentPage,
  historyTotalPages,
}: HistoryTableProps) {
  return (
    <div
      className={`rounded-3xl flex flex-col h-full overflow-hidden transition-colors duration-0 ${
        theme === "dark"
          ? "bg-[#151b2b] border border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.2)]"
          : "bg-white shadow-[0_4px_24px_rgb(0,0,0,0.03)] border border-slate-100"
      }`}
    >
      <div
        className={`px-6 py-5 border-b flex items-center justify-between shrink-0 z-30 transition-colors duration-0 ${theme === "dark" ? "bg-transparent border-white/5" : "bg-white border-slate-100"}`}
      >
        <h3
          className={`font-bold flex items-center gap-3 text-base transition-colors duration-0 ${theme === "dark" ? "text-white" : "text-slate-800"}`}
        >
          <span className="w-1.5 h-6 bg-orange-500 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.5)]"></span>
          📋 Danh sách lịch sử giữ slot
        </h3>

        <div className="flex items-center gap-2.5 flex-wrap justify-end">
          {/* Ô CHỌN TEAM LEAD DẠNG DROPDOWN CÓ TỰ ĐỘNG ĐÓNG KHI BẤM RA NGOÀI */}
          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setOpenDropdown(
                  openDropdown === "teamLeadCustom" ? null : "teamLeadCustom",
                )
              }
              className={`px-3.5 py-2.5 border rounded-2xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer focus:outline-none shadow-sm ${
                openDropdown === "teamLeadCustom" || filterTeam !== "Tất cả"
                  ? theme === "dark"
                    ? "bg-[#0a0f1c] border-orange-500/50 text-orange-400"
                    : "bg-orange-50/50 border-orange-400 text-orange-600"
                  : theme === "dark"
                    ? "bg-[#0a0f1c] border-white/20 text-slate-200 hover:border-orange-500/30"
                    : "bg-slate-50 border-slate-200 text-slate-800 hover:border-orange-300"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span>👑</span>
                <span>
                  {filterTeam === "Tất cả" ? "Tất cả Team Lead" : filterTeam}
                </span>
              </span>
              <svg
                className={`w-3.5 h-3.5 text-orange-500 transition-transform duration-200 ${openDropdown === "teamLeadCustom" ? "rotate-180" : ""}`}
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

            {/* MÀN HÌNH TRONG SUỐT BẮT SỰ KIỆN CLICK BÊN NGOÀI */}
            {openDropdown === "teamLeadCustom" && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-transparent"
                  onClick={() => setOpenDropdown(null)}
                />

                <div
                  className={`absolute right-0 mt-2 w-56 border rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] py-2 z-50 animate-fade-slide-up overflow-hidden ${
                    theme === "dark"
                      ? "bg-[#151b2b] border-white/10 text-slate-200"
                      : "bg-white border-slate-100 text-slate-700"
                  }`}
                >
                  <div className="max-h-60 overflow-y-auto custom-scrollbar px-1.5 space-y-0.5">
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setFilterTeam("Tất cả");
                        setOpenDropdown(null);
                      }}
                      className={`px-3.5 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-2 ${
                        filterTeam === "Tất cả"
                          ? "bg-orange-500 text-white shadow-sm"
                          : theme === "dark"
                            ? "hover:bg-white/5 text-slate-300"
                            : "hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      👑 Tất cả Team Lead
                    </div>
                    {Array.from(
                      new Set(
                        slotHistoryData
                          .map((r) => r.team || r["Team"])
                          .filter(Boolean),
                      ),
                    ).map((t, idx) => {
                      const isSelected = filterTeam === t;
                      return (
                        <div
                          key={idx}
                          onClick={(e) => {
                            e.stopPropagation();
                            setFilterTeam(t as string);
                            setOpenDropdown(null);
                          }}
                          className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors truncate flex items-center gap-2 ${
                            isSelected
                              ? "bg-orange-500 text-white shadow-sm"
                              : theme === "dark"
                                ? "hover:bg-white/5 text-slate-300"
                                : "hover:bg-slate-100 text-slate-700"
                          }`}
                        >
                          🛡️ {t}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* BỘ LỌC TRẠNG THÁI */}
          <div
            className={`p-1 border rounded-2xl flex items-center gap-1 transition-colors duration-0 ${
              theme === "dark"
                ? "bg-[#0a0f1c] border-white/10"
                : "bg-slate-50 border-slate-200"
            }`}
          >
            {[
              { id: "Tất cả", label: "Tất cả", icon: "📌" },
              { id: "Chưa xử lý", label: "Chưa xử lý", icon: "⏳" },
              { id: "Đã xử lý", label: "Đã xử lý", icon: "✅" },
              { id: "Quá hạn", label: "Quá hạn", icon: "❌" },
            ].map((tab) => {
              const isActive = filterHistoryStatus === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterHistoryStatus(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-1.5 focus:outline-none active:scale-95 ${
                    isActive
                      ? "bg-orange-500 text-white shadow-[0_4px_12px_rgba(249,115,22,0.35)] scale-105"
                      : theme === "dark"
                        ? "text-slate-400 hover:text-white hover:bg-white/5"
                        : "text-slate-600 hover:text-orange-600 hover:bg-white shadow-xs"
                  }`}
                >
                  <span className="text-[11px]">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TỔNG SỐ BẢN GHI SAU KHI LỌC */}
          <span
            className={`font-extrabold px-3.5 py-2.5 rounded-xl border shadow-sm text-xs transition-colors duration-0 ${
              theme === "dark"
                ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                : "bg-orange-50 border-orange-600 border-orange-100"
            }`}
          >
            Tổng:{" "}
            {
              currentHistoryData.filter((row, index) => {
                const teamVal = row.team || row["Team"] || "";
                if (filterTeam !== "Tất cả" && teamVal !== filterTeam)
                  return false;

                if (filterHistoryStatus === "Tất cả") return true;
                let timeStr = "";
                if (row.timestamp) {
                  const d = new Date(Number(row.timestamp));
                  const pad = (n: number) => n.toString().padStart(2, "0");
                  timeStr = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
                } else {
                  timeStr = row["Thời gian"] || "";
                }
                const maLop =
                  row.ma_lop || row["Mã lớp giữ"] || row["Mã lớp"] || "";
                const rowKey = `${timeStr}-${maLop}-${index}`;
                const isDone =
                  completedSlots[rowKey] ||
                  row.is_done ||
                  row["Trạng thái"] === "Done" ||
                  row["Status"] === "Đã xếp xong";
                const isExpired = checkIsExpired(timeStr);

                if (filterHistoryStatus === "Đã xử lý") return isDone;
                if (filterHistoryStatus === "Quá hạn")
                  return !isDone && isExpired;
                if (filterHistoryStatus === "Chưa xử lý")
                  return !isDone && !isExpired;
                return true;
              }).length
            }
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar relative">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead
            className={`text-[12px] uppercase font-bold tracking-wider sticky top-0 z-20 shadow-sm border-b transition-colors duration-0 ${
              theme === "dark"
                ? "bg-[#1a2235] text-slate-400 border-white/5"
                : "bg-slate-50 text-slate-400 border-slate-100"
            }`}
          >
            <tr>
              <th className="px-6 py-4">Thời gian</th>
              <th className="px-6 py-4">Mã lớp giữ</th>
              <th className="px-6 py-4">Môn học</th>
              <th className="px-6 py-4">Người giữ</th>
              <th className="px-6 py-4">Team</th>
              <th className="px-6 py-4">Time còn lại (24h)</th>
              <th className="px-6 py-4">Lưu ý (Note)</th>
              <th className="px-6 py-4 text-right pr-6">Thao tác xếp</th>
            </tr>
          </thead>
          <tbody
            className={`divide-y transition-colors duration-0 ${theme === "dark" ? "divide-white/5" : "divide-slate-50"}`}
          >
            {loadingHistory ? (
              Array.from({ length: 6 }).map((_, r) => (
                <tr key={`skeleton-${r}`} className="animate-pulse">
                  {Array.from({ length: 8 }).map((__, c) => (
                    <td key={c} className="px-6 py-4">
                      <div
                        className={`h-4 rounded ${theme === "dark" ? "bg-white/10" : "bg-slate-200"} ${c === 7 ? "w-20 ml-auto" : "w-full"}`}
                      ></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : currentHistoryData.length > 0 ? (
              currentHistoryData
                .filter((row, index) => {
                  const teamVal = row.team || row["Team"] || "";
                  if (filterTeam !== "Tất cả" && teamVal !== filterTeam) {
                    return false;
                  }

                  if (filterHistoryStatus === "Tất cả") return true;

                  let timeStr = "";
                  if (row.timestamp) {
                    const d = new Date(Number(row.timestamp));
                    const pad = (n: number) => n.toString().padStart(2, "0");
                    timeStr = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
                  } else {
                    timeStr = row["Thời gian"] || "";
                  }

                  const maLop =
                    row.ma_lop || row["Mã lớp giữ"] || row["Mã lớp"] || "";
                  const rowKey = `${timeStr}-${maLop}-${index}`;

                  const isDone =
                    completedSlots[rowKey] ||
                    row.is_done ||
                    row["Trạng thái"] === "Done" ||
                    row["Trạng thái xếp"] === "Đã xếp xong";
                  const isExpired = checkIsExpired(timeStr);

                  if (filterHistoryStatus === "Đã xử lý") return isDone;
                  if (filterHistoryStatus === "Quá hạn")
                    return !isDone && isExpired;
                  if (filterHistoryStatus === "Chưa xử lý")
                    return !isDone && !isExpired;

                  return true;
                })
                .map((row, index) => {
                  let timeStr = "";
                  if (row.timestamp) {
                    const d = new Date(Number(row.timestamp));
                    const pad = (n: number) => n.toString().padStart(2, "0");
                    timeStr = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
                  } else {
                    timeStr = row["Thời gian"] || "";
                  }

                  const maLop =
                    row.ma_lop || row["Mã lớp giữ"] || row["Mã lớp"] || "";
                  const monHoc = row.mon_hoc || row["Môn học"] || "-";
                  const nguoiGiu = row.nguoi_giu || row["Người giữ"] || "-";
                  const team = row.team || row["Team"] || "-";
                  const note =
                    row.note ||
                    row["lưu ý ( mục note của QLL )"] ||
                    row["lưu ý"] ||
                    "-";

                  const rowKey = `${timeStr}-${maLop}-${index}`;
                  const isDone = completedSlots[rowKey] || row.is_done;
                  const isExpired = checkIsExpired(timeStr);
                  const isCancelled = row.is_cancelled === true;

                  return (
                    <tr
                      key={row.id || index}
                      className={`transition-colors duration-0 ${
                        isDone
                          ? theme === "dark"
                            ? "bg-emerald-900/20 opacity-75"
                            : "bg-emerald-50/40 opacity-75"
                          : isExpired
                            ? theme === "dark"
                              ? "bg-red-900/20 opacity-75"
                              : "bg-red-50/30 opacity-75"
                            : theme === "dark"
                              ? "hover:bg-[#1e293b] even:bg-[#1a2235]/50"
                              : "hover:bg-orange-50/40 even:bg-slate-50/60"
                      }`}
                    >
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        {timeStr || "-"}
                      </td>
                      <td className="px-6 py-4 font-bold text-sky-500">
                        {maLop || "-"}
                      </td>
                      <td
                        className={`px-6 py-4 font-medium transition-colors ${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}
                      >
                        {monHoc}
                      </td>
                      <td className="px-6 py-4 font-bold text-orange-500">
                        {nguoiGiu}
                      </td>
                      <td
                        className={`px-6 py-4 transition-colors ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}
                      >
                        {team}
                      </td>

                      <td className="px-6 py-4">
                        {isCancelled ? (
                          <span
                            className={`px-2.5 py-1 font-bold rounded-lg text-xs ${theme === "dark" ? "bg-slate-500/10 text-slate-400" : "bg-slate-200 text-slate-600"}`}
                          >
                            QLL đã thu hồi
                          </span>
                        ) : isDone ? (
                          <span
                            className={`px-2.5 py-1 font-bold rounded-lg text-xs ${theme === "dark" ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-100 text-emerald-700"}`}
                          >
                            Đã hoàn thành
                          </span>
                        ) : isExpired ? (
                          <span
                            className={`px-2.5 py-1 font-bold rounded-lg text-xs ${theme === "dark" ? "bg-red-500/10 text-red-400" : "bg-red-100 text-red-700"}`}
                          >
                            Quá hạn (Đã nhả slot)
                          </span>
                        ) : (
                          <span
                            className={`px-2.5 py-1 border font-bold rounded-lg text-xs ${theme === "dark" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-amber-50 text-amber-700 border-amber-200"}`}
                          >
                            <CountdownTimer timeString={timeStr} />
                          </span>
                        )}
                      </td>

                      <td
                        className={`px-6 py-4 font-medium transition-colors ${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}
                      >
                        {note}
                      </td>

                      <td className="px-6 py-4 text-right pr-6">
                        {isCancelled ? (
                          <span className="text-xs font-bold text-slate-400 flex items-center justify-end gap-1">
                            <span>🔄</span> QLL đã thu hồi
                          </span>
                        ) : isDone ? (
                          <span className="text-xs font-bold text-emerald-500 flex items-center justify-end gap-1">
                            <span>✅</span> Đã xếp xong
                          </span>
                        ) : isExpired ? (
                          <span
                            className={`px-3 py-1.5 font-bold rounded-xl text-xs inline-flex items-center gap-1 shadow-sm ${theme === "dark" ? "bg-red-500/10 text-red-400" : "bg-red-100 text-red-600"}`}
                          >
                            <span>❌</span> Quá hạn (Đã nhả slot)
                          </span>
                        ) : (
                          <button
                            onClick={() => handleMarkAsDone(row.id)}
                            className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs shadow-sm transition-colors cursor-pointer active:scale-95"
                          >
                            Đã xếp (Done)
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
            ) : (
              <tr>
                <td
                  colSpan={8}
                  className="px-6 py-24 text-center text-slate-400 font-semibold"
                >
                  Chưa có dữ liệu lịch sử giữ slot nào được ghi nhận.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {historyTotalPages > 1 && (
        <div
          className={`flex items-center justify-between px-6 py-4 border-t shrink-0 z-10 transition-colors duration-0 ${theme === "dark" ? "bg-transparent border-white/5" : "bg-white border-slate-100"}`}
        >
          <span className="text-[13px] text-slate-500 font-bold tracking-wide uppercase">
            Page{" "}
            <span className="text-sky-500 text-sm mx-1">{currentPage}</span> /{" "}
            {historyTotalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`px-5 py-2 border rounded-xl text-[13px] font-bold focus:outline-none transition-colors duration-0 active:scale-95 ${
                theme === "dark"
                  ? "bg-[#0a0f1c] border-white/10 text-slate-400 hover:text-sky-400 hover:border-sky-500/50 disabled:opacity-40 disabled:hover:bg-[#0a0f1c] disabled:hover:border-white/10 disabled:hover:text-slate-400"
                  : "bg-white border-slate-200 text-slate-500 hover:text-sky-600 hover:border-sky-300 hover:bg-sky-50 disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-slate-200 disabled:hover:text-slate-500"
              }`}
            >
              ← Back
            </button>
            <button
              onClick={() =>
                setCurrentPage((p) => Math.min(historyTotalPages, p + 1))
              }
              disabled={currentPage === historyTotalPages}
              className={`px-5 py-2 border rounded-xl text-[13px] font-bold focus:outline-none transition-colors duration-0 active:scale-95 ${
                theme === "dark"
                  ? "bg-[#0a0f1c] border-white/10 text-slate-400 hover:text-sky-400 hover:border-sky-500/50 disabled:opacity-40 disabled:hover:bg-[#0a0f1c] disabled:hover:border-white/10 disabled:hover:text-slate-400"
                  : "bg-white border-slate-200 text-slate-500 hover:text-sky-600 hover:border-sky-300 hover:bg-sky-50 disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-slate-200 disabled:hover:text-slate-500"
              }`}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
