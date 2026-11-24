"use client";

import React from "react";

export type NavKey =
  | "Đang học"
  | "Khai giảng"
  | "Giữ Slot"
  | "SlotDaGiu"
  | "DanhSachAddLopQLL"
  | "DanhSachHSAddLop"
  | "QuanTriAdmin"
  | "LichSuSlotAdmin"
  | "ThongKeAdmin"
  | "Dashboard"
  | "TrangCuaToi"
  | "NhatKy";

export const navLabels: Record<NavKey, string> = {
  "Đang học": "Lớp đang học",
  "Khai giảng": "Chờ khai giảng",
  "Giữ Slot": "Giữ slot lớp",
  SlotDaGiu: "Slot đã giữ",
  DanhSachAddLopQLL: "Danh sách học sinh",
  DanhSachHSAddLop: "Danh sách HS add lớp",
  QuanTriAdmin: "Quản trị Admin",
  LichSuSlotAdmin: "DS Giữ Slot",
  ThongKeAdmin: "Theo dõi truy cập",
  Dashboard: "Dashboard book Slots",
  TrangCuaToi: "Trang của tôi",
  NhatKy: "Nhật ký",
};

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
  const navigationRef = React.useRef<HTMLElement>(null);
  const indicatorRef = React.useRef<HTMLSpanElement>(null);

  React.useLayoutEffect(() => {
    const navigation = navigationRef.current;
    const indicator = indicatorRef.current;
    if (!navigation || !indicator) return;

    const selected = navigation.querySelector<HTMLButtonElement>('button[aria-current="page"]');
    const previous = indicator.getBoundingClientRect();
    const wasVisible = !indicator.hidden;
    indicator.getAnimations().forEach((animation) => animation.cancel());
    indicator.hidden = !selected;
    if (!selected) return;

    const center = selected.offsetTop + selected.offsetHeight / 2;
    const height = indicator.offsetHeight;
    const top = center - height / 2;
    indicator.style.transform = `translateY(${top}px)`;
    if (!wasVisible || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const previousTop = previous.top - indicator.getBoundingClientRect().top + top;
    const distance = top - previousTop;
    if (Math.abs(distance) < 1 && Math.abs(previous.height - height) < 1) return;

    const previousCenter = previousTop + previous.height / 2;
    const centerDistance = center - previousCenter;
    const stretchLimit = height * 0.55;
    const easeEdge = (progress: number) => progress ** 3 * (10 + progress * (-15 + 6 * progress));

    // Ease the leading and trailing edges separately so the stretch settles continuously.
    const frames = Array.from({ length: 33 }, (_, index) => {
      const time = index / 32;
      const leading = easeEdge(Math.min(time / 0.86, 1));
      const trailing = easeEdge(Math.max((time - 0.14) / 0.86, 0));
      const progress = (leading + trailing) / 2;
      const stretch = stretchLimit * Math.tanh(Math.abs(centerDistance) * (leading - trailing) / stretchLimit);
      const frameHeight = previous.height + (height - previous.height) * progress + stretch;
      const frameTop = previousCenter + centerDistance * progress - frameHeight / 2;

      return { transform: `translateY(${frameTop}px) scaleY(${frameHeight / height})` };
    });

    indicator.animate(frames, Math.min(490, 345 + Math.abs(centerDistance) * 0.29));
  }, [activeNav, loginRole]);

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

      <div className="ops-sidebar-rail">
      <aside
        data-theme={theme}
        onClick={() => setSidebarOpen?.(false)}
        className={`ops-sidebar w-64 flex flex-col z-40 shrink-0 motion-safe:transition-transform motion-safe:duration-200 fixed inset-y-0 left-0 lg:static ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${
          theme === "dark"
            ? "bg-[#0e1320] border-r border-white/5 shadow-[4px_0_24px_rgba(0,0,0,0.5)]"
            : "bg-white border-r border-slate-200/80 shadow-[4px_0_24px_rgba(0,0,0,0.02)]"
        }`}
      >
      <div
        className={`ops-sidebar-heading h-14 flex items-center justify-between gap-2 px-4 border-b shrink-0 transition-colors duration-0 ${theme === "dark" ? "border-white/5" : "border-slate-100"}`}
      >
        <div className="ops-sidebar-brand flex min-w-0 items-center gap-3">
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

      <nav ref={navigationRef} id="ops-sidebar-navigation" aria-label="Điều hướng chính" className="relative flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
        <span ref={indicatorRef} className="ops-sidebar-indicator" aria-hidden="true" hidden />
        {/* Trang chủ cá nhân — chỉ QLL */}
        {loginRole === "QLL" && (
          <button
            title={navLabels["TrangCuaToi"]}
            aria-label={navLabels["TrangCuaToi"]}
            aria-current={activeNav === "TrangCuaToi" ? "page" : undefined}
            onClick={() => setActiveNav("TrangCuaToi")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors duration-0 focus:outline-none relative group ${
              activeNav === "TrangCuaToi"
                ? theme === "dark"
                  ? "bg-sky-500/10 text-sky-400 font-bold border border-sky-500/20"
                  : "bg-sky-50/80 text-sky-600 font-bold shadow-[0_2px_10px_rgba(14,165,233,0.05)]"
                : theme === "dark"
                  ? "text-slate-400 hover:bg-white/5 hover:text-sky-400 font-medium"
                  : "text-slate-500 hover:bg-slate-50 hover:text-sky-500 font-medium"
            }`}
          >
            <span className="text-lg">🏠</span>
            <span className="ops-sidebar-label text-xs truncate">Trang của tôi</span>
          </button>
        )}

        <div className="ops-sidebar-section text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 mt-2 px-2">
          Quản lý báo cáo
        </div>

        <button
          title={navLabels["Đang học"]}
          aria-label={navLabels["Đang học"]}
          aria-current={activeNav === "Đang học" ? "page" : undefined}
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
          <span className="text-lg">📚</span>
          <span className="ops-sidebar-label text-xs truncate">Lớp Đang Học</span>
        </button>

        <button
          title={navLabels["Khai giảng"]}
          aria-label={navLabels["Khai giảng"]}
          aria-current={activeNav === "Khai giảng" ? "page" : undefined}
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
          <span className="text-lg">🚀</span>
          <span className="ops-sidebar-label text-xs truncate">Chờ Khai Giảng</span>
        </button>

        <div className="ops-sidebar-section text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 mt-6 px-2">
          Tác vụ chuyên biệt
        </div>

        <button
          title={navLabels["Giữ Slot"]}
          aria-label={navLabels["Giữ Slot"]}
          aria-current={activeNav === "Giữ Slot" ? "page" : undefined}
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
          <span className="text-lg">📌</span>
          <span className="ops-sidebar-label text-xs truncate">Giữ Slot Lớp</span>
        </button>

        <button
          title={navLabels["SlotDaGiu"]}
          aria-label={navLabels["SlotDaGiu"]}
          aria-current={activeNav === "SlotDaGiu" ? "page" : undefined}
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
          <span className="text-lg">🕒</span>
          <span className="ops-sidebar-label text-xs truncate">Slot Đã Giữ</span>
        </button>

        {loginRole === "QLL" && (
          <>
            <div className="ops-sidebar-section text-[10px] font-black text-sky-500 uppercase tracking-widest mb-2 mt-6 px-2">
              Học sinh add lớp
            </div>

            <button
              title={navLabels["DanhSachAddLopQLL"]}
              aria-label={navLabels["DanhSachAddLopQLL"]}
              aria-current={activeNav === "DanhSachAddLopQLL" ? "page" : undefined}
              onClick={() => setActiveNav("DanhSachAddLopQLL")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors duration-0 focus:outline-none relative group ${
                activeNav === "DanhSachAddLopQLL"
                  ? theme === "dark"
                    ? "bg-sky-500/10 text-sky-400 font-bold border border-sky-500/20"
                    : "bg-sky-50/80 text-sky-600 font-bold shadow-[0_2px_10px_rgba(14,165,233,0.05)]"
                  : theme === "dark"
                    ? "text-slate-400 hover:bg-white/5 hover:text-sky-400 font-medium"
                    : "text-slate-500 hover:bg-slate-50 hover:text-sky-500 font-medium"
              }`}
            >
              <span className="text-lg">🎓</span>
              <span className="ops-sidebar-label text-xs truncate">Danh sách học sinh</span>
            </button>
          </>
        )}

        {loginRole === "Admin" && (
          <>
            <div className="ops-sidebar-section text-[10px] font-black text-sky-500 uppercase tracking-widest mb-2 mt-6 px-2">
              Quản lý học sinh
            </div>

            <button
              title={navLabels["DanhSachHSAddLop"]}
              aria-label={navLabels["DanhSachHSAddLop"]}
              aria-current={activeNav === "DanhSachHSAddLop" ? "page" : undefined}
              onClick={() => setActiveNav("DanhSachHSAddLop")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors duration-0 focus:outline-none relative group ${
                activeNav === "DanhSachHSAddLop"
                  ? theme === "dark"
                    ? "bg-sky-500/10 text-sky-400 font-bold border border-sky-500/20"
                    : "bg-sky-50/80 text-sky-600 font-bold shadow-[0_2px_10px_rgba(14,165,233,0.05)]"
                  : theme === "dark"
                    ? "text-slate-400 hover:bg-white/5 hover:text-sky-400 font-medium"
                    : "text-slate-500 hover:bg-slate-50 hover:text-sky-500 font-medium"
              }`}
            >
              <span className="text-lg">🎓</span>
              <span className="ops-sidebar-label text-xs truncate">Danh sách HS add lớp</span>
            </button>

            <div className="ops-sidebar-section text-[10px] font-black text-orange-400 uppercase tracking-widest mb-2 mt-6 px-2">
              Hệ thống Quản trị
            </div>

            <button
              title={navLabels["Dashboard"]}
              aria-label={navLabels["Dashboard"]}
              aria-current={activeNav === "Dashboard" ? "page" : undefined}
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
              <span className="ops-sidebar-label text-xs truncate">Dashboard book Slots</span>
            </button>

            <button
              title={navLabels["NhatKy"]}
              aria-label={navLabels["NhatKy"]}
              aria-current={activeNav === "NhatKy" ? "page" : undefined}
              onClick={() => setActiveNav("NhatKy")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors duration-0 focus:outline-none relative group ${
                activeNav === "NhatKy"
                  ? "bg-orange-500 text-white font-bold shadow-[0_4px_15px_rgba(249,115,22,0.3)]"
                  : theme === "dark"
                    ? "text-slate-400 hover:bg-white/5 hover:text-orange-400 font-medium"
                    : "text-slate-600 hover:bg-orange-50 hover:text-orange-600 font-medium"
              }`}
            >
              <span className="text-lg">📜</span>
              <span className="ops-sidebar-label text-xs truncate">Nhật ký</span>
            </button>

            <button
              title={navLabels["LichSuSlotAdmin"]}
              aria-label={navLabels["LichSuSlotAdmin"]}
              aria-current={activeNav === "LichSuSlotAdmin" ? "page" : undefined}
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
              <span className="ops-sidebar-label text-xs truncate">DS Giữ Slot</span>
            </button>

            <button
              title={navLabels["ThongKeAdmin"]}
              aria-label={navLabels["ThongKeAdmin"]}
              aria-current={activeNav === "ThongKeAdmin" ? "page" : undefined}
              onClick={() => setActiveNav("ThongKeAdmin")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors duration-0 focus:outline-none relative group ${
                activeNav === "ThongKeAdmin"
                  ? "bg-orange-500 text-white font-bold shadow-[0_4px_15px_rgba(249,115,22,0.3)]"
                  : theme === "dark"
                    ? "text-slate-400 hover:bg-white/5 hover:text-orange-400 font-medium"
                    : "text-slate-600 hover:bg-orange-50 hover:text-orange-600 font-medium"
              }`}
            >
              <span className="text-lg">📊</span>
              <span className="ops-sidebar-label text-xs truncate">Theo dõi truy cập</span>
            </button>

            <button
              title={navLabels["QuanTriAdmin"]}
              aria-label={navLabels["QuanTriAdmin"]}
              aria-current={activeNav === "QuanTriAdmin" ? "page" : undefined}
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
              <span className="ops-sidebar-label text-xs truncate">Quản Trị Admin</span>
            </button>
          </>
        )}
      </nav>

      <div
        className={`ops-sidebar-footer p-4 border-t shrink-0 flex items-center justify-between transition-colors duration-0 ${theme === "dark" ? "bg-[#0a0f1c] border-white/5" : "bg-slate-50/30 border-slate-100"}`}
      >
        <div className="ops-sidebar-profile ops-profile-welcome flex items-center gap-3 px-1 cursor-pointer group">
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
    </div>
    </>
  );
}
