"use client";

import React, { useEffect } from "react";

// ==========================================
// TỐI ƯU: ĐẾM TỪNG GIÂY (BYPASS REACT DOM)
// Đảm bảo chuẩn 24h, nhảy từng giây nhưng không tốn CPU Render
// ==========================================
// warnThresholdMs: khi thời gian còn lại <= ngưỡng này thì chuyển cảnh báo (đỏ).
// Mặc định 2 giờ.
const CountdownTimer = React.memo(
  ({
    timeString,
    warnThresholdMs = 2 * 60 * 60 * 1000,
  }: {
    timeString: string;
    warnThresholdMs?: number;
  }) => {
    const timerRef = React.useRef<HTMLSpanElement>(null);

    // ra khỏi Component này để tránh bị gọi lặp lại hàng chục lần khi render bảng.

    useEffect(() => {
      let targetTime = 0;
      try {
        const parts = timeString.split(" ");
        if (parts.length >= 2) {
          const dateParts = parts[0].split("/");
          const timeParts = parts[1].split(":");
          const logDate = new Date(
            parseInt(dateParts[2]),
            parseInt(dateParts[1]) - 1,
            parseInt(dateParts[0]),
            parseInt(timeParts[0]),
            parseInt(timeParts[1]),
            parseInt(timeParts[2] || "0"),
          );
          targetTime = logDate.getTime() + 24 * 60 * 60 * 1000;
        }
      } catch {
        if (timerRef.current) timerRef.current.innerText = "Lỗi dữ liệu";
        return;
      }

      if (!targetTime) return;

      const applyWarnStyle = (warn: boolean) => {
        if (!timerRef.current) return;
        if (warn) {
          timerRef.current.style.color = "#dc2626"; // đỏ
          timerRef.current.style.fontWeight = "800";
        } else {
          // Trả về mặc định (kế thừa màu từ class container).
          timerRef.current.style.color = "";
          timerRef.current.style.fontWeight = "";
        }
      };

      const updateTimer = () => {
        if (!timerRef.current) return;

        const diff = targetTime - Date.now();
        if (diff <= 0) {
          applyWarnStyle(true);
          timerRef.current.innerText = "⏰ Quá hạn";
          return;
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        // Sắp hết hạn: đổi màu đỏ + icon cảnh báo.
        const isWarn = diff <= warnThresholdMs;
        applyWarnStyle(isWarn);
        const icon = isWarn ? "⚠️" : "⏳";
        timerRef.current.innerText = `${icon} ${hours}h ${minutes}m ${seconds}s`;
      };

      updateTimer();
      const timer = setInterval(updateTimer, 1000);

      return () => clearInterval(timer);
    }, [timeString, warnThresholdMs]);

    return <span ref={timerRef}>Đang tính...</span>;
  },
);

CountdownTimer.displayName = "CountdownTimer";

export default CountdownTimer;
