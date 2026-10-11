import React from "react";

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
  if (isFull) {
    return (
      <div className="custom-action-btn opacity-60 cursor-not-allowed flex items-center justify-center font-bold text-slate-400 bg-slate-200/50 border border-slate-300 rounded-[18px]">
        Hết Slot
      </div>
    );
  }

  return (
    <button
      className="custom-action-btn"
      onClick={onClick}
      disabled={isLoading}
    >
      <div className="custom-bg"></div>
      <svg
        className="custom-splash"
        width="342"
        height="208"
        viewBox="0 0 342 208"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M48.5 102.3C48.5 102.3 36.2 92.5 24.8 98.7C13.4 104.9 3 98.7 3 98.7"
          strokeWidth="3"
          strokeLinecap="round"
        ></path>
        <path
          d="M290.5 102.3C290.5 102.3 302.8 92.5 314.2 98.7C325.6 104.9 339 96.2 339 96.2"
          strokeWidth="3"
          strokeLinecap="round"
        ></path>
        <path
          d="M278.5 68.2C278.5 68.2 284.3 54.1 298.7 52.8C313.1 51.5 315.5 42.3 315.5 42.3"
          strokeOpacity="0.4"
          strokeWidth="3"
          strokeLinecap="round"
        ></path>
        <path
          d="M278.5 141.7C278.5 141.7 284.3 155.8 298.7 157.1C313.1 158.4 315.5 167.6 315.5 167.6"
          strokeOpacity="0.4"
          strokeWidth="3"
          strokeLinecap="round"
        ></path>
        <path
          d="M225.3 60.8C225.3 60.8 221.5 45.2 231.2 35.6C240.9 26 239.8 19.5 239.8 19.5"
          strokeWidth="3"
          strokeLinecap="round"
        ></path>
        <path
          d="M225.3 153.2C225.3 153.2 221.5 168.8 231.2 178.4C240.9 188 239.8 194.5 239.8 194.5"
          strokeWidth="3"
          strokeLinecap="round"
        ></path>
      </svg>

      <div className="custom-wrap">
        <svg
          className="custom-path"
          width="221"
          height="42"
          viewBox="0 0 221 42"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M182.674 2H203C211.837 2 219 9.16344 219 18V24C219 32.8366 211.837 40 203 40H18C9.16345 40 2 32.8366 2 24V18C2 9.16344 9.16344 2 18 2H47.8855"
            strokeWidth="3"
            strokeLinecap="round"
          ></path>
        </svg>

        <div className="custom-outline"></div>
        <div className="custom-content">
          {isLoading ? (
            <svg
              className="animate-spin h-6 w-6 text-white mx-auto my-auto"
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
            <>
              {/* Trạng thái 1: Giữ Slot */}
              <span className="custom-char state-1">
                <span
                  style={{ "--i": 1 } as React.CSSProperties}
                  data-label="G"
                >
                  G
                </span>
                <span
                  style={{ "--i": 2 } as React.CSSProperties}
                  data-label="i"
                >
                  i
                </span>
                <span
                  style={{ "--i": 3 } as React.CSSProperties}
                  data-label="ữ"
                >
                  ữ
                </span>
                <span
                  style={{ "--i": 4 } as React.CSSProperties}
                  data-label="n"
                >
                  {" "}
                </span>
                <span
                  style={{ "--i": 5 } as React.CSSProperties}
                  data-label="S"
                >
                  S
                </span>
                <span
                  style={{ "--i": 6 } as React.CSSProperties}
                  data-label="l"
                >
                  l
                </span>
                <span
                  style={{ "--i": 7 } as React.CSSProperties}
                  data-label="o"
                >
                  o
                </span>
                <span
                  style={{ "--i": 8 } as React.CSSProperties}
                  data-label="t"
                >
                  t
                </span>
              </span>

              <div className="custom-icon">
                <div></div>
              </div>

              {/* Trạng thái 2: Đồng ý */}
              <span className="custom-char state-2">
                <span
                  style={{ "--i": 1 } as React.CSSProperties}
                  data-label="Đ"
                >
                  Đ
                </span>
                <span
                  style={{ "--i": 2 } as React.CSSProperties}
                  data-label="ồ"
                >
                  ồ
                </span>
                <span
                  style={{ "--i": 3 } as React.CSSProperties}
                  data-label="n"
                >
                  n
                </span>
                <span
                  style={{ "--i": 4 } as React.CSSProperties}
                  data-label="g"
                >
                  g
                </span>
                <span
                  style={{ "--i": 5 } as React.CSSProperties}
                  data-label=" "
                >
                  {" "}
                </span>
                <span
                  style={{ "--i": 6 } as React.CSSProperties}
                  data-label="ý"
                >
                  ý
                </span>
              </span>
            </>
          )}
        </div>
      </div>
    </button>
  );
}
