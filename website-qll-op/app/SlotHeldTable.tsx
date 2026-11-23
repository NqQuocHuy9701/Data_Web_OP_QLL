"use client";

import React from "react";
import CountdownTimer from "./CountdownTimer";

interface SlotHeldTableProps {
  slotHistoryData: any[];
  displayName: string;
  completedSlots: Record<string, boolean>;
  checkIsExpired: (timeString: string) => boolean;
  onRequestRecall?: (row: any) => void;
  theme: "light" | "dark";
  onRefresh: () => void;
  refreshing: boolean;
}

export default function SlotHeldTable({
  slotHistoryData,
  displayName,
  completedSlots,
  checkIsExpired,
  onRequestRecall,
  theme,
  onRefresh,
  refreshing,
}: SlotHeldTableProps) {
  return (
    <div
      className={`rounded-3xl flex flex-col h-full overflow-hidden transition-colors duration-0 ${
        theme === "dark"
          ? "bg-[#151b2b] border border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.2)]"
          : "bg-white shadow-[0_4px_24px_rgb(0,0,0,0.03)] border border-slate-100"
      }`}
    >
      <div
        className={`px-3 py-2 border-b flex flex-wrap items-center justify-between gap-2 shrink-0 z-30 transition-colors duration-0 ${theme === "dark" ? "bg-transparent border-white/5" : "bg-white border-slate-100"}`}
      >
        <h3
          className={`font-bold flex items-center gap-3 text-base transition-colors duration-0 ${theme === "dark" ? "text-white" : "text-slate-800"}`}
        >
          <span className="w-1.5 h-6 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span>
          🕒 Danh sách Slot lớp bạn đã giữ
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`font-extrabold px-3.5 py-2 rounded-xl border shadow-sm text-xs transition-colors duration-0 ${
              theme === "dark"
                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                : "bg-amber-50 text-amber-600 border-amber-100"
            }`}
          >
            Đã giữ:{" "}
            {
              slotHistoryData.filter(
                (item) =>
                  (item.nguoi_giu || item["Người giữ"]) === displayName,
              ).length
            }{" "}
            slot
          </span>
          <button
            type="button"
            disabled={refreshing}
            aria-busy={refreshing}
            onClick={onRefresh}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:opacity-60 ${
              theme === "dark" ? "border-white/10 text-slate-300 hover:bg-white/5" : "border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {refreshing ? "Đang tải…" : "Làm mới slot"}
          </button>
        </div>
      </div>

      <div className="ops-table-container flex-1 overflow-auto custom-scrollbar relative">
        <table className="w-full min-w-[640px] text-left text-sm [&_td]:px-2 [&_td]:py-2 [&_th]:px-2 [&_th]:py-2 xl:[&_td]:px-4 xl:[&_th]:px-4">
          <thead
            className={`text-[12px] uppercase font-bold tracking-wider sticky top-0 z-20 shadow-sm border-b transition-colors duration-0 ${
              theme === "dark"
                ? "bg-[#1a2235] text-slate-400 border-white/5"
                : "bg-slate-50 text-slate-400 border-slate-100"
            }`}
          >
            <tr>
              <th className="px-6 py-4">Thời gian tạo</th>
              <th className="px-6 py-4">Mã lớp</th>
              <th className="px-6 py-4">Môn học</th>
              <th className="px-6 py-4">Lưu ý (SID/CID)</th>
              <th className="px-6 py-4">
                <span className="ops-table-wide-column">Thời gian còn lại (24h)</span>
                <span className="ops-table-compact-field">Trạng thái / Còn lại</span>
              </th>
              <th className="ops-table-wide-column px-6 py-4">Trạng thái xếp</th>
              <th className="px-6 py-4 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody
            className={`divide-y transition-colors duration-0 ${theme === "dark" ? "divide-white/5" : "divide-slate-50"}`}
          >
            {slotHistoryData.filter(
              (item) => (item.nguoi_giu || item["Người giữ"]) === displayName,
            ).length > 0 ? (
              slotHistoryData
                .filter(
                  (item) =>
                    (item.nguoi_giu || item["Người giữ"]) === displayName,
                )
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
                  const note =
                    row.note ||
                    row["lưu ý ( mục note của QLL )"] ||
                    row["lưu ý"] ||
                    "-";

                  const rowKey = `${timeStr}-${maLop}-${index}`;
                  const isDone = completedSlots[rowKey] || row.is_done;
                  const isExpired = checkIsExpired(timeStr);
                  const isCancelled = row.is_cancelled === true;
                  // Slot còn hiệu lực → mới cho thu hồi.
                  const canRecall = !isDone && !isExpired && !isCancelled;
                  const statusLabel = isCancelled ? (
                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                      <span>🔄</span> Đã thu hồi
                    </span>
                  ) : isDone ? (
                    <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                      <span>✅</span> Admin đã chốt xếp
                    </span>
                  ) : isExpired ? (
                    <span
                      className={`text-xs font-bold ${theme === "dark" ? "text-red-400" : "text-red-500"} flex items-center gap-1`}
                    >
                      <span>❌</span> Đã nhả slot
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
                      <span>⏳</span> Vận hành đang xử lý !
                    </span>
                  );

                  return (
                    <tr
                      key={row.id || index}
                      className={`transition-colors duration-0 ${
                        isCancelled
                          ? theme === "dark"
                            ? "bg-slate-800/40 opacity-60"
                            : "bg-slate-100/60 opacity-60"
                          : isDone
                            ? theme === "dark"
                              ? "bg-emerald-900/20 opacity-75"
                              : "bg-emerald-50/40 opacity-75"
                            : isExpired
                              ? theme === "dark"
                                ? "bg-red-900/20 opacity-75"
                                : "bg-red-50/30 opacity-75"
                              : theme === "dark"
                                ? "hover:bg-[#1e293b] even:bg-[#1a2235]/50"
                                : "hover:bg-amber-50/40 even:bg-slate-50/60"
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
                      <td
                        className={`px-6 py-4 font-medium transition-colors ${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}
                      >
                        {note}
                      </td>

                      <td className="px-6 py-4">
                        <div className="ops-table-compact-field">{statusLabel}</div>
                        <div>
                          {isCancelled ? (
                          <span className="text-slate-400 text-xs italic">
                            Đã thu hồi
                          </span>
                        ) : isDone ? (
                          <span className="text-slate-400 text-xs italic">
                            Đã xử lý xong
                          </span>
                        ) : isExpired ? (
                          <span
                            className={`px-2.5 py-1 font-bold rounded-lg text-xs ${theme === "dark" ? "bg-red-500/10 text-red-400" : "bg-red-100 text-red-700"}`}
                          >
                            Hết hạn
                          </span>
                        ) : (
                          <span
                            className={`px-3 py-1.5 border font-bold rounded-xl text-xs shadow-sm inline-flex justify-center min-w-[120px] ${theme === "dark" ? "bg-[#0a0f1c] text-amber-400 border-amber-500/30" : "bg-white text-amber-600 border-amber-200"}`}
                          >
                            <CountdownTimer timeString={timeStr} />
                          </span>
                        )}
                        </div>
                      </td>
                      <td className="ops-table-wide-column px-6 py-4">{statusLabel}</td>

                      <td className="px-6 py-4 text-center">
                        {canRecall ? (
                          <button
                            onClick={() => onRequestRecall?.(row)}
                            className="px-4 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold text-xs shadow-sm transition-colors cursor-pointer active:scale-95"
                          >
                            🔄 Thu hồi
                          </button>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
            ) : (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-24 text-center text-slate-400 font-semibold"
                >
                  <div className="text-3xl mb-3">🕒</div>
                  Bạn chưa yêu cầu giữ slot nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
