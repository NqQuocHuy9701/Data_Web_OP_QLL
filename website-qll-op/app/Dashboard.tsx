"use client";

import React, { useMemo } from "react";
import CountUp from "./CountUp";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface QllStat {
  name: string;
  team: string;
  total: number;
  done: number;
  pending: number;
  expired: number;
}

interface DashboardProps {
  qllStats: QllStat[];
  slotHistoryData: any[];
  theme: "light" | "dark";
}

export default function Dashboard({
  qllStats,
  slotHistoryData,
  theme,
}: DashboardProps) {
  // Tổng hợp toàn hệ thống từ qllStats.
  const totals = useMemo(() => {
    return qllStats.reduce(
      (acc, q) => {
        acc.total += q.total;
        acc.done += q.done;
        acc.pending += q.pending;
        acc.expired += q.expired;
        return acc;
      },
      { total: 0, done: 0, pending: 0, expired: 0 },
    );
  }, [qllStats]);

  const doneRate =
    totals.total > 0 ? Math.round((totals.done / totals.total) * 100) : 0;

  // Thống kê theo team (số slot mỗi team giữ).
  const teamChartData = useMemo(() => {
    const map: Record<string, number> = {};
    qllStats.forEach((q) => {
      const team = q.team || "-";
      map[team] = (map[team] || 0) + q.total;
    });
    return Object.entries(map)
      .map(([team, total]) => ({ team, total }))
      .sort((a, b) => b.total - a.total);
  }, [qllStats]);

  // Giờ cao điểm: đếm số slot được giữ theo từng khung giờ (0–23h), từ timestamp.
  const peakHourData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, h) => ({
      hour: `${h.toString().padStart(2, "0")}h`,
      total: 0,
    }));
    slotHistoryData.forEach((row) => {
      let d: Date | null = null;
      if (row.timestamp) {
        d = new Date(Number(row.timestamp));
      } else if (row["Thời gian"]) {
        const parts = String(row["Thời gian"]).split(" ");
        if (parts.length >= 2) {
          const dp = parts[0].split("/");
          const tp = parts[1].split(":");
          d = new Date(
            parseInt(dp[2]),
            parseInt(dp[1]) - 1,
            parseInt(dp[0]),
            parseInt(tp[0]),
            parseInt(tp[1]),
          );
        }
      }
      if (d && !isNaN(d.getTime())) {
        const h = d.getHours();
        if (h >= 0 && h < 24) hours[h].total += 1;
      }
    });
    return hours;
  }, [slotHistoryData]);

  const topQll = useMemo(() => qllStats.slice(0, 10), [qllStats]);

  const cardBase =
    theme === "dark"
      ? "bg-[#151b2b] border-white/10"
      : "bg-white border-slate-200";

  const chartGridStroke =
    theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
  const axisTick = {
    fill: theme === "dark" ? "#94a3b8" : "#64748b",
    fontSize: 11,
    fontWeight: 600,
  };

  return (
    <div className="flex-1 px-8 pt-5 pb-6 min-h-0 overflow-y-auto custom-scrollbar animate-fade-slide-up">
      {/* 4 THẺ KPI TỔNG */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
        <div className={`border rounded-2xl py-3 px-4 ${cardBase}`}>
          <p className="text-sky-500 text-[10px] font-bold uppercase tracking-wider mb-0.5">
            Tổng Slot
          </p>
          <span
            className={`text-2xl font-extrabold ${theme === "dark" ? "text-white" : "text-slate-900"}`}
          >
            <CountUp value={totals.total} />
          </span>
        </div>
        <div className={`border rounded-2xl py-3 px-4 ${cardBase}`}>
          <p className="text-emerald-500 text-[10px] font-bold uppercase tracking-wider mb-0.5">
            Tỉ Lệ Xử Lý
          </p>
          <span className="text-2xl font-extrabold text-emerald-500">
            <CountUp value={doneRate} />%
          </span>
          <div className="mt-2 h-2 w-full rounded-full bg-slate-200/40 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${doneRate}%` }}
            ></div>
          </div>
        </div>
        <div className={`border rounded-2xl py-3 px-4 ${cardBase}`}>
          <p className="text-amber-500 text-[10px] font-bold uppercase tracking-wider mb-0.5">
            Đang Chờ
          </p>
          <span className="text-2xl font-extrabold text-amber-500">
            <CountUp value={totals.pending} />
          </span>
        </div>
        <div className={`border rounded-2xl py-3 px-4 ${cardBase}`}>
          <p className="text-red-500 text-[10px] font-bold uppercase tracking-wider mb-0.5">
            Quá Hạn
          </p>
          <span className="text-2xl font-extrabold text-red-500">
            <CountUp value={totals.expired} />
          </span>
        </div>
      </div>

      {/* 2 BIỂU ĐỒ: theo team + giờ cao điểm */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-5">
        <div className={`border rounded-3xl p-5 ${cardBase}`}>
          <h3
            className={`font-bold flex items-center gap-2 text-sm mb-4 ${theme === "dark" ? "text-white" : "text-slate-800"}`}
          >
            <span className="w-1.5 h-5 bg-orange-500 rounded-full"></span>
            📊 Slot theo Team
          </h3>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={teamChartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                barSize={28}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={chartGridStroke}
                />
                <XAxis
                  dataKey="team"
                  axisLine={false}
                  tickLine={false}
                  tick={axisTick}
                  dy={8}
                />
                <YAxis axisLine={false} tickLine={false} tick={axisTick} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme === "dark" ? "#1e293b" : "#ffffff",
                    borderColor:
                      theme === "dark"
                        ? "rgba(255,255,255,0.1)"
                        : "rgba(0,0,0,0.1)",
                    borderRadius: "12px",
                  }}
                  cursor={{ fill: theme === "dark" ? "#1e293b" : "#f1f5f9" }}
                />
                <Bar
                  dataKey="total"
                  name="Số slot"
                  fill="#f97316"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`border rounded-3xl p-5 ${cardBase}`}>
          <h3
            className={`font-bold flex items-center gap-2 text-sm mb-4 ${theme === "dark" ? "text-white" : "text-slate-800"}`}
          >
            <span className="w-1.5 h-5 bg-sky-500 rounded-full"></span>
            ⏰ Giờ cao điểm giữ slot
          </h3>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={peakHourData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={chartGridStroke}
                />
                <XAxis
                  dataKey="hour"
                  axisLine={false}
                  tickLine={false}
                  tick={axisTick}
                  interval={2}
                  dy={8}
                />
                <YAxis axisLine={false} tickLine={false} tick={axisTick} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme === "dark" ? "#1e293b" : "#ffffff",
                    borderColor:
                      theme === "dark"
                        ? "rgba(255,255,255,0.1)"
                        : "rgba(0,0,0,0.1)",
                    borderRadius: "12px",
                  }}
                  cursor={{ fill: theme === "dark" ? "#1e293b" : "#f1f5f9" }}
                />
                <Bar
                  dataKey="total"
                  name="Số slot"
                  fill="#0ea5e9"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* BẢNG XẾP HẠNG TOP QLL */}
      <div className={`border rounded-3xl overflow-hidden ${cardBase}`}>
        <div
          className={`px-6 py-4 border-b ${theme === "dark" ? "border-white/5" : "border-slate-100"}`}
        >
          <h3
            className={`font-bold flex items-center gap-2 text-sm ${theme === "dark" ? "text-white" : "text-slate-800"}`}
          >
            <span className="w-1.5 h-5 bg-emerald-500 rounded-full"></span>
            🏆 Top QLL giữ nhiều slot
          </h3>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead
              className={`text-[11px] uppercase font-bold tracking-wider border-b ${
                theme === "dark"
                  ? "bg-[#1a2235] text-slate-400 border-white/5"
                  : "bg-slate-50 text-slate-400 border-slate-100"
              }`}
            >
              <tr>
                <th className="px-5 py-3 text-center w-16">#</th>
                <th className="px-5 py-3">QLL</th>
                <th className="px-5 py-3">Team</th>
                <th className="px-5 py-3 text-center">Tổng</th>
                <th className="px-5 py-3 text-center text-emerald-500">Done</th>
                <th className="px-5 py-3 text-center text-amber-500">Chờ</th>
                <th className="px-5 py-3 text-center text-red-500">Quá hạn</th>
              </tr>
            </thead>
            <tbody
              className={`divide-y ${theme === "dark" ? "divide-white/5" : "divide-slate-50"}`}
            >
              {topQll.length > 0 ? (
                topQll.map((q, i) => (
                  <tr
                    key={q.name + i}
                    className={
                      theme === "dark"
                        ? "hover:bg-white/5 text-slate-300"
                        : "hover:bg-slate-50 text-slate-700"
                    }
                  >
                    <td className="px-5 py-3 text-center font-bold text-slate-400">
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                    </td>
                    <td className="px-5 py-3 font-bold text-sky-500">
                      {q.name}
                    </td>
                    <td className="px-5 py-3">{q.team}</td>
                    <td className="px-5 py-3 text-center font-extrabold">
                      {q.total}
                    </td>
                    <td className="px-5 py-3 text-center font-bold text-emerald-500">
                      {q.done}
                    </td>
                    <td className="px-5 py-3 text-center font-bold text-amber-500">
                      {q.pending}
                    </td>
                    <td className="px-5 py-3 text-center font-bold text-red-500">
                      {q.expired}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-16 text-center text-slate-400 font-semibold"
                  >
                    Chưa có dữ liệu thống kê.
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
