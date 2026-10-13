import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://sehvatktrqtgsnmvebmm.supabase.co";

const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

const BCRYPT_ROUNDS = 10;

function authHeaders() {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
  };
}

// Thêm tài khoản Admin mới — mật khẩu được HASH phía server trước khi lưu.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = (body?.username || "").toString().trim();
    const password = (body?.password || "").toString().trim();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Tên đăng nhập và mật khẩu không được để trống!" },
        { status: 400 },
      );
    }

    if (!SUPABASE_KEY) {
      return NextResponse.json(
        { success: false, error: "Server chưa cấu hình khóa Supabase." },
        { status: 500 },
      );
    }

    // Kiểm tra trùng username.
    const checkRes = await fetch(
      `${SUPABASE_URL}/rest/v1/admins?select=username&username=eq.${encodeURIComponent(username)}`,
      { method: "GET", headers: authHeaders(), cache: "no-store" },
    );

    if (!checkRes.ok) {
      return NextResponse.json(
        { success: false, error: "Lỗi truy vấn cơ sở dữ liệu." },
        { status: 500 },
      );
    }

    const existing = await checkRes.json();
    if (Array.isArray(existing) && existing.length > 0) {
      return NextResponse.json(
        { success: false, error: "Tên đăng nhập Admin này đã tồn tại!" },
        { status: 409 },
      );
    }

    const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Lưu pass_hash. Vẫn ghi pass để tương thích ngược trong giai đoạn chuyển đổi;
    // sau khi toàn bộ admin đã có pass_hash, có thể bỏ cột pass.
    const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/admins`, {
      method: "POST",
      headers: {
        ...authHeaders(),
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify([{ username, pass: password, pass_hash: hash }]),
    });

    if (!insertRes.ok) {
      const detail = await insertRes.text();
      return NextResponse.json(
        { success: false, error: "Lỗi lưu vào Supabase: " + detail },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, username });
  } catch {
    return NextResponse.json(
      { success: false, error: "Lỗi kết nối khi thêm Admin!" },
      { status: 500 },
    );
  }
}
