"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import ConfirmDialog from "./ConfirmDialog";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://sehvatktrqtgsnmvebmm.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlaHZhdGt0cnF0Z3NubXZlYm1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5MzE5NzEsImV4cCI6MjEwNjUwNzk3MX0.hmQpRDUxsfP_LSWVE96nFEH85Qqw-z9LG3AQU1VXe0E",
);

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

interface StudentAddRequestsPageProps {
  theme: "light" | "dark";
  onCountsChanged: () => Promise<void>;
}

function formatTimestamp(timestamp: number | string) {
  const date = new Date(
    typeof timestamp === "number" || /^\d+$/.test(timestamp)
      ? Number(timestamp)
      : timestamp,
  );
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(date);
}

export default function StudentAddRequestsPage({
  theme,
  onCountsChanged,
}: StudentAddRequestsPageProps) {
  const [requests, setRequests] = useState<StudentAddRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Chờ xử lý");
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

    if (!response.ok || !result.success || !Array.isArray(result.data)) {
      throw new Error(result.error || "Không thể tải danh sách Add lớp.");
    }

    return result.data as StudentAddRequest[];
  }, []);

  const loadRequests = useCallback(async () => {
    try {
      setRequests(await fetchRequests());
      setErrorMessage("");
    } catch (error) {
      console.error("Lỗi tải danh sách HS Add lớp:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Không thể tải danh sách HS Add lớp.",
      );
    } finally {
      setLoading(false);
    }
  }, [fetchRequests]);

  useEffect(() => {
    let cancelled = false;

    fetchRequests()
      .then((data) => {
        if (!cancelled) {
          setRequests(data);
          setErrorMessage("");
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          console.error("Lỗi tải danh sách HS Add lớp:", error);
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Không thể tải danh sách HS Add lớp.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [fetchRequests]);

  useEffect(() => {
    const applyStatus = (
      id: number | string,
      action: RequestAction,
    ) => {
      setRequests((current) =>
        current.map((request) =>
          String(request.id) === String(id)
            ? {
                ...request,
                is_done: action === "done",
                is_cancelled: action === "cancel",
              }
            : request,
        ),
      );
    };

    const channel = supabase
      .channel("qll-room")
      .on("broadcast", { event: "student_add_status" }, (payload) => {
        const id = payload.payload?.id;
        const action = payload.payload?.action;
        if (id && (action === "done" || action === "cancel")) {
          applyStatus(id, action);
        }
      })
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "class_schedule_requests",
        },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            const updated = payload.new as Partial<StudentAddRequest>;
            if (
              updated.id !== undefined &&
              (typeof updated.is_done === "boolean" ||
                typeof updated.is_cancelled === "boolean")
            ) {
              setRequests((current) =>
                current.map((request) =>
                  String(request.id) === String(updated.id)
                    ? { ...request, ...updated }
                    : request,
                ),
              );
            }
          } else if (payload.eventType === "INSERT") {
            const inserted = payload.new as StudentAddRequest;
            setRequests((current) =>
              current.some(
                (request) => String(request.id) === String(inserted.id),
              )
                ? current
                : [inserted, ...current],
            );
          } else if (payload.eventType === "DELETE") {
            const deleted = payload.old as Partial<StudentAddRequest>;
            if (deleted.id !== undefined) {
              setRequests((current) =>
                current.filter(
                  (request) => String(request.id) !== String(deleted.id),
                ),
              );
            }
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const pendingCount = useMemo(
    () => requests.filter((request) => !request.is_done && !request.is_cancelled).length,
    [requests],
  );

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();

    return requests.filter((request) => {
      if (
        statusFilter === "Chờ xử lý" &&
        (request.is_done || request.is_cancelled)
      ) {
        return false;
      }
      if (statusFilter === "Đã xếp" && !request.is_done) return false;
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

  const updateRequestStatus = async () => {
    if (!confirmTarget) return;

    const id = String(confirmTarget.request.id);
    const action = confirmTarget.action;
    setUpdatingId(id);
    setRequests((current) =>
      current.map((request) =>
        String(request.id) === id
          ? {
              ...request,
              is_done: action === "done",
              is_cancelled: action === "cancel",
            }
          : request,
      ),
    );
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

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Không thể cập nhật trạng thái.");
      }

      setConfirmTarget(null);
      await supabase.channel("qll-room").send({
        type: "broadcast",
        event: "student_add_status",
        payload: { id, action },
      });
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
    <div className="flex-1 px-8 pt-5 pb-6 min-h-0 flex flex-col gap-4 animate-fade-slide-up">
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div>
          <h1
            className={`text-xl font-extrabold flex items-center gap-3 ${heading}`}
          >
            <span className="w-1.5 h-6 bg-orange-500 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
            <span>📋 Danh sách HS add lớp</span>
          </h1>
          <p className={`text-sm mt-1 ${muted}`}>
            Theo dõi các yêu cầu QLL đã gửi để vận hành xếp lớp.
          </p>
        </div>
        <span
          className={`font-extrabold px-3.5 py-2.5 rounded-xl border shadow-sm text-xs ${
            theme === "dark"
              ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
              : "bg-orange-50 text-orange-600 border-orange-200"
          }`}
        >
          Đang chờ: {pendingCount}
        </span>
      </div>

      <section
        className={`rounded-3xl border flex flex-col min-h-0 flex-1 overflow-hidden ${panel}`}
      >
        <div
          className={`px-5 py-4 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 ${
            theme === "dark" ? "border-white/5" : "border-slate-100"
          }`}
        >
          <div className="flex flex-wrap items-center gap-2">
            <div
              className={`p-1 border rounded-2xl flex items-center gap-1 transition-colors duration-0 ${
                theme === "dark"
                  ? "bg-[#0a0f1c] border-white/10"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              {[
                { label: "Tất cả", icon: "📌" },
                { label: "Chờ xử lý", icon: "⏳" },
                { label: "Đã xếp", icon: "✅" },
                { label: "Đã hủy", icon: "❌" },
              ].map(({ label, icon }) => {
                const filter = label as StatusFilter;
                const isSelected = statusFilter === filter;

                return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setStatusFilter(filter)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-1.5 focus:outline-none active:scale-95 ${
                    isSelected
                      ? "bg-orange-500 text-white shadow-[0_4px_12px_rgba(249,115,22,0.35)] scale-105"
                      : theme === "dark"
                        ? "text-slate-400 hover:text-white hover:bg-white/5"
                        : "text-slate-600 hover:text-orange-600 hover:bg-white shadow-xs"
                  }`}
                >
                  <span className="text-[11px]">{icon}</span>
                  <span>{label}</span>
                </button>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm mã lớp, SID/CID, QLL..."
              className={`w-64 max-w-full px-3.5 py-2 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-orange-500/30 ${
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
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border ${
                theme === "dark"
                  ? "border-white/10 text-slate-300 hover:bg-white/5"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              Làm mới
            </button>
          </div>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="mx-5 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
          >
            {errorMessage}
          </div>
        )}

        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full min-w-[1050px] text-sm text-left whitespace-nowrap">
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
                  <td colSpan={9} className={`px-5 py-16 text-center ${muted}`}>
                    Đang tải danh sách...
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={9} className={`px-5 py-16 text-center ${muted}`}>
                    Không có yêu cầu phù hợp.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((request) => {
                  const isPending =
                    !request.is_done && !request.is_cancelled;

                  return (
                    <tr
                      key={request.id}
                      className={`transition-colors ${
                        request.is_cancelled
                          ? theme === "dark"
                            ? "bg-slate-800/40 opacity-70"
                            : "bg-slate-100/60 opacity-75"
                          : request.is_done
                            ? theme === "dark"
                              ? "bg-emerald-900/20 opacity-80"
                              : "bg-emerald-50/40"
                            : theme === "dark"
                              ? "hover:bg-[#1e293b] even:bg-[#1a2235]/50"
                              : "hover:bg-orange-50/40 even:bg-slate-50/60"
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
                      <td className="px-5 py-4 text-right">
                        {isPending ? (
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              disabled={updatingId === String(request.id)}
                              onClick={() =>
                                setConfirmTarget({ request, action: "done" })
                              }
                              className="px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold disabled:opacity-50"
                            >
                              Đã xếp (Done)
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
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-bold text-xs border ${
                              request.is_done
                                ? theme === "dark"
                                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : theme === "dark"
                                  ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                                  : "bg-rose-50 text-rose-600 border-rose-200"
                            }`}
                          >
                            {request.is_done ? "✅ Đã xếp (Done)" : "❌ Đã hủy"}
                          </span>
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
