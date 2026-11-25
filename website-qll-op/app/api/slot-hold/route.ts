import { NextResponse } from "next/server";
import { createHash } from "node:crypto";

export const dynamic = 'force-dynamic';

const SUPABASE_ENDPOINT = "https://sehvatktrqtgsnmvebmm.supabase.co/rest/v1/slot_holds";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlaHZhdGt0cnF0Z3NubXZlYm1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5MzE5NzEsImV4cCI6MjEwNjUwNzk3MX0.hmQpRDUxsfP_LSWVE96nFEH85Qqw-z9LG3AQU1VXe0E";

// 1. LẤY DANH SÁCH SLOT
export async function GET(request: Request) {
  try {
    // [TỐI ƯU PAYLOAD] Chỉ lấy đúng các cột client dùng (thay cho select=*),
    // giảm kích thước Output. Tất cả cột client đọc đều có mặt ở đây;
    // client còn có fallback "|| ''" nên kể cả thiếu cột cũng không vỡ UI.
    const SELECT_COLS =
      "id,ma_lop,mon_hoc,nguoi_giu,team,note,timestamp,is_done,is_cancelled,ngay_bat_dau,ngay_het_han";
    const pageSize = 1000;
    const data: unknown[] = [];

    for (let offset = 0; ; offset += pageSize) {
      const res = await fetch(
        `${SUPABASE_ENDPOINT}?select=${SELECT_COLS}&order=timestamp.desc,id.desc`,
        {
          method: "GET",
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            Range: `${offset}-${offset + pageSize - 1}`,
            "Range-Unit": "items",
          },
          cache: "no-store",
        },
      );
      if (!res.ok) throw new Error(await res.text());

      const page: unknown = await res.json();
      if (!Array.isArray(page)) {
        throw new Error("Supabase trả về dữ liệu slot không hợp lệ.");
      }

      data.push(...page);
      if (page.length < pageSize) break;
    }

    const body = JSON.stringify({ success: true, data });
    const etag = `W/"${createHash("sha256").update(body).digest("hex")}"`;
    const headers = { ETag: etag, "Cache-Control": "private, no-cache" };
    const validators = request.headers.get("if-none-match")?.split(",");
    const unchanged = validators?.some((validator) => {
      const tag = validator.trim();
      return tag === "*" || tag.replace(/^W\//, "") === etag.slice(2);
    });
    if (unchanged) {
      return new Response(null, { status: 304, headers });
    }

    return new Response(body, {
      headers: { ...headers, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// 2. GIỮ SLOT MỚI
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const sid = typeof body?.note === "string"
    ? /^SID\/CID:\s*(\d{1,8})\s*$/i.exec(body.note)?.[1]
    : undefined;
  if (!sid || typeof body?.ma_lop !== "string" || !body.ma_lop.trim()) {
    return NextResponse.json(
      { success: false, error: "Thiếu mã lớp hoặc SID/CID không hợp lệ." },
      { status: 400 },
    );
  }

  const classCode = body.ma_lop.trim();
  const duplicateResponse = () => NextResponse.json({
    success: false,
    error: "SID/CID này đang giữ mã lớp này trong vòng 24 giờ.",
  }, { status: 409 });

  try {
    const now = Date.now();
    const lookup = new URL(SUPABASE_ENDPOINT);
    lookup.search = new URLSearchParams({
      select: "ma_lop",
      note: `ilike.SID/CID: ${sid}`,
      timestamp: `gt.${now - 86_400_000}`,
      or: "(is_cancelled.is.null,is_cancelled.eq.false)",
    }).toString();
    const headers = {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    };
    const existing = await fetch(lookup, { headers, cache: "no-store" });
    if (!existing.ok) throw new Error(await existing.text());
    const holds: { ma_lop: string }[] = await existing.json();
    if (holds.some((hold) => hold.ma_lop?.trim().toUpperCase() === classCode.toUpperCase())) {
      return duplicateResponse();
    }

    const res = await fetch(SUPABASE_ENDPOINT, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
      },
      body: JSON.stringify({
        ma_lop: classCode,
        mon_hoc: body.mon_hoc,
        nguoi_giu: body.nguoi_giu,
        team: body.team,
        ngay_bat_dau: body.ngay_bat_dau,
        ngay_het_han: body.ngay_het_han,
        note: `SID/CID: ${sid}`,
        timestamp: now,
      }),
    });
    if (res.status === 409) {
      const error = await res.json();
      if (error.code === "PT409" && error.message === "hold_same_class") {
        return duplicateResponse();
      }
      throw new Error("Supabase rejected the slot hold.");
    }
    if (!res.ok) throw new Error(await res.text());
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// 3. CẬP NHẬT TRẠNG THÁI
//    - action "done" (mặc định): đánh dấu đã xếp xong (is_done = true)
//    - action "cancel": QLL thu hồi slot còn hạn (is_cancelled = true)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, action } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Thiếu ID bản ghi" }, { status: 400 });
    }

    const payload =
      action === "cancel" ? { is_cancelled: true } : { is_done: true };

    const res = await fetch(`${SUPABASE_ENDPOINT}?id=eq.${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "Prefer": "return=minimal"
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error(await res.text());
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
