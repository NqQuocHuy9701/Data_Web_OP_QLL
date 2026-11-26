"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import DashboardDatePicker from "./DashboardDatePicker";
import { firstDailyReportDay } from "./classScheduleReportRange";

interface DailyStats {
  day: string;
  requests: number;
  added: number;
  cancelled: number;
}

const series = [
  { key: "requests", label: "Yêu cầu mới", total: "Tổng yêu cầu", light: "#0284c7", dark: "#38bdf8" },
  { key: "added", label: "Đã Add lớp", total: "Đã Add lớp", light: "#047857", dark: "#34d399" },
  { key: "cancelled", label: "Đã hủy", total: "Đã hủy", light: "#e11d48", dark: "#fb7185" },
] as const;
const pendingTone = { light: "#92400e", dark: "#fcd34d" };
const zeroTone = { light: "#64748b", dark: "#94a3b8" };

const number = new Intl.NumberFormat("vi-VN");
const percentage = new Intl.NumberFormat("vi-VN", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 });
const vietnamDate = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" });
const dayMs = 86_400_000;
const maxDailyDays = 31;
const offsetDay = (day: string, offset: number) => new Date(Date.parse(day + "T00:00:00Z") + offset * dayMs).toISOString().slice(0, 10);
const reportStart = (day: string) => day < firstDailyReportDay ? firstDailyReportDay : day;
const shortDate = (day: string) => `${day.slice(8, 10)}/${day.slice(5, 7)}`;
const displayDate = (day: string) => `${shortDate(day)}/${day.slice(0, 4)}`;
const rate = (part: number, whole: number) => whole ? part / whole : 0;

function recentWeek() {
  const end = vietnamDate.format(new Date());
  const start = new Date(Date.parse(end + "T00:00:00Z") - 6 * dayMs).toISOString().slice(0, 10);
  return { start: reportStart(start), end };
}

function downloadCsv(rows: DailyStats[], start: string, end: string) {
  const lines = [
    "Ngày,Yêu cầu mới,Đã Add lớp,Đã hủy,Tỷ lệ Add lớp",
    ...rows.map(({ day, requests, added, cancelled }) =>
      [displayDate(day), requests, added, cancelled, (rate(added, requests) * 100).toFixed(1) + "%"].join(",")
    ),
  ];
  const url = URL.createObjectURL(new Blob(["\uFEFF", lines.join("\r\n")], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `yeu-cau-add-lop_${start}_${end}.csv`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

export default function ClassScheduleDashboard({ theme, onSessionExpired }: {
  theme: "light" | "dark";
  onSessionExpired: () => void;
}) {
  const [{ start, end }, setRange] = useState(recentWeek);
  const [result, setResult] = useState<{ key: string; data: DailyStats[]; start: string; end: string }>();
  const [failure, setFailure] = useState<{ key: string; message: string }>();
  const [revision, setRevision] = useState(0);
  const today = vietnamDate.format(new Date());
  const latestEnd = offsetDay(start, maxDailyDays - 1);
  const days = (Date.parse(end + "T00:00:00Z") - Date.parse(start + "T00:00:00Z")) / dayMs + 1;
  const valid = days >= 1 && days <= maxDailyDays && start >= firstDailyReportDay && end <= today;
  const requestKey = `${start}/${end}/${revision}`;
  const loaded = result?.key === requestKey ? result : undefined;
  const rows = result?.data ?? [];
  const error = failure?.key === requestKey ? failure.message : undefined;
  const loading = valid && !loaded && !error;

  useEffect(() => {
    const controller = new AbortController();
    if (!valid) return;
    async function load() {
      try {
        const response = await fetch(`/api/class-schedule/stats?start=${start}&end=${end}`, { signal: controller.signal });
        if (controller.signal.aborted) return;
        if (response.status === 401) {
          onSessionExpired();
          return;
        }
        const result = await response.json();
        if (!response.ok || !Array.isArray(result.data)) throw new Error(result.error || "Chưa tải được thống kê.");
        if (!controller.signal.aborted) setResult({ key: requestKey, data: result.data, start, end });
      } catch (problem) {
        if (!controller.signal.aborted) setFailure({
          key: requestKey,
          message: problem instanceof Error ? problem.message : "Chưa tải được thống kê.",
        });
      }
    }
    void load();
    return () => controller.abort();
  }, [start, end, valid, requestKey, onSessionExpired]);

  const totals = rows.reduce((acc, row) => ({
    requests: acc.requests + row.requests,
    added: acc.added + row.added,
    cancelled: acc.cancelled + row.cancelled,
  }), { requests: 0, added: 0, cancelled: 0 });
  const addedRate = rate(totals.added, totals.requests);
  const cancelledRate = rate(totals.cancelled, totals.requests);
  const processed = totals.added + totals.cancelled;
  const processedRate = rate(processed, totals.requests);
  const pending = totals.requests - totals.added - totals.cancelled;
  const dark = theme === "dark";
  const metrics = series.map((item) => ({ ...item, color: item[theme] }));
  const statuses = [
    { ...metrics[1], count: totals.added },
    { ...metrics[2], count: totals.cancelled },
    { key: "pending", label: "Chờ xử lý", color: pendingTone[theme], count: pending },
  ];
  const surface = dark ? "bg-[#151b2b] border-white/10" : "bg-white border-slate-200";
  const panel = `min-w-0 rounded-2xl border p-4 ${surface}`;
  const control = `h-[38px] rounded-xl border px-3 text-sm ${surface}`;
  const muted = dark ? "text-slate-300" : "text-slate-600";
  const errorText = dark ? "text-rose-300" : "text-rose-700";
  const chartBackground = dark ? "#151b2b" : "#fff";
  const grid = dark ? "#334155" : "#e2e8f0";
  const axis = dark ? "#cbd5e1" : "#475569";
  const chartText = dark ? "#f1f5f9" : "#0f172a";

  return (
    <div className={`min-h-0 min-w-0 flex-1 overflow-auto px-4 py-5 [scrollbar-gutter:stable] sm:px-6 2xl:px-8 ${dark ? "text-slate-100" : "text-slate-900"}`}
      style={{ colorScheme: theme }}>
      <div className="w-full min-w-0">
        <p className={`text-sm ${muted}`}>Thống kê theo ngày tạo yêu cầu (giờ Việt Nam)</p>

        <div className={`my-4 flex flex-wrap items-end gap-2.5 text-sm ${muted}`}>
          <div className="grid w-full grid-cols-2 gap-2.5 sm:flex sm:w-auto">
            <DashboardDatePicker label="Từ ngày" theme={theme} value={start} min={reportStart(offsetDay(end, 1 - maxDailyDays))} max={end}
              onChange={(date) => setRange({ start: date, end })} />
            <DashboardDatePicker label="Đến ngày" theme={theme} value={end} min={start} max={latestEnd < today ? latestEnd : today}
              onChange={(date) => setRange({ start, end: date })} alignEnd />
          </div>
          <button type="button" className={control} onClick={() => setRange(recentWeek())}>7 ngày gần nhất</button>
          <button type="button" className={control} onClick={() => setRevision((value) => value + 1)} disabled={!valid || loading}>Làm mới</button>
          {valid && <span className="ml-auto flex h-[38px] items-center tabular-nums">{number.format(days)} ngày</span>}
        </div>

        <div className="mb-2 flex h-10 flex-col justify-center overflow-hidden text-xs sm:h-8">
          {!valid ? <p role="alert" className={errorText}>Chọn tối đa {maxDailyDays} ngày từ {displayDate(firstDailyReportDay)} đến hôm nay.</p>
            : error ? <p role="alert" className={errorText}>{error}</p>
            : loading ? <p role="status" className={muted}>Đang tải thống kê…</p> : null}
          {result && (
            <p className={muted}>Số liệu đang hiển thị từ {displayDate(result.start)} đến {displayDate(result.end)}.</p>
          )}
        </div>
        <div aria-busy={loading}>
            <dl className="mb-4 grid gap-3 sm:grid-cols-3">
              {metrics.map((item) => (
                <div key={item.key} className={panel}>
                  <dt className={`text-sm font-semibold ${muted}`}>{item.total}</dt>
                  <dd className="mt-1 text-3xl font-semibold tabular-nums" style={{ color: item.color }}>{result ? number.format(totals[item.key]) : "—"}</dd>
                </div>
              ))}
            </dl>

            <section aria-labelledby="daily-chart" className={`${panel} mb-4`}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h2 id="daily-chart" className="font-bold">Xu hướng theo ngày</h2>
                <ul className={`flex flex-wrap gap-3 text-xs ${muted}`}>
                  {metrics.map((item) => <li key={item.key} className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />{item.label}
                  </li>)}
                </ul>
              </div>
              <div className="h-60 overflow-x-auto overflow-y-hidden">
                <div className="h-56" style={{ minWidth: Math.max(380, rows.length * (rows.length <= 14 ? 62 : 34)) }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={rows} margin={{ top: 19, right: 4, left: 0, bottom: 0 }} barGap={4}>
                      <CartesianGrid vertical={false} stroke={grid} />
                      <XAxis dataKey="day" tickFormatter={shortDate} tick={{ fill: axis, fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis allowDecimals={false} width={31} tick={{ fill: axis, fontSize: 11 }} tickLine={false} axisLine={false}
                        domain={[0, (max: number) => Math.max(1, Math.ceil(max * 1.15))]} />
                      <Tooltip labelFormatter={(day) => displayDate(String(day))}
                        position={{ y: 8 }} isAnimationActive={false} wrapperStyle={{ pointerEvents: "none" }}
                        contentStyle={{ background: chartBackground, borderColor: grid, borderRadius: 10 }}
                        labelStyle={{ color: chartText }} itemStyle={{ color: axis }} cursor={{ fill: grid, opacity: .45 }} />
                      {metrics.map((item) => <Bar key={item.key} dataKey={item.key} name={item.label} fill={item.color}
                        radius={[5, 5, 0, 0]} maxBarSize={30} isAnimationActive={false}>
                        {rows.length <= 14 && <LabelList dataKey={item.key} position="top" fill={chartText} fontSize={11} />}
                      </Bar>)}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(255px,1fr)_minmax(0,2fr)]">
              <section aria-labelledby="processing-rates" className={`${panel} self-start`}>
                <h2 id="processing-rates" className="mb-4 font-bold">Tỷ lệ xử lý yêu cầu</h2>
                <div className="flex flex-wrap items-center gap-4">
                  <div aria-hidden="true" className="grid size-32 shrink-0 place-items-center rounded-full" style={{
                    background: `conic-gradient(${statuses[0].color} ${addedRate * 100}%, ${statuses[1].color} ${addedRate * 100}% ${(addedRate + cancelledRate) * 100}%, ${statuses[2].color} ${(addedRate + cancelledRate) * 100}%)`,
                  }}>
                    <div className="grid size-[100px] place-content-center rounded-full text-center" style={{ background: chartBackground }}>
                      <strong className="text-xl tabular-nums" style={{ color: totals.added ? metrics[1].color : zeroTone[theme] }}>
                        {totals.requests ? percentage.format(addedRate) : "—"}
                      </strong>
                      <span className={`text-xs ${muted}`}>Đã Add lớp</span>
                    </div>
                  </div>
                  <dl className="space-y-2 text-xs">
                    {statuses.map((item) => <div key={item.key}>
                      <dt className="flex items-center gap-1.5 font-semibold" style={{ color: item.color }}>
                        <span className="size-2 rounded-full" style={{ background: item.color }} />{item.label}
                      </dt>
                      <dd className="ml-3.5 mt-0.5 font-semibold tabular-nums" style={{ color: item.count ? item.color : zeroTone[theme] }}>
                        {percentage.format(rate(item.count, totals.requests))} · {number.format(item.count)}
                      </dd>
                    </div>)}
                  </dl>
                </div>
                {totals.requests > 0 && (
                  <p className={`mt-4 text-xs ${muted}`}>
                    Đã xử lý {number.format(processed)} / {number.format(totals.requests)} yêu cầu ({percentage.format(processedRate)}), gồm Add lớp và hủy.
                  </p>
                )}
              </section>

              <section aria-labelledby="daily-table" className={panel}>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 id="daily-table" className="font-bold">Chi tiết theo ngày</h2>
                  <button type="button" className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${surface} ${dark ? "text-sky-300 hover:bg-white/10" : "text-sky-700 hover:bg-sky-50"}`}
                    disabled={!valid || !loaded || Boolean(error)}
                    onClick={() => downloadCsv(rows, start, end)}>Tải CSV</button>
                </div>
                <div className="h-60 overflow-auto [scrollbar-gutter:stable] sm:h-64">
                  <table className="w-full whitespace-nowrap text-xs">
                    <thead className={`sticky top-0 ${dark ? "bg-[#202b40]" : "bg-slate-100"}`}>
                      <tr>
                        <th scope="col" className="px-2 py-2 text-left">Ngày</th>
                        {metrics.map((item) => <th key={item.key} scope="col" className="px-2 py-2 text-right" style={{ color: item.color }}>{item.label}</th>)}
                        <th scope="col" className="px-2 py-2 text-right" style={{ color: metrics[1].color }}>Tỷ lệ Add lớp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => <tr key={row.day} className={`border-b ${dark ? "border-white/10 even:bg-white/5" : "border-slate-100 even:bg-slate-50"}`}>
                        <th scope="row" className="px-2 py-2 text-left font-medium"><time dateTime={row.day}>{displayDate(row.day)}</time></th>
                        {metrics.map((item) => (
                          <td key={item.key} className="px-2 py-2 text-right font-semibold tabular-nums"
                            style={{ color: row[item.key] ? item.color : zeroTone[theme] }}>{number.format(row[item.key])}</td>
                        ))}
                        <td className="px-2 py-2 text-right tabular-nums">
                          <span className={`inline-block min-w-14 rounded-md px-1.5 py-0.5 text-center font-semibold ${row.added ? dark ? "bg-emerald-400/10" : "bg-emerald-50" : ""}`}
                            style={{ color: row.added ? metrics[1].color : zeroTone[theme] }}>
                            {percentage.format(rate(row.added, row.requests))}
                          </span>
                        </td>
                      </tr>)}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
        </div>
        <MonthlyClassSchedule yearNow={Number(today.slice(0, 4))} onSessionExpired={onSessionExpired}
          panel={panel} control={control} muted={muted} errorText={errorText} dark={dark} />
      </div>
    </div>
  );
}

function MonthlyClassSchedule({ yearNow, onSessionExpired, panel, control, muted, errorText, dark }: {
  yearNow: number;
  onSessionExpired: () => void;
  panel: string;
  control: string;
  muted: string;
  errorText: string;
  dark: boolean;
}) {
  const [year, setYear] = useState(yearNow);
  const [result, setResult] = useState<{ year: number; data?: DailyStats[]; error?: string }>();

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`/api/class-schedule/stats?year=${year}`, { signal: controller.signal });
        if (controller.signal.aborted) return;
        if (response.status === 401) {
          onSessionExpired();
          return;
        }
        const body = await response.json();
        if (!response.ok || !Array.isArray(body.data)) throw new Error(body.error || "Chưa tải được thống kê theo tháng.");
        if (!controller.signal.aborted) setResult({ year, data: body.data });
      } catch (problem) {
        if (!controller.signal.aborted) setResult({
          year, error: problem instanceof Error ? problem.message : "Chưa tải được thống kê theo tháng.",
        });
      }
    }
    void load();
    return () => controller.abort();
  }, [year, onSessionExpired]);

  const loaded = result?.year === year ? result : undefined;
  const heading = dark ? "bg-[#202b40]" : "bg-slate-100";
  const rowStyle = dark ? "border-white/10 even:bg-white/5" : "border-slate-100 even:bg-slate-50";
  const theme = dark ? "dark" : "light";

  return (
    <section aria-labelledby="monthly-table" className={`${panel} mt-4`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 id="monthly-table" className="font-bold">Tổng hợp theo tháng</h2>
        <label className={`flex items-center gap-2 text-xs font-semibold ${muted}`}>
          Năm
          <select className={control} value={year} onChange={(event) => setYear(Number(event.target.value))}>
            {Array.from({ length: yearNow - 2026 + 1 }, (_, i) => yearNow - i).map((option) =>
              <option key={option} value={option}>{option}</option>
            )}
          </select>
        </label>
      </div>
      {!loaded ? <p className={`text-sm ${muted}`} role="status">Đang tải theo tháng…</p> :
        loaded.error ? <p className={`text-sm ${errorText}`} role="alert">{loaded.error}</p> : (
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap text-xs">
              <thead className={heading}>
                <tr>
                  <th scope="col" className="px-2 py-2 text-left">Tháng</th>
                  {series.map((item) => <th key={item.key} scope="col" className="px-2 py-2 text-right" style={{ color: item[theme] }}>{item.label}</th>)}
                  <th scope="col" className="px-2 py-2 text-right" style={{ color: pendingTone[theme] }}>Chờ xử lý</th>
                </tr>
              </thead>
              <tbody>
                {loaded.data?.map((row) => <tr key={row.day} className={`border-b ${rowStyle}`}>
                  <th scope="row" className="px-2 py-2 text-left font-medium">{row.day.slice(5, 7)}/{row.day.slice(0, 4)}</th>
                  {series.map((item) => <td key={item.key} className="px-2 py-2 text-right font-semibold tabular-nums"
                    style={{ color: row[item.key] ? item[theme] : zeroTone[theme] }}>{number.format(row[item.key])}</td>)}
                  <td className="px-2 py-2 text-right font-semibold tabular-nums"
                    style={{ color: row.requests > row.added + row.cancelled ? pendingTone[theme] : zeroTone[theme] }}>
                    {number.format(row.requests - row.added - row.cancelled)}
                  </td>
                </tr>)}
              </tbody>
            </table>
          </div>
        )}
    </section>
  );
}
