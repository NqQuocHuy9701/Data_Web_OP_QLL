"use client";

import { useId } from "react";
import styles from "./TelegramUsernameNotice.module.css";

export default function TelegramUsernameNotice({ onConfirm }: { onConfirm: () => void }) {
  const id = useId();
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;

  return (
    <div className={styles.overlay}>
      <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId}>
        <svg className={styles.illustration} viewBox="0 0 360 174" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id={`${id}-tile`} x1="128" y1="27" x2="213" y2="148" gradientUnits="userSpaceOnUse">
              <stop stopColor="#49D8FF" />
              <stop offset=".48" stopColor="#0EA5ED" />
              <stop offset="1" stopColor="#064FC7" />
            </linearGradient>
            <linearGradient id={`${id}-warning`} x1="239" y1="79" x2="268" y2="155" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FFE281" />
              <stop offset="1" stopColor="#FF932C" />
            </linearGradient>
            <linearGradient id={`${id}-orbit`} x1="0" x2="1" y1="0" y2="0">
              <stop stopColor="#168FE5" stopOpacity=".1" />
              <stop offset=".54" stopColor="#168FE5" stopOpacity=".25" />
              <stop offset=".88" stopColor="#45D5FF" />
              <stop offset="1" stopColor="#DEF9FF" />
            </linearGradient>
          </defs>
          <g className={styles.orbit}>
            <ellipse cx="180" cy="88" rx="144" ry="35" transform="rotate(-19 180 88)" stroke={`url(#${id}-orbit)`} strokeWidth="2" pathLength="1" />
            <ellipse cx="180" cy="88" rx="111" ry="25" transform="rotate(-19 180 88)" stroke="#38BDF8" strokeOpacity=".28" />
          </g>
          <path d="M54 56c0 12 5 17 17 17-12 0-17 5-17 17 0-12-5-17-17-17 12 0 17-5 17-17Z" fill="#45D5FF" opacity=".85" />
          <path d="M315 106c0 7 3 10 10 10-7 0-10 3-10 10 0-7-3-10-10-10 7 0 10-3 10-10Z" fill="#45D5FF" opacity=".7" />
          <g className={styles.telegramIcon}>
            <g transform="rotate(-12 167 83)">
              <rect x="111" y="29" width="116" height="116" rx="27" fill="#064BAB" />
              <rect x="115" y="23" width="116" height="116" rx="27" fill={`url(#${id}-tile)`} stroke="#97E9FF" strokeOpacity=".8" strokeWidth="2" />
              <path d="M135 77 208 47c3-1 5 1 4 4l-12 62c-.5 3-3 4-5 2l-26-19-11 10-1-18-22-7c-3-1-3-3 0-4Z" fill="#F7FAFF" />
              <path d="m157 88 45-32-33 40-11 10-1-18Z" fill="#BDE8FF" />
              <path d="m169 96 33-40-45 32 12 8Z" fill="#1289E5" />
            </g>
          </g>
          <g transform="rotate(-8 253 122)">
            <path d="m242 88-31 49c-5 8 0 17 9 17h66c9 0 14-9 9-17l-32-49c-5-8-16-8-21 0Z" fill={`url(#${id}-warning)`} stroke="#FFE6A2" strokeWidth="2" />
            <path d="M253 103v22" stroke="#FFF8E8" strokeWidth="7" strokeLinecap="round" />
            <circle cx="253" cy="136" r="4" fill="#FFF8E8" />
          </g>
          <path d="m284 78 8-12m2 21 13-5" stroke="#FFCE65" strokeWidth="5" strokeLinecap="round" />
        </svg>

        <h2 id={titleId} className={styles.heading}>
          Sử dụng đúng
          <span className={styles.highlight}>
            <strong>Username</strong> Telegram
          </span>
        </h2>
        <p id={descriptionId} className={styles.description}>
          Anh/chị vui lòng sử dụng đúng <strong>Username</strong> Telegram đã đăng ký khi đăng nhập hệ thống OP để đảm bảo nhận đầy đủ các thông báo từ hệ thống.
        </p>
        <button type="button" autoFocus onClick={onConfirm} className={styles.confirm}>
          <span aria-hidden="true" className={styles.check}>✓</span>
          Đã hiểu
        </button>
      </section>
    </div>
  );
}
