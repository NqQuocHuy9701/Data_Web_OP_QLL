"use client";

import React, { useMemo } from "react";
import styles from "./MyDashboard.module.css";
import CountdownTimer from "./CountdownTimer";
import BituGreeting from "./BituGreeting";
import { formatTimestamp, useMyStudentAddRequests } from "./useMyStudentAddRequests";

interface MyDashboardProps {
  slotHistoryData: any[];
  displayName: string;
  completedSlots: Record<string, boolean>;
  checkIsExpired: (timeString: string) => boolean;
  onRequestRecall: (row: any) => void;
  onGoKeepSlot: () => void;
  onGoStudentRequests: () => void;
  theme: "light" | "dark";
}

// Dựng chuỗi thời gian "dd/mm/yyyy hh:mm:ss" từ 1 bản ghi slot.
function buildTimeStr(row: any): string {
  if (row.timestamp) {
    const d = new Date(Number(row.timestamp));
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }
  return row["Thời gian"] || "";
}

// Mili-giây còn lại tới hạn 24h (âm nếu đã quá hạn).
function msLeft(timeStr: string): number {
  try {
    const parts = timeStr.split(" ");
    if (parts.length < 2) return 0;
    const dp = parts[0].split("/");
    const tp = parts[1].split(":");
    const logDate = new Date(
      parseInt(dp[2]),
      parseInt(dp[1]) - 1,
      parseInt(dp[0]),
      parseInt(tp[0]),
      parseInt(tp[1]),
      parseInt(tp[2] || "0"),
    );
    return logDate.getTime() + 24 * 60 * 60 * 1000 - Date.now();
  } catch {
    return 0;
  }
}

const TWO_HOURS = 2 * 60 * 60 * 1000;

export default function MyDashboard({
  slotHistoryData,
  displayName,
  completedSlots,
  checkIsExpired,
  onRequestRecall,
  onGoKeepSlot,
  onGoStudentRequests,
  theme,
}: MyDashboardProps) {
  // Chuẩn hóa slot của chính QLL + phân loại trạng thái.
  const mine = useMemo(() => {
    const rows = (slotHistoryData || []).filter(
      (item) => (item.nguoi_giu || item["Người giữ"]) === displayName,
    );

    return rows.map((row, index) => {
      const timeStr = buildTimeStr(row);
      const maLop = row.ma_lop || row["Mã lớp giữ"] || row["Mã lớp"] || "";
      const monHoc = row.mon_hoc || row["Môn học"] || "-";
      const note =
        row.note ||
        row["lưu ý ( mục note của QLL )"] ||
        row["lưu ý"] ||
        "-";
      const rowKey = `${timeStr}-${maLop}-${index}`;
      const isDone = completedSlots[rowKey] || row.is_done;
      const isExpired = checkIsExpired(timeStr);
      const isCancelled = row.is_cancelled === true;
      const active = !isDone && !isExpired && !isCancelled;
      const soon = active && msLeft(timeStr) <= TWO_HOURS;
      return {
        row,
        timeStr,
        maLop,
        monHoc,
        note,
        isDone,
        isExpired,
        isCancelled,
        active,
        soon,
      };
    });
  }, [slotHistoryData, displayName, completedSlots, checkIsExpired]);

  const activeList = mine.filter((m) => m.active);
  const soonList = mine.filter((m) => m.soon);
  const doneCount = mine.filter((m) => m.isDone).length;

  const metrics = [
    { label: "Đang giữ", count: activeList.length, tone: "amber", icon: "◷" },
    { label: "Sắp hết hạn", count: soonList.length, tone: "rose", icon: "!" },
    { label: "Đã xếp xong", count: doneCount, tone: "green", icon: "✓" },
  ];

  return (
    <div className={`flex-1 min-h-0 min-w-0 overflow-y-auto custom-scrollbar ${styles.dashboard}`} data-theme={theme}>
      <div className={styles.layout}>
        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <h1>Xin chào, <span>{displayName || "QLL"}</span></h1>
            <p>Theo dõi các slot bạn đang giữ và ưu tiên những lớp sắp hết hạn.</p>
          </div>
          <div className={styles.heroArt} aria-hidden="true">
            <BituGreeting />
          </div>
          <button type="button" onClick={onGoKeepSlot} className={`ops-action ${styles.primary}`}>
            <span aria-hidden="true">+</span> Giữ slot mới
          </button>
        </header>

        <dl className={styles.metrics} aria-label="Tổng quan slot của tôi">
          {metrics.map((metric) => (
            <div key={metric.label} className={styles.metric} data-tone={metric.tone}>
              <dt>{metric.label}</dt>
              <dd>{metric.count}</dd>
              <span className={styles.metricIcon} aria-hidden="true">{metric.icon}</span>
            </div>
          ))}
        </dl>

        <div className={styles.columns}>
          <section className={styles.panel} aria-labelledby="my-active-slots">
            <div className={styles.panelHeading}>
              <h2 id="my-active-slots">Slot đang giữ</h2>
              <span className={styles.badge}>{activeList.length} slot</span>
            </div>
            {activeList.length ? (
              <ul className={styles.list}>
                {activeList.map((slot, index) => (
                  <li key={slot.row.id ?? index} className={styles.row}>
                    <div className={styles.classInfo}>
                      <strong>{slot.maLop}</strong>
                      <p>{slot.monHoc}{slot.note !== "-" && ` · ${slot.note}`}</p>
                    </div>
                    <div className={styles.rowActions}>
                      <span className={styles.timer} data-soon={slot.soon}>
                        <CountdownTimer timeString={slot.timeStr} />
                      </span>
                      <button type="button" onClick={() => onRequestRecall(slot.row)} className="ops-action ops-action-soft ops-action-danger rounded-full px-3 py-1.5 text-xs font-bold">
                        Thu hồi
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className={styles.empty}>
                <span aria-hidden="true">◷</span>
                <strong>Bạn chưa giữ slot nào</strong>
                <p>Chọn Giữ slot mới để tìm lớp còn chỗ.</p>
              </div>
            )}
          </section>

          <section className={styles.panel} aria-labelledby="my-expiring-slots">
            <div className={styles.panelHeading}>
              <h2 id="my-expiring-slots">Sắp hết hạn</h2>
              <span className={`${styles.badge} ${styles.urgentBadge}`}>Dưới 2 giờ</span>
            </div>
            {soonList.length ? (
              <ul className={styles.list}>
                {soonList.map((slot, index) => (
                  <li key={slot.row.id ?? index} className={`${styles.row} ${styles.urgentRow}`}>
                    <div className={styles.classInfo}>
                      <strong>{slot.maLop}</strong>
                      <p>{slot.monHoc}{slot.note !== "-" && ` · ${slot.note}`}</p>
                    </div>
                    <button type="button" onClick={() => onRequestRecall(slot.row)} className="ops-action ops-action-soft ops-action-danger shrink-0 rounded-full px-3 py-1.5 text-xs font-bold">
                      Thu hồi
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className={`${styles.empty} ${styles.clear}`}>
                <span aria-hidden="true">✓</span>
                <strong>Không có slot sắp hết hạn</strong>
              </div>
            )}
          </section>
        </div>
        <RecentStudentRequests displayName={displayName} onOpenList={onGoStudentRequests} />
      </div>
    </div>
  );
}

function RecentStudentRequests({ displayName, onOpenList }: { displayName: string; onOpenList: () => void }) {
  const { requests, loading, errorMessage, loadRequests } = useMyStudentAddRequests(displayName, 5);

  return (
    <section className={styles.panel} aria-labelledby="my-recent-add-requests" aria-busy={loading}>
      <div className={styles.panelHeading}>
        <div>
          <h2 id="my-recent-add-requests">Yêu cầu thêm học sinh</h2>
          <p className={styles.panelSubtitle}>Các yêu cầu bạn gửi gần đây</p>
        </div>
        <button type="button" onClick={onOpenList} className={`ops-action ${styles.listLink}`}>
          Xem tất cả <span aria-hidden="true">→</span>
        </button>
      </div>
      {errorMessage && (
        <p className={styles.requestError} role="status">
          Không thể cập nhật yêu cầu. <button type="button" onClick={() => void loadRequests()}>Thử lại</button>
        </p>
      )}
      {requests.length > 0 ? (
        <ul className={styles.list}>
          {requests.map((request) => {
            const status = request.is_cancelled ? "cancelled" : request.is_done ? "done" : "pending";
            return (
              <li key={request.id} className={`${styles.row} ${styles.requestRow}`}>
                <div className={styles.classInfo}>
                  <strong>{request.ma_lop}</strong>
                  <p>{request.mon_hoc && `${request.mon_hoc} · `}SID {request.sid_cid}</p>
                </div>
                <span className={styles.requestDate}>{formatTimestamp(request.timestamp)}</span>
                <span className={styles.requestStatus} data-status={status}>
                  {status === "cancelled" ? "Đã hủy" : status === "done" ? "Đã xếp" : "Chờ xử lý"}
                </span>
              </li>
            );
          })}
        </ul>
      ) : !errorMessage && (
        <div className={styles.empty}>
          <strong>{loading ? "Đang tải yêu cầu…" : "Bạn chưa gửi yêu cầu nào"}</strong>
        </div>
      )}
    </section>
  );
}
