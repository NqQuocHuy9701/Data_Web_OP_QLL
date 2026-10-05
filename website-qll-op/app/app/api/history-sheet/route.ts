import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Thay thế URL bên dưới bằng Link xuất CSV (Publish to web -> CSV) của riêng tab "LichSuGiuSlot" trên Google Sheet của bạn
    const SHEET_CSV_EXPORT_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRH99w75D-KMdtC6KIH-bfza_bdHF_vz3grGlz6cXRNgaalR-_wHQRWI4PYESwWmJHxs_rXPVo7TKCv/pubhtml?gid=1190427124&single=true";

    const response = await fetch(SHEET_CSV_EXPORT_URL);
    const data = await response.text();

    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Lỗi tải dữ liệu lịch sử" }, { status: 500 });
  }
}