"use client";

import React from "react";

interface OnlineUser {
  namecode: string;
  teamLead: string;
  onlineAt: number;
}

interface OnlineUsersTableProps {
  onlineUsers: OnlineUser[];
  formatOnlineDuration: (timestamp: number) => string;
  onRefresh?: () => void;
  theme: "light" | "dark";
}

export default function OnlineUsersTable({
  onlineUsers,
  formatOnlineDuration,
  onRefresh,
  theme,
}: OnlineUsersTableProps) {
  return (
    <div
      className={`flex-1 rounded-3xl flex flex-col h-full overflow-hidden transition-colors duration-0 ${
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
          <span className="w-1.5 h-6 bg-sky-500 rounded-full shadow-[0_0_8px_rgba(14,165,233,0.5)]"></span>
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          Danh sách nhân sự đang truy cập trực tuyến
        </h3>

        <div className="flex items-center gap-3">
          <span
            className={`font-extrabold px-3.5 py-2 rounded-xl border shadow-sm text-xs flex items-center gap-1.5 ${theme === "dark" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-emerald-50 text-emerald-600 border-emerald-100"}`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Đang online: {onlineUsers.length} người
          </span>

          {/* Nút Refresh thủ công */}
          <button
            onClick={() => onRefresh?.()}
            className={`p-2 rounded-xl border transition-all ${theme === "dark" ? "border-slate-700 hover:bg-slate-800 text-slate-300" : "border-slate-200 hover:bg-slate-100 text-slate-600"}`}
            title="Làm mới danh sách"
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
            className={`text-[12px] uppercase font-bold tracking-wider sticky top-0 z-20 shadow-sm border-b transition-colors duration-0 ${
              theme === "dark"
                ? "bg-[#1a2235] text-slate-400 border-white/5"
                : "bg-slate-50 text-slate-400 border-slate-100"
            }`}
          >
            <tr>
              <th className="px-6 py-4 text-center w-24">STT</th>
              <th className="px-6 py-4">Tên Namecode (Đang Onl)</th>
              <th className="px-6 py-4">Team Lead</th>
              <th className="px-6 py-4 text-right pr-8">Thời gian Online</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/20 text-sm">
            {onlineUsers && onlineUsers.length > 0 ? (
              onlineUsers.map((user, index) => (
                <tr
                  key={index}
                  className={`transition-colors duration-200 ${theme === "dark" ? "hover:bg-slate-800/40 text-slate-300" : "hover:bg-slate-50 text-slate-700"}`}
                >
                  <td className="py-3.5 px-6 font-medium text-slate-400 text-center w-24">
                    #{index + 1}
                  </td>
                  <td className="py-3.5 px-6">
                    <div className="flex items-center gap-2.5">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                      <span className="font-semibold text-orange-400">
                        {user.namecode || "op_vanhanh"}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-6">
                    {user.teamLead || "Admin hệ thống"}
                  </td>
                  <td className="py-3.5 px-6 text-right pr-8 text-slate-400 text-xs">
                    {formatOnlineDuration(user.onlineAt)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-6 text-center text-slate-400">
                  Không có nhân sự nào đang trực tuyến.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
