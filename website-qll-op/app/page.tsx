"use client";
"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Papa from "papaparse";
import LoginScreen from "./LoginScreen";
import Sidebar from "./Sidebar";
import Header from "./Header";
import AdminStats from "./AdminStats";
import TrafficCharts from "./TrafficCharts";
import FilterDropdown from "./FilterDropdown";
import OnlineUsersTable from "./OnlineUsersTable";
import CountdownTimer from "./CountdownTimer";
import SlotHeldTable from "./SlotHeldTable";
import AdminManagement from "./AdminManagement";
import HistoryTable from "./HistoryTable";
import SlotModal from "./SlotModal";
import ErrorPopup from "./ErrorPopup";
import MainDataTable from "./MainDataTable";
import Dashboard from "./Dashboard";
import ConfirmDialog from "./ConfirmDialog";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://sehvatktrqtgsnmvebmm.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlaHZhdGt0cnF0Z3NubXZlYm1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5MzE5NzEsImV4cCI6MjEwNjUwNzk3MX0.hmQpRDUxsfP_LSWVE96nFEH85Qqw-z9LG3AQU1VXe0E";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginRole, setLoginRole] = useState<"QLL" | "Admin">("QLL");
  const [filterHistoryStatus, setFilterHistoryStatus] = useState("Tất cả");
  const [namecode, setNamecode] = useState("");
  const [teamLead, setTeamLead] = useState("Lead LienDT");
  // State quản lý popup lỗi khi load Sheet
  const [showErrorPopup, setShowErrorPopup] = useState(false);

  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [filterTeam, setFilterTeam] = useState("Tất cả");
  const [filterTrinhDo, setFilterTrinhDo] = useState("Tất cả");

  useEffect(() => {
    const savedTheme = localStorage.getItem("qll_theme") as "light" | "dark";
    if (savedTheme) setTheme(savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("qll_theme", newTheme);
  };

  const [adminList, setAdminList] = useState<
    { username: string; pass: string }[]
  >([{ username: "op_vanhanh", pass: "vhvuihoc123" }]);
  const [newAdminUser, setNewAdminUser] = useState("");
  const [newAdminPass, setNewAdminPass] = useState("");
  const [adminAddSuccess, setAdminAddSuccess] = useState("");
  const [adminAddError, setAdminAddError] = useState("");

  const fetchAdminsFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from("admins")
        .select("username, pass");
      if (!error && data && data.length > 0) {
        setAdminList(data);
      }
    } catch (err) {
      console.error("Lỗi tải danh sách admin:", err);
    }
  };

  // Hàm tính toán thời gian online tự động nhảy số
  const formatOnlineDuration = (timestamp: number) => {
    const now = Date.now();
    const diffMinutes = Math.floor((now - timestamp) / 60000);

    if (diffMinutes < 1) return "Vừa xong";
    if (diffMinutes < 60) return `${diffMinutes} phút`;

    // Nếu online quá 60 phút thì hiển thị theo giờ và phút
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return `${hours} giờ ${minutes} phút`;
  };

  useEffect(() => {
    fetchAdminsFromSupabase();
  }, []);

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const [activeNav, setActiveNav] = useState<
    | "Đang học"
    | "Khai giảng"
    | "Giữ Slot"
    | "SlotDaGiu"
    | "QuanTriAdmin"
    | "LichSuSlotAdmin"
    | "ThongKeAdmin"
    | "Dashboard"
  >("Giữ Slot");
  const [onlineUsers, setOnlineUsers] = useState<
    { namecode: string; teamLead: string; onlineAt: number }[]
  >([]);
  const [onlineCount, setOnlineCount] = useState(0);

  // [MOBILE] Mở/đóng sidebar dạng drawer trên màn hình nhỏ (desktop luôn hiện).
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Slot đang chờ xác nhận thu hồi (mở popup ConfirmDialog). null = đóng.
  const [recallTarget, setRecallTarget] = useState<any>(null);

  // Ref giữ channel realtime để nút "Làm mới" có thể đọc lại presence thủ công.
  const presenceChannelRef = useRef<any>(null);

  // Đọc lại danh sách online hiện tại từ channel (không đụng luồng subscribe/track).
  const refreshOnlineUsers = () => {
    const channel = presenceChannelRef.current;
    if (!channel) return;
    const newState = channel.presenceState();
    const usersList: {
      namecode: string;
      teamLead: string;
      onlineAt: number;
    }[] = [];
    Object.keys(newState).forEach((key) => {
      const presences = newState[key] as any[];
      if (presences && presences.length > 0) {
        const info = presences[0];
        usersList.push({
          namecode: info.user_name || key,
          teamLead: info.team_lead || "Vận hành chung",
          onlineAt: info.online_at || Date.now(),
        });
      }
    });
    setOnlineUsers(usersList);
    setOnlineCount(usersList.length);
  };

  // [TỐI ƯU V3] State Debounce để xử lý chống lag khi gõ tìm kiếm
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // [TỐI ƯU V6] ĐỒNG BỘ REALTIME TỪNG PHÚT (CHỐNG KẸT BIỂU ĐỒ)
  useEffect(() => {
    if (!isLoggedIn) return;

    const syncRealtimePresence = async () => {
      try {
        const now = new Date();
        const pad = (n: number) => n.toString().padStart(2, "0");
        const dateStr = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;
        const timeSlot = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

        const currentOnlineCount = onlineUsers.length; // Lấy chính xác số người đang online (kể cả 0)

        const { data: existing } = await supabase
          .from("system_traffic_logs")
          .select("id, request_count")
          .eq("date_str", dateStr)
          .eq("time_slot", timeSlot)
          .single();

        if (existing) {
          // Luôn cập nhật nếu số lượng online có biến động
          if (currentOnlineCount !== existing.request_count) {
            await supabase
              .from("system_traffic_logs")
              .update({
                request_count: currentOnlineCount,
                updated_at: new Date(),
              })
              .eq("id", existing.id);
          }
        } else {
          // Phút mới -> Tạo bản ghi mới
          await supabase.from("system_traffic_logs").insert([
            {
              date_str: dateStr,
              time_slot: timeSlot,
              request_count: currentOnlineCount,
            },
          ]);
        }
      } catch (error) {
        console.error("Lỗi đồng bộ CCU lên Supabase:", error);
      }
    };

    // 1. Kích hoạt ngay khi danh sách online thay đổi (Có người vào/ra)
    syncRealtimePresence();

    // 2. Chốt sổ định kỳ mỗi 60 giây
    const interval = setInterval(syncRealtimePresence, 60000);

    // Yêu cầu quyền thông báo (nếu có)
    if (typeof window !== "undefined" && "Notification" in window) {
      if (
        Notification.permission !== "granted" &&
        Notification.permission !== "denied"
      ) {
        Notification.requestPermission();
      }
    }

    return () => clearInterval(interval);
  }, [isLoggedIn, onlineUsers.length]);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 250); // Delay 250ms
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Mảng câu chữ chạy luân phiên (câu đầu tiên là câu chào dài cá nhân hóa)
  const words = useMemo(
    () => ["Dữ liệu đã sẵn sàng !", "Xin Chào", "Hello !"],
    [],
  );
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % (words.length + 1));
    }, 4000);

    return () => clearInterval(timer);
  }, [words]);

  const [slotHistoryData, setSlotHistoryData] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [completedSlots, setCompletedSlots] = useState<Record<string, boolean>>(
    {},
  );

  const [filterMonHoc, setFilterMonHoc] = useState("Tất cả");
  // DÒNG BỊ THIẾU Ở ĐÂY NÀY BẠN: Khai báo State cho Phân môn KHTN
  const [filterPhanMonKHTN, setFilterPhanMonKHTN] = useState("Tất cả");

  // Tự động reset Phân môn nếu QLL chọn môn khác (không phải KHTN)
  useEffect(() => {
    if (filterMonHoc !== "KHTN") {
      setFilterPhanMonKHTN("Tất cả");
    }
  }, [filterMonHoc]);

  const [filterKhoi, setFilterKhoi] = useState("Tất cả");
  const [filterLoaiLop, setFilterLoaiLop] = useState("Tất cả");
  const [filterLichHoc, setFilterLichHoc] = useState("Tất cả");
  const [filterToday, setFilterToday] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // HÀM MỚI: Xóa tất cả bộ lọc
  const handleClearFilters = () => {
    setFilterMonHoc("Tất cả");
    setFilterPhanMonKHTN("Tất cả");
    setFilterKhoi("Tất cả");
    setFilterLoaiLop("Tất cả");
    setFilterLichHoc("Tất cả");
    setFilterTrinhDo("Tất cả"); // <--- THÊM DÒNG NÀY ĐỂ RESET TRÌNH ĐỘ
    setFilterToday(false);
    setSearchTerm(""); // Nếu bạn muốn xóa cả thanh tìm kiếm thì để dòng này
    setCurrentPage(1);
  };

  // Xác định xem có bộ lọc nào đang được kích hoạt không
  const isFiltering =
    filterMonHoc !== "Tất cả" ||
    filterPhanMonKHTN !== "Tất cả" ||
    filterKhoi !== "Tất cả" ||
    filterLoaiLop !== "Tất cả" ||
    filterLichHoc !== "Tất cả" ||
    filterTrinhDo !== "Tất cả" || // <--- THÊM ĐIỀU KIỆN NÀY ĐỂ HIỆN NÚT XÓA LỌC
    filterToday !== false;

  const [systemRequestsData, setSystemRequestsData] = useState<any[]>([]);

  // [TỐI ƯU V3] State khóa nút chống click liên tục trong form xác nhận
  const [isSubmitting, setIsSubmitting] = useState(false);

  // =====================================================================
  // =====================================================================
  // TẢI VÀ VẼ LƯU VẾT TRUY CẬP (TRAFFIC ANALYTICS) TỪ SUPABASE
  // =====================================================================
  const [dailyTrafficStats, setDailyTrafficStats] = useState<
    Record<string, number>
  >({});

  // Hàm tải dữ liệu log từ DB
  const loadTrafficStatsFromSupabase = async () => {
    try {
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, "0");
      const dateStr = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;

      const { data, error } = await supabase
        .from("system_traffic_logs")
        .select("time_slot, request_count")
        .eq("date_str", dateStr);

      if (!error && data) {
        const trafficMap: Record<string, number> = {};
        data.forEach((row: any) => {
          trafficMap[row.time_slot] = row.request_count;
        });
        setDailyTrafficStats(trafficMap);
      }
    } catch (err) {
      console.error("Lỗi tải traffic từ Supabase:", err);
    }
  };

  // =======================================================================
  // 1. TỰ ĐỘNG LÀM MỚI BIỂU ĐỒ MỖI 30 GIÂY (GIẢI QUYẾT LỖI LỆCH DATA)
  // =======================================================================
  useEffect(() => {
    if (isLoggedIn && activeNav === "ThongKeAdmin") {
      loadTrafficStatsFromSupabase(); // Kéo data ngay lập tức khi mở tab

      // Thiết lập tự động kéo data mới mỗi 30 giây (30000ms)
      const interval = setInterval(() => {
        loadTrafficStatsFromSupabase();
      }, 30000);

      // Dọn dẹp interval khi chuyển sang tab khác
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, activeNav]);

  // =======================================================================
  // =======================================================================
  // 2. ZOOM BIỂU ĐỒ ĐƯỜNG (THUẬT TOÁN ĐIỀN KHUYẾT CHỐNG ĐỨT GÃY)
  // =======================================================================
  const todayChartData = useMemo(() => {
    const now = new Date();
    const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
    const chartData = [];

    // ZOOM IN: Xem 2 tiếng (120 phút) gần nhất để sóng hiển thị to và rõ
    const startMinutes = Math.max(0, currentTotalMinutes - 120);

    let lastKnownValue = 0; // Bộ nhớ lưu số lượng online gần nhất
    let minutesSinceLastData = 0; // Bộ đếm thời gian mất kết nối

    // Quét chi tiết TỪNG PHÚT MỘT
    for (let i = startMinutes; i <= currentTotalMinutes; i++) {
      const h = Math.floor(i / 60)
        .toString()
        .padStart(2, "0");
      const m = (i % 60).toString().padStart(2, "0");
      const timeKey = `${h}:${m}`;

      // Nếu Supabase có ghi nhận phút này -> Cập nhật số mới nhất
      if (dailyTrafficStats[timeKey] !== undefined) {
        lastKnownValue = dailyTrafficStats[timeKey];
        minutesSinceLastData = 0; // Reset bộ đếm
      } else {
        // Nếu phút này Database chưa kịp đồng bộ -> Giữ nguyên con số của phút trước
        minutesSinceLastData++;

        // BẢO VỆ: Nếu quá 3 phút không có tín hiệu (Tất cả đã tắt máy) -> Ép về 0 để không bị ảo
        if (minutesSinceLastData >= 3) {
          lastKnownValue = 0;
        }
      }

      chartData.push({ time: timeKey, requests: lastKnownValue });
    }

    return chartData;
  }, [dailyTrafficStats]);

  // 2. BIỂU ĐỒ CỘT: TỔNG HỢP 7 NGÀY GẦN NHẤT & ĐỒNG BỘ DỮ LIỆU
  const historicalChartData = useMemo(() => {
    const last7Days: string[] = [];
    const dayMap: Record<string, number> = {};

    // 1. Khởi tạo mốc 7 ngày gần nhất (Đảm bảo đúng thứ tự thời gian và luôn hiển thị cả ngày 0 request)
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}`;
      last7Days.push(dayStr);
      dayMap[dayStr] = 0;
    }

    // 2. Đếm số lượng request thực tế từ Database lịch sử
    if (slotHistoryData && slotHistoryData.length > 0) {
      slotHistoryData.forEach((row) => {
        let dateObj = null;
        try {
          if (row.timestamp) {
            const ts = Number(row.timestamp);
            dateObj = isNaN(ts) ? new Date(row.timestamp) : new Date(ts);
          } else if (row["Thời gian"]) {
            const parts = row["Thời gian"].split(" ");
            if (parts.length >= 2) {
              const dParts = parts[0].split("/");
              dateObj = new Date(
                parseInt(dParts[2]),
                parseInt(dParts[1]) - 1,
                parseInt(dParts[0]),
              );
            }
          }
        } catch (e) {}

        if (dateObj) {
          const dayStr = `${dateObj.getDate().toString().padStart(2, "0")}/${(dateObj.getMonth() + 1).toString().padStart(2, "0")}`;
          if (dayMap[dayStr] !== undefined) {
            dayMap[dayStr] += 1;
          }
        }
      });
    }

    // 3. ĐỒNG BỘ BIỂU ĐỒ: Cộng số người đang Online vào tổng ngày hôm nay để khớp với biểu đồ Line
    const today = new Date();
    const todayStr = `${today.getDate().toString().padStart(2, "0")}/${(today.getMonth() + 1).toString().padStart(2, "0")}`;

    if (
      onlineUsers &&
      onlineUsers.length > 0 &&
      dayMap[todayStr] !== undefined
    ) {
      dayMap[todayStr] += onlineUsers.length;
    }

    // Trả về mảng đúng chuẩn 7 ngày
    return last7Days.map((day) => ({ date: day, total: dayMap[day] }));
  }, [slotHistoryData, onlineUsers]);

  const [heldSlots, setHeldSlots] = useState<
    Record<string, { timestamp: number }[]>
  >({});
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
    const savedCompleted = localStorage.getItem("qll_completed_slots");
    if (savedCompleted) {
      try {
        setCompletedSlots(JSON.parse(savedCompleted));
      } catch (e) {
        console.error(e);
      }
    }

    const savedHeld = localStorage.getItem("qll_held_slots_data");
    if (savedHeld) {
      try {
        const parsed = JSON.parse(savedHeld);
        const now = Date.now();
        const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
        const cleaned: Record<string, { timestamp: number }[]> = {};

        Object.keys(parsed).forEach((maLop) => {
          const validHolds = parsed[maLop].filter(
            (item: { timestamp: number }) =>
              now - item.timestamp < TWENTY_FOUR_HOURS,
          );
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
          setTeamLead(parsed.teamLead || "Lead LienDT");
          setLoginRole("QLL");
        }
        setIsLoggedIn(true);
      } catch (e) {
        console.error(e);
      }
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
        parseInt(timeParts[2] || "0"),
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
      const matchMaLop =
        item.ma_lop === maLop ||
        item["Mã lớp giữ"] === maLop ||
        item["Mã lớp"] === maLop;
      const notDone = item.is_done === false;
      const notExpired = now - Number(item.timestamp) < TWENTY_FOUR_HOURS;
      const notCancelled = item.is_cancelled !== true; // Slot đã thu hồi → nhả lại

      return matchMaLop && notDone && notExpired && notCancelled;
    });

    return activeHolds.length;
  };

  const handleMarkAsDone = async (dbId: string) => {
    if (!dbId) {
      alert("Lỗi: Không tìm thấy ID bản ghi trong cơ sở dữ liệu!");
      return;
    }

    // 1. Đổi giao diện màn hình của chính mình (Tài khoản A) ngay lập tức
    setSlotHistoryData((prevData) =>
      prevData.map((item) =>
        item.id === dbId ? { ...item, is_done: true } : item,
      ),
    );

    try {
      // ========================================================
      // 2. TÍNH NĂNG MỚI: Bắn tín hiệu "Broadcast" thẳng sang màn hình Tài khoản B
      // Giúp màn B ẩn nút ngay lập tức mà không cần đợi Database hay API
      // ========================================================
      await supabase.channel("qll-room").send({
        type: "broadcast",
        event: "slot_done",
        payload: { id: dbId },
      });

      // 3. Vẫn update vào Database bình thường để lưu lại lịch sử
      const { error } = await supabase
        .from("slot_holds")
        .update({ is_done: true })
        .eq("id", dbId);

      if (error) {
        console.error("Lỗi update Supabase:", error);
        alert("Lỗi Update DB: " + error.message);
        loadSlotHistory(true);
      }
    } catch (error) {
      console.error("Lỗi mạng khi update trạng thái:", error);
    }
  };

  // THU HỒI SLOT: QLL thu hồi slot CÒN HẠN (chưa done, chưa quá hạn).
  // Đánh dấu is_cancelled = true (không xóa, giữ lịch sử). Slot được nhả lại
  // vì getActiveHeldCount sẽ bỏ qua bản ghi đã hủy. Realtime tới mọi máy.
  const handleRecallSlot = async (dbId: string) => {
    if (!dbId) {
      alert("Lỗi: Không tìm thấy ID bản ghi trong cơ sở dữ liệu!");
      return;
    }

    // 1. Cập nhật UI của chính mình ngay lập tức (optimistic).
    setSlotHistoryData((prevData) =>
      prevData.map((item) =>
        item.id === dbId ? { ...item, is_cancelled: true } : item,
      ),
    );

    try {
      // 2. Bắn tín hiệu realtime sang mọi máy khác (Admin + QLL khác).
      await supabase.channel("qll-room").send({
        type: "broadcast",
        event: "slot_cancelled",
        payload: { id: dbId },
      });

      // 3. Lưu vào Database.
      const { error } = await supabase
        .from("slot_holds")
        .update({ is_cancelled: true })
        .eq("id", dbId);

      if (error) {
        console.error("Lỗi thu hồi slot:", error);
        alert("Lỗi thu hồi slot: " + error.message);
        loadSlotHistory(true);
      }
    } catch (error) {
      console.error("Lỗi mạng khi thu hồi slot:", error);
    }
  };

  const isUserAdmin = loginRole === "Admin";
  const displayName = isUserAdmin ? adminUsername : namecode;
  const displayTeamOrRole = isUserAdmin ? "Admin hệ thống" : teamLead;

  useEffect(() => {
    if (isLoggedIn) {
      const currentLoginTime = Date.now();
      const channel = supabase.channel("qll-room", {
        config: {
          presence: { key: displayName },
          broadcast: { self: false }, // QUAN TRỌNG: Mở cổng để nhận "tin nhắn ngầm" từ máy khác
        },
      });
      presenceChannelRef.current = channel;

      channel.on("presence", { event: "sync" }, () => {
        const newState = channel.presenceState();
        const usersList: {
          namecode: string;
          teamLead: string;
          onlineAt: number;
        }[] = [];

        Object.keys(newState).forEach((key) => {
          const presences = newState[key] as any[];
          if (presences && presences.length > 0) {
            const info = presences[0];
            usersList.push({
              namecode: info.user_name || key,
              teamLead: info.team_lead || "Vận hành chung",
              onlineAt: info.online_at || currentLoginTime,
            });
          }
        });

        setOnlineUsers(usersList);
        setOnlineCount(usersList.length);
      });

      // ========================================================
      // TÍNH NĂNG MỚI: Lắng nghe nếu có ai đó (Tài khoản A) vừa bấm Done
      // Màn hình của mình (Tài khoản B) sẽ lập tức chuyển sang "Đã xếp xong"
      // ========================================================
      channel.on("broadcast", { event: "slot_done" }, (payload) => {
        const doneId = payload.payload.id;
        console.log(
          "🔥 Tín hiệu Realtime: Mã slot ID",
          doneId,
          "vừa được xếp xong!",
        );

        // Ép dữ liệu bảng ở máy mình đổi sang is_done = true
        setSlotHistoryData((prevData) =>
          prevData.map((item) =>
            item.id === doneId ? { ...item, is_done: true } : item,
          ),
        );
      });

      // Lắng nghe khi có QLL thu hồi slot → cập nhật mọi máy ngay (nhả slot).
      channel.on("broadcast", { event: "slot_cancelled" }, (payload) => {
        const cancelledId = payload.payload.id;
        setSlotHistoryData((prevData) =>
          prevData.map((item) =>
            item.id === cancelledId ? { ...item, is_cancelled: true } : item,
          ),
        );
      });

      channel.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_name: displayName,
            team_lead: displayTeamOrRole,
            online_at: currentLoginTime,
          });
        }
      });

      return () => {
        presenceChannelRef.current = null;
        supabase.removeChannel(channel);
      };
    }
  }, [isLoggedIn, displayName, displayTeamOrRole]);

  const qllStats = useMemo(() => {
    if (!slotHistoryData || slotHistoryData.length === 0) return [];
    const map: Record<
      string,
      {
        name: string;
        team: string;
        total: number;
        done: number;
        pending: number;
        expired: number;
      }
    > = {};

    slotHistoryData.forEach((row, index) => {
      const nguoiGiu = row.nguoi_giu || row["Người giữ"] || "Không rõ";
      const team = row.team || row["Team"] || "-";

      let timeStr = "";
      if (row.timestamp) {
        const d = new Date(Number(row.timestamp));
        const pad = (n: number) => n.toString().padStart(2, "0");
        timeStr = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      } else {
        timeStr = row["Thời gian"] || "";
      }

      const maLop = row.ma_lop || row["Mã lớp giữ"] || row["Mã lớp"] || "";
      const rowKey = `${timeStr}-${maLop}-${index}`;

      const isDone = completedSlots[rowKey] || row.is_done;
      const isExpired = checkIsExpired(timeStr);

      if (!map[nguoiGiu]) {
        map[nguoiGiu] = {
          name: nguoiGiu,
          team: team,
          total: 0,
          done: 0,
          pending: 0,
          expired: 0,
        };
      }

      map[nguoiGiu].total += 1;
      if (isDone) map[nguoiGiu].done += 1;
      else if (isExpired) map[nguoiGiu].expired += 1;
      else map[nguoiGiu].pending += 1;
    });

    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [slotHistoryData, completedSlots]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
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
      setAdminUsername("");
      const userData = {
        namecode: namecode.trim(),
        teamLead: teamLead.trim(),
        role: "QLL",
      };
      localStorage.setItem("qll_logged_user", JSON.stringify(userData));
      setIsLoggedIn(true);
    } else {
      if (!adminUsername.trim() || !adminPassword.trim()) {
        setLoginError("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu Admin!");
        return;
      }

      try {
        const res = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: adminUsername.trim(),
            password: adminPassword.trim(),
          }),
        });

        const result = await res.json();

        if (!result.success) {
          setLoginError("Tên đăng nhập hoặc mật khẩu Admin không chính xác!");
          return;
        }

        setNamecode("");
        const userData = {
          namecode: result.username,
          teamLead: "Admin hệ thống",
          role: "Admin",
        };
        localStorage.setItem("qll_logged_user", JSON.stringify(userData));
        setTeamLead("Admin hệ thống");
        setIsLoggedIn(true);
      } catch (err) {
        setLoginError("Lỗi kết nối khi xác thực Admin!");
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("qll_logged_user");
    setIsLoggedIn(false);
    setNamecode("");
    setAdminUsername("");
    setAdminPassword("");
    setLoginRole("QLL");
    setTeamLead("Lead LienDT");
    setActiveNav("Giữ Slot");
  };

  const handleAddAdminSubmit = async (e: React.FormEvent) => {
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

    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: cleanUser, password: cleanPass }),
      });

      const result = await res.json();

      if (!result.success) {
        setAdminAddError(result.error || "Lỗi lưu vào Supabase!");
        return;
      }

      await fetchAdminsFromSupabase();
      setNewAdminUser("");
      setNewAdminPass("");
      setAdminAddSuccess("Đã thêm tài khoản Admin vào Database thành công!");
      setTimeout(() => setAdminAddSuccess(""), 4000);
    } catch (err) {
      setAdminAddError("Lỗi kết nối khi thêm Admin!");
    }
  };
  // =========================================================

  useEffect(() => {
    if (isLoggedIn) {
      loadTrafficStatsFromSupabase();
    }
  }, [isLoggedIn]);

const loadData = () => {
    setLoading(true);
    setErrorMessage(""); 

    Papa.parse(SHEET_CSV_URL, {
      download: true,
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete: (results) => {
        const isHtmlError = results.meta?.fields?.some(field => 
          field.toLowerCase().includes("html") || field.toLowerCase().includes("!doctype")
        );

        if (isHtmlError) {
          // 👉 ĐỔI LỜI NHẮN LỖI MẠNG / LINK TRẢ VỀ HTML
          setErrorMessage("Hệ thống đang có sự cố ! Liên hệ huynq5 Vận hành !");
        } 
        else if (results.data && results.data.length > 0) {
          setData(results.data);
          setErrorMessage(""); // Dữ liệu ok thì ẩn popup
        } 
        else {
          // 👉 ĐỔI LỜI NHẮN KHI DATA TRỐNG (Hoặc bạn có thể giữ nguyên câu cũ tuỳ ý)
          setErrorMessage("Hệ thống đang có sự cố ! Liên hệ HuyNQ5 - Vận hành !");
        }

        setLoading(false);
        const now = new Date();
        const timeStr = now.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
        const dateStr = now.toLocaleDateString("vi-VN");
        setLastUpdated(`${timeStr}\n${dateStr}`);
      },
      error: (err) => {
        console.error("Lỗi:", err);
        setLoading(false);
        // 👉 ĐỔI LỜI NHẮN LỖI KẾT NỐI (Mất mạng, CORS...)
        setErrorMessage("Hệ thống đang có sự cố ! Liên hệ HuyNQ5 - Vận hành !");
      },
    });
  };

  const loadSlotHistory = async (isSilent = false) => {
    if (!isSilent) {
      setLoadingHistory(true);
    }

    try {
      const response = await fetch(`/api/slot-hold?t=${Date.now()}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });
      const result = await response.json();

      if (result.success && result.data) {
        setSlotHistoryData((prevData) => {
          const doneIds = new Set(
            prevData.filter((item) => item.is_done).map((item) => item.id),
          );

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

      const intervalId = setInterval(
        () => {
          loadData();
        },
        5 * 60 * 1000,
      );

      // LẮNG NGHE REALTIME TỪ SUPABASE
      const slotHistorySubscription = supabase
        .channel("realtime-slot-holds")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "slot_holds",
          },
          (payload) => {
            console.log("⚡ Supabase Realtime báo có thay đổi:", payload);

            // 1. Nếu là hành động UPDATE (Có người vừa bấm Done)
            if (payload.eventType === "UPDATE") {
              // Ép UI tài khoản đổi sang xanh ngay lập tức
              setSlotHistoryData((prev) =>
                prev.map((item) =>
                  item.id === payload.new.id
                    ? { ...item, is_done: payload.new.is_done }
                    : item,
                ),
              );
            }

            // 2. TÍNH NĂNG MỚI: Nếu là hành động INSERT (Có người vừa tạo Giữ Slot mới)
            if (payload.eventType === "INSERT") {
              // [TỐI ƯU V3] Bổ sung Optimistic Update cho INSERT
              // Đẩy thẳng bản ghi mới vào danh sách giúp trừ slot ngay lập tức không cần đợi Server
              setSlotHistoryData((prev) => {
                // Đảm bảo không bị thêm trùng nếu máy mình vừa bấm gọi API xong
                if (prev.some((item) => item.id === payload.new.id))
                  return prev;
                return [payload.new, ...prev];
              });

              // Bắn thông báo Web Push góc màn hình cho Admin
              if (
                loginRole === "Admin" &&
                "Notification" in window &&
                Notification.permission === "granted"
              ) {
                const notif = new Notification("🚨 CÓ YÊU CẦU GIỮ SLOT MỚI!", {
                  body: `QLL ${payload.new.nguoi_giu} vừa xin giữ mã lớp: ${payload.new.ma_lop}. Click để xử lý ngay!`,
                  icon: "https://vuihoc.vn/favicon.ico",
                  requireInteraction: true,
                });

                notif.onclick = () => {
                  window.focus();
                  notif.close();
                };
              }
            }

            // [TỐI ƯU V3] Đã loại bỏ loadSlotHistory(true) khỏi luồng sự kiện INSERT
            // để tránh bão Request (Spike) từ 50 máy trút lên API cùng 1 lúc.
            // Dữ liệu đã được Optimistic Update bên trên!
          },
        )
        .subscribe();

      return () => {
        clearInterval(intervalId);
        supabase.removeChannel(slotHistorySubscription);
      };
    }
  }, [isLoggedIn, isUserAdmin]);

  // [TỐI ƯU V3] Cập nhật mảng phụ thuộc cho Pagination
  useEffect(() => {
    setCurrentPage(1);
  }, [
    debouncedSearchTerm,
    activeNav,
    filterLoaiLop,
    filterKhoi,
    filterMonHoc,
    filterPhanMonKHTN,
    filterLichHoc,
    filterToday,
  ]);

  // TỐI ƯU V3: Danh sách thả xuống Lịch học phụ thuộc vào Môn học
  const dropdownOptions = useMemo(() => {
    const loaiLopSet = new Set<string>();
    const khoiSet = new Set<string>();
    const monHocSet = new Set<string>();
    const daysOnlySet = new Set<string>();
    const trinhDoSet = new Set<string>(); // <--- THÊM DÒNG NÀY VÀO ĐÂY

    data.forEach((item) => {
      // 2. Quét Môn học (Áp dụng thuật toán ảo hóa TCLC)
      const rawSub = (item["Môn học"] || "").trim();
      let isToanTCLC = false;
      let isToanThuong = false;
      let isKHTN = false;

      if (
        rawSub.toLowerCase().includes("toán") ||
        rawSub.toLowerCase().includes("toan")
      ) {
        const maLop = (item["Mã lớp"] || "").trim().toUpperCase();
        if (maLop.startsWith("TCLC")) {
          monHocSet.add("Toán TCLC");
          isToanTCLC = true;
        } else {
          monHocSet.add("Toán");
          isToanThuong = true;
        }
      } else {
        if (rawSub) {
          monHocSet.add(rawSub);
          if (
            rawSub.toLowerCase().includes("khtn") ||
            rawSub.toLowerCase().includes("khoa học")
          ) {
            isKHTN = true;
          }
        }
      }

      // 3. TỐI ƯU UX: Quét Lịch học dựa trên Ngữ cảnh Môn
      // Chỉ add Lịch học vào danh sách xổ xuống NẾU dòng đó thỏa mãn bộ lọc Môn hiện tại
      let shouldAddLich = true;

      if (filterMonHoc !== "Tất cả") {
        if (filterMonHoc === "Toán TCLC" && !isToanTCLC) shouldAddLich = false;
        else if (filterMonHoc === "Toán" && !isToanThuong)
          shouldAddLich = false;
        else if (filterMonHoc === "KHTN" && !isKHTN) shouldAddLich = false;
        else if (
          filterMonHoc !== "Toán" &&
          filterMonHoc !== "Toán TCLC" &&
          filterMonHoc !== "KHTN"
        ) {
          if (rawSub !== filterMonHoc) shouldAddLich = false;
        }
      }

      if (shouldAddLich) {
        // 1. Quét Loại Lớp và Khối của những môn thỏa mãn
        if (item["Loại lớp"]) {
          loaiLopSet.add(item["Loại lớp"].trim());
        }
        if (item["Khối"]) {
          khoiSet.add(item["Khối"].trim());
        }

        // 2. Chỉ thêm lịch học nếu có
        if (item["Lịch học"]) {
          const fullLich = item["Lịch học"].trim();
          const daysPart = fullLich.split(" ")[0]; // Lấy phần "T2,T5"
          if (daysPart) daysOnlySet.add(daysPart);
        }

        // 3. CHỈ thêm Trình độ của những môn thoả mãn (tức là nằm TRONG khối shouldAddLich)
        if (item["Trình độ"]) {
          trinhDoSet.add(item["Trình độ"].trim());
        }
      } // <-- Đây là dấu đóng của if(shouldAddLich)
    }); // <-- Dấu đóng của vòng lặp data.forEach

    const sortedKhoi = Array.from(khoiSet).sort((a, b) => {
      const numA = parseInt(a.replace(/[^0-9]/g, "")) || 0;
      const numB = parseInt(b.replace(/[^0-9]/g, "")) || 0;
      return numA - numB;
    });

    return {
      loaiLop: Array.from(loaiLopSet).sort(),
      khoi: sortedKhoi,
      monHoc: Array.from(monHocSet).sort(),
      lichHoc: Array.from(daysOnlySet).sort(), // Lúc này danh sách Lịch đã được lọc đúng
      trinhDo: Array.from(trinhDoSet).sort(), // <--- THÊM DÒNG NÀY
    };
  }, [data, filterMonHoc]); // Rất quan trọng: Thêm filterMonHoc vào để nó tự động tính lại khi đổi môn

  const stats = useMemo(() => {
    const currentTabBase = data.filter((item) => {
      const status = (item["Phân loại lớp"] || "").toLowerCase().trim();
      if (
        activeNav === "Giữ Slot" ||
        activeNav === "QuanTriAdmin" ||
        activeNav === "LichSuSlotAdmin" ||
        activeNav === "ThongKeAdmin"
      )
        return true;
      return activeNav === "Đang học"
        ? status.includes("đang học")
        : status.includes("khai giảng");
    });

    return {
      total: data.length,
      studying: data.filter((d) =>
        (d["Phân loại lớp"] || "").toLowerCase().includes("đang học"),
      ).length,
      pending: data.filter((d) =>
        (d["Phân loại lớp"] || "").toLowerCase().includes("khai giảng"),
      ).length,
      tabTotal: currentTabBase.length,
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
    } else if (
      monHoc.includes("tiếng anh") ||
      monHoc.includes("tieng anh") ||
      monHoc.includes("moet")
    ) {
      if (loaiLop === "1:4") maxAllowed = 3;
    } else if (monHoc.includes("khtn")) {
      if (loaiLop === "1:10") maxAllowed = 10;
    } else if (
      monHoc.includes("ngữ văn") ||
      monHoc.includes("ngu van") ||
      monHoc.includes("văn")
    ) {
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
    } else if (
      monHoc.includes("tiếng anh") ||
      monHoc.includes("tieng anh") ||
      monHoc.includes("moet")
    ) {
      if (loaiLop === "1:4") threshold = 1;
    } else if (monHoc.includes("khtn")) {
      if (loaiLop === "1:10") threshold = 10;
    } else if (
      monHoc.includes("ngữ văn") ||
      monHoc.includes("ngu van") ||
      monHoc.includes("văn")
    ) {
      if (loaiLop === "1:4") threshold = 1;
    }

    if (dangHoc <= threshold) {
      return { isLow: true, text: "🥲 Lớp còn hơi vắng..." };
    }
    return { isLow: false, text: "" };
  };

  const filteredData = useMemo(() => {
    const today = new Date().getDay();
    const todayStr = today === 0 ? "CN" : `T${today + 1}`;

    return data.filter((item) => {
      const monHocRule = (item["Môn học"] || "")
        .toString()
        .toLowerCase()
        .trim();
      const loaiLopRawRule = (item["Loại lớp"] || "").toString().trim();
      const loaiLopRule = loaiLopRawRule.replace(/^Lớp\s+/i, "").trim();
      const dangHocRule = Number(item["Đang học"]) || 0;

      let isPassRule = false;

      if (monHocRule.includes("toán") || monHocRule.includes("toan")) {
        if (loaiLopRule === "1:6") isPassRule = dangHocRule <= 5;
        else if (loaiLopRule === "1:8") isPassRule = dangHocRule <= 8;
        else if (loaiLopRule === "1:10") isPassRule = dangHocRule <= 9;
        else if (loaiLopRule === "1:15") isPassRule = dangHocRule <= 19;
      } else if (
        monHocRule.includes("tiếng anh") ||
        monHocRule.includes("tieng anh") ||
        monHocRule.includes("moet")
      ) {
        if (loaiLopRule === "1:4") isPassRule = dangHocRule <= 2;
      } else if (monHocRule.includes("khtn")) {
        if (loaiLopRule === "1:10") isPassRule = dangHocRule <= 9;
      } else if (
        monHocRule.includes("ngữ văn") ||
        monHocRule.includes("ngu van") ||
        monHocRule.includes("văn")
      ) {
        if (loaiLopRule === "1:4") isPassRule = dangHocRule <= 3;
      }

      if (!isPassRule) return false;

      if (
        activeNav !== "Giữ Slot" &&
        activeNav !== "QuanTriAdmin" &&
        activeNav !== "LichSuSlotAdmin" &&
        activeNav !== "ThongKeAdmin"
      ) {
        const status = (item["Phân loại lớp"] || "").toLowerCase().trim();
        const matchNav =
          activeNav === "Đang học"
            ? status.includes("đang học")
            : status.includes("khai giảng");
        if (!matchNav) return false;
      }

      if (
        filterLoaiLop !== "Tất cả" &&
        (item["Loại lớp"] || "").trim() !== filterLoaiLop
      )
        return false;
      if (filterKhoi !== "Tất cả" && (item["Khối"] || "").trim() !== filterKhoi)
        return false;

      // TỐI ƯU LỌC V3: Rẽ nhánh riêng biệt cho Toán và KHTN
      if (filterMonHoc !== "Tất cả") {
        if (filterMonHoc === "Toán" || filterMonHoc === "Toán TCLC") {
          const rawSub = (item["Môn học"] || "").toLowerCase().trim();
          if (!rawSub.includes("toán") && !rawSub.includes("toan"))
            return false;

          const isTCLC = (item["Mã lớp"] || "")
            .toUpperCase()
            .startsWith("TCLC");
          if (filterMonHoc === "Toán TCLC" && !isTCLC) return false;
          if (filterMonHoc === "Toán" && isTCLC) return false;
        } else if (filterMonHoc === "KHTN") {
          // XỬ LÝ KHTN & PHÂN MÔN TỪ KHUNG CHƯƠNG TRÌNH
          const rawSub = (item["Môn học"] || "").toLowerCase().trim();
          if (!rawSub.includes("khtn") && !rawSub.includes("khoa học"))
            return false;

          if (filterPhanMonKHTN !== "Tất cả") {
            const khungCT = (
              item["M: Khung chương trình"] ||
              item["Khung chương trình"] ||
              ""
            ).toLowerCase();
            // Lọc theo từ khóa của từng phân môn
            if (
              filterPhanMonKHTN === "Vật lí" &&
              !khungCT.includes("vật lí") &&
              !khungCT.includes("vật lý")
            )
              return false;
            if (filterPhanMonKHTN === "Hóa học" && !khungCT.includes("hóa học"))
              return false;
            if (
              filterPhanMonKHTN === "Sinh học" &&
              !khungCT.includes("sinh học")
            )
              return false;
          }
        } else {
          // Các môn khác (Anh...): So sánh chuỗi tĩnh bình thường, tốc độ chớp mắt
          if ((item["Môn học"] || "").trim() !== filterMonHoc) return false;
        }
      }

      const itemLich = (item["Lịch học"] || "").trim();

      if (filterLichHoc !== "Tất cả") {
        if (!itemLich.startsWith(filterLichHoc)) return false;
      }
      if (filterToday) {
        if (!itemLich.includes(todayStr)) return false;
      }
      if (
        filterTrinhDo !== "Tất cả" &&
        (item["Trình độ"] || "").trim() !== filterTrinhDo
      ) {
        return false;
      }

      // [TỐI ƯU V3] Đã đổi thành debouncedSearchTerm để thanh tìm kiếm mượt mà
      if (debouncedSearchTerm) {
        const searchStr = debouncedSearchTerm.toLowerCase().trim();
        const matchSearch =
          (item["Mã lớp"] || "").toLowerCase().includes(searchStr) ||
          (item["Môn học"] || "").toLowerCase().includes(searchStr);
        if (!matchSearch) return false;
      }

      return true;
    });
  }, [
    data,
    activeNav,
    debouncedSearchTerm,
    filterLoaiLop,
    filterKhoi,
    filterMonHoc,
    filterPhanMonKHTN,
    filterLichHoc,
    filterTrinhDo, // <--- THÊM VÀO ĐÂY NHÉ
    filterToday,
  ]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const currentTableData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage]);

  // 1. TẠO BỘ LỌC TÌM KIẾM CHO LỊCH SỬ
  const filteredHistoryData = useMemo(() => {
    // [TỐI ƯU V3] Áp dụng luôn debounce cho bảng lịch sử Admin
    if (!debouncedSearchTerm) return slotHistoryData;
    const lowerSearch = debouncedSearchTerm.toLowerCase().trim();

    return slotHistoryData.filter((item) => {
      const maLop = (
        item.ma_lop ||
        item["Mã lớp giữ"] ||
        item["Mã lớp"] ||
        ""
      ).toLowerCase();
      const monHoc = (item.mon_hoc || item["Môn học"] || "").toLowerCase();
      const nguoiGiu = (
        item.nguoi_giu ||
        item["Người giữ"] ||
        ""
      ).toLowerCase();
      const note = (
        item.note ||
        item["lưu ý ( mục note của QLL )"] ||
        item["lưu ý"] ||
        ""
      ).toLowerCase();

      return (
        maLop.includes(lowerSearch) ||
        monHoc.includes(lowerSearch) ||
        nguoiGiu.includes(lowerSearch) ||
        note.includes(lowerSearch)
      );
    });
  }, [slotHistoryData, debouncedSearchTerm]);

  // 2. CẬP NHẬT LẠI PHÂN TRANG DỰA TRÊN DỮ LIỆU ĐÃ LỌC
  const historyTotalPages = Math.ceil(
    filteredHistoryData.length / itemsPerPage,
  );

  const currentHistoryData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredHistoryData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredHistoryData, currentPage]);

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

    const currentHeldCount = getActiveHeldCount(maLop);
    const currentAvailable = calculateAvailableSlots(row, currentHeldCount);

    if (currentAvailable <= 0) {
      alert(
        `⚠️ Chậm chân mất rồi! Vừa có một QLL khác nhanh tay giữ slot cuối cùng của lớp ${maLop}. Vui lòng f5 hoặc chờ lớp khác nhé!`,
      );
      setShowModal(false);
      return;
    }

    // [TỐI ƯU V3] Bật trạng thái khóa nút để chống spam click
    setIsSubmitting(true);
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
          nguoi_giu: displayName,
          team: displayTeamOrRole,
          ngay_bat_dau: formatDate(startDate),
          ngay_het_han: formatDate(expiryDate),
          note: `SID/CID: ${cleanVal}`,
          timestamp: Date.now(),
        }),
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
      // [TỐI ƯU V3] Tắt trạng thái khóa nút
      setIsSubmitting(false);
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
    formatItem?: (val: string) => string,
  ) => {
    return (
      <FilterDropdown
        label={label}
        dropdownKey={key}
        currentValue={currentValue}
        options={options}
        onChange={onChange}
        formatItem={formatItem}
        openDropdown={openDropdown}
        setOpenDropdown={setOpenDropdown}
      />
    );
  };

  const getSubjectStyle = (subject: string) => {
    const s = subject.toLowerCase();

    // Thêm màu Tím Indigo cho Toán TCLC
    if (s.includes("tclc")) {
      return "bg-indigo-50 text-indigo-600 border-indigo-100";
    }

    if (s.includes("toán") || s.includes("toan")) {
      return "bg-blue-50 text-blue-600 border-blue-100";
    }
    if (
      s.includes("tiếng anh") ||
      s.includes("tieng anh") ||
      s.includes("moet")
    ) {
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
      <LoginScreen
        loginRole={loginRole}
        setLoginRole={setLoginRole}
        loginError={loginError}
        setLoginError={setLoginError}
        namecode={namecode}
        setNamecode={setNamecode}
        teamLead={teamLead}
        setTeamLead={setTeamLead}
        adminUsername={adminUsername}
        setAdminUsername={setAdminUsername}
        adminPassword={adminPassword}
        setAdminPassword={setAdminPassword}
        handleLoginSubmit={handleLoginSubmit}
      />
    );
  }

  return (
    <div
      className={`flex h-screen font-vietnam overflow-hidden selection:bg-sky-500/30 relative z-0 transition-colors duration-0 ${theme === "dark" ? "bg-[#070b14] text-slate-300" : "bg-[#F4F7FE] text-slate-700"}`}
    >
      <div
        className={`absolute inset-0 pointer-events-none -z-10 transition-opacity duration-0 ${theme === "dark" ? "opacity-100" : "opacity-0"}`}
      >
        <div
          className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(49, 46, 129, 0.4) 0%, rgba(0,0,0,0) 70%)",
          }}
        ></div>
        <div
          className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(154, 52, 18, 0.15) 0%, rgba(0,0,0,0) 70%)",
          }}
        ></div>
        <div
          className="absolute top-[20%] right-[20%] w-[30vw] h-[30vw] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(14, 165, 233, 0.15) 0%, rgba(0,0,0,0) 70%)",
          }}
        ></div>
      </div>

      {successMessage && (
        <div className="fixed top-6 right-8 bg-emerald-500 text-white px-6 py-3 rounded-2xl shadow-xl z-50 flex items-center gap-2 font-bold text-sm animate-fade-slide-down">
          <span>✅</span> {successMessage}
        </div>
      )}

      <Sidebar
        theme={theme}
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        loginRole={loginRole}
        adminUsername={adminUsername}
        namecode={namecode}
        teamLead={teamLead}
        loadSlotHistory={loadSlotHistory}
        handleLogout={handleLogout}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-10 min-w-0">
        <Header
          theme={theme}
          toggleTheme={toggleTheme}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          lastUpdated={lastUpdated}
          loading={loading}
          loadingHistory={loadingHistory}
          loginRole={loginRole}
          loadData={loadData}
          loadSlotHistory={loadSlotHistory}
          onOpenSidebar={() => setSidebarOpen(true)}
        />
        {loginRole === "Admin" && activeNav === "Dashboard" ? (
          <Dashboard
            qllStats={qllStats}
            slotHistoryData={slotHistoryData}
            theme={theme}
          />
        ) : loginRole === "Admin" && activeNav === "LichSuSlotAdmin" ? (
          <div
            key="LichSuSlotAdmin"
            className="flex-1 px-8 pt-4 pb-5 min-h-0 flex flex-col animate-fade-slide-up"
          >
            {/* 4 THẺ THỐNG KÊ NHANH (MINI KPI CARDS) CHO ADMIN */}
            <AdminStats
              currentHistoryData={filteredHistoryData}

              filterTeam={filterTeam}
              completedSlots={completedSlots}
              checkIsExpired={checkIsExpired}
              theme={theme}
            />

            <HistoryTable
              theme={theme}
              openDropdown={openDropdown}
              setOpenDropdown={setOpenDropdown}
              filterTeam={filterTeam}
              setFilterTeam={setFilterTeam}
              filterHistoryStatus={filterHistoryStatus}
              setFilterHistoryStatus={setFilterHistoryStatus}
              slotHistoryData={slotHistoryData}
              currentHistoryData={currentHistoryData}
              completedSlots={completedSlots}
              checkIsExpired={checkIsExpired}
              handleMarkAsDone={handleMarkAsDone}
              loadingHistory={loadingHistory}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              historyTotalPages={historyTotalPages}
            />

          </div>
        ) : loginRole === "Admin" && activeNav === "ThongKeAdmin" ? (
          <div
            key="ThongKeAdmin"
            className="flex-1 px-8 pt-5 pb-6 min-h-0 flex flex-col animate-fade-slide-up"
          >
            <TrafficCharts
              todayChartData={todayChartData}
              historicalChartData={historicalChartData}
              theme={theme}
            />

            <OnlineUsersTable
              onlineUsers={onlineUsers}
              formatOnlineDuration={formatOnlineDuration}
              onRefresh={refreshOnlineUsers}
              theme={theme}
            />
          </div>
        ) : activeNav === "SlotDaGiu" ? (
          <div
            key="SlotDaGiu"
            className="flex-1 px-8 pt-5 pb-6 min-h-0 flex flex-col animate-fade-slide-up"
          >
            <SlotHeldTable
              slotHistoryData={slotHistoryData}
              displayName={displayName}
              completedSlots={completedSlots}
              checkIsExpired={checkIsExpired}
              onRequestRecall={(row) => setRecallTarget(row)}
              theme={theme}
            />
          </div>
        ) : loginRole === "Admin" && activeNav === "QuanTriAdmin" ? (
          <div
            key="QuanTriAdmin"
            className="flex-1 p-6 overflow-y-auto animate-fade-slide-up"
          >
            <AdminManagement
              theme={theme}
              newAdminUser={newAdminUser}
              setNewAdminUser={setNewAdminUser}
              newAdminPass={newAdminPass}
              setNewAdminPass={setNewAdminPass}
              adminAddError={adminAddError}
              setAdminAddError={setAdminAddError}
              adminAddSuccess={adminAddSuccess}
              adminList={adminList}
              handleAddAdminSubmit={handleAddAdminSubmit}
            />
          </div>
        ) : (
          <MainDataTable
            theme={theme}
            displayName={displayName}
            currentWordIndex={currentWordIndex}
            words={words}
            stats={stats}
            activeNav={activeNav}
            filterMonHoc={filterMonHoc}
            setFilterMonHoc={setFilterMonHoc}
            filterPhanMonKHTN={filterPhanMonKHTN}
            setFilterPhanMonKHTN={setFilterPhanMonKHTN}
            filterTrinhDo={filterTrinhDo}
            setFilterTrinhDo={setFilterTrinhDo}
            filterKhoi={filterKhoi}
            setFilterKhoi={setFilterKhoi}
            filterLoaiLop={filterLoaiLop}
            setFilterLoaiLop={setFilterLoaiLop}
            filterLichHoc={filterLichHoc}
            setFilterLichHoc={setFilterLichHoc}
            filterToday={filterToday}
            setFilterToday={setFilterToday}
            isFiltering={isFiltering}
            handleClearFilters={handleClearFilters}
            filteredData={filteredData}
            dropdownOptions={dropdownOptions}
            currentTableData={currentTableData}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalPages={totalPages}
            isHoldingSlot={isHoldingSlot}
            renderCustomDropdown={renderCustomDropdown}
            getActiveHeldCount={getActiveHeldCount}
            calculateAvailableSlots={calculateAvailableSlots}
            checkAttendanceStatus={checkAttendanceStatus}
            getSubjectStyle={getSubjectStyle}
            handleOpenPopup={handleOpenPopup}
          />
        )}
      </main>

      {showModal && (
        <SlotModal
          theme={theme}
          selectedRowForSlot={selectedRowForSlot}
          inputValue={inputValue}
          setInputValue={setInputValue}
          inputError={inputError}
          setInputError={setInputError}
          setShowModal={setShowModal}
          handleConfirmKeepSlot={handleConfirmKeepSlot}
          isSubmitting={isSubmitting}
        />
      )}

      <ConfirmDialog
        open={!!recallTarget}
        theme={theme}
        title="Xác nhận Thu hồi Slot"
        message={
          recallTarget
            ? `Bạn chắc chắn muốn THU HỒI slot lớp ${
                recallTarget.ma_lop ||
                recallTarget["Mã lớp giữ"] ||
                recallTarget["Mã lớp"] ||
                ""
              }? Slot sẽ được nhả lại cho người khác.`
            : ""
        }
        confirmText="🔄 Thu hồi"
        onConfirm={() => {
          if (recallTarget) handleRecallSlot(recallTarget.id);
          setRecallTarget(null);
        }}
        onCancel={() => setRecallTarget(null)}
      />

      {/* 📍 BẠN DÁN ĐOẠN POPUP LỖI VÀO ĐÂY (NGAY TRÊN DÒNG 4140) */}
{errorMessage && (
        <ErrorPopup
          errorMessage={errorMessage}
          setErrorMessage={setErrorMessage}
          loadData={loadData}
          theme={theme}
        />
      )}
      {/* -------------------------------------------------------- */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=Dancing+Script:wght@600;700&display=swap');
        
        .font-vietnam { font-family: 'Be Vietnam Pro', sans-serif !important; }
        .font-greeting { font-family: 'Baloo 2', cursive; }
        .font-handwriting { font-family: 'Dancing Script', cursive; padding-right: 2px; }

        @keyframes smoothSignature {
          0% {
            clip-path: inset(0 100% 0 0);
            opacity: 0;
            transform: translateX(-5px);
          }
          15% {
            opacity: 1;
          }
          40%, 85% {
            clip-path: inset(0 0 0 0);
            opacity: 1;
            transform: translateX(0);
          }
          100% {
            clip-path: inset(0 0 0 0);
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-smooth-signature {
          display: inline-block;
          white-space: nowrap;
          animation: smoothSignature 4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
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

        @keyframes fadeSlideUpStagger {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-slide-down { animation: fadeSlideDown 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fade-slide-up { animation: fadeSlideUpStagger 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `,
        }}
      />
    </div>
  );
}
