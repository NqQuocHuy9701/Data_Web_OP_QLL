"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import { useClassScheduleRealtime } from "./useClassScheduleRealtime";

interface StudentAddRequest {
  id: number | string;
  ma_lop: string;
  mon_hoc: string;
  sid_cid: string;
  timestamp: number | string;
  is_done: boolean;
  is_cancelled: boolean;
}

interface StudentAddRequestsQLLPageProps {
  theme: "light" | "dark";
  displayName: string;
}

function formatTimestamp(timestamp: number | string) {
  const date = new Date(Number(timestamp));
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(date);
}

export default function StudentAddRequestsQLLPage({
  theme,
  displayName,
}: StudentAddRequestsQLLPageProps) {
  const [requests, setRequests] = useState<StudentAddRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const loadVersion = useRef(0);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchRequests = useCallback(async () => {
    const params = new URLSearchParams({
      view: "my-list",
      namecode: displayName,
    });
    const response = await fetch(`/api/class-schedule?${params}`, {
      cache: "no-store",
    });
    const result = await response.json();

    if (!response.ok || !result.success || !Array.isArray(result.data)) {
      throw new Error(result.error || "Không thể tải danh sách Add lớp.");
    }

    return result.data as StudentAddRequest[];
  }, [displayName]);

  const loadRequests = useCallback(async () => {
    const version = ++loadVersion.current;
    try {
      const data = await fetchRequests();
      if (version !== loadVersion.current) return;
      setRequests(data);
      setErrorMessage("");
    } catch (error) {
      if (version !== loadVersion.current) return;
      console.error("Lỗi tải danh sách Add lớp của QLL:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Không thể tải danh sách Add lớp.",
      );
    } finally {
      if (version === loadVersion.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [fetchRequests]);

  useClassScheduleRealtime(loadRequests);

  const pendingCount = useMemo(
    () =>
      requests.filter(
        (request) => !request.is_done && !request.is_cancelled,
      ).length,
    [requests],
  );

  const panel =
    theme === "dark"
      ? "bg-[#151b2b] border-white/5"
      : "bg-white border-slate-100";
  const heading = theme === "dark" ? "text-white" : "text-slate-800";
  const muted = theme === "dark" ? "text-slate-400" : "text-slate-500";

  return (
    <div className="flex-1 px-8 pt-5 pb-6 min-h-0 flex flex-col gap-4 animate-fade-slide-up">
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className={`text-xl font-extrabold ${heading}`}>
            Học sinh add lớp
          </h1>
          <p className={`text-sm mt-1 ${muted}`}>
            Theo dõi trạng thái các yêu cầu Add lớp bạn đã gửi.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3.5 py-2 rounded-xl border bg-amber-50 text-amber-700 border-amber-200 font-bold text-xs">
            Đang chờ: {pendingCount}
          </span>
          <button
            type="button"
            disabled={refreshing}
            onClick={() => {
              setRefreshing(true);
              void loadRequests();
            }}
            className={`ops-action px-3.5 py-2 rounded-full text-xs font-bold border disabled:opacity-50 ${
              theme === "dark"
                ? "border-white/10 text-slate-300 hover:bg-white/5"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {refreshing ? "Đang tải..." : "Làm mới"}
          </button>
        </div>
      </div>

      <section
        className={`rounded-3xl border flex flex-col min-h-0 flex-1 overflow-hidden ${panel}`}
      >
        {errorMessage && (
          <div
            role="alert"
            className="mx-5 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
          >
            {errorMessage}
          </div>
        )}

        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full min-w-[760px] text-sm text-left whitespace-nowrap">
            <thead
              className={`sticky top-0 z-10 border-b text-[11px] uppercase tracking-wider ${
                theme === "dark"
                  ? "bg-[#1a2235] border-white/5 text-slate-400"
                  : "bg-slate-50 border-slate-100 text-slate-500"
              }`}
            >
              <tr>
                <th className="px-5 py-4">Thời gian gửi</th>
                <th className="px-5 py-4">Mã lớp</th>
                <th className="px-5 py-4">Môn học</th>
                <th className="px-5 py-4">SID/CID</th>
                <th className="px-5 py-4">Trạng thái vận hành</th>
              </tr>
            </thead>
            <tbody
              className={`divide-y ${
                theme === "dark" ? "divide-white/5" : "divide-slate-50"
              }`}
            >
              {loading ? (
                <tr>
                  <td colSpan={5} className={`px-5 py-16 text-center ${muted}`}>
                    Đang tải danh sách...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={5} className={`px-5 py-16 text-center ${muted}`}>
                    Bạn chưa gửi yêu cầu Add lớp nào.
                  </td>
                </tr>
              ) : (
                requests.map((request) => (
                  <tr
                    key={request.id}
                    className={`transition-colors ${
                      theme === "dark"
                        ? "hover:bg-[#1e293b]"
                        : "hover:bg-sky-50/40"
                    }`}
                  >
                    <td className={`px-5 py-4 text-xs ${muted}`}>
                      {formatTimestamp(request.timestamp)}
                    </td>
                    <td className="px-5 py-4 font-bold text-sky-500">
                      {request.ma_lop || "-"}
                    </td>
                    <td className={`px-5 py-4 ${heading}`}>
                      {request.mon_hoc || "-"}
                    </td>
                    <td className="px-5 py-4 font-semibold text-orange-500">
                      {request.sid_cid || "-"}
                    </td>
                    <td className="px-5 py-4">
                      {request.is_cancelled ? (
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-bold text-xs border ${
                            theme === "dark"
                              ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                              : "bg-rose-50 text-rose-600 border-rose-200"
                          }`}
                        >
                          ⛔ Đã hủy
                        </span>
                      ) : request.is_done ? (
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-bold text-xs border ${
                            theme === "dark"
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}
                        >
                          ✅ Đã xếp
                        </span>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-bold text-xs border ${
                            theme === "dark"
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          ⏳ Đang chờ vận hành xử lý
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
