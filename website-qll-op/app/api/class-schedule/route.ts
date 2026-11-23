import { NextResponse } from "next/server";
import { getAdminSessionUsername, hasAdminSession } from "../_lib/admin-session";
import { CLASS_SCHEDULE_CHANGED, CLASS_SCHEDULE_TOPIC } from "../../classScheduleEvents";

export const dynamic = "force-dynamic";

const SUPABASE_ENDPOINT =
  "https://sehvatktrqtgsnmvebmm.supabase.co/rest/v1/class_schedule_requests";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhbGciOiJIUzI1NiIsInJlZiI6InNlaHZhdGt0cnF0Z3NubXZlYm1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5MzE5NzEsImV4cCI6MjEwNjUwNzk3MX0.hmQpRDU1sfP_LSWVE96nFEH85Qqw-z9LG3AQU1VXe0E";

async function broadcastClassScheduleChange() {
  try {
    const response = await fetch(
      new URL("/realtime/v1/api/broadcast", SUPABASE_ENDPOINT),
      {
        method: "POST",
        headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ topic: CLASS_SCHEDULE_TOPIC, event: CLASS_SCHEDULE_CHANGED, payload: {} }],
        }),
        signal: AbortSignal.timeout(2000),
      },
    );
    if (!response.ok) console.warn("Add lop broadcast failed:", response.status);
  } catch (error) {
    console.warn("Add lop broadcast failed:", error);
  }
}

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const view = searchParams.get("view");
  const isListView = view === "list";
  const isQllListView = view === "my-list";
  if (isListView && !hasAdminSession(request)) {
    return NextResponse.json(
      {
        success: false,
        error: "Phiên Admin không hợp lệ. Vui lòng đăng xuất và đăng nhập lại.",
      },
      { status: 401 },
    );
  }

  const namecode = searchParams.get("namecode")?.trim();
  if (isQllListView && !namecode) {
    return NextResponse.json(
      { success: false, error: "Thiếu Namecode để tải danh sách Add lớp." },
      { status: 400 },
    );
  }

  const isDetailedList = isListView || isQllListView;
  const supabaseKey = isDetailedList
    ? process.env.SUPABASE_SERVICE_ROLE_KEY
    : SUPABASE_ANON_KEY;
  if (!supabaseKey) {
    return NextResponse.json(
      { success: false, error: "Server chưa cấu hình khóa Supabase phù hợp." },
      { status: 503 },
    );
  }

  const counts: Record<string, number> = Object.create(null);
  const requests: unknown[] = [];
  const pageSize = 1000;

  try {
    if (!isDetailedList) {
      const response = await fetch(
        new URL("rpc/count_pending_class_schedule_requests", SUPABASE_ENDPOINT),
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
          cache: "no-store",
        },
      );

      if (response.ok) {
        return NextResponse.json({ success: true, data: await response.json() });
      }

      const error = await response.json();
      // Keep counts available while the database migration is being rolled out.
      if (response.status !== 404 || error.code !== "PGRST202") {
        throw new Error(`Supabase count request failed (${response.status}).`);
      }
    }

    for (let offset = 0; ; offset += pageSize) {
      const selectedColumns = isListView
        ? "id,ma_lop,mon_hoc,nguoi_tao,team,sid_cid,timestamp,is_done,is_cancelled,created_at,processed_by,processed_at"
        : isQllListView
          ? "id,ma_lop,mon_hoc,sid_cid,timestamp,is_done,is_cancelled"
          : "ma_lop";
      const activeFilters = isListView
        ? ""
        : isQllListView
          ? `&nguoi_tao=eq.${encodeURIComponent(namecode!)}`
          : "&is_done=eq.false&is_cancelled=eq.false";
      const order = isQllListView ? "id.desc" : "id.asc";
      const response = await fetch(
        `${SUPABASE_ENDPOINT}?select=${selectedColumns}${activeFilters}&order=${order}`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            Range: `${offset}-${offset + pageSize - 1}`,
            "Range-Unit": "items",
          },
          cache: "no-store",
        },
      );

      if (!response.ok) {
        const error = await response.text();
        console.error("Supabase rejected Add lớp count request:", error);
        return NextResponse.json(
          { success: false, error: "Không thể tải số lớp đã Add." },
          { status: 502 },
        );
      }

      const rows: unknown = await response.json();
      if (!Array.isArray(rows)) {
        throw new Error("Supabase returned an invalid Add lớp count response.");
      }

      if (isDetailedList) {
        requests.push(...rows);
      } else {
        for (const row of rows) {
          if (
            typeof row === "object" &&
            row !== null &&
            "ma_lop" in row &&
            typeof row.ma_lop === "string"
          ) {
            counts[row.ma_lop] = (counts[row.ma_lop] || 0) + 1;
          }
        }
      }

      const contentRange = response.headers.get("content-range");
      const total = Number(contentRange?.split("/")[1]);
      if (
        rows.length < pageSize ||
        (Number.isFinite(total) && offset + rows.length >= total)
      ) {
        break;
      }
    }

    return NextResponse.json({
      success: true,
      data: isDetailedList ? requests : counts,
    });
  } catch (error) {
    console.error("Failed to load Add lớp counts:", error);
    return NextResponse.json(
      { success: false, error: "Không thể kết nối tới Supabase." },
      { status: 502 },
    );
  }
}

export async function POST(request: Request) {
  let parsedBody: unknown;

  try {
    parsedBody = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Nội dung yêu cầu không hợp lệ." },
      { status: 400 },
    );
  }

  if (
    typeof parsedBody !== "object" ||
    parsedBody === null ||
    Array.isArray(parsedBody)
  ) {
    return NextResponse.json(
      { success: false, error: "Nội dung yêu cầu không hợp lệ." },
      { status: 400 },
    );
  }

  const body = parsedBody as Record<string, unknown>;
  const { ma_lop, mon_hoc, nguoi_tao, team, sid_cid, timestamp } = body;
  if (
    typeof ma_lop !== "string" ||
    !ma_lop.trim() ||
    typeof nguoi_tao !== "string" ||
    !nguoi_tao.trim() ||
    typeof sid_cid !== "string" ||
    !/^\d{1,8}$/.test(sid_cid) ||
    typeof timestamp !== "number" ||
    !Number.isFinite(timestamp)
  ) {
    return NextResponse.json(
      { success: false, error: "Thiếu hoặc sai thông tin yêu cầu Add lớp." },
      { status: 400 },
    );
  }

  const payload = {
    ma_lop: ma_lop.trim(),
    mon_hoc: typeof mon_hoc === "string" ? mon_hoc : "",
    nguoi_tao: nguoi_tao.trim(),
    team: typeof team === "string" ? team : "",
    sid_cid,
    timestamp,
  };

  try {
    const response = await fetch(SUPABASE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Supabase rejected Add lớp request:", error);
      return NextResponse.json(
        { success: false, error: "Không thể lưu yêu cầu Add lớp vào Supabase." },
        { status: 502 },
      );
    }

    await broadcastClassScheduleChange();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save Add lớp request:", error);
    return NextResponse.json(
      { success: false, error: "Không thể kết nối tới Supabase." },
      { status: 502 },
    );
  }
}

export async function PATCH(request: Request) {
  const adminUsername = getAdminSessionUsername(request);
  if (!adminUsername) {
    return NextResponse.json(
      {
        success: false,
        error: "Phiên Admin không hợp lệ. Vui lòng đăng xuất và đăng nhập lại.",
      },
      { status: 401 },
    );
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return NextResponse.json(
      { success: false, error: "Server chưa cấu hình khóa Supabase an toàn." },
      { status: 503 },
    );
  }

  let parsedBody: unknown;

  try {
    parsedBody = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Nội dung yêu cầu không hợp lệ." },
      { status: 400 },
    );
  }

  if (
    typeof parsedBody !== "object" ||
    parsedBody === null ||
    Array.isArray(parsedBody)
  ) {
    return NextResponse.json(
      { success: false, error: "Nội dung yêu cầu không hợp lệ." },
      { status: 400 },
    );
  }

  const body = parsedBody as Record<string, unknown>;
  const id = String(body.id || "");
  const action = body.action;
  if (!/^\d+$/.test(id) || !["done", "cancel"].includes(String(action))) {
    return NextResponse.json(
      { success: false, error: "ID hoặc thao tác cập nhật không hợp lệ." },
      { status: 400 },
    );
  }

  const payload = {
    is_done: action === "done",
    is_cancelled: action === "cancel",
    processed_by: adminUsername,
    processed_at: new Date().toISOString(),
  };

  try {
    const response = await fetch(
      `${SUPABASE_ENDPOINT}?id=eq.${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      },
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Supabase rejected Add lớp status update:", error);
      return NextResponse.json(
        { success: false, error: "Không thể cập nhật trạng thái yêu cầu." },
        { status: 502 },
      );
    }

    await broadcastClassScheduleChange();

    if (action === "done") {
      const recordResponse = await fetch(
        `${SUPABASE_ENDPOINT}?select=id,ma_lop,mon_hoc,nguoi_tao,team,sid_cid,timestamp,created_at,is_done&id=eq.${encodeURIComponent(id)}`,
        {
          headers: {
            apikey: serviceRoleKey,
            Authorization: `Bearer ${serviceRoleKey}`,
          },
          cache: "no-store",
        },
      );

      if (recordResponse.ok) {
        const records = await recordResponse.json();
        const record = Array.isArray(records) ? records[0] : null;
        if (record?.is_done === true) {
          const notificationResponse = await fetch(
            "https://sehvatktrqtgsnmvebmm.supabase.co/functions/v1/class-schedule-telegram",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
              },
              body: JSON.stringify({
                type: "UPDATE",
                schema: "public",
                table: "class_schedule_requests",
                record,
                old_record: { ...record, is_done: false },
              }),
              cache: "no-store",
              signal: AbortSignal.timeout(10_000),
            },
          );

          if (!notificationResponse.ok) {
            const notificationError = await notificationResponse.text();
            console.error(
              "Failed to notify Telegram done group:",
              notificationError,
            );
          }
        }
      } else {
        console.error(
          "Failed to read Add lớp record after Done:",
          await recordResponse.text(),
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update Add lớp status:", error);
    return NextResponse.json(
      { success: false, error: "Không thể kết nối tới Supabase." },
      { status: 502 },
    );
  }
}
