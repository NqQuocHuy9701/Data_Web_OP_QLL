"use client";

import { useEffect, useState } from "react";
import { CLASS_SCHEDULE_CHANGED, CLASS_SCHEDULE_TOPIC } from "./classScheduleEvents";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://sehvatktrqtgsnmvebmm.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlaHZhdGt0cnF0Z3NubXZlYm1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5MzE5NzEsImV4cCI6MjEwNjUwNzk3MX0.hmQpRDUxsfP_LSWVE96nFEH85Qqw-z9LG3AQU1VXe0E",
);

export function useClassScheduleRealtime(refresh: () => Promise<void>) {
  const [connection, setConnection] = useState<"connecting" | "connected" | "reconnecting">("connecting");

  useEffect(() => {
    let active = true;
    let running = false;
    let refreshQueued = false;
    let timer: number | undefined;

    const sync = async () => {
      if (!active || running) return;
      running = true;
      try {
        do {
          refreshQueued = false;
          await refresh();
        } while (active && refreshQueued);
      } finally {
        running = false;
      }
    };

    const queueRefresh = () => {
      if (!active) return;
      refreshQueued = true;
      if (!running && timer === undefined) {
        timer = window.setTimeout(() => {
          timer = undefined;
          void sync();
        }, 100);
      }
    };

    const channel = supabase
      .channel(CLASS_SCHEDULE_TOPIC)
      .on("broadcast", { event: CLASS_SCHEDULE_CHANGED }, queueRefresh)
      .subscribe((status) => {
        if (!active) return;
        if (status === "SUBSCRIBED") {
          setConnection("connected");
          queueRefresh();
        } else {
          setConnection("reconnecting");
        }
      });

    const refreshIfVisible = () => {
      if (document.visibilityState === "visible") queueRefresh();
    };
    queueRefresh();
    const fallback = window.setInterval(refreshIfVisible, 30_000);
    document.addEventListener("visibilitychange", refreshIfVisible);

    return () => {
      active = false;
      window.clearTimeout(timer);
      window.clearInterval(fallback);
      document.removeEventListener("visibilitychange", refreshIfVisible);
      void supabase.removeChannel(channel);
    };
  }, [refresh]);

  return connection;
}
