"use client";

import React, { useState, useEffect, useMemo } from "react";
import Papa from "papaparse";
import { createClient } from "@supabase/supabase-js";

// Đảm bảo lấy đúng biến hoặc gán trực tiếp để loại trừ lỗi thiếu biến môi trường trên Vercel
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://sehvatktrqtgsnmvebmm.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlaHZhdGt0cnF0Z3NubXZlYm1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5MzE5NzEsImV4cCI6MjEwNjUwNzk3MX0.hmQpRDUxsfP_LSWVE96nFEH85Qqw-z9LG3AQU1VXe0E";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginRole, setLoginRole] = useState<"QLL" | "Admin">("QLL");
  
  // Form QLL
  const [namecode, setNamecode] = useState("");
  const [teamLead, setTeamLead] = useState("Team Lead A");
  
  // Form Admin
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  
  // --- QUẢN LÝ DARK MODE ---
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("qll_theme") as "light" | "dark";
    if (savedTheme) setTheme(savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("qll_theme", newTheme);
  };

  const [adminList, setAdminList] = useState<{username: string, pass: string}[]>([
    { username: "op_vanhanh", pass: "vanhanhvuihoc" }
  ]);
  const [newAdminUser, setNewAdminUser] = useState("");
  const [newAdminPass, setNewAdminPass] = useState("");
  const [adminAddSuccess, setAdminAddSuccess] = useState("");
  const [adminAddError, setAdminAddError] = useState("");

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  
  const [activeNav, setActiveNav] = useState<"Đang học" | "Khai giảng" | "Giữ Slot" | "QuanTriAdmin" | "LichSuSlotAdmin" | "ThongKeAdmin">("Giữ Slot");
  const [onlineCount, setOnlineCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [slotHistoryData, setSlotHistoryData] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [completedSlots, setCompletedSlots] = useState<Record<string, boolean>>({});

  const [filterMonHoc, setFilterMonHoc] = useState("Tất cả");
  const [filterKhoi, setFilterKhoi] = useState("Tất cả");
  const [filterLoaiLop, setFilterLoaiLop] = useState("Tất cả");
  const [filterLichHoc, setFilterLichHoc] = useState("Tất cả");
  const [filterToday, setFilterToday] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const typingWords = useMemo(() => ["Hello !", "Xin Chào", "Mọi thứ đã sẵn sàng !"], []);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const [heldSlots, setHeldSlots] = useState<Record<string, { timestamp: number }[]>>({});
  const [isHoldingSlot, setIsHoldingSlot] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [selectedRowForSlot, setSelectedRowForSlot] = useState<any>(null);
  const [slotAvailableCount, setSlotAvailableCount] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [inputError, setInputError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const SHEET_CSV_URL = "/api/sheet";

  useEffect(() => {
    const savedAdmins = localStorage.getItem("qll_admin_accounts");
    if (savedAdmins) {
      try { setAdminList(JSON.parse(savedAdmins)); } catch (e) { console.error(e); }
    }

    const savedCompleted = localStorage.getItem("qll_completed_slots");
    if (savedCompleted) {
      try { setCompletedSlots(JSON.parse(savedCompleted)); } catch (e) { console.error(e); }
    }

    const savedHeld = localStorage.getItem("qll_held_slots_data");
    if (savedHeld) {
      try {
        const parsed = JSON.parse(savedHeld);
        const now = Date.now();
        const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
        const cleaned: Record<string, { timestamp: number }[]> = {};

        Object.keys(parsed).forEach(maLop => {
          const validHolds = parsed[maLop].filter((item: { timestamp: number }) => now - item.timestamp < TWENTY_FOUR_HOURS);
          if (validHolds.length > 0) {
            cleaned[maLop] = validHolds;
          }
        });
        setHeldSlots(cleaned);
      } catch (e) {
        console.error("Lỗi đọc held slots", e);
      }
    }

    const savedUser = localStorage.getItem("qll_logged_user");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed.role === "Admin") {
          setAdminUsername(parsed.namecode || "");
          setLoginRole("Admin");
          setTeamLead("Admin hệ thống");
        } else if (parsed.namecode) {
          setNamecode(parsed.namecode);
          setTeamLead(parsed.teamLead || "Team Lead A");
          setLoginRole("QLL");
        }
        setIsLoggedIn(true);
      } catch (e) { console.error(e); }
    }
  }, []);

  const checkIsExpired = (timeString: string) => {
    try {
      const parts = timeString.split(" ");
      if (parts.length < 2) return false;
      const dateParts = parts[0].split("/");
      const timeParts = parts[1].split(":");
      
      const logDate = new Date(
        parseInt(dateParts[2]), 
        parseInt(dateParts[1]) - 1, 
        parseInt(dateParts[0]), 
        parseInt(timeParts[0]), 
        parseInt(timeParts[1]), 
        parseInt(timeParts[2] || "0")
      );

      const targetTime = logDate.getTime() + 24 * 60 * 60 * 1000;
      return Date.now() >= targetTime;
    } catch (e) {
      return false;
    }
  };

  const getActiveHeldCount = (maLop: string) => {
    if (!slotHistoryData || slotHistoryData.length === 0) return 0;
    
    const now = Date.now();
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    
    const activeHolds = slotHistoryData.filter((item: any) => {
      const matchMaLop = item.ma_lop === maLop || item["Mã lớp giữ"] === maLop || item["Mã lớp"] === maLop;
      const notDone = item.is_done === false;
      const notExpired = (now - Number(item.timestamp)) < TWENTY_FOUR_HOURS;
      
      return matchMaLop && notDone && notExpired;
    });

    return activeHolds.length;
  };

  const calculateTimeRemaining = (timeString: string) => {
    try {
      const parts = timeString.split(" ");
      if (parts.length < 2) return "Đang cập nhật";
      const dateParts = parts[0].split("/");
      const timeParts = parts[1].split(":");
      
      const logDate = new Date(
        parseInt(dateParts[2]), 
        parseInt(dateParts[1]) - 1, 
        parseInt(dateParts[0]), 
        parseInt(timeParts[0]), 
        parseInt(timeParts[1]), 
        parseInt(timeParts[2] || "0")
      );

      const targetTime = logDate.getTime() + 24 * 60 * 60 * 1000;
      const now = Date.now();
      const diff = targetTime - now;

      if (diff <= 0) return "⏰ Quá hạn";

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      return `${hours}h ${minutes}m ${seconds}s còn lại`;
    } catch (e) {
      return "24h";
    }
  };

  const handleMarkAsDone = async (dbId: string) => {
    if (!dbId) {
      alert("Lỗi: Không tìm thấy ID bản ghi trong cơ sở dữ liệu!");
      return;
    }

    setSlotHistoryData(prevData =>
      prevData.map(item => (item.id === dbId ? { ...item, is_done: true } : item))
    );

    try {
      const { error } = await supabase
        .from('slot_holds')
        .update({ is_done: true })
        .eq('id', dbId);

      if (error) {
        console.error("Lỗi update Supabase:", error);
        alert("Lỗi Update DB: " + error.message);
        loadSlotHistory(true);
      }
    } catch (error) {
      console.error("Lỗi mạng khi update trạng thái:", error);
    }
  };

  // --- SUPABASE PRESENCE (THEO DÕI ONLINE REAL-TIME) ---
  useEffect(() => {
    if (isLoggedIn) {
      const channel = supabase.channel('qll-room', {
        config: { presence: { key: namecode } },
      });

      channel.on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        setOnlineCount(Object.keys(newState).length);
      });

      channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_name: namecode,
            online_at: new Date().toISOString(),
          });
        }
      });

      return () => { supabase.removeChannel(channel); };
    }
  }, [isLoggedIn, namecode]);

  const qllStats = useMemo(() => {
    if (!slotHistoryData || slotHistoryData.length === 0) return [];
    const map: Record<string, { name: string; team: string; total: number; done: number; pending: number; expired: number }> = {};

    slotHistoryData.forEach((row, index) => {
      const nguoiGiu = row.nguoi_giu || row["Người giữ"] || "Không rõ";
      const team = row.team || row["Team"] || "-";

      let timeStr = "";
      if (row.timestamp) {
        const d = new Date(Number(row.timestamp));
        const pad = (n: number) => n.toString().padStart(2, '0');
        timeStr = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      } else {
        timeStr = row["Thời gian"] || "";
      }

      const maLop = row.ma_lop || row["Mã lớp giữ"] || row["Mã lớp"] || "";
      const rowKey = `${timeStr}-${maLop}-${index}`;
      
      const isDone = completedSlots[rowKey] || row.is_done;
      const isExpired = checkIsExpired(timeStr);

      if (!map[nguoiGiu]) {
        map[nguoiGiu] = { name: nguoiGiu, team: team, total: 0, done: 0, pending: 0, expired: 0 };
      }

      map[nguoiGiu].total += 1;
      if (isDone) map[nguoiGiu].done += 1;
      else if (isExpired) map[nguoiGiu].expired += 1;
      else map[nguoiGiu].pending += 1;
    });

    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [slotHistoryData, completedSlots]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (loginRole === "QLL") {
      if (!namecode.trim()) {
        setLoginError("Vui lòng nhập Namecode của bạn!");
        return;
      }
      if (!teamLead.trim()) {
        setLoginError("Vui lòng chọn hoặc nhập Team Lead!");
        return;
      }
      const userData = { 
        namecode: namecode.trim(), 
        teamLead: teamLead.trim(), 
        role: "QLL" 
      };
      localStorage.setItem("qll_logged_user", JSON.stringify(userData));
      
    } else {
      const matchedAdmin = adminList.find(
        (acc) => acc.username.trim() === adminUsername.trim() && acc.pass === adminPassword.trim()
      );

      if (!matchedAdmin) {
        setLoginError("Tên đăng nhập hoặc mật khẩu Admin không chính xác!");
        return;
      }

      const userData = { 
        namecode: matchedAdmin.username, 
        teamLead: "Admin hệ thống", 
        role: "Admin" 
      };
      localStorage.setItem("qll_logged_user", JSON.stringify(userData));
      setTeamLead("Admin hệ thống");
    }

    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("qll_logged_user");
    setIsLoggedIn(false);
    setNamecode("");
    setAdminUsername("");
    setAdminPassword("");
    setActiveNav("Giữ Slot");
  };

  const handleAddAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminAddError("");
    setAdminAddSuccess("");

    const cleanUser = newAdminUser.trim();
    const cleanPass = newAdminPass.trim();

    if (!cleanUser || !cleanPass) {
      setAdminAddError("Tên đăng nhập và mật khẩu không được để trống!");
      return;
    }

    if (adminList.some((acc) => acc.username === cleanUser)) {
      setAdminAddError("Tên đăng nhập Admin này đã tồn tại!");
      return;
    }

    const updatedList = [...adminList, { username: cleanUser, pass: cleanPass }];
    setAdminList(updatedList);
    localStorage.setItem("qll_admin_accounts", JSON.stringify(updatedList));
    setNewAdminUser("");
    setNewAdminPass("");
    setAdminAddSuccess("Đã thêm tài khoản Admin thành công!");
    setTimeout(() => setAdminAddSuccess(""), 4000);
  };

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

  const loadSlotHistory = async (isSilent = false) => {
    if (!isSilent) {
      setLoadingHistory(true);
    }
    
    try {
      const response = await fetch("/api/slot-hold");
      const result = await response.json();
      
      if (result.success && result.data) {
        setSlotHistoryData(prevData => {
          const doneIds = new Set(prevData.filter(item => item.is_done).map(item => item.id));
          
          const mergedData = result.data.map((newItem: any) => {
            if (doneIds.has(newItem.id)) {
              return { ...newItem, is_done: true };
            }
            return newItem;
          });

          return mergedData;
        });
      }
    } catch (err) {
      console.error("Lỗi fetch lịch sử giữ slot:", err);
    } finally {
      if (!isSilent) {
        setLoadingHistory(false);
      }
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      loadData();
      loadSlotHistory(); 
      
      const intervalId = setInterval(() => {
        loadData();
        loadSlotHistory();
      }, 5 * 60 * 1000); 
      return () => clearInterval(intervalId);
    }
  }, [isLoggedIn, loginRole]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeNav, filterLoaiLop, filterKhoi, filterMonHoc, filterLichHoc, filterToday]);

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
      if (activeNav === "Giữ Slot" || activeNav === "QuanTriAdmin" || activeNav === "LichSuSlotAdmin" || activeNav === "ThongKeAdmin") return true;
      return activeNav === "Đang học" ? status.includes("đang học") : status.includes("khai giảng");
    });

    return {
      total: data.length,
      studying: data.filter(d => (d["Phân loại lớp"] || "").toLowerCase().includes("đang học")).length,
      pending: data.filter(d => (d["Phân loại lớp"] || "").toLowerCase().includes("khai giảng")).length,
      tabTotal: currentTabBase.length
    };
  }, [data, activeNav]);

  const calculateAvailableSlots = (row: any, heldCount: number) => {
    const monHoc = (row["Môn học"] || "").toString().toLowerCase().trim();
    const loaiLopRaw = (row["Loại lớp"] || "").toString().trim();
    const loaiLop = loaiLopRaw.replace(/^Lớp\s+/i, "").trim();
    const dangHoc = Number(row["Đang học"]) || 0;

    let maxAllowed = 0;

    if (monHoc.includes("toán") || monHoc.includes("toan")) {
      if (loaiLop === "1:6") maxAllowed = 6;
      else if (loaiLop === "1:8") maxAllowed = 10;
      else if (loaiLop === "1:10") maxAllowed = 10;
      else if (loaiLop === "1:15") maxAllowed = 20;
    } 
    else if (monHoc.includes("tiếng anh") || monHoc.includes("tieng anh") || monHoc.includes("moet")) {
      if (loaiLop === "1:4") maxAllowed = 3;
    } 
    else if (monHoc.includes("khtn")) {
      if (loaiLop === "1:10") maxAllowed = 10;
    } 
    else if (monHoc.includes("ngữ văn") || monHoc.includes("ngu van") || monHoc.includes("văn")) {
      if (loaiLop === "1:4") maxAllowed = 4;
    }

    const remaining = maxAllowed - dangHoc - heldCount;
    return remaining > 0 ? remaining : 0;
  };

  const checkAttendanceStatus = (row: any) => {
    const monHoc = (row["Môn học"] || "").toString().toLowerCase().trim();
    const loaiLopRaw = (row["Loại lớp"] || "").toString().trim();
    const loaiLop = loaiLopRaw.replace(/^Lớp\s+/i, "").trim();
    const dangHoc = Number(row["Đang học"]) || 0;

    let threshold = 999; 

    if (monHoc.includes("toán") || monHoc.includes("toan")) {
      if (loaiLop === "1:6") threshold = 3;       
      else if (loaiLop === "1:8") threshold = 7;     
      else if (loaiLop === "1:10") threshold = 6;    
    } 
    else if (monHoc.includes("tiếng anh") || monHoc.includes("tieng anh") || monHoc.includes("moet")) {
      if (loaiLop === "1:4") threshold = 1;       
    } 
    else if (monHoc.includes("khtn")) {
      if (loaiLop === "1:10") threshold = 10;    
    } 
    else if (monHoc.includes("ngữ văn") || monHoc.includes("ngu van") || monHoc.includes("văn")) {
      if (loaiLop === "1:4") threshold = 1;       
    }

    if (dangHoc <= threshold) {
      return { isLow: true, text: "⚠️ Thiếu sĩ số quá !!" };
    }
    return { isLow: false, text: "✅ Đạt chuẩn" };
  };

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

      if (activeNav !== "Giữ Slot" && activeNav !== "QuanTriAdmin" && activeNav !== "LichSuSlotAdmin" && activeNav !== "ThongKeAdmin") {
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

  const handleOpenPopup = (row: any, availableSlots: number) => {
    if (availableSlots <= 0) return;
    setSelectedRowForSlot(row);
    setSlotAvailableCount(availableSlots);
    setInputValue("");
    setInputError("");
    setShowModal(true);
  };

  const handleConfirmKeepSlot = async () => {
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

    setShowModal(false);
    setIsHoldingSlot(maLop);

    try {
      const startDate = new Date();
      const expiryDate = new Date();
      expiryDate.setDate(startDate.getDate() + 1);
      const formatDate = (date: Date) => date.toLocaleDateString("vi-VN");

      const response = await fetch("/api/slot-hold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ma_lop: maLop,
          mon_hoc: row["Môn học"] || "",
          nguoi_giu: namecode,
          team: loginRole === "Admin" ? "Admin hệ thống" : teamLead,
          ngay_bat_dau: formatDate(startDate),
          ngay_het_han: formatDate(expiryDate),
          note: `SID/CID: ${cleanVal}`,
          timestamp: Date.now()
        })
      });

      const result = await response.json();

      if (!result.success) {
        alert("Lỗi khi lưu giữ slot: " + result.error);
        return;
      }

      await loadSlotHistory();

      setSuccessMessage("Đã lưu giữ slot thành công!");
      setTimeout(() => setSuccessMessage(""), 4000);

    } catch (error) {
      console.error("Lỗi kết nối:", error);
      alert("Lỗi kết nối khi giữ slot!");
    } finally {
      setIsHoldingSlot(null);
      setSelectedRowForSlot(null);
    }
  };

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

  if (!isLoggedIn) {
    return (
      <div className="relative h-screen w-screen overflow-hidden font-sora bg-[#0f172a] flex items-center justify-center">
        <style dangerouslySetInnerHTML={{__html: `
          @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&display=swap');
          .font-sora { font-family: 'Sora', sans-serif !important; }

          @keyframes floatBitu {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-12px) rotate(2deg); }
          }
          .animate-float-bitu {
            animation: floatBitu 4s ease-in-out infinite;
          }

          @keyframes typing {
            from { width: 0; }
            to { width: 100%; }
          }
          @keyframes blink {
            from, to { border-color: transparent; }
            50% { border-color: #f97316; }
          }
          .typing-effect {
            display: inline-block;
            overflow: hidden;
            white-space: nowrap;
            border-right: 3px solid #f97316;
            animation: typing 3s steps(16, end) infinite alternate, blink 0.75s step-end infinite;
          }

          @keyframes spin-glow {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .animated-border-box {
            position: relative;
            border-radius: 40px; 
            padding: 4px; 
            overflow: hidden;
            background: rgba(255, 255, 255, 0.05); 
            box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6);
          }

          .animated-border-box::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: conic-gradient(
              transparent 70%, 
              #00f2fe 85%, 
              #4facfe 100%
            );
            animation: spin-glow 4s linear infinite;
            z-index: 0;
          }

          .animated-border-box::after {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: conic-gradient(
              transparent 70%, 
              #f97316 85%, 
              #f59e0b 100%
            );
            animation: spin-glow 4s linear infinite;
            animation-delay: -2s;
            z-index: 0;
          }

          .animated-border-inner {
            position: relative;
            background: #0d111a; 
            border-radius: 36px; 
            z-index: 1;
            width: 100%;
            height: 100%;
          }

          input:-webkit-autofill,
          input:-webkit-autofill:hover, 
          input:-webkit-autofill:focus, 
          input:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 30px #151a28 inset !important;
            -webkit-text-fill-color: white !important;
            transition: background-color 5000s ease-in-out 0s;
          }
        `}} />

        <div className="absolute inset-0 bg-[#070b19] -z-40"></div>
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30 mix-blend-screen -z-30"
          style={{ backgroundImage: `url('/backdrop.jpg')` }}
        ></div>

        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-indigo-700/20 filter blur-[150px] -z-20 pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-cyan-600/15 filter blur-[150px] -z-20 pointer-events-none"></div>
        <div className="absolute top-[20%] right-[20%] w-[30vw] h-[30vw] rounded-full bg-purple-600/10 filter blur-[120px] -z-20 pointer-events-none"></div>

        <div className="w-full max-w-[1400px] px-6 lg:px-16 flex items-center justify-between">
          
          <div className="hidden lg:flex flex-col items-start relative animate-float-bitu z-20 pointer-events-none select-none pl-6 xl:pl-12">
            <div className="mb-4 ml-6 bg-[#1a1f33]/90 backdrop-blur-md border border-white/10 px-5 py-3 rounded-2xl shadow-2xl relative">
              <p className="text-white font-medium text-base tracking-wide">
                <span className="typing-effect">Xin chào bạn! ✨</span>
              </p>
              <div className="absolute -bottom-2 left-8 w-4 h-4 bg-[#1a1f33]/90 border-r border-b border-white/10 rotate-45 backdrop-blur-md"></div>
            </div>

            <img 
              src="/Chào hỏi_2.png" 
              alt="Nhân vật Bitu Vuihoc" 
              className="w-[360px] xl:w-[420px] h-auto object-contain filter drop-shadow-[0_25px_60px_rgba(0,0,0,0.6)]"
              onError={(e) => { (e.target as HTMLImageElement).src = '/Ch%C3%A0o%20h%E1%BB%8Fi_2.png'; }}
            />
          </div>

          <div className="animated-border-box w-full max-w-[540px] mx-auto lg:mx-0">
            <div className="animated-border-inner p-10 lg:p-12">
              
              <div className="flex items-center gap-3.5 mb-6">
                <div className="bg-gradient-to-br from-orange-400 to-orange-600 p-3 rounded-2xl shadow-lg flex items-center justify-center">
                  <img 
                    src="https://xcdn-cf.vuihoc.vn/theme/vuihoc/imgs/vuihoc_logo_final.png" 
                    alt="Vuihoc Logo" 
                    className="h-6 w-auto object-contain brightness-0 invert"
                  />
                </div>
                <div>
                  <span className="text-white font-semibold tracking-wider uppercase text-sm block">Vuihoc Operations</span>
                  <span className="text-slate-400 text-xs font-normal">Hệ thống quản lý vận hành QLL</span>
                </div>
              </div>

              <h2 className="text-3xl lg:text-4xl font-semibold text-white mb-1.5">Đăng nhập</h2>
              <p className="text-slate-400 text-sm mb-7">Chào mừng bạn quay trở lại làm việc.</p>

              <div className="grid grid-cols-2 gap-2.5 p-1.5 bg-[#070a14] rounded-2xl mb-7 border border-white/5 shadow-inner">
                <button
                  type="button"
                  onClick={() => { setLoginRole("QLL"); setLoginError(""); }}
                  className={`py-3.5 text-xs font-medium rounded-xl transition-all ${
                    loginRole === "QLL" 
                      ? "bg-white/10 text-white shadow-md border border-white/10" 
                      : "text-slate-500 hover:text-white"
                  }`}
                >
                  👩‍💻 Quản Lý Lớp (QLL)
                </button>
                <button
                  type="button"
                  onClick={() => { setLoginRole("Admin"); setLoginError(""); }}
                  className={`py-3.5 text-xs font-medium rounded-xl transition-all ${
                    loginRole === "Admin" 
                      ? "bg-white/10 text-white shadow-md border border-white/10" 
                      : "text-slate-500 hover:text-white"
                  }`}
                >
                  🔐 Quản Trị (Admin)
                </button>
              </div>

              <form onSubmit={handleLoginSubmit}>
                {loginRole === "QLL" ? (
                  <>
                    <div className="mb-5">
                      <label className="text-slate-300 text-sm font-medium mb-2 block">
                        Namecode <span className="text-cyan-400">*</span>
                      </label>
                      <input 
                        type="text"
                        placeholder=""
                        value={namecode}
                        onChange={(e) => {
                          setNamecode(e.target.value);
                          setLoginError("");
                        }}
                        className="w-full min-h-[54px] px-4.5 py-3.5 bg-[#151a28] border border-white/10 rounded-2xl text-white font-normal text-base focus:outline-none focus:border-cyan-500/50 focus:bg-[#1a2133] transition-all shadow-inner"
                        autoFocus
                      />
                    </div>

                    <div className="mb-7">
                      <label className="text-slate-300 text-sm font-medium mb-2 block">
                        Team Lead <span className="text-cyan-400">*</span>
                      </label>
                      <select
                        value={teamLead}
                        onChange={(e) => setTeamLead(e.target.value)}
                        className="w-full min-h-[54px] px-4.5 py-3.5 bg-[#151a28] border border-white/10 rounded-2xl text-white font-normal text-base focus:outline-none focus:border-cyan-500/50 focus:bg-[#1a2133] transition-all cursor-pointer shadow-inner"
                      >
                        <option value="Team Lead A" className="bg-[#151a28] text-white">Team Lead A</option>
                        <option value="Team Lead B" className="bg-[#151a28] text-white">Team Lead B</option>
                        <option value="Team Lead C" className="bg-[#151a28] text-white">Team Lead C</option>
                        <option value="Team Lead D" className="bg-[#151a28] text-white">Team Lead D</option>
                        <option value="Khác" className="bg-[#151a28] text-white">Khác / Vận hành chung</option>
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mb-5">
                      <label className="text-slate-300 text-sm font-medium mb-2 block">
                        Tên đăng nhập Admin <span className="text-cyan-400">*</span>
                      </label>
                      <input 
                        type="text"
                        placeholder=""
                        value={adminUsername}
                        onChange={(e) => {
                          setAdminUsername(e.target.value);
                          setLoginError("");
                        }}
                        className="w-full min-h-[54px] px-4.5 py-3.5 bg-[#151a28] border border-white/10 rounded-2xl text-white font-normal text-base focus:outline-none focus:border-cyan-500/50 focus:bg-[#1a2133] transition-all shadow-inner"
                        autoFocus
                      />
                    </div>
                    <div className="mb-7">
                      <label className="text-slate-300 text-sm font-medium mb-2 block">
                        Mật khẩu Admin <span className="text-cyan-400">*</span>
                      </label>
                      <input 
                        type="password"
                        placeholder=""
                        value={adminPassword}
                        onChange={(e) => {
                          setAdminPassword(e.target.value);
                          setLoginError("");
                        }}
                        className="w-full min-h-[54px] px-4.5 py-3.5 bg-[#151a28] border border-white/10 rounded-2xl text-white font-normal text-base focus:outline-none focus:border-cyan-500/50 focus:bg-[#1a2133] transition-all shadow-inner"
                      />
                    </div>
                  </>
                )}

                {loginError && (
                  <p className="text-red-400 text-xs font-medium mb-4 text-center">{loginError}</p>
                )}

                <button 
                  type="submit"
                  className="w-full min-h-[58px] rounded-2xl font-medium text-base transition-all cursor-pointer active:scale-95 shadow-xl flex items-center justify-center gap-2 bg-gradient-to-r from-[#00f2fe] to-[#4facfe] text-white hover:opacity-90 shadow-cyan-500/30 border border-cyan-400/30"
                >
                  {loginRole === "QLL" ? "Vào hệ thống QLL →" : "Đăng nhập Admin →"}
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen font-vietnam overflow-hidden selection:bg-sky-500/30 relative z-0 transition-colors duration-0 ${theme === 'dark' ? 'bg-[#070b14] text-slate-300' : 'bg-[#F4F7FE] text-slate-700'}`}>
      
      <div className={`absolute inset-0 pointer-events-none -z-10 transition-opacity duration-0 ${theme === 'dark' ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-indigo-900/30 filter blur-[150px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-orange-900/10 filter blur-[150px]"></div>
        <div className="absolute top-[20%] right-[20%] w-[30vw] h-[30vw] rounded-full bg-sky-900/15 filter blur-[120px]"></div>
      </div>

      <div className={`absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-sky-50/60 to-transparent pointer-events-none -z-10 transition-opacity duration-0 ${theme === 'light' ? 'opacity-100' : 'opacity-0'}`}></div>

      {successMessage && (
        <div className="fixed top-6 right-8 bg-emerald-500 text-white px-6 py-3 rounded-2xl shadow-xl z-50 flex items-center gap-2 font-bold text-sm animate-fade-slide-down">
          <span>✅</span> {successMessage}
        </div>
      )}   

      {/* SIDEBAR */}
      <aside className={`w-64 min-w-[16rem] max-w-[16rem] flex flex-col z-20 shrink-0 transition-colors duration-0 ${
        theme === 'dark' 
          ? 'bg-[#0e1320] border-r border-white/5 shadow-[4px_0_24px_rgba(0,0,0,0.5)]' 
          : 'bg-white border-r border-slate-200/80 shadow-[4px_0_24px_rgba(0,0,0,0.02)]'
      }`}>
        
        <div className={`h-20 flex items-center px-6 border-b shrink-0 transition-colors duration-0 ${theme === 'dark' ? 'border-white/5' : 'border-slate-100'}`}>
          <div className="flex items-center gap-3 cursor-pointer">
            <img 
              src="https://xcdn-cf.vuihoc.vn/theme/vuihoc/imgs/vuihoc_logo_final.png" 
              alt="Vuihoc Logo" 
              className={`h-6 w-auto object-contain transition-all duration-0 ${theme === 'dark' ? 'brightness-0 invert opacity-90' : 'drop-shadow-sm'}`}
            />
            <div className={`border-l-[1.5px] pl-3 transition-colors duration-0 ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'}`}>
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
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors duration-0 focus:outline-none relative group ${
              activeNav === "Đang học" 
                ? (theme === 'dark' ? "bg-sky-500/10 text-sky-400 font-bold border border-sky-500/20" : "bg-sky-50/80 text-sky-600 font-bold shadow-[0_2px_10px_rgba(14,165,233,0.05)]") 
                : (theme === 'dark' ? "text-slate-400 hover:bg-white/5 hover:text-sky-400 font-medium" : "text-slate-500 hover:bg-slate-50 hover:text-sky-500 font-medium")
            }`}
          >
            <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-sky-500 rounded-r-full transition-all duration-0 ${activeNav === "Đang học" ? "opacity-100 scale-y-100" : "opacity-0 scale-y-0"}`}></div>
            <span className="text-lg">📚</span>
            <span className="text-xs truncate">Lớp Đang Học</span>
          </button>

          <button
            onClick={() => setActiveNav("Khai giảng")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors duration-0 focus:outline-none relative group ${
              activeNav === "Khai giảng" 
                ? (theme === 'dark' ? "bg-sky-500/10 text-sky-400 font-bold border border-sky-500/20" : "bg-sky-50/80 text-sky-600 font-bold shadow-[0_2px_10px_rgba(14,165,233,0.05)]") 
                : (theme === 'dark' ? "text-slate-400 hover:bg-white/5 hover:text-sky-400 font-medium" : "text-slate-500 hover:bg-slate-50 hover:text-sky-500 font-medium")
            }`}
          >
            <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-sky-500 rounded-r-full transition-all duration-0 ${activeNav === "Khai giảng" ? "opacity-100 scale-y-100" : "opacity-0 scale-y-0"}`}></div>
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
                ? (theme === 'dark' ? "bg-orange-500/10 text-orange-400 font-bold border border-orange-500/20" : "bg-orange-50 text-orange-600 font-bold shadow-[0_2px_10px_rgba(249,115,22,0.1)]") 
                : (theme === 'dark' ? "text-slate-400 hover:bg-white/5 hover:text-orange-400 font-medium" : "text-slate-500 hover:bg-orange-50/50 hover:text-orange-500 font-medium")
            }`}
          >
            <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-orange-500 rounded-r-full transition-all duration-0 ${activeNav === "Giữ Slot" ? "opacity-100 scale-y-100" : "opacity-0 scale-y-0"}`}></div>
            <span className="text-lg">📌</span>
            <span className="text-xs truncate">Giữ Slot Lớp</span>
          </button>

          {loginRole === "Admin" && (
            <>
              <div className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-2 mt-6 px-2">
                Hệ thống Quản trị
              </div>

              <button
                onClick={() => { setActiveNav("LichSuSlotAdmin"); loadSlotHistory(); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors duration-0 focus:outline-none relative group ${
                  activeNav === "LichSuSlotAdmin" 
                    ? "bg-orange-500 text-white font-bold shadow-[0_4px_15px_rgba(249,115,22,0.3)]" 
                    : (theme === 'dark' ? "text-slate-400 hover:bg-white/5 hover:text-orange-400 font-medium" : "text-slate-600 hover:bg-orange-50 hover:text-orange-600 font-medium")
                }`}
              >
                <span className="text-lg">📋</span>
                <span className="text-xs truncate">DS Giữ Slot</span>
              </button>

              <button
                onClick={() => { setActiveNav("QuanTriAdmin"); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors duration-0 focus:outline-none relative group ${
                  activeNav === "QuanTriAdmin" 
                    ? "bg-orange-500 text-white font-bold shadow-[0_4px_15px_rgba(249,115,22,0.3)]" 
                    : (theme === 'dark' ? "text-slate-400 hover:bg-white/5 hover:text-orange-400 font-medium" : "text-slate-600 hover:bg-orange-50 hover:text-orange-600 font-medium")
                }`}
              >
                <span className="text-lg">⚙️</span>
                <span className="text-xs truncate">Quản Trị Admin</span>
              </button>

              {/* THÊM MỤC THEO DÕI TRUY CẬP DƯỚI QUẢN TRỊ NGAY TẠI ĐÂY */}
              <button
                onClick={() => { setActiveNav("ThongKeAdmin"); loadSlotHistory(); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors duration-0 focus:outline-none relative group ${
                  activeNav === "ThongKeAdmin" 
                    ? "bg-orange-500 text-white font-bold shadow-[0_4px_15px_rgba(249,115,22,0.3)]" 
                    : (theme === 'dark' ? "text-slate-400 hover:bg-white/5 hover:text-orange-400 font-medium" : "text-slate-600 hover:bg-orange-50 hover:text-orange-600 font-medium")
                }`}
              >
                <span className="text-lg">📊</span>
                <span className="text-xs truncate">Theo dõi truy cập</span>
              </button>
            </>
          )}
        </nav>

        <div className={`p-4 border-t shrink-0 flex items-center justify-between transition-colors duration-0 ${theme === 'dark' ? 'bg-[#0a0f1c]/50 border-white/5' : 'bg-slate-50/30 border-slate-100'}`}>
          <div className="flex items-center gap-3 px-1 cursor-pointer group">
            <div className={`w-9 h-9 rounded-full border flex items-center justify-center font-bold text-xs shadow-sm transition-colors duration-0 ${
              theme === 'dark' 
                ? (loginRole === "Admin" ? "bg-orange-500/20 border-orange-500/30 text-orange-400" : "bg-sky-500/20 border-sky-500/30 text-sky-400")
                : (loginRole === "Admin" ? "bg-orange-100 border-orange-200 text-orange-700" : "bg-sky-100 border-sky-200 text-sky-700")
            }`}>
              {namecode.substring(0, 2).toUpperCase()}
            </div>
            <div className="text-xs truncate max-w-[100px]">
              <p className={`font-bold truncate transition-colors duration-0 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`} title={namecode}>{namecode}</p>
              <p className="text-[10px] text-slate-400 truncate" title={loginRole === "Admin" ? "Admin hệ thống" : teamLead}>
                {loginRole === "Admin" ? "Admin hệ thống" : teamLead}
              </p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            title="Đăng xuất"
            className={`p-2 rounded-xl transition-colors duration-0 cursor-pointer ${theme === 'dark' ? 'text-slate-500 hover:text-red-400 hover:bg-red-500/10' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'}`}
          >
            🚪
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
        
        {/* HEADER */}
        <header className={`h-20 border-b flex items-center justify-between px-8 shrink-0 z-20 transition-colors duration-0 ${
          theme === 'dark' ? 'bg-[#0e1320]/80 backdrop-blur-xl border-white/5 shadow-md' : 'bg-white/90 backdrop-blur-md border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.01)]'
        }`}>
          <div className="flex-1 max-w-xl relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className="text-slate-400 group-focus-within:text-sky-500 transition-colors">🔍</span>
            </div>
            <input 
              type="text" 
              placeholder="" 
              className={`w-full pl-12 pr-4 py-2.5 rounded-full focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-colors duration-0 text-sm font-medium ${
                theme === 'dark' 
                  ? 'bg-[#151b2b] border border-white/10 text-white placeholder-slate-500 focus:bg-[#1a2235]' 
                  : 'bg-slate-50/80 border border-slate-200 text-slate-700 placeholder-slate-400 hover:bg-white focus:bg-white focus:shadow-sm'
              }`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className={`px-4 py-2.5 rounded-full text-xs font-bold transition-all duration-0 border flex items-center gap-2 active:scale-95 ${
                theme === 'dark' 
                  ? 'bg-[#151b2b] border-white/10 text-amber-400 hover:bg-white/5 shadow-inner' 
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 shadow-sm'
              }`}
            >
              {theme === 'dark' ? '☀️ Giao diện Sáng' : '🌙 Giao diện Tối'}
            </button>

            {lastUpdated && (
              <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline-block">
                Cập nhật lúc: <strong className={`transition-colors duration-0 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>{lastUpdated}</strong>
              </span>
            )}
            
            <button 
              onClick={() => { loadData(); if(loginRole === "Admin") loadSlotHistory(); }}
              disabled={loading || loadingHistory}
              className={`px-6 py-2.5 text-sm font-bold rounded-full shadow-sm transition-colors duration-0 flex items-center gap-2.5 focus:outline-none active:scale-95
                ${(loading || loadingHistory) 
                  ? (theme === 'dark' ? "bg-white/5 text-slate-500 cursor-not-allowed border border-white/5" : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200") 
                  : "bg-sky-500 text-white hover:bg-sky-600 border border-sky-500 hover:shadow-[0_4px_15px_rgba(14,165,233,0.3)]"}`}
            >
              {loading || loadingHistory ? (
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

        {/* --- 1. MÀN HÌNH LỊCH SỬ SLOT ADMIN --- */}
        {loginRole === "Admin" && activeNav === "LichSuSlotAdmin" ? (
          <div className="flex-1 px-8 py-8 min-h-0 flex flex-col">
            <div className={`rounded-3xl flex flex-col h-full overflow-hidden transition-colors duration-0 ${
              theme === 'dark' ? 'bg-[#151b2b]/90 border border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.2)]' : 'bg-white shadow-[0_4px_24px_rgb(0,0,0,0.03)] border border-slate-100'
            }`}>
              <div className={`px-6 py-5 border-b flex items-center justify-between shrink-0 z-30 transition-colors duration-0 ${theme === 'dark' ? 'bg-transparent border-white/5' : 'bg-white border-slate-100'}`}>
                <h3 className={`font-bold flex items-center gap-3 text-base transition-colors duration-0 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                  <span className="w-1.5 h-6 bg-orange-500 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.5)]"></span>
                  📋 Danh sách lịch sử giữ slot (Tab: LichSuGiuSlot)
                </h3>
                <span className={`font-extrabold px-3.5 py-2 rounded-xl border shadow-sm text-xs transition-colors duration-0 ${
                  theme === 'dark' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-orange-50 text-orange-600 border-orange-100'
                }`}>
                  Tổng số bản ghi: {slotHistoryData.length}
                </span>
              </div>

              <div className="flex-1 overflow-auto custom-scrollbar relative">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className={`text-[12px] uppercase font-bold tracking-wider sticky top-0 z-20 shadow-sm border-b transition-colors duration-0 ${
                    theme === 'dark' ? 'bg-[#1a2235] text-slate-400 border-white/5' : 'bg-slate-50 text-slate-400 border-slate-100'
                  }`}>
                    <tr>
                      <th className="px-6 py-4">Thời gian</th>
                      <th className="px-6 py-4">Mã lớp giữ</th>
                      <th className="px-6 py-4">Môn học</th>
                      <th className="px-6 py-4">Người giữ</th>
                      <th className="px-6 py-4">Team</th>
                      <th className="px-6 py-4">Time còn lại (24h)</th>
                      <th className="px-6 py-4">Lưu ý (Note)</th>
                      <th className="px-6 py-4 text-right pr-6">Thao tác xếp</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y transition-colors duration-0 ${theme === 'dark' ? 'divide-white/5' : 'divide-slate-50'}`}>
                    {loadingHistory ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-20 text-center text-slate-400 font-semibold">Vui lòng chờ dữ liệu từ Database !!</td>
                      </tr>
                    ) : slotHistoryData.length > 0 ? (
                      slotHistoryData.map((row, index) => {
                        let timeStr = "";
                        if (row.timestamp) {
                          const d = new Date(Number(row.timestamp));
                          const pad = (n: number) => n.toString().padStart(2, '0');
                          timeStr = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
                        } else {
                          timeStr = row["Thời gian"] || "";
                        }

                        const maLop = row.ma_lop || row["Mã lớp giữ"] || row["Mã lớp"] || "";
                        const monHoc = row.mon_hoc || row["Môn học"] || "-";
                        const nguoiGiu = row.nguoi_giu || row["Người giữ"] || "-";
                        const team = row.team || row["Team"] || "-";
                        const note = row.note || row["lưu ý ( mục note của QLL )"] || row["lưu ý"] || "-";
                        
                        const rowKey = `${timeStr}-${maLop}-${index}`;
                        const isDone = completedSlots[rowKey] || row.is_done;
                        const isExpired = checkIsExpired(timeStr);

                        return (
                          <tr key={row.id || index} className={`transition-colors duration-0 ${
                            isDone 
                              ? (theme === 'dark' ? "bg-emerald-900/20 opacity-75" : "bg-emerald-50/40 opacity-75")
                              : isExpired 
                                ? (theme === 'dark' ? "bg-red-900/20 opacity-75" : "bg-red-50/30 opacity-75") 
                                : (theme === 'dark' ? "hover:bg-[#1e293b] even:bg-[#1a2235]/50" : "hover:bg-orange-50/40 even:bg-slate-50/60")
                          }`}>
                            <td className="px-6 py-4 text-slate-500 text-xs">{timeStr || "-"}</td>
                            <td className="px-6 py-4 font-bold text-sky-500">{maLop || "-"}</td>
                            <td className={`px-6 py-4 font-medium transition-colors ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{monHoc}</td>
                            <td className="px-6 py-4 font-bold text-orange-500">{nguoiGiu}</td>
                            <td className={`px-6 py-4 transition-colors ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{team}</td>
                            
                            <td className="px-6 py-4">
                              {isDone ? (
                                <span className={`px-2.5 py-1 font-bold rounded-lg text-xs ${theme === 'dark' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>Đã hoàn thành</span>
                              ) : isExpired ? (
                                <span className={`px-2.5 py-1 font-bold rounded-lg text-xs ${theme === 'dark' ? 'bg-red-500/10 text-red-400' : 'bg-red-100 text-red-700'}`}>Quá hạn (Đã nhả slot)</span>
                              ) : (
                                <span className={`px-2.5 py-1 border font-bold rounded-lg text-xs animate-pulse ${theme === 'dark' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                  {calculateTimeRemaining(timeStr)}
                                </span>
                              )}
                            </td>

                            <td className={`px-6 py-4 font-medium transition-colors ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{note}</td>
                            
                            <td className="px-6 py-4 text-right pr-6">
                              {isDone ? (
                                <span className="text-xs font-bold text-emerald-500 flex items-center justify-end gap-1">
                                  <span>✅</span> Đã xếp xong
                                </span>
                              ) : isExpired ? (
                                <span className={`px-3 py-1.5 font-bold rounded-xl text-xs inline-flex items-center gap-1 shadow-sm ${theme === 'dark' ? 'bg-red-500/10 text-red-400' : 'bg-red-100 text-red-600'}`}>
                                  <span>❌</span> Quá hạn (Đã nhả slot)
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleMarkAsDone(row.id)}
                                  className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs shadow-sm transition-colors cursor-pointer active:scale-95"
                                >
                                  Đã xếp (Done)
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} className="px-6 py-24 text-center text-slate-400 font-semibold">Chưa có dữ liệu lịch sử giữ slot nào được ghi nhận.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>


        ) : loginRole === "Admin" && activeNav === "ThongKeAdmin" ? (
          <div className="flex-1 px-8 py-8 min-h-0 flex flex-col">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 shrink-0 animate-fade-slide-down">
              <div className={`rounded-3xl p-6 shadow-sm border transition-colors duration-0 ${theme === 'dark' ? 'bg-[#151b2b]/90 border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.2)]' : 'bg-white border-slate-100 shadow-[0_4px_24px_rgb(0,0,0,0.03)]'}`}>
                <p className={`text-[11px] font-extrabold uppercase tracking-widest mb-1 transition-colors duration-0 ${theme === 'dark' ? 'text-sky-400' : 'text-sky-500'}`}>Tổng Requests</p>
                <p className={`text-3xl font-extrabold transition-colors duration-0 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                  {qllStats.reduce((acc, curr) => acc + curr.total, 0)}
                </p>
              </div>
              <div className={`rounded-3xl p-6 shadow-sm border transition-colors duration-0 ${theme === 'dark' ? 'bg-[#151b2b]/90 border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.2)]' : 'bg-white border-slate-100 shadow-[0_4px_24px_rgb(0,0,0,0.03)]'}`}>
                <p className={`text-[11px] font-extrabold uppercase tracking-widest mb-1 transition-colors duration-0 ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-500'}`}>Đã xử lý (Done)</p>
                <p className={`text-3xl font-extrabold transition-colors duration-0 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                  {qllStats.reduce((acc, curr) => acc + curr.done, 0)}
                </p>
              </div>
              <div className={`rounded-3xl p-6 shadow-sm border transition-colors duration-0 ${theme === 'dark' ? 'bg-[#151b2b]/90 border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.2)]' : 'bg-white border-slate-100 shadow-[0_4px_24px_rgb(0,0,0,0.03)]'}`}>
                <p className={`text-[11px] font-extrabold uppercase tracking-widest mb-1 transition-colors duration-0 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-500'}`}>Đang Online (Real-time)</p>
                <div className="flex items-center gap-3">
                   <span className="relative flex h-3 w-3">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                     <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                   </span>
                   <p className={`text-3xl font-extrabold transition-colors duration-0 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                     {onlineCount} <span className="text-sm font-medium text-slate-500">nhân sự</span>
                   </p>
                </div>
              </div>
            </div>

            <div className={`flex-1 rounded-3xl flex flex-col h-full overflow-hidden transition-colors duration-0 ${
              theme === 'dark' ? 'bg-[#151b2b]/90 border border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.2)]' : 'bg-white shadow-[0_4px_24px_rgb(0,0,0,0.03)] border border-slate-100'
            }`}>
              <div className={`px-6 py-5 border-b flex items-center justify-between shrink-0 z-30 transition-colors duration-0 ${theme === 'dark' ? 'bg-transparent border-white/5' : 'bg-white border-slate-100'}`}>
                <h3 className={`font-bold flex items-center gap-3 text-base transition-colors duration-0 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                  <span className="w-1.5 h-6 bg-sky-500 rounded-full shadow-[0_0_8px_rgba(14,165,233,0.5)]"></span>
                  📊 Thống kê hiệu suất Quản Lý Lớp (Top Requester)
                </h3>
              </div>

              <div className="flex-1 overflow-auto custom-scrollbar relative">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className={`text-[12px] uppercase font-bold tracking-wider sticky top-0 z-20 shadow-sm border-b transition-colors duration-0 ${
                    theme === 'dark' ? 'bg-[#1a2235] text-slate-400 border-white/5' : 'bg-slate-50 text-slate-400 border-slate-100'
                  }`}>
                    <tr>
                      <th className="px-6 py-4 text-center w-24">Xếp hạng</th>
                      <th className="px-6 py-4">Tên QLL (Namecode)</th>
                      <th className="px-6 py-4">Team Lead</th>
                      <th className="px-6 py-4 text-center">Tổng Request</th>
                      <th className="px-6 py-4 text-center text-emerald-500">Đã Xếp (Done)</th>
                      <th className="px-6 py-4 text-center text-amber-500">Đang chờ</th>
                      <th className="px-6 py-4 text-center text-red-500">Quá hạn nhả slot</th>
                      <th className="px-6 py-4 text-right pr-6">Tỷ lệ hoàn thành</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y transition-colors duration-0 ${theme === 'dark' ? 'divide-white/5' : 'divide-slate-50'}`}>
                    {qllStats.length > 0 ? (
                      qllStats.map((stat, index) => {
                        const completionRate = stat.total > 0 ? Math.round((stat.done / stat.total) * 100) : 0;
                        return (
                          <tr key={stat.name} className={`transition-colors duration-0 ${theme === 'dark' ? "hover:bg-[#1e293b] even:bg-[#1a2235]/50" : "hover:bg-sky-50/40 even:bg-slate-50/60"}`}>
                            <td className="px-6 py-4 font-bold text-slate-500 flex justify-center">
                              <span className={`flex items-center justify-center w-7 h-7 rounded-full text-xs ${index === 0 ? 'bg-amber-100 text-amber-600 border border-amber-200 shadow-sm' : index === 1 ? 'bg-slate-200 text-slate-600 border border-slate-300' : index === 2 ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-transparent text-slate-400 border'}`}>
                                #{index + 1}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-bold text-sky-500">{stat.name}</td>
                            <td className={`px-6 py-4 font-medium transition-colors duration-0 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{stat.team}</td>
                            
                            <td className={`px-6 py-4 text-center font-bold text-lg transition-colors duration-0 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{stat.total}</td>
                            <td className="px-6 py-4 text-center font-bold text-emerald-500">{stat.done}</td>
                            <td className="px-6 py-4 text-center font-bold text-amber-500">{stat.pending}</td>
                            <td className="px-6 py-4 text-center font-bold text-red-500">{stat.expired}</td>
                            
                            <td className="px-6 py-4 text-right pr-6">
                              <div className="flex items-center justify-end gap-3">
                                <div className={`w-24 h-2.5 rounded-full overflow-hidden transition-colors duration-0 ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-100'}`}>
                                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${completionRate}%` }}></div>
                                </div>
                                <span className="font-bold text-xs w-9 text-right text-emerald-500">{completionRate}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} className="px-6 py-24 text-center text-slate-400 font-semibold">Chưa có dữ liệu thống kê từ hệ thống.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        {/* --- 3. MÀN HÌNH QUẢN TRỊ ADMIN (FORM THÊM TÀI KHOẢN) --- */}
        ) : loginRole === "Admin" && activeNav === "QuanTriAdmin" ? (
          <div className="flex-1 p-8 overflow-y-auto">
            <div className={`max-w-xl mx-auto rounded-3xl p-8 shadow-sm border transition-colors duration-0 ${theme === 'dark' ? 'bg-[#151b2b]/90 border-white/5' : 'bg-white border-slate-100'}`}>
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold transition-colors duration-0 ${theme === 'dark' ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-50 text-orange-500'}`}>
                  ⚙️
                </div>
                <div>
                  <h2 className={`text-xl font-bold transition-colors duration-0 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Quản trị Tài khoản Admin</h2>
                  <p className="text-xs text-slate-500">Thêm tài khoản quản trị viên mới vào hệ thống</p>
                </div>
              </div>

              <form onSubmit={handleAddAdminSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Tên đăng nhập Admin mới <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text"
                    value={newAdminUser}
                    onChange={(e) => {
                      setNewAdminUser(e.target.value);
                      setAdminAddError("");
                    }}
                    className={`w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 font-bold text-sm transition-colors duration-0 mb-3 ${
                      theme === 'dark' ? 'bg-[#0a0f1c] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Mật khẩu Admin mới <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="password"
                    value={newAdminPass}
                    onChange={(e) => {
                      setNewAdminPass(e.target.value);
                      setAdminAddError("");
                    }}
                    className={`w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 font-bold text-sm transition-colors duration-0 ${
                      theme === 'dark' ? 'bg-[#0a0f1c] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                  {adminAddError && <p className="text-xs font-bold text-red-500 mt-1.5">{adminAddError}</p>}
                  {adminAddSuccess && <p className="text-xs font-bold text-emerald-500 mt-1.5">{adminAddSuccess}</p>}
                </div>

                <button 
                  type="submit"
                  className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-orange-500/30 transition-colors cursor-pointer active:scale-95"
                >
                  Thêm Tài Khoản Admin
                </button>
              </form>

              <div className={`mt-8 pt-6 border-t transition-colors duration-0 ${theme === 'dark' ? 'border-white/5' : 'border-slate-100'}`}>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Danh sách tài khoản Admin ({adminList.length})</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                  {adminList.map((acc, idx) => (
                    <div key={idx} className={`flex items-center justify-between px-4 py-2.5 border rounded-xl text-xs font-bold transition-colors duration-0 ${
                      theme === 'dark' ? 'bg-[#0a0f1c] border-white/5 text-slate-300' : 'bg-slate-50 border-slate-100 text-slate-700'
                    }`}>
                      <span>👤 {acc.username}</span>
                      <span className={`text-[10px] px-2 py-1 rounded-lg transition-colors ${theme === 'dark' ? 'text-emerald-400 bg-emerald-500/10' : 'text-emerald-600 bg-emerald-50'}`}>Đang hoạt động</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        {/* --- 4. MÀN HÌNH CHUNG DÀNH CHO CẢ ADMIN VÀ QLL --- */}
        ) : (
          <>
            <div className="px-8 pt-8 pb-5 shrink-0 animate-fade-slide-down">
              <div className="flex items-center gap-4 mb-6">
                <img 
                  src="https://lh3.googleusercontent.com/d/1OUQHIpJzHQ-Xugd1BBN0eDR9Bt-cW0_f" 
                  alt="Bitu Mascot" 
                  className="h-15 w-auto object-contain drop-shadow-md animate-bounce-bitu"
                />
                <h2 className="text-[30px] font-greeting tracking-wide flex items-center gap-2 pt-1 h-[45px]">
                  <span className={`font-extrabold tracking-tight transition-colors duration-0 ${theme === 'dark' ? 'text-white' : 'text-sky-600'}`}>Vận hành,</span>
                  <div className="flex items-center">
                    <span className="text-orange-500 font-handwriting text-[36px] font-bold tracking-normal leading-none mt-1 animate-smooth-signature">
                      Mọi thứ đã sẵn sàng !
                    </span>
                  </div>
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={`border-2 rounded-3xl p-6 relative overflow-hidden group hover:-translate-y-1.5 transition-all duration-300 ${
                  theme === 'dark' ? 'bg-[#151b2b]/90 border-sky-900/30 shadow-[0_10px_30px_rgba(0,0,0,0.3)]' : 'bg-gradient-to-br from-white via-white to-sky-50/40 border-sky-100/80 shadow-[0_10px_30px_rgba(14,165,233,0.08)] hover:shadow-[0_20px_40px_rgba(14,165,233,0.15)]'
                }`}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-sky-400/10 rounded-bl-full -mr-8 -mt-8 transition-transform duration-500 group-hover:scale-125"></div>
                  <p className="text-sky-500 text-[11px] font-extrabold uppercase tracking-widest mb-2 relative z-10">Tổng Lớp</p>
                  <div className="flex items-baseline gap-2 relative z-10">
                    <span className={`text-4xl font-extrabold transition-colors duration-0 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{stats.total}</span>
                    <span className="text-slate-500 text-sm font-semibold">hệ thống</span>
                  </div>
                </div>
                
                <div className={`border-2 rounded-3xl p-6 relative overflow-hidden group hover:-translate-y-1.5 transition-all duration-300 ${
                  theme === 'dark' ? 'bg-[#151b2b]/90 border-blue-900/30 shadow-[0_10px_30px_rgba(0,0,0,0.3)]' : 'bg-gradient-to-br from-white via-white to-blue-50/40 border-blue-100/80 shadow-[0_10px_30px_rgba(37,99,235,0.08)] hover:shadow-[0_20px_40px_rgba(37,99,235,0.15)]'
                }`}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 rounded-bl-full -mr-8 -mt-8 transition-transform duration-500 group-hover:scale-125"></div>
                  <p className="text-blue-500 text-[11px] font-extrabold uppercase tracking-widest mb-2 relative z-10">Đang Học</p>
                  <div className="flex items-baseline gap-2 relative z-10">
                    <span className="text-4xl font-extrabold text-blue-500">{stats.studying}</span>
                    <span className="text-slate-500 text-sm font-semibold">đang chạy</span>
                  </div>
                </div>

                <div className={`border-2 rounded-3xl p-6 relative overflow-hidden group hover:-translate-y-1.5 transition-all duration-300 ${
                  theme === 'dark' ? 'bg-[#151b2b]/90 border-orange-900/30 shadow-[0_10px_30px_rgba(0,0,0,0.3)]' : 'bg-gradient-to-br from-white via-white to-orange-50/40 border-orange-100/80 shadow-[0_10px_30px_rgba(249,115,22,0.08)] hover:shadow-[0_20px_40px_rgba(249,115,22,0.15)]'
                }`}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-400/10 rounded-bl-full -mr-8 -mt-8 transition-transform duration-500 group-hover:scale-125"></div>
                  <p className="text-orange-500 text-[11px] font-extrabold uppercase tracking-widest mb-2 relative z-10">Chờ Khai Giảng</p>
                  <div className="flex items-baseline gap-2 relative z-10">
                    <span className="text-4xl font-extrabold text-orange-500">{stats.pending}</span>
                    <span className="text-slate-500 text-sm font-semibold">chờ khai giảng</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 px-8 pb-8 min-h-0 flex flex-col">
              <div className={`rounded-3xl flex flex-col h-full overflow-hidden transition-colors duration-0 ${
                theme === 'dark' ? 'bg-[#151b2b]/90 border border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.2)]' : 'bg-white shadow-[0_4px_24px_rgb(0,0,0,0.03)] border border-slate-100'
              }`}>
                
                <div className={`px-6 py-4 border-b flex flex-wrap gap-3 justify-between items-center shrink-0 z-30 relative transition-colors duration-0 ${
                  theme === 'dark' ? 'bg-transparent border-white/5' : 'bg-white border-slate-100'
                }`}>
                  <h3 className={`font-bold flex items-center gap-3 text-base transition-colors duration-0 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
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
                      className={`px-4 py-2 border rounded-xl font-bold text-xs flex items-center gap-2 focus:outline-none transition-colors duration-0 active:scale-95 ${
                        filterToday
                          ? (theme === 'dark' ? "bg-orange-500/20 border-orange-500/30 text-orange-400" : "bg-orange-50 border-orange-400 text-orange-600 shadow-sm")
                          : (theme === 'dark' ? "bg-[#0a0f1c] border-white/10 text-slate-300 hover:border-orange-500/50 hover:text-orange-400" : "bg-white border-slate-200 text-slate-600 hover:border-orange-300 hover:bg-orange-50/30 hover:text-orange-500")
                      }`}
                    >
                      <span className="text-sm">{filterToday ? "📅" : "🗓️"}</span>
                      {filterToday ? "Đang chọn: Hôm nay" : "Hôm nay"}
                    </button>

                    <span className={`font-extrabold px-3.5 py-2 rounded-xl border shadow-sm text-xs transition-colors duration-0 ${
                      theme === 'dark' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' : 'bg-sky-50 text-sky-600 border-sky-100'
                    }`}>
                      {filteredData.length} kết quả
                    </span>
                  </div>
                </div>

                <div className="flex-1 overflow-auto custom-scrollbar relative">
                  <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead className={`text-[12px] uppercase font-bold tracking-wider sticky top-0 z-20 shadow-sm border-b transition-colors duration-0 ${
                      theme === 'dark' ? 'bg-[#1a2235] text-slate-400 border-white/5' : 'bg-slate-50 text-slate-400 border-slate-100'
                    }`}>
                      <tr>
                        <th className="px-6 py-4">Mã lớp</th>
                        <th className="px-6 py-4">Môn học</th>
                        <th className="px-6 py-4">Loại lớp</th>
                        <th className="px-6 py-4 text-center">Khối</th>
                        <th className="px-6 py-4">Trình độ</th>
                        <th className="px-6 py-4">Giáo trình</th>
                        
                        {activeNav !== "Giữ Slot" && <th className="px-6 py-4 text-sky-500">M: Khung chương trình</th>}

                        <th className="px-6 py-4">Lịch học</th>
                        
                        {activeNav === "Giữ Slot" && <th className="px-6 py-4 text-center text-orange-500">Số slot còn</th>}
                        {activeNav === "Giữ Slot" && <th className="px-6 py-4 text-center text-rose-500">Trạng thái sĩ số</th>}
                        {activeNav === "Giữ Slot" && <th className="px-6 py-4 text-right pr-8 text-orange-500">Thao tác giữ</th>}
                      </tr>
                    </thead>
                    <tbody key={`${activeNav}-${currentPage}-${filterLoaiLop}-${filterKhoi}-${filterMonHoc}-${filterLichHoc}-${filterToday}`} className={`divide-y transition-colors duration-0 ${theme === 'dark' ? 'divide-white/5' : 'divide-slate-50'}`}>
                      {currentTableData.length > 0 ? (
                        currentTableData.map((row, index) => {
                          const maLop = row["Mã lớp"];
                          const subjectStr = row["Môn học"] || "";
                          const heldCount = getActiveHeldCount(maLop);
                          const availableSlots = calculateAvailableSlots(row, heldCount);
                          const attendanceCheck = checkAttendanceStatus(row);
                          const isFull = availableSlots <= 0;
                          const isLoading = isHoldingSlot === maLop;

                          return (
                            <tr 
                              key={`${maLop}-${index}`} 
                              className={`transition-colors duration-0 group/row opacity-0 animate-fade-slide-up-stagger ${
                                theme === 'dark' ? 'hover:bg-[#1e293b] even:bg-[#1a2235]/50' : 'hover:bg-sky-50/40 even:bg-slate-50/60'
                              }`}
                              style={{ animationDelay: `${index * 0.03}s`, animationFillMode: 'forwards' }}
                            >
                              <td className="px-6 py-4 font-bold text-sky-500">{maLop}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md border transition-colors duration-0 ${
                                  theme === 'dark' ? 'bg-white/5 border-white/10 text-slate-300' : getSubjectStyle(subjectStr)
                                }`}>
                                  {subjectStr}
                                </span>
                              </td>
                              <td className={`px-6 py-4 text-[13px] transition-colors duration-0 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{row["Loại lớp"]}</td>
                              <td className={`px-6 py-4 text-center font-bold transition-colors duration-0 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>{row["Khối"]}</td>
                              <td className={`px-6 py-4 font-medium transition-colors duration-0 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>{row["Trình độ"]}</td>
                              <td className={`px-6 py-4 text-[13px] truncate max-w-[120px] transition-colors duration-0 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{row["Giáo trình"]}</td>

                              {activeNav !== "Giữ Slot" && (
                                <td className="px-6 py-4 font-semibold text-sky-500 text-[13px]">
                                  {row["M: Khung chương trình"] || row["Khung chương trình"] || "-"}
                                </td>
                              )}

                              <td className={`px-6 py-4 font-medium transition-colors duration-0 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>{row["Lịch học"]}</td>

                              {activeNav === "Giữ Slot" && (
                                <>
                                  <td className="px-6 py-4 text-center">
                                    <span className={`px-2.5 py-1 rounded-md font-bold text-xs border transition-colors duration-0 ${
                                      availableSlots > 0 
                                        ? (theme === 'dark' ? "bg-orange-500/10 text-orange-400 border-orange-500/20" : "bg-orange-50 text-orange-600 border-orange-200") 
                                        : (theme === 'dark' ? "bg-white/5 text-slate-500 border-white/5" : "bg-slate-100 text-slate-400 border-slate-200")
                                    }`}>
                                      {availableSlots > 0 ? `Còn ${availableSlots} slot` : "Đã hết slot"}
                                    </span>
                                  </td>

                                  <td className="px-6 py-4 text-center">
                                    {attendanceCheck.isLow ? (
                                      <span className={`px-2.5 py-1 rounded-md font-bold text-xs border animate-pulse transition-colors duration-0 ${theme === 'dark' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-red-50 text-red-600 border-red-200'}`}>
                                        ⚠️ Thiếu sĩ số quá !!
                                      </span>
                                    ) : (
                                      <span className={`px-2.5 py-1 rounded-md font-bold text-xs border transition-colors duration-0 ${theme === 'dark' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                                        ✅ Đạt chuẩn
                                      </span>
                                    )}
                                  </td>

                                  <td className="px-6 py-4 text-right pr-6 min-w-[130px]">
                                    <button 
                                      onClick={() => handleOpenPopup(row, availableSlots)}
                                      disabled={isFull || isLoading}
                                      className={`px-4 py-1.5 border font-bold rounded-lg focus:outline-none transition-colors duration-0 text-xs w-full max-w-[110px] text-center shadow-sm
                                        ${isFull 
                                          ? (theme === 'dark' ? 'bg-white/5 border-white/5 text-slate-500 cursor-not-allowed shadow-none' : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed shadow-none') 
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
                          <td colSpan={10} className="px-6 py-24 text-center">
                            <div className="flex flex-col items-center justify-center text-slate-400">
                              <div className={`w-20 h-20 mb-4 rounded-full flex items-center justify-center border-2 border-dashed transition-colors duration-0 ${theme === 'dark' ? 'bg-[#0a0f1c] border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                                <span className="text-3xl opacity-60">📭</span>
                              </div>
                              <p className={`font-bold text-lg mb-1 transition-colors duration-0 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-500'}`}>Không tìm thấy dữ liệu phù hợp</p>
                              <p className="text-sm font-medium">Hãy thử thay đổi điều kiện bộ lọc hoặc từ khóa tìm kiếm.</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className={`flex items-center justify-between px-6 py-4 border-t shrink-0 z-10 transition-colors duration-0 ${theme === 'dark' ? 'bg-transparent border-white/5' : 'bg-white border-slate-100'}`}>
                    <span className="text-[13px] text-slate-500 font-bold tracking-wide uppercase">
                      Page <span className="text-sky-500 text-sm mx-1">{currentPage}</span> / {totalPages}
                    </span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className={`px-5 py-2 border rounded-xl text-[13px] font-bold focus:outline-none transition-colors duration-0 active:scale-95 ${
                          theme === 'dark' 
                            ? 'bg-[#0a0f1c] border-white/10 text-slate-400 hover:text-sky-400 hover:border-sky-500/50 disabled:opacity-40 disabled:hover:bg-[#0a0f1c] disabled:hover:border-white/10 disabled:hover:text-slate-400' 
                            : 'bg-white border-slate-200 text-slate-500 hover:text-sky-600 hover:border-sky-300 hover:bg-sky-50 disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-slate-200 disabled:hover:text-slate-500'
                        }`}
                      >
                        ← Back
                      </button>
                      <button 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className={`px-5 py-2 border rounded-xl text-[13px] font-bold focus:outline-none transition-colors duration-0 active:scale-95 ${
                          theme === 'dark' 
                            ? 'bg-[#0a0f1c] border-white/10 text-slate-400 hover:text-sky-400 hover:border-sky-500/50 disabled:opacity-40 disabled:hover:bg-[#0a0f1c] disabled:hover:border-white/10 disabled:hover:text-slate-400' 
                            : 'bg-white border-slate-200 text-slate-500 hover:text-sky-600 hover:border-sky-300 hover:bg-sky-50 disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-slate-200 disabled:hover:text-slate-500'
                        }`}
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                )}
                
              </div>
            </div>
          </>
        )}
      </main>

      {/* MODAL GIỮ SLOT */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-slide-up">
          <div className={`rounded-3xl p-6 w-full max-w-md shadow-2xl border relative transition-colors duration-0 ${
            theme === 'dark' ? 'bg-[#151b2b] border-white/10 text-slate-200' : 'bg-white border-slate-100'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold transition-colors duration-0 ${theme === 'dark' ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-50 text-orange-500'}`}>
                📌
              </div>
              <div>
                <h3 className={`text-lg font-bold transition-colors duration-0 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Xác nhận Giữ Slot</h3>
                <p className="text-xs text-slate-500">Mã lớp: <strong className="text-sky-500">{selectedRowForSlot?.["Mã lớp"]}</strong></p>
              </div>
            </div>

            <div className="space-y-4 my-4">
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 transition-colors duration-0 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-700'}`}>
                  Nhập SID hoặc CID học sinh <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text"
                  maxLength={8}
                  placeholder=""
                  value={inputValue}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^\d*$/.test(val) && val.length <= 8) {
                      setInputValue(val);
                      setInputError("");
                    }
                  }}
                  className={`w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 font-bold text-sm transition-colors duration-0 ${
                    theme === 'dark' ? 'bg-[#0a0f1c] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                  autoFocus
                />
                {inputError && (
                  <p className="text-[11px] font-bold text-red-500 mt-1.5">{inputError}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button 
                type="button"
                onClick={() => setShowModal(false)}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-colors duration-0 cursor-pointer border ${
                  theme === 'dark' ? 'bg-[#0a0f1c] border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/5' : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-transparent'
                }`}
              >
                Hủy bỏ
              </button>
              <button 
                type="button"
                onClick={handleConfirmKeepSlot}
                className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-orange-500/30 transition-colors duration-0 cursor-pointer active:scale-95"
              >
                Xác nhận Giữ Slot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STYLE RENDER & ANIMATION */}
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=Dancing+Script:wght@600;700&display=swap');
        
        .font-vietnam { font-family: 'Be Vietnam Pro', sans-serif !important; }
        .font-greeting { font-family: 'Baloo 2', cursive; }
        .font-handwriting { font-family: 'Dancing Script', cursive; padding-right: 2px; }

        @keyframes smoothSignature {
          0%, 10% { clip-path: inset(0 100% 0 0); }
          45%, 60% { clip-path: inset(0 -5% 0 0); }
          90%, 100% { clip-path: inset(0 100% 0 0); }
        }
        .animate-smooth-signature {
          display: inline-block;
          white-space: nowrap;
          animation: smoothSignature 4.5s cubic-bezier(0.3, 0.1, 0.3, 1) infinite;
        }

        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }

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
      `}} />
    </div>
  );
}