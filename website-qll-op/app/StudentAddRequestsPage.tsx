"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ConfirmDialog from "./ConfirmDialog";
import { useClassScheduleRealtime } from "./useClassScheduleRealtime";

interface StudentAddRequest {
  id: number | string;
  ma_lop: string;
  mon_hoc: string;
  nguoi_tao: string;
  team: string;
  sid_cid: string;
  timestamp: number | string;
  is_done: boolean;
  is_cancelled: boolean;
  processed_by: string | null;
  processed_at: string | null;
}

type StatusFilter = "Tất cả" | "Chờ xử lý" | "Đã xếp" | "Đã hủy";
type RequestAction = "done" | "cancel";
const MAX_WAIT_MS = 2 * 60 * 60 * 1000;

interface StudentAddRequestsPageProps {
  theme: "light" | "dark";
  onCountsChanged: () => Promise<void>;
  onSessionExpired: () => void;
}

function parseTimestamp(timestamp: number | string) {
  return new Date(
    typeof timestamp === "number" || /^\d+$/.test(timestamp)
      ? Number(timestamp)
      : timestamp,
  );
}

function formatTimestamp(timestamp: number | string) {
  const date = parseTimestamp(timestamp);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(date);
}

function formatRemainingTime(milliseconds: number) {
  const seconds = Math.ceil(milliseconds / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor(seconds / 60) % 60;
  return [hours, minutes, seconds % 60]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
}

export default function StudentAddRequestsPage({
  theme,
  onCountsChanged,
  onSessionExpired,
}: StudentAddRequestsPageProps) {
  const [requests, setRequests] = useState<StudentAddRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const loadVersion = useRef(0);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [conflictMessage, setConflictMessage] = useState("");
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [syncFailed, setSyncFailed] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Chờ xử lý");
  const [now, setNow] = useState(() => Date.now());
  const [confirmTarget, setConfirmTarget] = useState<{
    request: StudentAddRequest;
    action: RequestAction;
  } | null>(null);

  const fetchRequests = useCallback(async () => {
    const response = await fetch(
      `/api/class-schedule?view=list&t=${Date.now()}`,
      { cache: "no-store" },
    );
    const result = await response.json();

    if (response.status === 401) {
      onSessionExpired();
    }

    if (!response.ok || !result.success || !Array.isArray(result.data)) {
      throw new Error(result.error || "Không thể tải danh sách Add lớp.");
    }

    return result.data as StudentAddRequest[];
  }, [onSessionExpired]);

  const loadRequests = useCallback(async () => {
    const version = ++loadVersion.current;
    try {
      const data = await fetchRequests();
      if (version !== loadVersion.current) return;
      setRequests(data);
      setLastSyncedAt(Date.now());
      setSyncFailed(false);
      setErrorMessage("");
    } catch (error) {
      if (version !== loadVersion.current) return;
      setSyncFailed(true);
      console.error("Lỗi tải danh sách HS Add lớp:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Không thể tải danh sách HS Add lớp.",
      );
    } finally {
      if (version === loadVersion.current) setLoading(false);
    }
  }, [fetchRequests]);

  const connection = useClassScheduleRealtime(loadRequests);
  const syncLabel = connection === "reconnecting"
    ? "Đang kết nối lại"
    : syncFailed
      ? "Chưa đồng bộ được"
      : connection === "connected" && lastSyncedAt !== null
        ? "Đã kết nối Realtime"
        : "Đang đồng bộ";

  const counts = useMemo(() => {
    const totals = { "Tất cả": requests.length, "Chờ xử lý": 0, "Đã xếp": 0, "Đã hủy": 0 };
    for (const request of requests) {
      if (request.is_cancelled) totals["Đã hủy"]++;
      else if (request.is_done) totals["Đã xếp"]++;
      else totals["Chờ xử lý"]++;
    }
    return totals;
  }, [requests]);

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();

    return requests.filter((request) => {
      if (
        statusFilter === "Chờ xử lý" &&
        (request.is_done || request.is_cancelled)
      ) {
        return false;
      }
      if (statusFilter === "Đã xếp" && (!request.is_done || request.is_cancelled)) return false;
      if (statusFilter === "Đã hủy" && !request.is_cancelled) return false;

      if (!query) return true;
      return [
        request.ma_lop,
        request.mon_hoc,
        request.nguoi_tao,
        request.team,
        request.sid_cid,
      ]
        .join(" ")
        .toLocaleLowerCase()
        .includes(query);
    });
  }, [requests, search, statusFilter]);

  const hasPendingRequests = counts["Chờ xử lý"] > 0;
  useEffect(() => {
    if (!hasPendingRequests) return;

    const tick = () => setNow(Date.now());
    const initialTick = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, 1000);
    return () => {
      window.clearTimeout(initialTick);
      window.clearInterval(timer);
    };
  }, [hasPendingRequests]);

  const updateRequestStatus = async () => {
    if (!confirmTarget || updatingId) return;

    const id = String(confirmTarget.request.id);
    const action = confirmTarget.action;
    setUpdatingId(id);
    setConflictMessage("");
    try {
      const response = await fetch("/api/class-schedule", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          action,
        }),
      });
      const result = await response.json();

      if (response.status === 401) {
        onSessionExpired();
        return;
      }

      if (response.status === 409) {
        setConfirmTarget(null);
        setConflictMessage(result.error || "Đơn này đã được xử lý.");
        await loadRequests();
        await onCountsChanged();
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Không thể cập nhật trạng thái.");
      }

      setConfirmTarget(null);
      await loadRequests();
      await onCountsChanged();
    } catch (error) {
      console.error("Lỗi cập nhật yêu cầu Add lớp:", error);
      await loadRequests();
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Không thể cập nhật trạng thái yêu cầu.",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const panel =
    theme === "dark"
      ? "bg-[#151b2b] border-white/5"
      : "bg-white border-slate-100";
  const heading = theme === "dark" ? "text-white" : "text-slate-800";
  const muted = theme === "dark" ? "text-slate-400" : "text-slate-500";

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 px-3 pb-3 pt-3 sm:px-4 xl:px-6 2xl:px-8 animate-fade-slide-up">
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div>
          <h1
            className={`text-xl font-extrabold flex items-center gap-3 ${heading}`}
          >
            <span className="w-1.5 h-6 bg-orange-500 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
            <span>📋 Danh sách HS add lớp</span>
          </h1>
          <div className={`mt-1 flex flex-wrap gap-x-3 text-xs ${muted}`}>
            <span role="status">{syncLabel}</span>
            {lastSyncedAt !== null && (
              <span>Cập nhật gần nhất {formatTimestamp(lastSyncedAt)}</span>
            )}
          </div>
        </div>
      </div>

      <section
        className={`rounded-3xl border flex flex-col min-h-0 flex-1 overflow-hidden ${panel}`}
      >
        <div
          className={`px-3 py-2 border-b flex flex-wrap items-center justify-between gap-2 shrink-0 ${
            theme === "dark" ? "border-white/5" : "border-slate-100"
          }`}
        >
          <div role="group" aria-label="Lọc yêu cầu theo trạng thái" className="flex flex-wrap gap-1.5">
            {(["Tất cả", "Chờ xử lý", "Đã xếp", "Đã hủy"] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                aria-pressed={statusFilter === filter}
                onClick={() => setStatusFilter(filter)}
                className={`inline-flex min-h-9 items-center gap-2 whitespace-nowrap rounded-lg border px-2.5 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 ${
                  statusFilter === filter
                    ? theme === "dark"
                      ? "border-orange-500/50 bg-orange-500/15 text-orange-200"
                      : "border-orange-300 bg-orange-50 text-orange-800"
                    : theme === "dark"
                      ? "border-white/10 text-slate-300 hover:bg-white/5"
                      : "border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span>{filter}</span>
                <span className="text-sm font-extrabold tabular-nums">
                  {lastSyncedAt === null ? "–" : counts[filter]}
                </span>
              </button>
            ))}
          </div>
          <div className="flex min-w-0 max-w-full items-center gap-2">
            <input
              type="search"
              aria-label="Tìm mã lớp, SID/CID hoặc QLL"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm mã lớp, SID/CID, QLL..."
              className={`w-52 min-w-0 px-3 py-2 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-orange-500/30 xl:w-64 ${
                theme === "dark"
                  ? "bg-[#0a0f1c] border-white/10 text-white placeholder:text-slate-500"
                  : "bg-white border-slate-200 text-slate-700 placeholder:text-slate-400"
              }`}
            />
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                void loadRequests();
              }}
              className={`shrink-0 px-3 py-2 rounded-xl text-xs font-bold border ${
                theme === "dark"
                  ? "border-white/10 text-slate-300 hover:bg-white/5"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              Làm mới
            </button>
          </div>
        </div>

        {conflictMessage && (
          <div role="status" className={`mx-5 mt-4 rounded-xl border px-4 py-3 text-sm font-semibold ${
            theme === "dark"
              ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
              : "border-amber-200 bg-amber-50 text-amber-800"
          }`}>
            {conflictMessage}
          </div>
        )}

        {errorMessage && (
          <div
            role="alert"
            className="mx-5 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
          >
            {errorMessage}
          </div>
        )}

        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full min-w-[820px] text-left text-sm [&_td]:px-2 [&_td]:py-2 [&_th]:px-2 [&_th]:py-2 2xl:[&_td]:px-4 2xl:[&_td]:py-3 2xl:[&_th]:px-4">
            <thead
              className={`sticky top-0 z-10 border-b text-[11px] uppercase tracking-wider ${
                theme === "dark"
                  ? "bg-[#1a2235] border-white/5 text-slate-400"
                  : "bg-slate-50 border-slate-100 text-slate-500"
              }`}
            >
              <tr>
                <th className="px-5 py-4">Thời gian</th>
                <th className="px-5 py-4">Mã lớp</th>
                <th className="px-5 py-4">Môn học</th>
                <th className="px-5 py-4">SID/CID</th>
                <th className="px-5 py-4">QLL</th>
                <th className="px-5 py-4">Team</th>
                <th className="px-5 py-4">Người xử lý / thời gian</th>
                <th className="px-5 py-4">Trạng thái</th>
                <th className="px-5 py-4">Thời gian còn chờ</th>
                <th className="px-5 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody
              className={`divide-y ${
                theme === "dark" ? "divide-white/5" : "divide-slate-50"
              }`}
            >
              {loading ? (
                <tr>
                  <td colSpan={10} className={`px-5 py-16 text-center ${muted}`}>
                    Đang tải danh sách...
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={10} className={`px-5 py-16 text-center ${muted}`}>
                    Không có yêu cầu phù hợp.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((request) => {
                  const isPending =
                    !request.is_done && !request.is_cancelled;
                  const deadline = parseTimestamp(request.timestamp).getTime() + MAX_WAIT_MS;
                  const remainingMs = deadline - now;

                  return (
                    <tr
                      key={request.id}
                      className={`transition-colors ${
                        theme === "dark"
                          ? "hover:bg-[#1e293b] even:bg-[#1a2235]/50"
                          : "hover:bg-sky-50/50 even:bg-slate-50/60"
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
                      <td className={`px-5 py-4 font-bold ${heading}`}>
                        {request.nguoi_tao || "-"}
                      </td>
                      <td className={`px-5 py-4 ${muted}`}>
                        {request.team || "-"}
                      </td>
                      <td className="px-5 py-4">
                        {request.processed_by || request.processed_at ? (
                          <div className="flex flex-col gap-1">
                            <span className={`text-xs font-bold ${heading}`}>
                              {request.processed_by || "-"}
                            </span>
                            <span className={`text-[11px] ${muted}`}>
                              {request.processed_at
                                ? formatTimestamp(request.processed_at)
                                : "-"}
                            </span>
                          </div>
                        ) : (
                          <span className={`text-xs ${muted}`}>-</span>
                        )}
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
                            ❌ Đã hủy
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
                            ⏳ Chờ xử lý
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs">
                        {!isPending || !Number.isFinite(remainingMs) ? (
                          <span className={muted}>-</span>
                        ) : remainingMs <= 0 ? (
                          <span
                            className={`inline-flex rounded-md border px-2.5 py-1 font-bold ${
                              theme === "dark"
                                ? "border-rose-500/30 bg-rose-500/20 text-rose-300"
                                : "border-rose-200 bg-rose-50 text-rose-700"
                            }`}
                          >
                            Quá hạn 2 giờ
                          </span>
                        ) : (
                          <span className={`font-semibold tabular-nums ${heading}`}>
                            {formatRemainingTime(Math.min(remainingMs, MAX_WAIT_MS))}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {isPending ? (
                          <div className="inline-flex items-center gap-1 whitespace-nowrap">
                            <button
                              type="button"
                              disabled={updatingId === String(request.id)}
                              onClick={() =>
                                setConfirmTarget({ request, action: "done" })
                              }
                              className="px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold disabled:opacity-50"
                            >
                              Đã xếp
                            </button>
                            <button
                              type="button"
                              disabled={updatingId === String(request.id)}
                              onClick={() =>
                                setConfirmTarget({ request, action: "cancel" })
                              }
                              className="px-3 py-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold disabled:opacity-50"
                            >
                              Hủy
                            </button>
                          </div>
                        ) : (
                          <span className={muted}>–</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <ConfirmDialog
        open={!!confirmTarget}
        theme={theme}
        title={
          confirmTarget?.action === "done"
            ? "Xác nhận đã xếp lớp"
            : "Xác nhận hủy yêu cầu"
        }
        message={
          confirmTarget
            ? `Xác nhận ${
                confirmTarget.action === "done" ? "đã xếp" : "hủy"
              } yêu cầu lớp ${confirmTarget.request.ma_lop}, SID/CID ${confirmTarget.request.sid_cid}?`
            : ""
        }
        confirmText={updatingId ? "Đang cập nhật..." : "Xác nhận"}
        onConfirm={() => void updateRequestStatus()}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}
