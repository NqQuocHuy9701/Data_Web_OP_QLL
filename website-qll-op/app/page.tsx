"use client";

import React, { useState, useEffect, useMemo } from "react";
import Papa from "papaparse";

export default function Home() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  
  // State điều hướng (Thêm màn hình "Giữ Slot")
  const [activeNav, setActiveNav] = useState<"Đang học" | "Khai giảng" | "Giữ Slot">("Giữ Slot");
  const [searchTerm, setSearchTerm] = useState("");
  
  // State bộ lọc
  const [filterMonHoc, setFilterMonHoc] = useState("Tất cả");
  const [filterKhoi, setFilterKhoi] = useState("Tất cả");
  const [filterLoaiLop, setFilterLoaiLop] = useState("Tất cả");
  const [filterLichHoc, setFilterLichHoc] = useState("Tất cả");

  // NÚT MỚI: State quản lý nút "Hôm nay"
  const [filterToday, setFilterToday] = useState(false);

  // State quản lý dropdown tùy chỉnh
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // ==========================================
  // STATE MỚI: HIỆU ỨNG GÕ CHỮ LIÊN TỤC
  // ==========================================
  const typingWords = useMemo(() => ["Xin chào", "hello"], []);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Quản lý giữ slot
  const [heldSlots, setHeldSlots] = useState<Record<string, number>>({});
  const [isHoldingSlot, setIsHoldingSlot] = useState<string | null>(null);

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const SHEET_CSV_URL = "/api/sheet";

  const loadData = () => {
    setLoading(true);
    Papa.parse(SHEET_CSV_URL, {
      download: true,
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          setData(results.data); 
        }
        setLoading(false);
        
        const now = new Date();
        const timeStr = now.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const dateStr = now.toLocaleDateString("vi-VN");
        setLastUpdated(`${timeStr}\n${dateStr}`);
      },
      error: (err) => {
        console.error("Lỗi:", err);
        setLoading(false);
      }
    });
  };

  useEffect(() => {
    loadData();

    const intervalId = setInterval(() => {
      loadData();
    }, 60 * 60 * 1000); 

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeNav, filterLoaiLop, filterKhoi, filterMonHoc, filterLichHoc, filterToday]);

  // ==========================================
  // EFFECT MỚI: CHẠY ANIMATION GÕ CHỮ
  // ==========================================
  useEffect(() => {
    const currentWord = typingWords[currentWordIndex];
    let timeout: NodeJS.Timeout;

    if (isDeleting) {
      if (displayedText.length > 0) {
        timeout = setTimeout(() => {
          setDisplayedText(currentWord.substring(0, displayedText.length - 1));
        }, 50); // Tốc độ xóa chữ
      } else {
        setIsDeleting(false);
        setCurrentWordIndex((prev) => (prev + 1) % typingWords.length);
      }
    } else {
      if (displayedText.length < currentWord.length) {
        timeout = setTimeout(() => {
          setDisplayedText(currentWord.substring(0, displayedText.length + 1));
        }, 150); // Tốc độ gõ chữ
      } else {
        timeout = setTimeout(() => {
          setIsDeleting(true);
        }, 2500); // Dừng lại 2.5s để đọc trước khi xóa
      }
    }
    return () => clearTimeout(timeout);
  }, [displayedText, isDeleting, currentWordIndex, typingWords]);

  const dropdownOptions = useMemo(() => {
    const loaiLopSet = new Set<string>();
    const khoiSet = new Set<string>();
    const monHocSet = new Set<string>();
    const daysOnlySet = new Set<string>();

    data.forEach(item => {
      if (item["Loại lớp"]) loaiLopSet.add(item["Loại lớp"].trim());
      if (item["Khối"]) khoiSet.add(item["Khối"].trim());
      if (item["Môn học"]) monHocSet.add(item["Môn học"].trim());
      if (item["Lịch học"]) {
        const fullLich = item["Lịch học"].trim();
        const daysPart = fullLich.split(" ")[0];
        if (daysPart) daysOnlySet.add(daysPart);
      }
    });

    const sortedKhoi = Array.from(khoiSet).sort((a, b) => {
      const numA = parseInt(a.replace(/[^0-9]/g, '')) || 0;
      const numB = parseInt(b.replace(/[^0-9]/g, '')) || 0;
      return numA - numB;
    });

    return {
      loaiLop: Array.from(loaiLopSet).sort(),
      khoi: sortedKhoi,
      monHoc: Array.from(monHocSet).sort(),
      lichHoc: Array.from(daysOnlySet).sort(),
    };
  }, [data]);

  const stats = useMemo(() => {
    const currentTabBase = data.filter(item => {
      const status = (item["Phân loại lớp"] || "").toLowerCase().trim();
      if (activeNav === "Giữ Slot") return true;
      return activeNav === "Đang học" ? status.includes("đang học") : status.includes("khai giảng");
    });

    return {
      total: data.length,
      studying: data.filter(d => (d["Phân loại lớp"] || "").toLowerCase().includes("đang học")).length,
      pending: data.filter(d => (d["Phân loại lớp"] || "").toLowerCase().includes("khai giảng")).length,
      tabTotal: currentTabBase.length
    };
  }, [data, activeNav]);

  const filteredData = useMemo(() => {
    const today = new Date().getDay();
    const todayStr = today === 0 ? "CN" : `T${today + 1}`;

    return data.filter((item) => {
      
      const monHocRule = (item["Môn học"] || "").toString().toLowerCase().trim();
      const loaiLopRawRule = (item["Loại lớp"] || "").toString().trim();
      const loaiLopRule = loaiLopRawRule.replace(/^Lớp\s+/i, "").trim();
      const dangHocRule = Number(item["Đang học"]) || 0;

      let isPassRule = false;

      if (monHocRule.includes("toán") || monHocRule.includes("toan")) {
        if (loaiLopRule === "1:6") isPassRule = dangHocRule <= 5;
        else if (loaiLopRule === "1:8") isPassRule = dangHocRule <= 8;
        else if (loaiLopRule === "1:10") isPassRule = dangHocRule <= 9;
        else if (loaiLopRule === "1:15") isPassRule = dangHocRule <= 19;
      } 
      else if (monHocRule.includes("tiếng anh") || monHocRule.includes("tieng anh") || monHocRule.includes("moet")) {
        if (loaiLopRule === "1:4") isPassRule = dangHocRule <= 2;
      } 
      else if (monHocRule.includes("khtn")) {
        if (loaiLopRule === "1:10") isPassRule = dangHocRule <= 9;
      } 
      else if (monHocRule.includes("ngữ văn") || monHocRule.includes("ngu van") || monHocRule.includes("văn")) {
        if (loaiLopRule === "1:4") isPassRule = dangHocRule <= 3;
      }

      if (!isPassRule) return false;

      if (activeNav !== "Giữ Slot") {
        const status = (item["Phân loại lớp"] || "").toLowerCase().trim();
        const matchNav = activeNav === "Đang học" ? status.includes("đang học") : status.includes("khai giảng");
        if (!matchNav) return false;
      }

      if (filterLoaiLop !== "Tất cả" && (item["Loại lớp"] || "").trim() !== filterLoaiLop) return false;
      if (filterKhoi !== "Tất cả" && (item["Khối"] || "").trim() !== filterKhoi) return false;
      if (filterMonHoc !== "Tất cả" && (item["Môn học"] || "").trim() !== filterMonHoc) return false;
      
      const itemLich = (item["Lịch học"] || "").trim();
      
      if (filterLichHoc !== "Tất cả") {
        if (!itemLich.startsWith(filterLichHoc)) return false;
      }
      if (filterToday) {
        if (!itemLich.includes(todayStr)) return false;
      }

      if (searchTerm) {
        const searchStr = searchTerm.toLowerCase().trim();
        const matchSearch = 
          (item["Mã lớp"] || "").toLowerCase().includes(searchStr) ||
          (item["Mã GV"] || "").toLowerCase().includes(searchStr) ||
          (item["Môn học"] || "").toLowerCase().includes(searchStr);
        if (!matchSearch) return false;
      }

      return true; 
    });
  }, [data, activeNav, searchTerm, filterLoaiLop, filterKhoi, filterMonHoc, filterLichHoc, filterToday]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  
  const currentTableData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage]);

"use client";

import React, { useState, useEffect, useMemo } from "react";
import Papa from "papaparse";

export default function Home() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  
  // State điều hướng
  const [activeNav, setActiveNav] = useState<"Đang học" | "Khai giảng" | "Giữ Slot">("Giữ Slot");
  const [searchTerm, setSearchTerm] = useState("");
  
  // State bộ lọc
  const [filterMonHoc, setFilterMonHoc] = useState("Tất cả");
  const [filterKhoi, setFilterKhoi] = useState("Tất cả");
  const [filterLoaiLop, setFilterLoaiLop] = useState("Tất cả");
  const [filterLichHoc, setFilterLichHoc] = useState("Tất cả");
  const [filterToday, setFilterToday] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Hiệu ứng gõ chữ
  const typingWords = useMemo(() => ["Xin chào", "hello", "sẵn sàng giữ slot!"], []);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Quản lý giữ slot
  const [heldSlots, setHeldSlots] = useState<Record<string, number>>({});
  const [isHoldingSlot, setIsHoldingSlot] = useState<string | null>(null);

  // ==========================================
  // STATE MỚI: QUẢN LÝ POPUP NHẬP SID / CID
  // ==========================================
  const [showModal, setShowModal] = useState(false);
  const [selectedRowForSlot, setSelectedRowForSlot] = useState<any>(null);
  const [slotAvailableCount, setSlotAvailableCount] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [inputError, setInputError] = useState("");

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const SHEET_CSV_URL = "/api/sheet";

  const loadData = () => {
    setLoading(true);
    Papa.parse(SHEET_CSV_URL, {
      download: true,
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          setData(results.data); 
        }
        setLoading(false);
        const now = new Date();
        const timeStr = now.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const dateStr = now.toLocaleDateString("vi-VN");
        setLastUpdated(`${timeStr}\n${dateStr}`);
      },
      error: (err) => {
        console.error("Lỗi:", err);
        setLoading(false);
      }
    });
  };

  useEffect(() => {
    loadData();
    const intervalId = setInterval(() => loadData(), 60 * 60 * 1000); 
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeNav, filterLoaiLop, filterKhoi, filterMonHoc, filterLichHoc, filterToday]);

  // Logic gõ chữ
  useEffect(() => {
    const currentWord = typingWords[currentWordIndex];
    let timeout: NodeJS.Timeout;

    if (isDeleting) {
      if (displayedText.length > 0) {
        timeout = setTimeout(() => {
          setDisplayedText(currentWord.substring(0, displayedText.length - 1));
        }, 50);
      } else {
        setIsDeleting(false);
        setCurrentWordIndex((prev) => (prev + 1) % typingWords.length);
      }
    } else {
      if (displayedText.length < currentWord.length) {
        timeout = setTimeout(() => {
          setDisplayedText(currentWord.substring(0, displayedText.length + 1));
        }, 150);
      } else {
        timeout = setTimeout(() => setIsDeleting(true), 2500);
      }
    }
    return () => clearTimeout(timeout);
  }, [displayedText, isDeleting, currentWordIndex, typingWords]);

  const dropdownOptions = useMemo(() => {
    const loaiLopSet = new Set<string>();
    const khoiSet = new Set<string>();
    const monHocSet = new Set<string>();
    const daysOnlySet = new Set<string>();

    data.forEach(item => {
      if (item["Loại lớp"]) loaiLopSet.add(item["Loại lớp"].trim());
      if (item["Khối"]) khoiSet.add(item["Khối"].trim());
      if (item["Môn học"]) monHocSet.add(item["Môn học"].trim());
      if (item["Lịch học"]) {
        const fullLich = item["Lịch học"].trim();
        const daysPart = fullLich.split(" ")[0];
        if (daysPart) daysOnlySet.add(daysPart);
      }
    });

    const sortedKhoi = Array.from(khoiSet).sort((a, b) => {
      const numA = parseInt(a.replace(/[^0-9]/g, '')) || 0;
      const numB = parseInt(b.replace(/[^0-9]/g, '')) || 0;
      return numA - numB;
    });

    return {
      loaiLop: Array.from(loaiLopSet).sort(),
      khoi: sortedKhoi,
      monHoc: Array.from(monHocSet).sort(),
      lichHoc: Array.from(daysOnlySet).sort(),
    };
  }, [data]);

  const stats = useMemo(() => {
    const currentTabBase = data.filter(item => {
      const status = (item["Phân loại lớp"] || "").toLowerCase().trim();
      if (activeNav === "Giữ Slot") return true;
      return activeNav === "Đang học" ? status.includes("đang học") : status.includes("khai giảng");
    });
    return {
      total: data.length,
      studying: data.filter(d => (d["Phân loại lớp"] || "").toLowerCase().includes("đang học")).length,
      pending: data.filter(d => (d["Phân loại lớp"] || "").toLowerCase().includes("khai giảng")).length,
      tabTotal: currentTabBase.length
    };
  }, [data, activeNav]);

  const filteredData = useMemo(() => {
    const today = new Date().getDay();
    const todayStr = today === 0 ? "CN" : `T${today + 1}`;

    return data.filter((item) => {
      const monHocRule = (item["Môn học"] || "").toString().toLowerCase().trim();
      const loaiLopRawRule = (item["Loại lớp"] || "").toString().trim();
      const loaiLopRule = loaiLopRawRule.replace(/^Lớp\s+/i, "").trim();
      const dangHocRule = Number(item["Đang học"]) || 0;
      let isPassRule = false;

      if (monHocRule.includes("toán") || monHocRule.includes("toan")) {
        if (loaiLopRule === "1:6") isPassRule = dangHocRule <= 5;
        else if (loaiLopRule === "1:8") isPassRule = dangHocRule <= 8;
        else if (loaiLopRule === "1:10") isPassRule = dangHocRule <= 9;
        else if (loaiLopRule === "1:15") isPassRule = dangHocRule <= 19;
      } else if (monHocRule.includes("tiếng anh") || monHocRule.includes("tieng anh") || monHocRule.includes("moet")) {
        if (loaiLopRule === "1:4") isPassRule = dangHocRule <= 2;
      } else if (monHocRule.includes("khtn")) {
        if (loaiLopRule === "1:10") isPassRule = dangHocRule <= 9;
      } else if (monHocRule.includes("ngữ văn") || monHocRule.includes("ngu van") || monHocRule.includes("văn")) {
        if (loaiLopRule === "1:4") isPassRule = dangHocRule <= 3;
      }

      if (!isPassRule) return false;

      if (activeNav !== "Giữ Slot") {
        const status = (item["Phân loại lớp"] || "").toLowerCase().trim();
        const matchNav = activeNav === "Đang học" ? status.includes("đang học") : status.includes("khai giảng");
        if (!matchNav) return false;
      }

      if (filterLoaiLop !== "Tất cả" && (item["Loại lớp"] || "").trim() !== filterLoaiLop) return false;
      if (filterKhoi !== "Tất cả" && (item["Khối"] || "").trim() !== filterKhoi) return false;
      if (filterMonHoc !== "Tất cả" && (item["Môn học"] || "").trim() !== filterMonHoc) return false;
      
      const itemLich = (item["Lịch học"] || "").trim();
      if (filterLichHoc !== "Tất cả" && !itemLich.startsWith(filterLichHoc)) return false;
      if (filterToday && !itemLich.includes(todayStr)) return false;

      if (searchTerm) {
        const searchStr = searchTerm.toLowerCase().trim();
        const matchSearch = 
          (item["Mã lớp"] || "").toLowerCase().includes(searchStr) ||
          (item["Mã GV"] || "").toLowerCase().includes(searchStr) ||
          (item["Môn học"] || "").toLowerCase().includes(searchStr);
        if (!matchSearch) return false;
      }
      return true; 
    });
  }, [data, activeNav, searchTerm, filterLoaiLop, filterKhoi, filterMonHoc, filterLichHoc, filterToday]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentTableData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage]);


  // ==========================================
  // BƯỚC 1: KHI BẤM NÚT "GIỮ SLOT" -> HIỆN POPUP
  // ==========================================
  const handleOpenPopup = (row: any, availableSlots: number) => {
    if (availableSlots <= 0) return;
    setSelectedRowForSlot(row);
    setSlotAvailableCount(availableSlots);
    setInputValue("");
    setInputError("");
    setShowModal(true); // Bật popup
  };


  // ==========================================
  // BƯỚC 2: XÁC NHẬN TỪ POPUP -> GỬI VỀ SHEET
  // ==========================================
  const handleConfirmKeepSlot = async () => {
    // Validate tối đa 8 số
    const cleanVal = inputValue.trim();
    if (!cleanVal) {
      setInputError("Vui lòng nhập SID hoặc CID!");
      return;
    }
    if (!/^\d+$/.test(cleanVal)) {
      setInputError("SID hoặc CID chỉ được phép chứa các chữ số!");
      return;
    }
    if (cleanVal.length > 8) {
      setInputError("Tối đa form 8 số!");
      return;
    }

    const row = selectedRowForSlot;
    const maLop = row["Mã lớp"];

    setShowModal(false); // Đóng popup
    setIsHoldingSlot(maLop);

    try {
      const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxNAdZGf5vLIQoP3TZA_kvyiT6OvZ2iMet91QFONP8rOKDGRZzVNFxx9XyE4TpXOKIi/exec";

      const startDate = new Date();
      const expiryDate = new Date();
      expiryDate.setDate(startDate.getDate() + 2); // Hạn 2 ngày

      const formatDate = (date: Date) => date.toLocaleDateString("vi-VN");

      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maLop: maLop,
          monHoc: row["Môn học"] || "",
          nguoiGiu: "Admin VH",
          team: "Vận Hành VH",
          ngayBatDau: formatDate(startDate),
          ngayHetHan: formatDate(expiryDate),
          note: `SID/CID: ${cleanVal}` // Đưa SID/CID vào mục Note gửi về Sheet
        })
      });

      setHeldSlots(prev => ({
        ...prev,
        [maLop]: (prev[maLop] || 0) + 1
      }));

    } catch (error) {
      console.error("Lỗi khi đẩy dữ liệu về sheet:", error);
      alert("Lỗi kết nối! Không thể lưu slot lên Google Sheet.");
    } finally {
      setIsHoldingSlot(null);
      setSelectedRowForSlot(null);
    }
  };


  const getSubjectStyle = (subject: string) => {
    const s = subject.toLowerCase();
    if (s.includes("toán") || s.includes("toan")) return "bg-blue-50 text-blue-600 border-blue-100";
    if (s.includes("tiếng anh") || s.includes("tieng anh") || s.includes("moet")) return "bg-rose-50 text-rose-600 border-rose-100";
    if (s.includes("khtn") || s.includes("khoa học")) return "bg-emerald-50 text-emerald-600 border-emerald-100";
    if (s.includes("ngữ văn") || s.includes("văn")) return "bg-purple-50 text-purple-600 border-purple-100";
    return "bg-slate-50 text-slate-600 border-slate-200"; 
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-amber-100 text-amber-700 border-amber-200", "bg-indigo-100 text-indigo-700 border-indigo-200",
      "bg-pink-100 text-pink-700 border-pink-200", "bg-cyan-100 text-cyan-700 border-cyan-200",
      "bg-teal-100 text-teal-700 border-teal-200"
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const renderCustomDropdown = (label: string, key: string, currentValue: string, options: string[], onChange: (val: string) => void, formatItem?: (val: string) => string) => {
    const isOpen = openDropdown === key;
    return (
      <div className="relative">
        <button type="button" onClick={() => setOpenDropdown(isOpen ? null : key)} className={`px-3.5 py-2 bg-white border rounded-xl font-semibold text-slate-700 shadow-sm text-xs flex items-center gap-2 transition-all cursor-pointer focus:outline-none ${isOpen || currentValue !== "Tất cả" ? "border-sky-500 ring-2 ring-sky-500/20 bg-sky-50/30 text-sky-700" : "border-slate-200 hover:border-sky-300"}`}>
          <span>{label}: <strong className="font-bold">{currentValue}</strong></span>
          <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
        </button>
        {isOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] py-2 z-50 animate-fade-slide-up">
            <div className="max-h-60 overflow-y-auto custom-scrollbar px-1.5 space-y-0.5">
              <div onClick={(e) => { e.stopPropagation(); onChange("Tất cả"); setOpenDropdown(null); }} className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${currentValue === "Tất cả" ? "bg-sky-500 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}>{label}: Tất cả</div>
              {options.map((opt, idx) => {
                const displayVal = formatItem ? formatItem(opt) : opt;
                const isSelected = currentValue === opt;
                return <div key={idx} onClick={(e) => { e.stopPropagation(); onChange(opt); setOpenDropdown(null); }} className={`px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors truncate ${isSelected ? "bg-sky-500 text-white shadow-sm" : "text-slate-700 hover:bg-slate-100"}`}>{displayVal}</div>;
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-[#F4F7FE] text-slate-700 font-vietnam overflow-hidden selection:bg-sky-500/30 relative">
      <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-sky-50/60 to-transparent pointer-events-none -z-0"></div>

      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col z-20 shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="h-20 flex items-center px-6 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3 group cursor-pointer">
            <img src="https://xcdn-cf.vuihoc.vn/theme/vuihoc/imgs/vuihoc_logo_final.png" alt="Vuihoc Logo" className="h-6 w-auto object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-300"/>
            <div className="border-l-[1.5px] border-slate-200 pl-3">
              <p className="text-[9px] text-sky-500 font-bold uppercase tracking-widest mt-1">Vận Hành</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 mt-2 px-2">Quản lý báo cáo</div>
          <button onClick={() => setActiveNav("Đang học")} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 ease-out focus:outline-none relative group ${activeNav === "Đang học" ? "bg-sky-50/80 text-sky-600 font-bold shadow-[0_2px_10px_rgba(14,165,233,0.05)]" : "text-slate-500 hover:bg-slate-50 hover:text-sky-500 font-medium"}`}>
            <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-sky-500 rounded-r-full transition-all duration-300 ease-out shadow-[0_0_8px_rgba(14,165,233,0.4)] ${activeNav === "Đang học" ? "opacity-100 scale-y-100" : "opacity-0 scale-y-0"}`}></div>
            <span className={`text-xl transition-transform duration-300 ${activeNav === "Đang học" ? "scale-110" : "group-hover:scale-110"}`}>📚</span>
            <span>Lớp Đang Học</span>
          </button>
          <button onClick={() => setActiveNav("Khai giảng")} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 ease-out focus:outline-none relative group ${activeNav === "Khai giảng" ? "bg-sky-50/80 text-sky-600 font-bold shadow-[0_2px_10px_rgba(14,165,233,0.05)]" : "text-slate-500 hover:bg-slate-50 hover:text-sky-500 font-medium"}`}>
            <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-sky-500 rounded-r-full transition-all duration-300 ease-out shadow-[0_0_8px_rgba(14,165,233,0.4)] ${activeNav === "Khai giảng" ? "opacity-100 scale-y-100" : "opacity-0 scale-y-0"}`}></div>
            <span className={`text-xl transition-transform duration-300 ${activeNav === "Khai giảng" ? "scale-110" : "group-hover:scale-110"}`}>🚀</span>
            <span>Chờ Khai Giảng</span>
          </button>

          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 mt-6 px-2">Tác vụ chuyên biệt</div>
          <button onClick={() => setActiveNav("Giữ Slot")} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 ease-out focus:outline-none relative group ${activeNav === "Giữ Slot" ? "bg-orange-50 text-orange-600 font-bold shadow-[0_2px_10px_rgba(249,115,22,0.1)]" : "text-slate-500 hover:bg-orange-50/50 hover:text-orange-500 font-medium"}`}>
            <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-orange-500 rounded-r-full transition-all duration-300 ease-out shadow-[0_0_8px_rgba(249,115,22,0.4)] ${activeNav === "Giữ Slot" ? "opacity-100 scale-y-100" : "opacity-0 scale-y-0"}`}></div>
            <span className={`text-xl transition-transform duration-300 ${activeNav === "Giữ Slot" ? "scale-110" : "group-hover:scale-110"}`}>📌</span>
            <span>Giữ Slot Lớp</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50/30 shrink-0">
          <div className="flex items-center gap-3 px-2 cursor-pointer group">
            <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-orange-500 font-bold shadow-sm group-hover:border-orange-200 transition-colors">AD</div>
            <div className="text-sm">
              <p className="font-bold text-slate-700 group-hover:text-orange-500 transition-colors">Admin VH</p>
              <div className="flex items-center gap-1.5 text-emerald-500 text-xs mt-0.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Connected
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
        <header className="h-20 bg-white/90 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-8 shrink-0 z-20 shadow-[0_2px_10px_rgba(0,0,0,0.01)]">
          <div className="flex-1 max-w-xl relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className="text-slate-400 group-focus-within:text-sky-500 transition-colors">🔍</span>
            </div>
            <input type="text" placeholder="Tìm kiếm nhanh Mã lớp, Mã GV, Môn học..." className="w-full pl-12 pr-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 text-slate-700 placeholder-slate-400 transition-all duration-300 text-sm font-medium hover:bg-white focus:bg-white focus:shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>

          <div className="flex items-center gap-4">
            {lastUpdated && (
              <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline-block">Cập nhật lúc: <strong className="text-slate-600">{lastUpdated}</strong></span>
            )}
            <button onClick={loadData} disabled={loading} className={`px-6 py-2.5 text-sm font-bold rounded-full shadow-sm transition-all duration-300 flex items-center gap-2.5 focus:outline-none active:scale-95 ${loading ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200" : "bg-sky-500 text-white hover:bg-sky-600 border border-sky-500 hover:shadow-[0_4px_15px_rgba(14,165,233,0.3)]"}`}>
              {!loading && <div className="absolute inset-0 -translate-x-full bg-white/20 group-hover:animate-shine skew-x-12"></div>}
              {loading ? (
                <><svg className="animate-spin h-4 w-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Updating...</>
              ) : (
                <><span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span></span><span className="relative z-10">Update</span></>
              )}
            </button>
          </div>
        </header>

        <div className="px-8 pt-8 pb-5 shrink-0 animate-fade-slide-down">
          <div className="flex items-center gap-4 mb-6">
            <img src="https://lh3.googleusercontent.com/d/1OUQHIpJzHQ-Xugd1BBN0eDR9Bt-cW0_f" alt="Bitu Mascot" className="h-15 w-auto object-contain drop-shadow-md animate-bounce-bitu"/>
            <h2 className="text-[30px] font-greeting text-slate-800 tracking-wide flex items-center gap-2 pt-1 h-[45px]">
              <span>Vận hành, </span>
              <div className="flex items-center">
                <span className="text-orange-500 font-handwriting text-[36px] font-bold tracking-normal leading-none -mb-2">{displayedText}</span>
                <span className="w-[3px] h-[30px] bg-orange-500 ml-1.5 animate-cursor-blink rounded-full"></span>
              </div>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-white via-white to-sky-50/40 border-2 border-sky-100/80 rounded-3xl p-6 shadow-[0_10px_30px_rgba(14,165,233,0.08)] relative overflow-hidden group hover:shadow-[0_20px_40px_rgba(14,165,233,0.15)] transition-all duration-300 hover:-translate-y-1.5">
              <div className="absolute top-0 right-0 w-32 h-32 bg-sky-400/10 rounded-bl-full -mr-8 -mt-8 transition-transform duration-500 group-hover:scale-125"></div>
              <p className="text-sky-600 text-[11px] font-extrabold uppercase tracking-widest mb-2 relative z-10">Tổng Lớp</p>
              <div className="flex items-baseline gap-2 relative z-10">
                <span className="text-4xl font-extrabold text-slate-900">{stats.total}</span>
                <span className="text-slate-500 text-sm font-semibold">hệ thống</span>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-white via-white to-blue-50/40 border-2 border-blue-100/80 rounded-3xl p-6 shadow-[0_10px_30px_rgba(37,99,235,0.08)] relative overflow-hidden group hover:shadow-[0_20px_40px_rgba(37,99,235,0.15)] transition-all duration-300 hover:-translate-y-1.5">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 rounded-bl-full -mr-8 -mt-8 transition-transform duration-500 group-hover:scale-125"></div>
              <p className="text-blue-600 text-[11px] font-extrabold uppercase tracking-widest mb-2 relative z-10">Đang Học</p>
              <div className="flex items-baseline gap-2 relative z-10">
                <span className="text-4xl font-extrabold text-blue-600">{stats.studying}</span>
                <span className="text-slate-500 text-sm font-semibold">đang chạy</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white via-white to-orange-50/40 border-2 border-orange-100/80 rounded-3xl p-6 shadow-[0_10px_30px_rgba(249,115,22,0.08)] relative overflow-hidden group hover:shadow-[0_20px_40px_rgba(249,115,22,0.15)] transition-all duration-300 hover:-translate-y-1.5">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-400/10 rounded-bl-full -mr-8 -mt-8 transition-transform duration-500 group-hover:scale-125"></div>
              <p className="text-orange-600 text-[11px] font-extrabold uppercase tracking-widest mb-2 relative z-10">Chờ Khai Giảng</p>
              <div className="flex items-baseline gap-2 relative z-10">
                <span className="text-4xl font-extrabold text-orange-500">{stats.pending}</span>
                <span className="text-slate-500 text-sm font-semibold">chờ khai giảng</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 px-8 pb-8 min-h-0 flex flex-col">
          <div className="bg-white rounded-3xl shadow-[0_4px_24px_rgb(0,0,0,0.03)] border border-slate-100 flex flex-col h-full overflow-hidden">
            
            <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap gap-3 justify-between items-center bg-white shrink-0 z-30 relative">
              <h3 className="font-bold text-slate-800 flex items-center gap-3 text-base">
                <span className="w-1.5 h-6 bg-sky-500 rounded-full shadow-[0_0_8px_rgba(14,165,233,0.5)]"></span>
                {activeNav === "Giữ Slot" ? "📌 Bảng Tác Vụ Giữ Slot Chuyên Biệt" : `Daily — Dữ liệu ${activeNav}`}
              </h3>

              <div className="flex flex-wrap items-center gap-2.5">
                {renderCustomDropdown("Môn", "mon", filterMonHoc, dropdownOptions.monHoc, setFilterMonHoc)}
                {renderCustomDropdown("Khối", "khoi", filterKhoi, dropdownOptions.khoi, setFilterKhoi, (val) => `Khối ${val}`)}
                {renderCustomDropdown("Loại lớp", "loai", filterLoaiLop, dropdownOptions.loaiLop, setFilterLoaiLop)}
                {renderCustomDropdown("Lịch", "lich", filterLichHoc, dropdownOptions.lichHoc, setFilterLichHoc)}
                
                <button type="button" onClick={() => setFilterToday(!filterToday)} className={`px-4 py-2 border rounded-xl font-bold text-xs flex items-center gap-2 focus:outline-none transition-all duration-200 active:scale-95 ${filterToday ? "bg-orange-50 border-orange-400 text-orange-600 shadow-sm" : "bg-white border-slate-200 text-slate-600 hover:border-orange-300 hover:bg-orange-50/30 hover:text-orange-500"}`}>
                  <span className="text-sm">{filterToday ? "📅" : "🗓️"}</span>{filterToday ? "Đang chọn: Hôm nay" : "Hôm nay"}
                </button>

                <span className="font-extrabold px-3.5 py-2 bg-sky-50 text-sky-600 rounded-xl border border-sky-100 shadow-sm text-xs">
                  {filteredData.length} kết quả
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar relative bg-white">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="text-[12px] text-slate-400 uppercase bg-slate-50 font-bold tracking-wider sticky top-0 z-20 shadow-sm border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Mã lớp</th>
                    <th className="px-6 py-4">Môn học</th>
                    <th className="px-6 py-4">Loại lớp</th>
                    <th className="px-6 py-4 text-center">Khối</th>
                    <th className="px-6 py-4">Trình độ</th>
                    <th className="px-6 py-4">Mã GV</th>
                    <th className="px-6 py-4">Giáo trình</th>
                    <th className="px-6 py-4">Lịch học</th>
                    <th className="px-6 py-4 text-center">Đang học</th>
                    
                    {activeNav === "Giữ Slot" && <th className="px-6 py-4 text-center text-orange-600">Số slot còn</th>}
                    {activeNav === "Giữ Slot" && <th className="px-6 py-4 text-right pr-8 text-orange-600">Thao tác giữ</th>}
                  </tr>
                </thead>
                <tbody key={`${activeNav}-${currentPage}-${filterLoaiLop}-${filterKhoi}-${filterMonHoc}-${filterLichHoc}-${filterToday}`} className="divide-y divide-slate-50">
                  {currentTableData.length > 0 ? (
                    currentTableData.map((row, index) => {
                      const maLop = row["Mã lớp"];
                      const subjectStr = row["Môn học"] || "";
                      const teacherStr = row["Mã GV"] || "GV";
                      const teacherInitials = teacherStr.substring(0, 2).toUpperCase();
                      const currentStudents = Number(row["Đang học"]) || 0;
                      const loaiLopStr = row["Loại lớp"] || "";

                      const match = loaiLopStr.match(/1:(\d+)/);
                      const maxStudents = match ? parseInt(match[1]) : 99;
                      const heldCount = heldSlots[maLop] || 0;
                      const availableSlots = maxStudents - currentStudents - heldCount;
                      const isFull = availableSlots <= 0;
                      const isLoading = isHoldingSlot === maLop;

                      return (
                        <tr 
                          key={`${maLop}-${index}`} 
                          className="hover:bg-sky-50/40 transition-all duration-200 group/row opacity-0 animate-fade-slide-up-stagger"
                          style={{ animationDelay: `${index * 0.03}s`, animationFillMode: 'forwards' }}
                        >
                          <td className="px-6 py-4 font-bold text-sky-600">{maLop}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md border ${getSubjectStyle(subjectStr)}`}>
                              {subjectStr}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-500 text-[13px]">{loaiLopStr}</td>
                          <td className="px-6 py-4 text-center font-bold text-slate-600">{row["Khối"]}</td>
                          <td className="px-6 py-4 font-medium text-slate-600">{row["Trình độ"]}</td>
                          
                          <td className="px-6 py-4 font-bold text-slate-700">
                            <div className="flex items-center gap-2">
                              <span className={`flex items-center justify-center w-7 h-7 rounded-full text-[10px] border ${getAvatarColor(teacherStr)} shadow-sm`}>
                                {teacherInitials}
                              </span>
                              <span>{teacherStr}</span>
                            </div>
                          </td>

                          <td className="px-6 py-4 text-slate-500 text-[13px] truncate max-w-[120px]">{row["Giáo trình"]}</td>
                          <td className="px-6 py-4 font-medium text-slate-600">{row["Lịch học"]}</td>
                          
                          <td className="px-6 py-4 text-center">
                            <span className="px-2.5 py-1 bg-sky-50/80 text-sky-600 border border-sky-100 rounded-md font-bold">{currentStudents + heldCount}</span>
                          </td>

                          {activeNav === "Giữ Slot" && (
                            <>
                              <td className="px-6 py-4 text-center">
                                <span className={`px-2.5 py-1 rounded-md font-bold text-xs border ${availableSlots > 0 ? "bg-orange-50 text-orange-600 border-orange-200" : "bg-slate-100 text-slate-400 border-slate-200"}`}>
                                  {availableSlots > 0 ? `Còn ${availableSlots} slot` : "Đã hết slot"}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right pr-6 min-w-[130px]">
                                <button 
                                  onClick={() => handleOpenPopup(row, availableSlots)}
                                  disabled={isFull || isLoading}
                                  className={`px-4 py-1.5 border font-bold rounded-lg focus:outline-none transition-all duration-300 text-xs w-full max-w-[110px] text-center shadow-sm
                                    ${isFull 
                                      ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' 
                                      : 'bg-orange-500 border-orange-500 text-white hover:bg-orange-600 active:scale-95'
                                    }`}
                                >
                                  {isLoading ? (
                                    <svg className="animate-spin h-3.5 w-3.5 mx-auto text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                  ) : isFull ? (
                                    "Hết Slot"
                                  ) : (
                                    "Giữ Slot"
                                  )}
                                </button>
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={activeNav === "Giữ Slot" ? 11 : 9} className="px-6 py-24 text-center">
                        <div className="flex flex-col items-center justify-center text-slate-400">
                          <div className="w-20 h-20 mb-4 rounded-full bg-slate-50 flex items-center justify-center border-2 border-dashed border-slate-200">
                            <span className="text-3xl opacity-60">📭</span>
                          </div>
                          <p className="font-bold text-slate-500 text-lg mb-1">Không tìm thấy dữ liệu phù hợp</p>
                          <p className="text-sm font-medium">Hãy thử thay đổi điều kiện bộ lọc hoặc từ khóa tìm kiếm.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-slate-100 shrink-0 z-10">
                <span className="text-[13px] text-slate-500 font-bold tracking-wide uppercase">
                  Page <span className="text-sky-600 text-sm mx-1">{currentPage}</span> / {totalPages}
                </span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-5 py-2 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-slate-500 focus:outline-none hover:text-sky-600 hover:border-sky-300 hover:bg-sky-50 disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-slate-200 disabled:hover:text-slate-500 transition-colors active:scale-95"
                  >
                    ← Back
                  </button>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-5 py-2 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-slate-500 focus:outline-none hover:text-sky-600 hover:border-sky-300 hover:bg-sky-50 disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-slate-200 disabled:hover:text-slate-500 transition-colors active:scale-95"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
            
          </div>
        </div>
      </main>

      {/* ========================================== */}
      {/* MODAL / POPUP NHẬP SID HOẶC CID (TỐI ĐA 8 SỐ) */}
      {/* ========================================== */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-slide-up">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center text-xl font-bold">
                📌
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Xác nhận Giữ Slot</h3>
                <p className="text-xs text-slate-500">Mã lớp: <strong className="text-sky-600">{selectedRowForSlot?.["Mã lớp"]}</strong></p>
              </div>
            </div>

            <div className="space-y-4 my-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nhập SID hoặc CID học sinh <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text"
                  maxLength={8}
                  placeholder="Nhập tối đa 8 số (VD: 12345678)"
                  value={inputValue}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^\d*$/.test(val) && val.length <= 8) {
                      setInputValue(val);
                      setInputError("");
                    }
                  }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 text-slate-800 font-bold text-sm transition-all"
                  autoFocus
                />
                {inputError ? (
                  <p className="text-[11px] font-bold text-red-500 mt-1.5">{inputError}</p>
                ) : (
                  <p className="text-[11px] font-medium text-slate-400 mt-1.5">Gợi ý: Tối đa form 8 số</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button 
                type="button"
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button 
                type="button"
                onClick={handleConfirmKeepSlot}
                className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-orange-500/30 transition-all cursor-pointer active:scale-95"
              >
                Xác nhận Giữ Slot
              </button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=Caveat:wght@600;700&display=swap');
        
        .font-vietnam { font-family: 'Be Vietnam Pro', sans-serif; }
        .font-greeting { font-family: 'Baloo 2', cursive; }
        .font-handwriting { font-family: 'Caveat', cursive; }

        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94A3B8; }
        
        @keyframes bounceBitu {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-bounce-bitu { animation: bounceBitu 1.5s infinite ease-in-out; }

        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-slide-down { animation: fadeSlideDown 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

        @keyframes fadeSlideUpStagger {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-slide-up-stagger { animation: fadeSlideUpStagger 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

        @keyframes cursorBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .animate-cursor-blink { animation: cursorBlink 0.8s infinite; }
      `}} />
    </div>
  );
}

  const renderCustomDropdown = (
    label: string, 
    key: string, 
    currentValue: string, 
    options: string[], 
    onChange: (val: string) => void,
    formatItem?: (val: string) => string
  ) => {
    const isOpen = openDropdown === key;

    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpenDropdown(isOpen ? null : key)}
          className={`px-3.5 py-2 bg-white border rounded-xl font-semibold text-slate-700 shadow-sm text-xs flex items-center gap-2 transition-all cursor-pointer focus:outline-none ${
            isOpen || currentValue !== "Tất cả" 
              ? "border-sky-500 ring-2 ring-sky-500/20 bg-sky-50/30 text-sky-700" 
              : "border-slate-200 hover:border-sky-300"
          }`}
        >
          <span>{label}: <strong className="font-bold">{currentValue}</strong></span>
          <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] py-2 z-50 animate-fade-slide-up">
            <div className="max-h-60 overflow-y-auto custom-scrollbar px-1.5 space-y-0.5">
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onChange("Tất cả");
                  setOpenDropdown(null);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                  currentValue === "Tất cả" ? "bg-sky-500 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {label}: Tất cả
              </div>
              {options.map((opt, idx) => {
                const displayVal = formatItem ? formatItem(opt) : opt;
                const isSelected = currentValue === opt;
                return (
                  <div
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange(opt);
                      setOpenDropdown(null);
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors truncate ${
                      isSelected ? "bg-sky-500 text-white shadow-sm" : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {displayVal}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const getSubjectStyle = (subject: string) => {
    const s = subject.toLowerCase();
    if (s.includes("toán") || s.includes("toan")) {
      return "bg-blue-50 text-blue-600 border-blue-100";
    }
    if (s.includes("tiếng anh") || s.includes("tieng anh") || s.includes("moet")) {
      return "bg-rose-50 text-rose-600 border-rose-100";
    }
    if (s.includes("khtn") || s.includes("khoa học")) {
      return "bg-emerald-50 text-emerald-600 border-emerald-100";
    }
    if (s.includes("ngữ văn") || s.includes("văn")) {
      return "bg-purple-50 text-purple-600 border-purple-100";
    }
    return "bg-slate-50 text-slate-600 border-slate-200"; 
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-amber-100 text-amber-700 border-amber-200",
      "bg-indigo-100 text-indigo-700 border-indigo-200",
      "bg-pink-100 text-pink-700 border-pink-200",
      "bg-cyan-100 text-cyan-700 border-cyan-200",
      "bg-teal-100 text-teal-700 border-teal-200"
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="flex h-screen bg-[#F4F7FE] text-slate-700 font-vietnam overflow-hidden selection:bg-sky-500/30 relative">
      <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-sky-50/60 to-transparent pointer-events-none -z-0"></div>

      <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col z-20 shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        
        <div className="h-20 flex items-center px-6 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3 group cursor-pointer">
            <img 
              src="https://xcdn-cf.vuihoc.vn/theme/vuihoc/imgs/vuihoc_logo_final.png" 
              alt="Vuihoc Logo" 
              className="h-6 w-auto object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-300"
            />
            <div className="border-l-[1.5px] border-slate-200 pl-3">
              <p className="text-[9px] text-sky-500 font-bold uppercase tracking-widest mt-1">Vận Hành</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 mt-2 px-2">
            Quản lý báo cáo
          </div>
          
          <button
            onClick={() => setActiveNav("Đang học")}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 ease-out focus:outline-none relative group ${
              activeNav === "Đang học" 
                ? "bg-sky-50/80 text-sky-600 font-bold shadow-[0_2px_10px_rgba(14,165,233,0.05)]" 
                : "text-slate-500 hover:bg-slate-50 hover:text-sky-500 font-medium"
            }`}
          >
            <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-sky-500 rounded-r-full transition-all duration-300 ease-out shadow-[0_0_8px_rgba(14,165,233,0.4)] ${activeNav === "Đang học" ? "opacity-100 scale-y-100" : "opacity-0 scale-y-0"}`}></div>
            <span className={`text-xl transition-transform duration-300 ${activeNav === "Đang học" ? "scale-110" : "group-hover:scale-110"}`}>📚</span>
            <span>Lớp Đang Học</span>
          </button>

          <button
            onClick={() => setActiveNav("Khai giảng")}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 ease-out focus:outline-none relative group ${
              activeNav === "Khai giảng" 
                ? "bg-sky-50/80 text-sky-600 font-bold shadow-[0_2px_10px_rgba(14,165,233,0.05)]" 
                : "text-slate-500 hover:bg-slate-50 hover:text-sky-500 font-medium"
            }`}
          >
            <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-sky-500 rounded-r-full transition-all duration-300 ease-out shadow-[0_0_8px_rgba(14,165,233,0.4)] ${activeNav === "Khai giảng" ? "opacity-100 scale-y-100" : "opacity-0 scale-y-0"}`}></div>
            <span className={`text-xl transition-transform duration-300 ${activeNav === "Khai giảng" ? "scale-110" : "group-hover:scale-110"}`}>🚀</span>
            <span>Chờ Khai Giảng</span>
          </button>

          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 mt-6 px-2">
            Tác vụ chuyên biệt
          </div>

          <button
            onClick={() => setActiveNav("Giữ Slot")}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 ease-out focus:outline-none relative group ${
              activeNav === "Giữ Slot" 
                ? "bg-orange-50 text-orange-600 font-bold shadow-[0_2px_10px_rgba(249,115,22,0.1)]" 
                : "text-slate-500 hover:bg-orange-50/50 hover:text-orange-500 font-medium"
            }`}
          >
            <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-orange-500 rounded-r-full transition-all duration-300 ease-out shadow-[0_0_8px_rgba(249,115,22,0.4)] ${activeNav === "Giữ Slot" ? "opacity-100 scale-y-100" : "opacity-0 scale-y-0"}`}></div>
            <span className={`text-xl transition-transform duration-300 ${activeNav === "Giữ Slot" ? "scale-110" : "group-hover:scale-110"}`}>📌</span>
            <span>Giữ Slot Lớp</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50/30 shrink-0">
          <div className="flex items-center gap-3 px-2 cursor-pointer group">
            <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-orange-500 font-bold shadow-sm group-hover:border-orange-200 transition-colors">
              AD
            </div>
            <div className="text-sm">
              <p className="font-bold text-slate-700 group-hover:text-orange-500 transition-colors">Admin VH</p>
              <div className="flex items-center gap-1.5 text-emerald-500 text-xs mt-0.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Connected
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
        
        <header className="h-20 bg-white/90 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-8 shrink-0 z-20 shadow-[0_2px_10px_rgba(0,0,0,0.01)]">
          <div className="flex-1 max-w-xl relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className="text-slate-400 group-focus-within:text-sky-500 transition-colors">🔍</span>
            </div>
            <input 
              type="text" 
              placeholder="Tìm kiếm nhanh Mã lớp, Mã GV, Môn học..." 
              className="w-full pl-12 pr-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 text-slate-700 placeholder-slate-400 transition-all duration-300 text-sm font-medium hover:bg-white focus:bg-white focus:shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-4">
            {lastUpdated && (
              <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline-block">
                Cập nhật lúc: <strong className="text-slate-600">{lastUpdated}</strong>
              </span>
            )}
            
            <button 
              onClick={loadData}
              disabled={loading}
              className={`px-6 py-2.5 text-sm font-bold rounded-full shadow-sm transition-all duration-300 flex items-center gap-2.5 focus:outline-none active:scale-95
                ${loading 
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200" 
                  : "bg-sky-500 text-white hover:bg-sky-600 border border-sky-500 hover:shadow-[0_4px_15px_rgba(14,165,233,0.3)]"}`}
            >
              {!loading && <div className="absolute inset-0 -translate-x-full bg-white/20 group-hover:animate-shine skew-x-12"></div>}
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating...
                </>
              ) : (
                <>
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                  </span>
                  <span className="relative z-10">Update</span>
                </>
              )}
            </button>
          </div>
        </header>

        <div className="px-8 pt-8 pb-5 shrink-0 animate-fade-slide-down">
          <div className="flex items-center gap-4 mb-6">
            <img 
              src="https://lh3.googleusercontent.com/d/1OUQHIpJzHQ-Xugd1BBN0eDR9Bt-cW0_f" 
              alt="Bitu Mascot" 
              className="h-15 w-auto object-contain drop-shadow-md animate-bounce-bitu"
            />
            <h2 className="text-[30px] font-greeting text-slate-800 tracking-wide flex items-center gap-2 pt-1 h-[45px]">
              <span>Vận hành, </span>
              <div className="flex items-center">
                <span className="text-orange-500 font-handwriting text-[36px] font-bold tracking-normal leading-none -mb-2">
                  {displayedText}
                </span>
                <span className="w-[3px] h-[30px] bg-orange-500 ml-1.5 animate-cursor-blink rounded-full"></span>
              </div>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-white via-white to-sky-50/40 border-2 border-sky-100/80 rounded-3xl p-6 shadow-[0_10px_30px_rgba(14,165,233,0.08)] relative overflow-hidden group hover:shadow-[0_20px_40px_rgba(14,165,233,0.15)] transition-all duration-300 hover:-translate-y-1.5">
              <div className="absolute top-0 right-0 w-32 h-32 bg-sky-400/10 rounded-bl-full -mr-8 -mt-8 transition-transform duration-500 group-hover:scale-125"></div>
              <p className="text-sky-600 text-[11px] font-extrabold uppercase tracking-widest mb-2 relative z-10">Tổng Lớp</p>
              <div className="flex items-baseline gap-2 relative z-10">
                <span className="text-4xl font-extrabold text-slate-900">{stats.total}</span>
                <span className="text-slate-500 text-sm font-semibold">hệ thống</span>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-white via-white to-blue-50/40 border-2 border-blue-100/80 rounded-3xl p-6 shadow-[0_10px_30px_rgba(37,99,235,0.08)] relative overflow-hidden group hover:shadow-[0_20px_40px_rgba(37,99,235,0.15)] transition-all duration-300 hover:-translate-y-1.5">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 rounded-bl-full -mr-8 -mt-8 transition-transform duration-500 group-hover:scale-125"></div>
              <p className="text-blue-600 text-[11px] font-extrabold uppercase tracking-widest mb-2 relative z-10">Đang Học</p>
              <div className="flex items-baseline gap-2 relative z-10">
                <span className="text-4xl font-extrabold text-blue-600">{stats.studying}</span>
                <span className="text-slate-500 text-sm font-semibold">đang chạy</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white via-white to-orange-50/40 border-2 border-orange-100/80 rounded-3xl p-6 shadow-[0_10px_30px_rgba(249,115,22,0.08)] relative overflow-hidden group hover:shadow-[0_20px_40px_rgba(249,115,22,0.15)] transition-all duration-300 hover:-translate-y-1.5">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-400/10 rounded-bl-full -mr-8 -mt-8 transition-transform duration-500 group-hover:scale-125"></div>
              <p className="text-orange-600 text-[11px] font-extrabold uppercase tracking-widest mb-2 relative z-10">Chờ Khai Giảng</p>
              <div className="flex items-baseline gap-2 relative z-10">
                <span className="text-4xl font-extrabold text-orange-500">{stats.pending}</span>
                <span className="text-slate-500 text-sm font-semibold">chờ khai giảng</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 px-8 pb-8 min-h-0 flex flex-col">
          <div className="bg-white rounded-3xl shadow-[0_4px_24px_rgb(0,0,0,0.03)] border border-slate-100 flex flex-col h-full overflow-hidden">
            
            <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap gap-3 justify-between items-center bg-white shrink-0 z-30 relative">
              <h3 className="font-bold text-slate-800 flex items-center gap-3 text-base">
                <span className="w-1.5 h-6 bg-sky-500 rounded-full shadow-[0_0_8px_rgba(14,165,233,0.5)]"></span>
                {activeNav === "Giữ Slot" ? "📌 Bảng Tác Vụ Giữ Slot Chuyên Biệt" : `Daily — Dữ liệu ${activeNav}`}
              </h3>

              <div className="flex flex-wrap items-center gap-2.5">
                {renderCustomDropdown("Môn", "mon", filterMonHoc, dropdownOptions.monHoc, setFilterMonHoc)}
                {renderCustomDropdown("Khối", "khoi", filterKhoi, dropdownOptions.khoi, setFilterKhoi, (val) => `Khối ${val}`)}
                {renderCustomDropdown("Loại lớp", "loai", filterLoaiLop, dropdownOptions.loaiLop, setFilterLoaiLop)}
                {renderCustomDropdown("Lịch", "lich", filterLichHoc, dropdownOptions.lichHoc, setFilterLichHoc)}
                
                <button
                  type="button"
                  onClick={() => setFilterToday(!filterToday)}
                  className={`px-4 py-2 border rounded-xl font-bold text-xs flex items-center gap-2 focus:outline-none transition-all duration-200 active:scale-95 ${
                    filterToday
                      ? "bg-orange-50 border-orange-400 text-orange-600 shadow-sm"
                      : "bg-white border-slate-200 text-slate-600 hover:border-orange-300 hover:bg-orange-50/30 hover:text-orange-500"
                  }`}
                >
                  <span className="text-sm">{filterToday ? "📅" : "🗓️"}</span>
                  {filterToday ? "Đang chọn: Hôm nay" : "Hôm nay"}
                </button>

                <span className="font-extrabold px-3.5 py-2 bg-sky-50 text-sky-600 rounded-xl border border-sky-100 shadow-sm text-xs">
                  {filteredData.length} kết quả
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar relative bg-white">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="text-[12px] text-slate-400 uppercase bg-slate-50 font-bold tracking-wider sticky top-0 z-20 shadow-sm border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Mã lớp</th>
                    <th className="px-6 py-4">Môn học</th>
                    <th className="px-6 py-4">Loại lớp</th>
                    <th className="px-6 py-4 text-center">Khối</th>
                    <th className="px-6 py-4">Trình độ</th>
                    <th className="px-6 py-4">Mã GV</th>
                    <th className="px-6 py-4">Giáo trình</th>
                    <th className="px-6 py-4">Lịch học</th>
                    <th className="px-6 py-4 text-center">Đang học</th>
                    
                    {/* CỘT THAO TÁC RIÊNG CHO MÀN HÌNH "GIỮ SLOT" */}
                    {activeNav === "Giữ Slot" && <th className="px-6 py-4 text-center text-orange-600">Số slot còn</th>}
                    {activeNav === "Giữ Slot" && <th className="px-6 py-4 text-right pr-8 text-orange-600">Thao tác giữ</th>}
                  </tr>
                </thead>
                <tbody key={`${activeNav}-${currentPage}-${filterLoaiLop}-${filterKhoi}-${filterMonHoc}-${filterLichHoc}-${filterToday}`} className="divide-y divide-slate-50">
                  {currentTableData.length > 0 ? (
                    currentTableData.map((row, index) => {
                      const maLop = row["Mã lớp"];
                      const subjectStr = row["Môn học"] || "";
                      const teacherStr = row["Mã GV"] || "GV";
                      const teacherInitials = teacherStr.substring(0, 2).toUpperCase();
                      const currentStudents = Number(row["Đang học"]) || 0;
                      const loaiLopStr = row["Loại lớp"] || "";

                      // Tính toán Slot theo Rule Thép
                      const match = loaiLopStr.match(/1:(\d+)/);
                      const maxStudents = match ? parseInt(match[1]) : 99;
                      const heldCount = heldSlots[maLop] || 0;
                      const availableSlots = maxStudents - currentStudents - heldCount;
                      const isFull = availableSlots <= 0;
                      const isLoading = isHoldingSlot === maLop;

                      return (
                        <tr 
                          key={`${maLop}-${index}`} 
                          className="hover:bg-sky-50/40 transition-all duration-200 group/row opacity-0 animate-fade-slide-up-stagger"
                          style={{ animationDelay: `${index * 0.03}s`, animationFillMode: 'forwards' }}
                        >
                          <td className="px-6 py-4 font-bold text-sky-600">{maLop}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md border ${getSubjectStyle(subjectStr)}`}>
                              {subjectStr}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-500 text-[13px]">{loaiLopStr}</td>
                          <td className="px-6 py-4 text-center font-bold text-slate-600">{row["Khối"]}</td>
                          <td className="px-6 py-4 font-medium text-slate-600">{row["Trình độ"]}</td>
                          
                          <td className="px-6 py-4 font-bold text-slate-700">
                            <div className="flex items-center gap-2">
                              <span className={`flex items-center justify-center w-7 h-7 rounded-full text-[10px] border ${getAvatarColor(teacherStr)} shadow-sm`}>
                                {teacherInitials}
                              </span>
                              <span>{teacherStr}</span>
                            </div>
                          </td>

                          <td className="px-6 py-4 text-slate-500 text-[13px] truncate max-w-[120px]">{row["Giáo trình"]}</td>
                          <td className="px-6 py-4 font-medium text-slate-600">{row["Lịch học"]}</td>
                          
                          <td className="px-6 py-4 text-center">
                            <span className="px-2.5 py-1 bg-sky-50/80 text-sky-600 border border-sky-100 rounded-md font-bold">{currentStudents + heldCount}</span>
                          </td>

                          {/* HIỂN THỊ NÚT GIỮ SLOT TẠI TAB GIỮ SLOT */}
                          {activeNav === "Giữ Slot" && (
                            <>
                              <td className="px-6 py-4 text-center">
                                <span className={`px-2.5 py-1 rounded-md font-bold text-xs border ${availableSlots > 0 ? "bg-orange-50 text-orange-600 border-orange-200" : "bg-slate-100 text-slate-400 border-slate-200"}`}>
                                  {availableSlots > 0 ? `Còn ${availableSlots} slot` : "Đã hết slot"}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right pr-6 min-w-[130px]">
                                <button 
                                  onClick={() => handleKeepSlot(row, availableSlots)}
                                  disabled={isFull || isLoading}
                                  className={`px-4 py-1.5 border font-bold rounded-lg focus:outline-none transition-all duration-300 text-xs w-full max-w-[110px] text-center shadow-sm
                                    ${isFull 
                                      ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' 
                                      : 'bg-orange-500 border-orange-500 text-white hover:bg-orange-600 active:scale-95'
                                    }`}
                                >
                                  {isLoading ? (
                                    <svg className="animate-spin h-3.5 w-3.5 mx-auto text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                  ) : isFull ? (
                                    "Hết Slot"
                                  ) : (
                                    "Giữ Slot"
                                  )}
                                </button>
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={activeNav === "Giữ Slot" ? 11 : 9} className="px-6 py-24 text-center">
                        <div className="flex flex-col items-center justify-center text-slate-400">
                          <div className="w-20 h-20 mb-4 rounded-full bg-slate-50 flex items-center justify-center border-2 border-dashed border-slate-200">
                            <span className="text-3xl opacity-60">📭</span>
                          </div>
                          <p className="font-bold text-slate-500 text-lg mb-1">Không tìm thấy dữ liệu phù hợp</p>
                          <p className="text-sm font-medium">Hãy thử thay đổi điều kiện bộ lọc hoặc từ khóa tìm kiếm.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-slate-100 shrink-0 z-10">
                <span className="text-[13px] text-slate-500 font-bold tracking-wide uppercase">
                  Page <span className="text-sky-600 text-sm mx-1">{currentPage}</span> / {totalPages}
                </span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-5 py-2 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-slate-500 focus:outline-none hover:text-sky-600 hover:border-sky-300 hover:bg-sky-50 disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-slate-200 disabled:hover:text-slate-500 transition-colors active:scale-95"
                  >
                    ← Back
                  </button>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-5 py-2 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-slate-500 focus:outline-none hover:text-sky-600 hover:border-sky-300 hover:bg-sky-50 disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-slate-200 disabled:hover:text-slate-500 transition-colors active:scale-95"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
            
          </div>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=Caveat:wght@600;700&display=swap');
        
        .font-vietnam { font-family: 'Be Vietnam Pro', sans-serif; }
        .font-greeting { font-family: 'Baloo 2', cursive; }
        .font-handwriting { font-family: 'Caveat', cursive; }

        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94A3B8; }
        
        @keyframes bounceBitu {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-bounce-bitu { animation: bounceBitu 1.5s infinite ease-in-out; }

        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-slide-down { animation: fadeSlideDown 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

        @keyframes fadeSlideUpStagger {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-slide-up-stagger { animation: fadeSlideUpStagger 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

        @keyframes cursorBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .animate-cursor-blink { animation: cursorBlink 0.8s infinite; }
      `}} />
    </div>
  );
}