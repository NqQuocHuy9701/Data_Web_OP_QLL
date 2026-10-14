"use client";

import React, { useState } from "react";

interface ActionButtonProps {
  onClick?: () => void;
  isFull?: boolean;
  isLoading?: boolean;
}

export default function ActionButton({
  onClick,
  isFull = false,
  isLoading = false,
}: ActionButtonProps) {
  const [ripples, setRipples] = useState<
    { id: number; x: number; y: number }[]
  >([]);

  if (isFull) {
    return (
      <div className="custom-btn opacity-60 cursor-not-allowed flex items-center justify-center font-light text-slate-400 bg-slate-200/50 border border-slate-300 rounded-[23px] text-xs h-[38px] w-[130px] mx-auto">
        Hết Slot
      </div>
    );
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Tạo gợn sóng tại vị trí bấm
    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now();
    setRipples((prev) => [
      ...prev,
      { id, x: e.clientX - rect.left, y: e.clientY - rect.top },
    ]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 600);
    onClick?.();
  };

  return (
    <button
      className="custom-btn btn-hover relative overflow-hidden"
      onClick={handleClick}
      disabled={isLoading}
    >
      {ripples.map((r) => (
        <span
          key={r.id}
          className="ripple-span"
          style={{ left: r.x, top: r.y, width: 16, height: 16, marginLeft: -8, marginTop: -8 }}
        />
      ))}
      <span className="btn-text flex items-center justify-center h-full">
        {isLoading ? (
          <svg
            className="animate-spin h-4 w-4 text-white mx-auto"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        ) : (
          <span className="btn-label-swap">
            <span className="default-text">Giữ Slot</span>
            <span className="hover-text">Đồng ý</span>
          </span>
        )}
      </span>
    </button>
  );
}
