"use client";

import React from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface TrafficChartsProps {
  todayChartData: { time: string; requests: number }[];
  historicalChartData: { date: string; total: number }[];
  theme: "light" | "dark";
}

export default function TrafficCharts({
  todayChartData,
  historicalChartData,
  theme,
}: TrafficChartsProps) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6 shrink-0">
      <div
        className={`rounded-3xl p-6 shadow-sm border transition-colors duration-0 ${theme === "dark" ? "bg-[#151b2b] border-white/5" : "bg-white border-slate-100"}`}
      >
        <h3
          className={`font-bold flex items-center gap-3 text-base mb-6 transition-colors duration-0 ${theme === "dark" ? "text-white" : "text-slate-800"}`}
        >
          <span className="w-1.5 h-6 bg-sky-500 rounded-full shadow-[0_0_8px_rgba(14,165,233,0.5)]"></span>
          📈 Requests Trong Ngày (Hôm nay)
        </h3>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={todayChartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={
                  theme === "dark"
                    ? "rgba(255,255,255,0.05)"
                    : "rgba(0,0,0,0.05)"
                }
              />
              <XAxis
                dataKey="time"
                minTickGap={35}
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: theme === "dark" ? "#94a3b8" : "#64748b",
                  fontSize: 11,
                  fontWeight: 600,
                }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: theme === "dark" ? "#94a3b8" : "#64748b",
                  fontSize: 11,
                  fontWeight: 600,
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme === "dark" ? "#1e293b" : "#ffffff",
                  borderColor:
                    theme === "dark"
                      ? "rgba(255,255,255,0.1)"
                      : "rgba(0,0,0,0.1)",
                  borderRadius: "12px",
                }}
                itemStyle={{ color: "#0ea5e9", fontWeight: "bold" }}
                labelStyle={{
                  color: theme === "dark" ? "#cbd5e1" : "#475569",
                  marginBottom: "4px",
                }}
              />
              <Line
                type="linear"
                dataKey="requests"
                name="Requests"
                stroke="#0ea5e9"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, stroke: "#e0f2fe", strokeWidth: 3 }}
                animationDuration={1000}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div
        className={`rounded-3xl p-6 shadow-sm border transition-colors duration-0 ${theme === "dark" ? "bg-[#151b2b] border-white/5" : "bg-white border-slate-100"}`}
      >
        <h3
          className={`font-bold flex items-center gap-3 text-base mb-6 transition-colors duration-0 ${theme === "dark" ? "text-white" : "text-slate-800"}`}
        >
          <span className="w-1.5 h-6 bg-orange-500 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.5)]"></span>
          📊 Lịch sử truy cập (7 ngày qua)
        </h3>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={historicalChartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              barSize={30}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={
                  theme === "dark"
                    ? "rgba(255,255,255,0.05)"
                    : "rgba(0,0,0,0.05)"
                }
              />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: theme === "dark" ? "#94a3b8" : "#64748b",
                  fontSize: 11,
                  fontWeight: 600,
                }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: theme === "dark" ? "#94a3b8" : "#64748b",
                  fontSize: 11,
                  fontWeight: 600,
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme === "dark" ? "#1e293b" : "#ffffff",
                  borderColor:
                    theme === "dark"
                      ? "rgba(255,255,255,0.1)"
                      : "rgba(0,0,0,0.1)",
                  borderRadius: "12px",
                }}
                itemStyle={{ color: "#f97316", fontWeight: "bold" }}
                labelStyle={{
                  color: theme === "dark" ? "#cbd5e1" : "#475569",
                  marginBottom: "4px",
                }}
                cursor={{
                  fill: theme === "dark" ? "#1e293b" : "#f1f5f9",
                }}
              />
              <Bar
                dataKey="total"
                name="Tổng Requests"
                fill="#f97316"
                radius={[6, 6, 0, 0]}
                animationDuration={1000}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
