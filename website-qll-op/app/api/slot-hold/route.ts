import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Gán cứng trực tiếp thông tin Supabase để đảm bảo Server Vercel luôn kết nối chính xác 100%
const supabaseUrl = "https://sehvatktrqtsnmvebmm.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlaHZhdGt0cnF0Z3NubXZlYm1tIiwicm9sZSI6ImFub24i lànXGF0IjoxNzkwOTMxOTcxLCJleHAiOjIxMDY1MDc5NzF9.hmQpRDUxsfP_LSWVE96nFEH85Qqw-z9LG3AQU1VXe0E";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ma_lop, mon_hoc, nguoi_giu, team, ngay_bat_dau, ngay_het_han, note, timestamp } = body;

    // Thực hiện insert dữ liệu xuống bảng slot_holds của Supabase
    const { data, error } = await supabase.from("slot_holds").insert([
      {
        ma_lop,
        mon_hoc,
        nguoi_giu,
        team,
        ngay_bat_dau,
        ngay_het_han,
        note,
        timestamp
      }
    ]);

    if (error) {
      console.error("Supabase Error Details:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("API Catch Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}