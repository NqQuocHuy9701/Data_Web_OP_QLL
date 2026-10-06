import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Khởi tạo Supabase client ở phía Server-side (Vercel)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://sehvatktrqtsnmvebmm.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlaHZhdGt0cnF0Z3NubXZlYm1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5MzE5NzEsImV4cCI6MjEwNjUwNzk3MX0.hmQpRDUxsfP_LSWVE96nFEH85Qqw-z9LG3AQU1VXe0E";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ma_lop, mon_hoc, nguoi_giu, team, ngay_bat_dau, ngay_het_han, note, timestamp } = body;

    // Server Vercel thực hiện ghi dữ liệu xuống Supabase
    const { error } = await supabase.from("slot_holds").insert([
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
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}