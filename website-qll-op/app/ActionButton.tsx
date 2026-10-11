import React from 'react';

interface ActionButtonProps {
  onClick?: () => void;
  isFull?: boolean;
  isLoading?: boolean;
}

export default function ActionButton({ onClick, isFull = false, isLoading = false }: ActionButtonProps) {
  if (isFull) {
    return (
      <div className="custom-action-btn opacity-60 cursor-not-allowed flex items-center justify-center font-bold text-slate-400 bg-slate-200/50 border border-slate-300 rounded-[12px] h-[40px] w-[120px] text-xs">
        Hết Slot
      </div>
    );
  }

  return (
    <button className="custom-action-btn" onClick={onClick} disabled={isLoading}>
      <div className="custom-wrap">
        <div className="custom-outline"></div>
        <div className="custom-content">
          {isLoading ? (
            <svg className="animate-spin h-5 w-5 text-white mx-auto my-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <>
              {/* Trạng thái 1: Giữ Slot */}
              <span className="custom-char state-1">
                <span style={{ '--i': 1 } as React.CSSProperties} data-label="G">G</span>
                <span style={{ '--i': 2 } as React.CSSProperties} data-label="i">i</span>
                <span style={{ '--i': 3 } as React.CSSProperties} data-label="ữ">ữ</span>
                <span style={{ '--i': 4 } as React.CSSProperties} data-label="n"> </span>
                <span style={{ '--i': 5 } as React.CSSProperties} data-label="S">S</span>
                <span style={{ '--i': 6 } as React.CSSProperties} data-label="l">l</span>
                <span style={{ '--i': 7 } as React.CSSProperties} data-label="o">o</span>
                <span style={{ '--i': 8 } as React.CSSProperties} data-label="t">t</span>
              </span>

              <div className="custom-icon">
                <div></div>
              </div>

              {/* Trạng thái 2: Đồng ý */}
              <span className="custom-char state-2">
                <span style={{ '--i': 1 } as React.CSSProperties} data-label="Đ">Đ</span>
                <span style={{ '--i': 2 } as React.CSSProperties} data-label="ồ">ồ</span>
                <span style={{ '--i': 3 } as React.CSSProperties} data-label="n">n</span>
                <span style={{ '--i': 4 } as React.CSSProperties} data-label="g">g</span>
                <span style={{ '--i': 5 } as React.CSSProperties} data-label=" "> </span>
                <span style={{ '--i': 6 } as React.CSSProperties} data-label="ý">ý</span>
              </span>
            </>
          )}
        </div>
      </div>
    </button>
  );
}