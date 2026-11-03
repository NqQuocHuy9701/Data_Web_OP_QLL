import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Thay bằng link Export trực tiếp từ ID gốc của bạn (bỏ qua trang chặn của Google)
  const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1GUNt31wuooogIR2elHmToAg4a9X2y4ZlAEDyEaiVNZc/export?format=csv&gid=0";

  // Nếu client gửi ?fresh=... (bấm nút Update) -> ép tải mới, bỏ cache.
  const { searchParams } = new URL(request.url);
  const forceFresh = searchParams.has("fresh");

  try {
    // Auto-load: cache 120s (revalidate) để nhiều user dùng chung, giảm Origin Transfer.
    // Update thủ công: no-store -> luôn lấy bản tươi.
    const res = await fetch(
      SHEET_CSV_URL,
      forceFresh ? { cache: "no-store" } : { next: { revalidate: 120 } },
    );
    const text = await res.text();

    // Nếu Google trả về trang HTML (bắt đăng nhập) -> KHÔNG cache lỗi, trả 502 để client báo sự cố.
    if (text.includes("<!DOCTYPE html>")) {
      console.error("LỖI: Google đang trả về trang bắt đăng nhập HTML thay vì file CSV.");
      return new NextResponse(text, {
        status: 502,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      });
    }

    return new NextResponse(text, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        // CDN Vercel giữ bản dùng chung 120s + phục vụ bản cũ trong lúc làm mới.
        // Bản ép tươi (forceFresh) thì không cache.
        'Cache-Control': forceFresh
          ? 'no-store'
          : 'public, s-maxage=120, stale-while-revalidate=300',
      }
    });
  } catch (error) {
    return new NextResponse("Lỗi Server", {
      status: 500,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
}