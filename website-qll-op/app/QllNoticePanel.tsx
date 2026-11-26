"use client";

import { useCallback, useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { QLL_NOTICE_EVENT, QLL_NOTICE_MAX_BYTES, type QllNotice } from "./qllNotices";

const API = "/api/qll-notices";
const TELEGRAM_REMINDER = "Bạn để lại đúng tên Telegram giúp VH nhé.";
const button = "ops-action rounded-xl border border-slate-400/40 px-3 py-1.5 text-sm font-semibold disabled:opacity-50";
const primary = "rounded-xl bg-sky-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50";
const field = "w-full rounded-xl border border-slate-400/40 bg-transparent p-3 text-sm";

class NoticeRequestError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

async function request<T>(suffix: string, init?: RequestInit): Promise<T> {
  const response = await fetch(API + suffix, { cache: "no-store", ...init });
  const result = await response.json() as T & { error?: string };
  if (!response.ok) throw new NoticeRequestError(result.error || "Bạn thử lại nhé.", response.status);
  return result;
}

function post<T>(body: object, signal?: AbortSignal) {
  return request<T>("", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
}

function message(error: unknown) {
  return error instanceof NoticeRequestError ? error.message : "Không kết nối được. Bạn thử lại nhé.";
}

function NoticeDialog({ open, title, theme, onClose, children }: {
  open: boolean;
  title: string;
  theme: "dark" | "light";
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const headingId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog?.open) dialog?.showModal();
    if (!open && dialog?.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby={headingId}
      className={`m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-2xl border border-slate-400/30 p-5 shadow-2xl backdrop:bg-slate-950/60 ${theme === "dark" ? "bg-[#151b2b] text-slate-100" : "bg-white text-slate-900"}`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <h2 id={headingId} className="break-all text-lg font-bold">{title}</h2>
        <button type="button" className={button} onClick={onClose}>Đóng</button>
      </div>
      {children}
    </dialog>
  );
}

export function QllNoticeComposer({ recipient, theme, onClose }: {
  recipient: string;
  theme: "dark" | "light";
  onClose: () => void;
}) {
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [failure, setFailure] = useState("");
  const delivery = useRef<string | null>(null);
  const byteCount = new TextEncoder().encode(body.trim()).length;

  const editBody = (value: string) => {
    delivery.current = null;
    setBody(value);
  };

  const send = async (event: FormEvent) => {
    event.preventDefault();
    if (pending || !byteCount || byteCount > QLL_NOTICE_MAX_BYTES) return;
    setPending(true);
    setFailure("");
    setFeedback("");
    try {
      delivery.current ??= crypto.randomUUID();
      await post({ action: "send", namecode: recipient, body, delivery: delivery.current });
      editBody("");
      setFeedback("Đã gửi thông báo.");
    } catch (error) {
      setFailure(message(error));
    } finally {
      setPending(false);
    }
  };

  return (
    <NoticeDialog open title={`Gửi thông báo cho ${recipient}`} theme={theme} onClose={onClose}>
      <form onSubmit={send} className="space-y-3">
        <button type="button" className={button} disabled={pending} onClick={() => editBody(TELEGRAM_REMINDER)}>Mẫu nhắc cập nhật Telegram</button>
        <label className="block text-sm font-semibold">
          Nội dung thông báo
          <textarea className={`mt-1 min-h-28 ${field}`} value={body} maxLength={QLL_NOTICE_MAX_BYTES}
            disabled={pending} onChange={(event) => editBody(event.target.value)} />
        </label>
        <div className="flex items-center justify-between gap-3">
          <span className={`text-xs ${byteCount > QLL_NOTICE_MAX_BYTES ? "text-rose-500" : "opacity-75"}`}>{byteCount}/{QLL_NOTICE_MAX_BYTES} byte</span>
          <button type="submit" className={primary} disabled={pending || !byteCount || byteCount > QLL_NOTICE_MAX_BYTES}>Gửi thông báo</button>
        </div>
      </form>
      {failure && <p role="alert" className="mt-3 text-sm text-rose-500">{failure}</p>}
      {feedback && <p role="status" className="mt-3 text-sm text-emerald-600 dark:text-emerald-400">{feedback}</p>}
    </NoticeDialog>
  );
}

interface InboxStatus { topic: string; unread: number; latest: QllNotice | null }
interface NoticePage { notices: QllNotice[]; hasMore: boolean }

export function QllNoticeInbox({ namecode, theme, realtime }: {
  namecode: string;
  theme: "dark" | "light";
  realtime: SupabaseClient;
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<InboxStatus>();
  const [revision, setRevision] = useState(0);
  const [notices, setNotices] = useState<QllNotice[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState("");
  const [dismissedThrough, setDismissedThrough] = useState(0);
  const [acknowledging, setAcknowledging] = useState(false);
  const [popupFailure, setPopupFailure] = useState("");
  const popupTitleId = useId();
  const statusRef = useRef<InboxStatus | undefined>(undefined);
  const statusVersion = useRef(0);
  const query = `?namecode=${encodeURIComponent(namecode)}`;
  const topic = status?.topic;

  const setInboxStatus = useCallback((next: InboxStatus) => {
    statusRef.current = next;
    setStatus(next);
  }, []);

  const refreshStatus = useCallback(async (signal?: AbortSignal) => {
    const version = ++statusVersion.current;
    const subscribe = () => post<InboxStatus>({ action: "subscribe", namecode }, signal);
    try {
      const next = statusRef.current
        ? await request<InboxStatus>(query + "&view=status", { signal }).catch((error: unknown) => {
          if (error instanceof NoticeRequestError && error.status === 401) return subscribe();
          throw error;
        })
        : await subscribe();
      if (!signal?.aborted && version === statusVersion.current) {
        setInboxStatus(next);
        setFailure("");
      }
    } catch (error) {
      if (!signal?.aborted && version === statusVersion.current) setFailure(message(error));
    }
  }, [namecode, query, setInboxStatus]);

  useEffect(() => {
    const controller = new AbortController();
    void refreshStatus(controller.signal);
    const visible = () => {
      if (document.visibilityState === "visible") {
        setRevision((value) => value + 1);
        void refreshStatus(controller.signal);
      }
    };
    document.addEventListener("visibilitychange", visible);
    return () => {
      controller.abort();
      document.removeEventListener("visibilitychange", visible);
    };
  }, [refreshStatus]);

  useEffect(() => {
    if (!topic) return;
    const controller = new AbortController();
    let timer: number | undefined;
    const channel = realtime.channel(topic)
      .on("broadcast", { event: QLL_NOTICE_EVENT }, () => {
        if (timer !== undefined || document.visibilityState !== "visible") return;
        timer = window.setTimeout(() => {
          timer = undefined;
          setRevision((value) => value + 1);
          void refreshStatus(controller.signal);
        }, 300);
      })
      .subscribe();
    return () => {
      controller.abort();
      window.clearTimeout(timer);
      void realtime.removeChannel(channel);
    };
  }, [realtime, refreshStatus, topic]);

  const markRead = useCallback(async (page: QllNotice[]) => {
    const ids = page.filter((notice) => !notice.read_at).map((notice) => notice.id);
    if (!ids.length) return;
    const { updated } = await post<{ updated: number }>({ action: "read", namecode, ids });
    statusVersion.current += 1;
    const current = statusRef.current;
    if (!current) return;
    const unread = Math.max(0, current.unread - updated);
    const latest = current.latest && !ids.includes(current.latest.id) ? current.latest : null;
    setInboxStatus({ ...current, unread, latest });
    if (unread > 0 && !latest) await refreshStatus();
  }, [namecode, refreshStatus, setInboxStatus]);

  useEffect(() => {
    if (!open || !topic) return;
    const controller = new AbortController();
    void request<NoticePage>(query, { signal: controller.signal }).then(async (page) => {
      if (controller.signal.aborted) return;
      setNotices(page.notices);
      setHasMore(page.hasMore);
      await markRead(page.notices);
    }).catch((error) => {
      if (!controller.signal.aborted) setFailure(message(error));
    });
    return () => controller.abort();
  }, [open, topic, revision, query, markRead]);

  const loadOlder = async () => {
    const cursor = notices.at(-1)?.id;
    if (!cursor || pending) return;
    setPending(true);
    setFailure("");
    try {
      const page = await request<NoticePage>(`${query}&before=${cursor}`);
      setNotices((current) => [...current, ...page.notices]);
      setHasMore(page.hasMore);
      await markRead(page.notices);
    } catch (error) {
      setFailure(message(error));
    } finally {
      setPending(false);
    }
  };

  const openInbox = () => {
    setOpen(true);
    if (status === undefined) void refreshStatus();
  };

  const unread = status?.unread ?? 0;
  const latest = status?.latest;
  const popupNotice = !open && latest && latest.id > dismissedThrough ? latest : null;

  const acknowledge = async (notice: QllNotice) => {
    setAcknowledging(true);
    setPopupFailure("");
    try {
      await markRead([notice]);
    } catch (error) {
      setPopupFailure(message(error));
    } finally {
      setAcknowledging(false);
    }
  };

  return (
    <>
      <div className="mx-3 mt-2 flex shrink-0 justify-end px-2 py-1 md:mx-5">
        <button type="button" className={`shrink-0 ${button}`} onClick={openInbox}>
          Thông báo{unread > 0 ? ` (${unread})` : ""}
        </button>
      </div>
      {popupNotice && (
        <aside
          aria-labelledby={popupTitleId}
          className={`fixed right-3 top-28 z-[65] w-[calc(100%-1.5rem)] max-w-md overflow-hidden rounded-2xl border border-sky-500/60 shadow-2xl shadow-sky-950/30 sm:right-6 ${theme === "dark" ? "bg-[#151b2b] text-slate-100" : "bg-white text-slate-900"}`}
        >
          <div aria-live="polite">
            <div className="flex items-center gap-3 bg-gradient-to-r from-blue-800 to-sky-700 px-4 py-3 text-white">
              <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/20">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-5">
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 12a2 2 0 0 0 4 0" />
                </svg>
              </span>
              <div className="min-w-0">
                <h2 id={popupTitleId} className="text-base font-bold">Thông báo mới từ Vận hành</h2>
                <p className="mt-0.5 break-words text-xs text-sky-100">Gửi bởi {popupNotice.sender}</p>
              </div>
            </div>
            <p className={`mx-4 mt-4 max-h-[45dvh] overflow-y-auto whitespace-pre-wrap break-words rounded-r-xl border-l-4 border-sky-500 px-3 py-2.5 text-sm leading-relaxed ${theme === "dark" ? "bg-sky-950/60" : "bg-sky-50"}`}>{popupNotice.body}</p>
          </div>
          {popupFailure && <p role="alert" className="mx-4 mt-2 text-sm text-rose-500">{popupFailure}</p>}
          <div className="flex flex-wrap justify-end gap-2 p-4">
            <button type="button" className={button} disabled={acknowledging} onClick={() => {
              setDismissedThrough(popupNotice.id);
              setPopupFailure("");
            }}>Để sau</button>
            <button type="button" className={primary} disabled={acknowledging} onClick={() => void acknowledge(popupNotice)}>Đã đọc</button>
          </div>
        </aside>
      )}
      <NoticeDialog open={open} title="Thông báo từ Vận hành" theme={theme} onClose={() => setOpen(false)}>
        {status === undefined && (
          failure
            ? <button type="button" className={button} onClick={() => void refreshStatus()}>Thử lại</button>
            : <p role="status" className="text-sm">Đang kiểm tra hộp thông báo…</p>
        )}
        {status && (
          <>
            {notices.length === 0 && <p className="text-sm opacity-80">Chưa có thông báo.</p>}
            <ul className="space-y-2">
              {notices.map((notice) => (
                <li key={notice.id} className="rounded-xl border border-slate-400/30 p-3">
                  <p className="mb-1 text-xs opacity-80">
                    {notice.sender} · {new Date(notice.created_at).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}
                  </p>
                  <p className="whitespace-pre-wrap break-words text-sm">{notice.body}</p>
                </li>
              ))}
            </ul>
            {hasMore && <button type="button" className={`mt-3 ${button}`} disabled={pending} onClick={() => void loadOlder()}>Xem tin cũ hơn</button>}
          </>
        )}
        {failure && <p role="alert" className="mt-3 text-sm text-rose-500">{failure}</p>}
      </NoticeDialog>
    </>
  );
}
