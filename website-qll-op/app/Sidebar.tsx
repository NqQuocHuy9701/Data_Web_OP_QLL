"use client";

import React from "react";

type NavKey =
  | "Đang học"
  | "Khai giảng"
  | "Giữ Slot"
  | "SlotDaGiu"
  | "QuanTriAdmin"
  | "LichSuSlotAdmin"
  | "ThongKeAdmin"
  | "Dashboard";

interface SidebarProps {
  theme: "light" | "dark";
  activeNav: NavKey;
  setActiveNav: (nav: NavKey) => void;
  loginRole: "QLL" | "Admin";
  adminUsername: string;
  namecode: string;
  teamLead: string;
  loadSlotHistory: (isSilent?: boolean) => void;
  handleLogout: () => void;
  sidebarOpen?: boolean;
  setSidebarOpen?: (open: boolean) => void;
}

export default function Sidebar({
  theme,
  activeNav,
  setActiveNav,
  loginRole,
  adminUsername,
  namecode,
  teamLead,
  loadSlotHistory,
  handleLogout,
  sidebarOpen = false,
  setSidebarOpen,
}: SidebarProps) {
  return (
    <>
      {/* [MOBILE] Lớp nền tối: chỉ hiện khi drawer mở, bấm để đóng. Ẩn trên desktop. */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen?.(false)}
          aria-hidden="true"
        />
      )}

      <aside
        onClick={() => setSidebarOpen?.(false)}
        className={`w-64 min-w-[16rem] max-w-[16rem] flex flex-col z-40 shrink-0 transition-transform duration-300 lg:transition-colors fixed inset-y-0 left-0 lg:static ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${
          theme === "dark"
            ? "bg-[#0e1320] border-r border-white/5 shadow-[4px_0_24px_rgba(0,0,0,0.5)]"
            : "bg-white border-r border-slate-200/80 shadow-[4px_0_24px_rgba(0,0,0,0.02)]"
        }`}
      >
      <div
        className={`h-20 flex items-center px-6 border-b shrink-0 transition-colors duration-0 ${theme === "dark" ? "border-white/5" : "border-slate-100"}`}
      >
        <div className="flex items-center gap-3 cursor-pointer">
          <img
            src="https://xcdn-cf.vuihoc.vn/theme/vuihoc/imgs/vuihoc_logo_final.png"
            alt="Vuihoc Logo"
            className="h-6 w-auto object-contain drop-shadow-sm"
          />
          <div
            className={`border-l-[1.5px] pl-3 transition-colors duration-0 ${theme === "dark" ? "border-white/10" : "border-slate-200"}`}
          >
            <p className="text-[9px] text-sky-500 font-bold uppercase tracking-widest mt-1">
              Vận Hành
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 mt-2 px-2">
          Quản lý báo cáo
        </div>

        <button
          onClick={() => setActiveNav("Đang học")}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors duration-0 focus:outline-none relative group ${
            activeNav === "Đang học"
              ? theme === "dark"
                ? "bg-sky-500/10 text-sky-400 font-bold border border-sky-500/20"
                : "bg-sky-50/80 text-sky-600 font-bold shadow-[0_2px_10px_rgba(14,165,233,0.05)]"
              : theme === "dark"
                ? "text-slate-400 hover:bg-white/5 hover:text-sky-400 font-medium"
                : "text-slate-500 hover:bg-slate-50 hover:text-sky-500 font-medium"
          }`}
        >
          <div
            className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-sky-500 rounded-r-full transition-all duration-0 ${activeNav === "Đang học" ? "opacity-100 scale-y-100" : "opacity-0 scale-y-0"}`}
          ></div>
          <span className="text-lg">📚</span>
          <span className="text-xs truncate">Lớp Đang Học</span>
        </button>

        <button
          onClick={() => setActiveNav("Khai giảng")}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors duration-0 focus:outline-none relative group ${
            activeNav === "Khai giảng"
              ? theme === "dark"
                ? "bg-sky-500/10 text-sky-400 font-bold border border-sky-500/20"
                : "bg-sky-50/80 text-sky-600 font-bold shadow-[0_2px_10px_rgba(14,165,233,0.05)]"
              : theme === "dark"
                ? "text-slate-400 hover:bg-white/5 hover:text-sky-400 font-medium"
                : "text-slate-500 hover:bg-slate-50 hover:text-sky-500 font-medium"
          }`}
        >
          <div
            className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-sky-500 rounded-r-full transition-all duration-0 ${activeNav === "Khai giảng" ? "opacity-100 scale-y-100" : "opacity-0 scale-y-0"}`}
          ></div>
          <span className="text-lg">🚀</span>
          <span className="text-xs truncate">Chờ Khai Giảng</span>
        </button>

        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 mt-6 px-2">
          Tác vụ chuyên biệt
        </div>

        <button
          onClick={() => setActiveNav("Giữ Slot")}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors duration-0 focus:outline-none relative group ${
            activeNav === "Giữ Slot"
              ? theme === "dark"
                ? "bg-orange-500/10 text-orange-400 font-bold border border-orange-500/20"
                : "bg-orange-50 text-orange-600 font-bold shadow-[0_2px_10px_rgba(249,115,22,0.1)]"
              : theme === "dark"
                ? "text-slate-400 hover:bg-white/5 hover:text-orange-400 font-medium"
                : "text-slate-500 hover:bg-orange-50/50 hover:text-orange-500 font-medium"
          }`}
        >
          <div
            className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-orange-500 rounded-r-full transition-all duration-0 ${activeNav === "Giữ Slot" ? "opacity-100 scale-y-100" : "opacity-0 scale-y-0"}`}
          ></div>
          <span className="text-lg">📌</span>
          <span className="text-xs truncate">Giữ Slot Lớp</span>
        </button>

        <button
          onClick={() => {
            setActiveNav("SlotDaGiu");
            loadSlotHistory();
          }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors duration-0 focus:outline-none relative group ${
            activeNav === "SlotDaGiu"
              ? theme === "dark"
                ? "bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20"
                : "bg-amber-50 text-amber-600 font-bold shadow-[0_2px_10px_rgba(251,191,36,0.1)]"
              : theme === "dark"
                ? "text-slate-400 hover:bg-white/5 hover:text-amber-400 font-medium"
                : "text-slate-500 hover:bg-amber-50/50 hover:text-amber-500 font-medium"
          }`}
        >
          <div
            className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-amber-500 rounded-r-full transition-all duration-0 ${activeNav === "SlotDaGiu" ? "opacity-100 scale-y-100" : "opacity-0 scale-y-0"}`}
          ></div>
          <span className="text-lg">🕒</span>
          <span className="text-xs truncate">Slot Đã Giữ</span>
        </button>

        {loginRole === "Admin" && (
          <>
            <div className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-2 mt-6 px-2">
              Hệ thống Quản trị
            </div>

            <button
              onClick={() => {
                setActiveNav("Dashboard");
                loadSlotHistory();
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors duration-0 focus:outline-none relative group ${
                activeNav === "Dashboard"
                  ? "bg-orange-500 text-white font-bold shadow-[0_4px_15px_rgba(249,115,22,0.3)]"
                  : theme === "dark"
                    ? "text-slate-400 hover:bg-white/5 hover:text-orange-400 font-medium"
                    : "text-slate-600 hover:bg-orange-50 hover:text-orange-600 font-medium"
              }`}
            >
              <span className="text-lg">📈</span>
              <span className="text-xs truncate">Dashboard book Slots</span>
            </button>

            <button
              onClick={() => {
                setActiveNav("LichSuSlotAdmin");
                loadSlotHistory();
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors duration-0 focus:outline-none relative group ${
                activeNav === "LichSuSlotAdmin"
                  ? "bg-orange-500 text-white font-bold shadow-[0_4px_15px_rgba(249,115,22,0.3)]"
                  : theme === "dark"
                    ? "text-slate-400 hover:bg-white/5 hover:text-orange-400 font-medium"
                    : "text-slate-600 hover:bg-orange-50 hover:text-orange-600 font-medium"
              }`}
            >
              <span className="text-lg">📋</span>
              <span className="text-xs truncate">DS Giữ Slot</span>
            </button>

            <button
              onClick={() => {
                setActiveNav("ThongKeAdmin");
                loadSlotHistory();
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors duration-0 focus:outline-none relative group ${
                activeNav === "ThongKeAdmin"
                  ? "bg-orange-500 text-white font-bold shadow-[0_4px_15px_rgba(249,115,22,0.3)]"
                  : theme === "dark"
                    ? "text-slate-400 hover:bg-white/5 hover:text-orange-400 font-medium"
                    : "text-slate-600 hover:bg-orange-50 hover:text-orange-600 font-medium"
              }`}
            >
              <span className="text-lg">📊</span>
              <span className="text-xs truncate">Theo dõi truy cập</span>
            </button>

            <button
              onClick={() => {
                setActiveNav("QuanTriAdmin");
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors duration-0 focus:outline-none relative group ${
                activeNav === "QuanTriAdmin"
                  ? "bg-orange-500 text-white font-bold shadow-[0_4px_15px_rgba(249,115,22,0.3)]"
                  : theme === "dark"
                    ? "text-slate-400 hover:bg-white/5 hover:text-orange-400 font-medium"
                    : "text-slate-600 hover:bg-orange-50 hover:text-orange-600 font-medium"
              }`}
            >
              <span className="text-lg">⚙️</span>
              <span className="text-xs truncate">Quản Trị Admin</span>
            </button>
          </>
        )}
      </nav>

      <div
        className={`p-4 border-t shrink-0 flex items-center justify-between transition-colors duration-0 ${theme === "dark" ? "bg-[#0a0f1c] border-white/5" : "bg-slate-50/30 border-slate-100"}`}
      >
        <div className="flex items-center gap-3 px-1 cursor-pointer group">
          <div
            className={`w-9 h-9 rounded-full border flex items-center justify-center font-bold text-xs shadow-sm transition-colors duration-0 ${
              theme === "dark"
                ? loginRole === "Admin"
                  ? "bg-orange-500/20 border-orange-500/30 text-orange-400"
                  : "bg-sky-500/20 border-sky-500/30 text-sky-400"
                : loginRole === "Admin"
                  ? "bg-orange-100 border-orange-200 text-orange-700"
                  : "bg-sky-100 border-sky-200 text-sky-700"
            }`}
          >
            {(loginRole === "Admin" ? adminUsername : namecode)
              .substring(0, 2)
              .toUpperCase()}
          </div>
          <div className="text-xs truncate max-w-[100px]">
            <p
              className={`font-bold truncate transition-colors duration-0 ${theme === "dark" ? "text-slate-200" : "text-slate-700"}`}
              title={loginRole === "Admin" ? adminUsername : namecode}
            >
              {loginRole === "Admin" ? adminUsername : namecode}
            </p>
            <p
              className="text-[10px] text-slate-400 truncate"
              title={loginRole === "Admin" ? "Admin hệ thống" : teamLead}
            >
              {loginRole === "Admin" ? "Admin hệ thống" : teamLead}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          title="Đăng xuất"
          className={`p-2 rounded-xl transition-colors duration-0 cursor-pointer ${theme === "dark" ? "text-slate-500 hover:text-red-400 hover:bg-red-500/10" : "text-slate-400 hover:text-red-500 hover:bg-red-50"}`}
        >
          🚪
        </button>
      </div>
    </aside>
    </>
  );
}
