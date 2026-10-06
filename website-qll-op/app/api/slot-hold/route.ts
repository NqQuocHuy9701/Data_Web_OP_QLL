import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

const SUPABASE_ENDPOINT = "https://sehvatktrqtgsnmvebmm.supabase.co/rest/v1/slot_holds";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlaHZhdGt0cnF0Z3NubXZlYm1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5MzE5NzEsImV4cCI6MjEwNjUwNzk3MX0.hmQpRDUxsfP_LSWVE96nFEH85Qqw-z9LG3AQU1VXe0E";

// HÀM LẤY DANH SÁCH SLOT (MỚI)
export async function GET() {
  try {
    // Thêm query select=* và order=timestamp.desc để lấy toàn bộ dữ liệu, mới nhất xếp trên cùng
    const res = await fetch(`${SUPABASE_ENDPOINT}?select=*&order=timestamp.desc`, {
      method: "GET",
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
      },
      // Ngăn Next.js cache kết quả cũ
      cache: 'no-store'
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ success: false, error: errText }, { status: 400 });
    }

    const data = await res.json();
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// HÀM GIỮ SLOT (GIỮ NGUYÊN NHƯ CŨ ĐÃ CHẠY TỐT)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await fetch(SUPABASE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "Prefer": "return=minimal"
      },
      body: JSON.stringify({
        ma_lop: body.ma_lop || "",
        mon_hoc: body.mon_hoc || "",
        nguoi_giu: body.nguoi_giu || "",
        team: body.team || "",
        ngay_bat_dau: body.ngay_bat_dau || "",
        ngay_het_han: body.ngay_het_han || "",
        note: body.note || "",
        timestamp: body.timestamp || Date.now()
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ success: false, error: errText }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}