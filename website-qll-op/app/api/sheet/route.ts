import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; 

export async function GET() {
  // Thay bằng link Export trực tiếp từ ID gốc của bạn (bỏ qua trang chặn của Google)
  const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1GUNt31wuooogIR2elHmToAg4a9X2y4ZlAEDyEaiVNZc/export?format=csv&gid=0";
  
  try {
    const res = await fetch(SHEET_CSV_URL, { cache: "no-store" });
    const text = await res.text();
    
    // Nếu Google trả về trang HTML (bắt đăng nhập), log ra để kiểm tra
    if (text.includes("<!DOCTYPE html>")) {
      console.error("LỖI: Google đang trả về trang bắt đăng nhập HTML thay vì file CSV.");
    }

    return new NextResponse(text, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
      }
    });
  } catch (error) {
    return new NextResponse("Lỗi Server", { status: 500 });
  }
}