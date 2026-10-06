import { NextResponse } from "next/server";

const SUPABASE_URL = "https://sehvatktrqtsnmvebmm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlaHZhdGt0cnF0Z3NubXZlYm1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5MzE5NzEsImV4cCI6MjEwNjUwNzk3MX0.hmQpRDUxsfP_LSWVE96nFEH85Qqw-z9LG3AQU1VXe0E";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ma_lop, mon_hoc, nguoi_giu, team, ngay_bat_dau, ngay_het_han, note, timestamp } = body;

    // Gọi trực tiếp Supabase qua REST API Endpoint chuẩn
    const res = await fetch(`${SUPABASE_URL}/rest/v1/slot_holds`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "Prefer": "return=minimal"
      },
      body: JSON.stringify({
        ma_lop,
        mon_hoc,
        nguoi_giu,
        team,
        ngay_bat_dau,
        ngay_het_han,
        note,
        timestamp
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Supabase REST Error:", errText);
      return NextResponse.json({ success: false, error: errText }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("API Proxy Catch Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}