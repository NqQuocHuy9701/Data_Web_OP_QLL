"use client";

import React from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import ActionButton from "./ActionButton";

interface MainDataTableProps {
  theme: "light" | "dark";
  displayName: string;
  currentWordIndex: number;
  words: string[];
  stats: { total: number; studying: number; pending: number; tabTotal: number };
  activeNav: string;
  filterMonHoc: string;
  setFilterMonHoc: (val: string) => void;
  filterPhanMonKHTN: string;
  setFilterPhanMonKHTN: (val: string) => void;
  filterTrinhDo: string;
  setFilterTrinhDo: (val: string) => void;
  filterKhoi: string;
  setFilterKhoi: (val: string) => void;
  filterLoaiLop: string;
  setFilterLoaiLop: (val: string) => void;
  filterLichHoc: string;
  setFilterLichHoc: (val: string) => void;
  filterToday: boolean;
  setFilterToday: (val: boolean) => void;
  isFiltering: boolean;
  handleClearFilters: () => void;
  filteredData: any[];
  dropdownOptions: {
    loaiLop: string[];
    khoi: string[];
    monHoc: string[];
    lichHoc: string[];
    trinhDo: string[];
  };
  currentTableData: any[];
  currentPage: number;
  setCurrentPage: (updater: (p: number) => number) => void;
  totalPages: number;
  isHoldingSlot: string | null;
  renderCustomDropdown: (
    label: string,
    key: string,
    currentValue: string,
    options: string[],
    onChange: (val: string) => void,
    formatItem?: (val: string) => string,
  ) => React.ReactNode;
  getActiveHeldCount: (maLop: string) => number;
  calculateAvailableSlots: (row: any, heldCount: number) => number;
  checkAttendanceStatus: (row: any) => { isLow: boolean; text: string };
  getSubjectStyle: (subject: string) => string;
  handleOpenPopup: (row: any, availableSlots: number) => void;
}

export default function MainDataTable({
  theme,
  displayName,
  currentWordIndex,
  words,
  stats,
  activeNav,
  filterMonHoc,
  setFilterMonHoc,
  filterPhanMonKHTN,
  setFilterPhanMonKHTN,
  filterTrinhDo,
  setFilterTrinhDo,
  filterKhoi,
  setFilterKhoi,
  filterLoaiLop,
  setFilterLoaiLop,
  filterLichHoc,
  setFilterLichHoc,
  filterToday,
  setFilterToday,
  isFiltering,
  handleClearFilters,
  filteredData,
  dropdownOptions,
  currentTableData,
  currentPage,
  setCurrentPage,
  totalPages,
  isHoldingSlot,
  renderCustomDropdown,
  getActiveHeldCount,
  calculateAvailableSlots,
  checkAttendanceStatus,
  getSubjectStyle,
  handleOpenPopup,
}: MainDataTableProps) {
  return (
    <div
      key={activeNav}
      className="flex-1 flex flex-col min-h-0 animate-fade-slide-up"
    >
      <div className="px-8 pt-4 pb-3 shrink-0">
        {/* BƯỚC 2: BANNER CHÀO MỪNG CÁ NHÂN HÓA CHO QLL */}
        <div className="flex items-center gap-2.5 mb-3">
          <img
            src="/Chào hỏi_2.png"
            alt="Bitu Mascot"
            className="h-8 sm:h-10 w-auto object-contain shrink-0 drop-shadow-sm animate-bounce"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "/Ch%C3%A0o%20h%E1%BB%8Fi_2.png";
            }}
          />

          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <span
              className={`font-bold tracking-tight text-sm sm:text-[17px] transition-colors duration-0 ${theme === "dark" ? "text-slate-300" : "text-slate-600"}`}
            >
              Vận hành,
            </span>

            <div className="inline-block min-w-0">
              <span
                key={currentWordIndex}
                className="text-orange-500 font-handwriting text-base sm:text-[20px] font-bold tracking-normal leading-snug animate-smooth-signature block"
              >
                {currentWordIndex === 0 ? (
                  <>
                    ✨ Chào mừng{" "}
                    <span className="text-sky-400 font-extrabold underline decoration-orange-400/50 decoration-2 underline-offset-4">
                      {displayName}
                    </span>{" "}
                    đến với website Vận hành! Chúc bạn một ngày làm việc thật
                    hiệu quả nhé.
                  </>
                ) : (
                  words[currentWordIndex - 1]
                )}
              </span>
            </div>
          </div>

          {/* Animation thư giãn — nằm bên phải trong cùng, né đoạn chữ chạy.
              pointer-events-none để không vướng thao tác. Ẩn trên mobile. */}
          <div className="hidden lg:block ml-auto shrink-0 h-14 w-40 pointer-events-none select-none">
            <DotLottieReact
              src="https://lottie.host/ff770bc9-a952-4a8c-b6d2-c20940ca5dbf/tsB3MRK0AC.json"
              loop
              autoplay
              style={{ width: "100%", height: "100%" }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            className={`border-2 rounded-3xl py-4 px-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 ${
              theme === "dark"
                ? "bg-[#151b2b] border-sky-900/30 shadow-[0_10px_30px_rgba(0,0,0,0.3)]"
                : "bg-gradient-to-br from-white via-white to-sky-50/40 border-sky-100/80 shadow-[0_10px_30px_rgba(14,165,233,0.08)] hover:shadow-[0_20px_40px_rgba(14,165,233,0.15)]"
            }`}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-sky-400/10 rounded-bl-full -mr-4 -mt-4 transition-transform duration-500 group-hover:scale-125"></div>
            <p className="text-sky-500 text-[11px] font-extrabold uppercase tracking-widest mb-1 relative z-10">
              Tổng Lớp
            </p>
            <div className="flex items-baseline gap-2 relative z-10">
              <span
                className={`text-3xl font-extrabold transition-colors duration-0 ${theme === "dark" ? "text-white" : "text-slate-900"}`}
              >
                {stats.total}
              </span>
              <span className="text-slate-500 text-xs font-semibold">
                hệ thống
              </span>
            </div>
          </div>

          <div
            className={`border-2 rounded-3xl py-4 px-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 ${
              theme === "dark"
                ? "bg-[#151b2b] border-blue-900/30 shadow-[0_10px_30px_rgba(0,0,0,0.3)]"
                : "bg-gradient-to-br from-white via-white to-blue-50/40 border-blue-100/80 shadow-[0_10px_30px_rgba(37,99,235,0.08)] hover:shadow-[0_20px_40px_rgba(37,99,235,0.15)]"
            }`}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-400/10 rounded-bl-full -mr-4 -mt-4 transition-transform duration-500 group-hover:scale-125"></div>
            <p className="text-blue-500 text-[11px] font-extrabold uppercase tracking-widest mb-1 relative z-10">
              Đang Học
            </p>
            <div className="flex items-baseline gap-2 relative z-10">
              <span className="text-3xl font-extrabold text-blue-500">
                {stats.studying}
              </span>
              <span className="text-slate-500 text-xs font-semibold">
                đang chạy
              </span>
            </div>
          </div>

          <div
            className={`border-2 rounded-3xl py-4 px-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 ${
              theme === "dark"
                ? "bg-[#151b2b] border-orange-900/30 shadow-[0_10px_30px_rgba(0,0,0,0.3)]"
                : "bg-gradient-to-br from-white via-white to-orange-50/40 border-orange-100/80 shadow-[0_10px_30px_rgba(249,115,22,0.08)] hover:shadow-[0_20px_40px_rgba(249,115,22,0.15)]"
            }`}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-400/10 rounded-bl-full -mr-4 -mt-4 transition-transform duration-500 group-hover:scale-125"></div>
            <p className="text-orange-500 text-[11px] font-extrabold uppercase tracking-widest mb-1 relative z-10">
              Chờ Khai Giảng
            </p>
            <div className="flex items-baseline gap-2 relative z-10">
              <span className="text-3xl font-extrabold text-orange-500">
                {stats.pending}
              </span>
              <span className="text-slate-500 text-xs font-semibold">
                chờ khai giảng
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 px-8 pb-6 min-h-0 flex flex-col">
        <div
          className={`rounded-3xl flex flex-col h-full overflow-hidden transition-colors duration-0 ${
            theme === "dark"
              ? "bg-[#151b2b] border border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.2)]"
              : "bg-white shadow-[0_4px_24px_rgb(0,0,0,0.03)] border border-slate-100"
          }`}
        >
          <div
            className={`px-6 py-4 border-b flex flex-wrap gap-3 justify-between items-center shrink-0 z-30 relative transition-colors duration-0 ${
              theme === "dark"
                ? "bg-transparent border-white/5"
                : "bg-white border-slate-100"
            }`}
          >
            <h3
              className={`font-bold flex items-center gap-3 text-base transition-colors duration-0 ${theme === "dark" ? "text-white" : "text-slate-800"}`}
            >
              <span className="w-1.5 h-6 bg-sky-500 rounded-full shadow-[0_0_8px_rgba(14,165,233,0.5)]"></span>
              {activeNav === "Giữ Slot"
                ? "📌 Bảng Tác Vụ Giữ Slot Chuyên Biệt"
                : `Daily — Dữ liệu ${activeNav}`}
            </h3>

            <div className="flex flex-wrap items-center gap-2.5">
              {renderCustomDropdown(
                "Môn",
                "mon",
                filterMonHoc,
                dropdownOptions.monHoc,
                setFilterMonHoc,
              )}

              {/* BỘ LỌC TÀNG HÌNH: Chỉ trượt ra khi Môn = KHTN */}
              {filterMonHoc === "KHTN" && (
                <div className="animate-fade-slide-up">
                  {renderCustomDropdown(
                    "Phân môn",
                    "phanMonKHTN",
                    filterPhanMonKHTN,
                    ["Vật lí", "Hóa học", "Sinh học"],
                    setFilterPhanMonKHTN,
                  )}
                </div>
              )}
              {renderCustomDropdown(
                "Trình độ",
                "trinhDo",
                filterTrinhDo,
                dropdownOptions.trinhDo, // <--- ĐỔI CHỖ NÀY LẠI THÀNH dropdownOptions.trinhDo
                setFilterTrinhDo,
              )}

              {/* Chỉ giữ lại đúng 1 dòng của bộ lọc Khối */}
              {renderCustomDropdown(
                "Khối",
                "khoi",
                filterKhoi,
                dropdownOptions.khoi,
                setFilterKhoi,
                (val) => `Khối ${val}`,
              )}
              {renderCustomDropdown(
                "Loại lớp",
                "loai",
                filterLoaiLop,
                dropdownOptions.loaiLop,
                setFilterLoaiLop,
              )}
              {renderCustomDropdown(
                "Lịch",
                "lich",
                filterLichHoc,
                dropdownOptions.lichHoc,
                setFilterLichHoc,
              )}

              <button
                type="button"
                onClick={() => setFilterToday(!filterToday)}
                className={`px-4 py-2 border rounded-xl font-bold text-xs flex items-center gap-2 focus:outline-none transition-colors duration-0 active:scale-95 ${
                  filterToday
                    ? theme === "dark"
                      ? "bg-orange-500/20 border-orange-500/30 text-orange-400"
                      : "bg-orange-50 border-orange-400 text-orange-600 shadow-sm"
                    : theme === "dark"
                      ? "bg-[#0a0f1c] border-white/10 text-slate-300 hover:border-orange-500/50 hover:text-orange-400"
                      : "bg-white border-slate-200 text-slate-600 hover:border-orange-300 hover:bg-orange-50/30 hover:text-orange-500"
                }`}
              >
                <span className="text-sm">{filterToday ? "📅" : "🗓️"}</span>
                {filterToday ? "Đang chọn: Hôm nay" : "Hôm nay"}
              </button>
              {/* NÚT XÓA BỘ LỌC ĐỘNG (Chỉ hiện khi có lọc) */}
              {isFiltering && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className={`group px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 focus:outline-none transition-all duration-300 active:scale-95 animate-fade-slide-up border ${
                    theme === "dark"
                      ? "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/40 hover:text-red-300 hover:shadow-[0_0_12px_rgba(239,68,68,0.3)]"
                      : "bg-red-50 border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300 hover:text-red-700 hover:shadow-sm"
                  }`}
                  title="Xóa tất cả bộ lọc"
                >
                  <svg
                    className="w-4 h-4 transition-transform duration-500 group-hover:rotate-180"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M6 18L18 6M6 6l12 12"
                    ></path>
                  </svg>
                  <span className="hidden sm:inline">Xóa lọc</span>
                </button>
              )}

              <span
                className={`font-extrabold px-3.5 py-2 rounded-xl border shadow-sm text-xs transition-colors duration-0 ${
                  theme === "dark"
                    ? "bg-sky-500/10 text-sky-400 border-sky-500/20"
                    : "bg-sky-50 text-sky-600 border-sky-100"
                }`}
              >
                {filteredData.length} kết quả
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-auto custom-scrollbar relative">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead
                className={`text-[12px] uppercase font-bold tracking-wider sticky top-0 z-20 shadow-sm border-b transition-colors duration-0 ${
                  theme === "dark"
                    ? "bg-[#1a2235] text-slate-400 border-white/5"
                    : "bg-slate-50 text-slate-400 border-slate-100"
                }`}
              >
                <tr>
                  <th className="px-6 py-4">Mã lớp</th>
                  <th className="px-6 py-4">Môn học</th>
                  <th className="px-6 py-4">Loại lớp</th>
                  <th className="px-6 py-4 text-center">Khối</th>
                  <th className="px-6 py-4">Trình độ</th>
                  <th className="px-6 py-4">Giáo trình</th>

                  {activeNav !== "Giữ Slot" && (
                    <th className="px-6 py-4 text-sky-500">
                      M: Khung chương trình
                    </th>
                  )}

                  <th className="px-6 py-4">Lịch học</th>

                  {activeNav === "Giữ Slot" && (
                    <th className="px-6 py-4 text-center text-orange-500">
                      Số slot còn
                    </th>
                  )}
                  {activeNav === "Giữ Slot" && (
                    <th className="px-6 py-4 text-center text-rose-500">
                      Trạng thái sĩ số
                    </th>
                  )}
                  {activeNav === "Giữ Slot" && (
                    <th className="px-6 py-4 text-right pr-8 text-orange-500">
                      Thao tác giữ
                    </th>
                  )}
                </tr>
              </thead>
              <tbody
                key={`${activeNav}-${currentPage}-${filterLoaiLop}-${filterKhoi}-${filterMonHoc}-${filterLichHoc}-${filterToday}`}
                className={`divide-y transition-colors duration-0 ${theme === "dark" ? "divide-white/5" : "divide-slate-50"}`}
              >
                {currentTableData.length > 0 ? (
                  currentTableData.map((row, index) => {
                    const maLop = row["Mã lớp"];
                    const rawSubjectStr = row["Môn học"] || "";
                    let displaySubject = rawSubjectStr;
                    if (
                      rawSubjectStr.toLowerCase().includes("toán") ||
                      rawSubjectStr.toLowerCase().includes("toan")
                    ) {
                      displaySubject = (maLop || "")
                        .toUpperCase()
                        .startsWith("TCLC")
                        ? "Toán TCLC"
                        : "Toán";
                    }
                    const heldCount = getActiveHeldCount(maLop);
                    const availableSlots = calculateAvailableSlots(
                      row,
                      heldCount,
                    );
                    const attendanceCheck = checkAttendanceStatus(row);
                    const isFull = availableSlots <= 0;
                    const isLoading = isHoldingSlot === maLop;
                    const lichHocStr = (row["Lịch học"] || "").trim();
                    const firstSpaceIdx = lichHocStr.indexOf(" ");
                    const thuPart =
                      firstSpaceIdx > -1
                        ? lichHocStr.substring(0, firstSpaceIdx)
                        : lichHocStr;
                    const gioPart =
                      firstSpaceIdx > -1
                        ? lichHocStr.substring(firstSpaceIdx)
                        : "";

                    return (
                      <tr
                        key={`${maLop}-${index}`}
                        className={`transition-colors duration-0 group/row ${
                          theme === "dark"
                            ? "hover:bg-[#1e293b] even:bg-[#1a2235]/50"
                            : "hover:bg-sky-50/40 even:bg-slate-50/60"
                        }`}
                      >
                        <td className="px-6 py-4 font-bold text-sky-500">
                          {maLop}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md border transition-colors duration-0 ${
                              theme === "dark"
                                ? "bg-[#1e293b] border-white/20 text-white shadow-sm"
                                : getSubjectStyle(displaySubject)
                            }`}
                          >
                            {displaySubject}
                          </span>
                        </td>
                        <td
                          className={`px-6 py-4 text-[13px] font-medium transition-colors duration-0 ${theme === "dark" ? "text-slate-200" : "text-slate-500"}`}
                        >
                          {row["Loại lớp"]}
                        </td>
                        <td
                          className={`px-6 py-4 text-center font-bold transition-colors duration-0 ${theme === "dark" ? "text-white" : "text-slate-600"}`}
                        >
                          {row["Khối"]}
                        </td>
                        <td
                          className={`px-6 py-4 font-semibold transition-colors duration-0 ${theme === "dark" ? "text-slate-200" : "text-slate-600"}`}
                        >
                          {row["Trình độ"]}
                        </td>

                        {/* [TỐI ƯU V3] Bổ sung thẻ title để khi hover hiển thị đủ nội dung bị truncate */}
                        <td
                          className={`px-6 py-4 text-[13px] truncate max-w-[120px] transition-colors duration-0 ${theme === "dark" ? "text-slate-300" : "text-slate-500"}`}
                          title={row["Giáo trình"]}
                        >
                          {row["Giáo trình"]}
                        </td>

                        {activeNav !== "Giữ Slot" && (
                          <td className="px-6 py-4 font-semibold text-sky-400 text-[13px]">
                            {row["M: Khung chương trình"] ||
                              row["Khung chương trình"] ||
                              "-"}
                          </td>
                        )}

                        <td
                          className={`px-6 py-4 font-medium transition-colors duration-0 ${theme === "dark" ? "text-slate-200" : "text-slate-600"}`}
                        >
                          <span
                            className={`${theme === "dark" ? "text-amber-400 font-extrabold text-sm" : "text-orange-600 font-bold"}`}
                          >
                            {thuPart}
                          </span>
                          <span className="ml-1 opacity-90">{gioPart}</span>
                        </td>

                        {activeNav === "Giữ Slot" && (
                          <>
                            <td className="px-6 py-4 text-center">
                              <span
                                className={`px-2.5 py-1 rounded-md font-bold text-xs border transition-colors duration-0 ${
                                  availableSlots > 0
                                    ? theme === "dark"
                                      ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                                      : "bg-orange-50 text-orange-600 border-orange-200"
                                    : theme === "dark"
                                      ? "bg-white/10 text-slate-400 border-white/10"
                                      : "bg-slate-100 text-slate-400 border-slate-200"
                                }`}
                              >
                                {availableSlots > 0
                                  ? `Còn ${availableSlots} slot`
                                  : "Đã hết slot"}
                              </span>
                            </td>

                            <td className="px-6 py-4 text-center">
                              {attendanceCheck.isLow ? (
                                <span
                                  className={`px-2.5 py-1 rounded-md font-bold text-xs border transition-colors duration-0 ${theme === "dark" ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-red-50 text-red-600 border-red-200"}`}
                                >
                                  {attendanceCheck.text}
                                </span>
                              ) : (
                                <span className="text-transparent">_</span>
                              )}
                            </td>

                            <td className="px-6 py-4 text-right pr-6 min-w-[130px]">
                              <div
                                onClick={() =>
                                  !isFull &&
                                  !isLoading &&
                                  handleOpenPopup(row, availableSlots)
                                }
                                className={`inline-block ${isFull || isLoading ? "cursor-not-allowed" : "cursor-pointer"}`}
                              >
                                <div
                                  onClick={() =>
                                    !isFull &&
                                    !isLoading &&
                                    handleOpenPopup(row, availableSlots)
                                  }
                                  className={`inline-block ${isFull || isLoading ? "cursor-not-allowed" : "cursor-pointer"}`}
                                >
                                  <ActionButton
                                    isFull={isFull}
                                    isLoading={isLoading}
                                  />
                                </div>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={10} className="px-6 py-24 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <div
                          className={`w-20 h-20 mb-4 rounded-full flex items-center justify-center border-2 border-dashed transition-colors duration-0 ${theme === "dark" ? "bg-[#0a0f1c] border-white/10" : "bg-slate-50 border-slate-200"}`}
                        >
                          <span className="text-3xl opacity-60">📭</span>
                        </div>
                        <p
                          className={`font-bold text-lg mb-1 transition-colors duration-0 ${theme === "dark" ? "text-slate-300" : "text-slate-500"}`}
                        >
                          Không tìm thấy dữ liệu phù hợp
                        </p>
                        <p className="text-sm font-medium">
                          Hãy thử thay đổi điều kiện bộ lọc hoặc từ khóa tìm
                          kiếm.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div
              className={`flex items-center justify-between px-6 py-4 border-t shrink-0 z-10 transition-colors duration-0 ${theme === "dark" ? "bg-transparent border-white/5" : "bg-white border-slate-100"}`}
            >
              <span className="text-[13px] text-slate-500 font-bold tracking-wide uppercase">
                Page{" "}
                <span className="text-sky-500 text-sm mx-1">{currentPage}</span>{" "}
                / {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`px-5 py-2 border rounded-xl text-[13px] font-bold focus:outline-none transition-colors duration-0 active:scale-95 ${
                    theme === "dark"
                      ? "bg-[#0a0f1c] border-white/10 text-slate-400 hover:text-sky-400 hover:border-sky-500/50 disabled:opacity-40 disabled:hover:bg-[#0a0f1c] disabled:hover:border-white/10 disabled:hover:text-slate-400"
                      : "bg-white border-slate-200 text-slate-500 hover:text-sky-600 hover:border-sky-300 hover:bg-sky-50 disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-slate-200 disabled:hover:text-slate-500"
                  }`}
                >
                  ← Back
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-5 py-2 border rounded-xl text-[13px] font-bold focus:outline-none transition-colors duration-0 active:scale-95 ${
                    theme === "dark"
                      ? "bg-[#0a0f1c] border-white/10 text-slate-400 hover:text-sky-400 hover:border-sky-500/50 disabled:opacity-40 disabled:hover:bg-[#0a0f1c] disabled:hover:border-white/10 disabled:hover:text-slate-400"
                      : "bg-white border-slate-200 text-slate-500 hover:text-sky-600 hover:border-sky-300 hover:bg-sky-50 disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-slate-200 disabled:hover:text-slate-500"
                  }`}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
