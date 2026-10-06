import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Ép Vercel luôn chạy API này ở chế độ động, không cache
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // Lấy biến môi trường trực tiếp từ hệ thống Vercel lúc chạy
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ 
        success: false, 
        error: "Server chưa đọc được biến môi trường Supabase URL hoặc KEY." 
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const body = await request.json();

    // Đẩy dữ liệu xuống Supabase
    const { error } = await supabase.from("slot_holds").insert([
      {
        ma_lop: body.ma_lop,
        mon_hoc: body.mon_hoc,
        nguoi_giu: body.nguoi_giu,
        team: body.team,
        ngay_bat_dau: body.ngay_bat_dau,
        ngay_het_han: body.ngay_het_han,
        note: body.note,
        timestamp: body.timestamp
      }
    ]);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Lỗi sập server API:", err);
    return NextResponse.json({ success: false, error: err.message || "Lỗi server không xác định" }, { status: 500 });
  }
}