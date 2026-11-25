"use client";

import { useCallback, useRef, useState } from "react";
import { CLASS_SCHEDULE_CANCELLED_TOPIC } from "./classScheduleEvents";
import { useClassScheduleRealtime } from "./useClassScheduleRealtime";

interface Cancellation {
  id: number | string;
  ma_lop: string;
  sid_cid: string;
  cancel_reason: string;
}

export default function ClassScheduleCancellationNotice({
  displayName,
  onOpenList,
}: {
  displayName: string;
  onOpenList: () => void;
}) {
  const [startedAt] = useState(() => new Date().toISOString());
  const [notices, setNotices] = useState<Cancellation[]>([]);
  const seenIds = useRef(new Set<string>());

  const refresh = useCallback(async () => {
    const params = new URLSearchParams({
      view: "my-list",
      namecode: displayName,
      cancelledSince: startedAt,
    });
    try {
      const response = await fetch(`/api/class-schedule?${params}`, { cache: "no-store" });
      if (!response.ok) return;
      const result = await response.json();
      if (!result.success || !Array.isArray(result.data)) return;
      const fresh = (result.data as Cancellation[]).filter((request) => {
        const id = String(request.id);
        if (!request.cancel_reason || seenIds.current.has(id)) return false;
        seenIds.current.add(id);
        return true;
      });
      if (fresh.length) setNotices((current) => [...current, ...fresh]);
    } catch (error) {
      console.error("Không thể tải thông báo hủy Add lớp:", error);
    }
  }, [displayName, startedAt]);

  useClassScheduleRealtime(refresh, { poll: false, topic: CLASS_SCHEDULE_CANCELLED_TOPIC });

  const notice = notices[0];
  if (!notice) return null;

  const dismiss = () => setNotices((current) => current.slice(1));

  return (
    <aside className="fixed top-20 right-4 z-[60] w-[calc(100%_-_2rem)] max-w-sm rounded-2xl border border-rose-400/40 bg-[#171321] p-4 text-white shadow-xl sm:right-6">
      <div role="status">
        <p className="font-bold text-rose-300">VH đã hủy yêu cầu Add lớp</p>
        <p className="mt-1 text-sm wrap-anywhere">{notice.ma_lop} · SID/CID {notice.sid_cid}</p>
        <p className="mt-2 max-h-40 overflow-y-auto text-sm whitespace-pre-wrap wrap-anywhere">Lý do: {notice.cancel_reason}</p>
      </div>
      <div className="mt-3 flex justify-end gap-3 text-sm">
        <button type="button" className="ops-action px-2 py-1 text-slate-300" onClick={dismiss}>Đóng</button>
        <button type="button" className="ops-action px-2 py-1 font-semibold text-sky-300" onClick={() => {
          dismiss();
          onOpenList();
        }}>Xem danh sách</button>
      </div>
    </aside>
  );
}
