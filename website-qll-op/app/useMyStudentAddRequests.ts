"use client";

import { useCallback, useRef, useState } from "react";
import { useClassScheduleRealtime } from "./useClassScheduleRealtime";

interface StudentAddRequest {
  id: number | string;
  ma_lop: string;
  mon_hoc: string;
  sid_cid: string;
  timestamp: number | string;
  is_done: boolean;
  is_cancelled: boolean;
  cancel_reason: string | null;
}

export function formatTimestamp(timestamp: number | string) {
  const date = new Date(Number(timestamp));
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(date);
}

export function useMyStudentAddRequests(displayName: string, limit?: number) {
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
    if (limit) params.set("limit", String(limit));
    const response = await fetch(`/api/class-schedule?${params}`, {
      cache: "no-store",
    });
    const result = await response.json();

    if (!response.ok || !result.success || !Array.isArray(result.data)) {
      throw new Error(result.error || "Không thể tải danh sách Add lớp.");
    }

    return result.data as StudentAddRequest[];
  }, [displayName, limit]);

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

  useClassScheduleRealtime(loadRequests, { poll: limit === undefined });

  return { requests, loading, refreshing, setRefreshing, errorMessage, loadRequests };
}
