import { NextResponse } from 'next/server';
import Papa from 'papaparse';
import { createHash } from 'crypto';

// Các cột client THỰC SỰ dùng (quét từ toàn bộ code). Chỉ giữ các cột này
// để giảm kích thước payload (bỏ cột thừa trong sheet). An toàn: nếu thiếu cột
// nào thì client đã có fallback "|| ''" nên không vỡ UI.
const KEEP_COLUMNS = [
  "Mã lớp",
  "Môn học",
  "Loại lớp",
  "Khối",
  "Trình độ",
  "Giáo trình",
  "Lịch học",
  "Đang học",
  "Phân loại lớp",
  "M: Khung chương trình",
  "Khung chương trình",
];

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

    // [TỐI ƯU MỨC 1] Lọc cột thừa + bỏ dòng rỗng NGAY TẠI SERVER để giảm payload.
    // Giữ nguyên định dạng CSV (client vẫn Papa.parse như cũ, không đổi gì phía client).
    // Có fallback: nếu xử lý lỗi -> trả CSV gốc để KHÔNG làm vỡ web.
    let outputCsv = text;
    try {
      const parsed = Papa.parse<string[]>(text, {
        header: false,
        skipEmptyLines: true,
      });

      if (parsed.data && parsed.data.length > 0) {
        const headers = parsed.data[0].map((header) => String(header || "").trim());
        const columnIndexes = new Map<string, number>();

        headers.forEach((header, index) => {
          if (header && !columnIndexes.has(header)) {
            columnIndexes.set(header, index);
          }
        });

        // Sheet hiện có hai cột "Trình độ": cột G là cột cũ, cột N là cột mới.
        // Cột N trong sheet tương ứng index 13 (A = 0).
        const TRINH_DO_COLUMN_INDEX = 13;
        if (headers[TRINH_DO_COLUMN_INDEX]?.trim() === "Trình độ") {
          columnIndexes.set("Trình độ", TRINH_DO_COLUMN_INDEX);
        }

        const cols = KEEP_COLUMNS.filter((c) => columnIndexes.has(c));

        if (cols.length > 0) {
          const slimRows = parsed.data.slice(1).map((row) => {
            const maLopIndex = columnIndexes.get("Mã lớp");
            if (maLopIndex === undefined) return null;
            if (!String(row[maLopIndex] || "").trim()) return null;

            const outputRow: Record<string, string> = {};
            for (const c of cols) {
              const columnIndex = columnIndexes.get(c);
              outputRow[c] = columnIndex === undefined
                ? ""
                : String(row[columnIndex] || "").trim();
            }
            return outputRow;
          }).filter((row): row is Record<string, string> => row !== null);

          outputCsv = Papa.unparse(slimRows, { columns: cols });
        }
      }
    } catch (e) {
      console.error("Lỗi lọc CSV, dùng bản gốc:", e);
      outputCsv = text;
    }

    // [CÁCH A - ETag/304] Tính "vân tay" (hash) của dữ liệu đã lọc.
    // Nếu client gửi If-None-Match khớp -> dữ liệu KHÔNG đổi -> trả 304 rỗng (0 byte body),
    // không tốn Fast Origin Transfer. Chỉ khi sheet thật sự thay đổi mới tải lại full.
    const etag = '"' + createHash("sha1").update(outputCsv).digest("hex") + '"';
    const ifNoneMatch = request.headers.get("if-none-match");

    const cacheControl = forceFresh
      ? "no-store"
      : "public, max-age=0, must-revalidate, s-maxage=120, stale-while-revalidate=300";

    // Khớp ETag (và không ép tươi) -> 304, không gửi lại body.
    if (!forceFresh && ifNoneMatch && ifNoneMatch === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: etag,
          'Cache-Control': cacheControl,
        },
      });
    }

    return new NextResponse(outputCsv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        ETag: etag,
        'Cache-Control': cacheControl,
      }
    });
  } catch {
    return new NextResponse("Lỗi Server", {
      status: 500,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
}
