import { NextResponse } from "next/server";

// Ép Vercel không cache API này
export const dynamic = 'force-dynamic';

// URL chuẩn xác 100% đến bảng slot_holds mà bạn vừa gửi
const SUPABASE_ENDPOINT = "https://sehvatktrqtgsnmvebmm.supabase.co/rest/v1/slot_holds";

// Key chuẩn không bị lỗi khoảng trắng
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlaHZhdGt0cnF0Z3NubXZlYm1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5MzE5NzEsImV4cCI6MjEwNjUwNzk3MX0.hmQpRDUxsfP_LSWVE96nFEH85Qqw-z9LG3AQU1VXe0E";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Dùng lệnh fetch nguyên thủy gọi thẳng vào link của bạn
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
      console.error("Lỗi khi ghi vào Supabase:", errText);
      return NextResponse.json({ success: false, error: errText }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Lỗi sập server Vercel:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}