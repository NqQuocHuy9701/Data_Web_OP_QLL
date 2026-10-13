import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://sehvatktrqtgsnmvebmm.supabase.co";

// Ưu tiên service_role key (bỏ qua RLS, chỉ chạy phía server).
// Nếu chưa cấu hình thì tạm fallback về anon key để không làm gián đoạn đăng nhập.
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

const BCRYPT_ROUNDS = 10;

// Một chuỗi bcrypt hợp lệ bắt đầu bằng $2a$ / $2b$ / $2y$.
function looksHashed(value: string | null | undefined): boolean {
  return !!value && /^\$2[aby]\$/.test(value);
}

function authHeaders() {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
  };
}

// Ghi pass_hash cho tài khoản vừa migrate (best-effort, không chặn đăng nhập nếu lỗi).
async function persistHash(username: string, hash: string) {
  try {
    await fetch(
      `${SUPABASE_URL}/rest/v1/admins?username=eq.${encodeURIComponent(username)}`,
      {
        method: "PATCH",
        headers: {
          ...authHeaders(),
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ pass_hash: hash }),
      },
    );
  } catch {
    // Bỏ qua: migrate hash là tối ưu dần, không được phá luồng đăng nhập.
  }
}

// Xác thực tài khoản Admin phía server.
// Trình duyệt KHÔNG còn query trực tiếp bảng admins nữa.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = (body?.username || "").toString().trim();
    const password = (body?.password || "").toString().trim();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Thiếu tên đăng nhập hoặc mật khẩu." },
        { status: 400 },
      );
    }

    if (!SUPABASE_KEY) {
      return NextResponse.json(
        { success: false, error: "Server chưa cấu hình khóa Supabase." },
        { status: 500 },
      );
    }

    // Chỉ lấy đúng bản ghi theo username, KHÔNG lọc theo mật khẩu trên URL.
    const endpoint =
      `${SUPABASE_URL}/rest/v1/admins` +
      `?select=username,pass,pass_hash&username=eq.${encodeURIComponent(username)}`;

    const res = await fetch(endpoint, {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: "Lỗi truy vấn cơ sở dữ liệu." },
        { status: 500 },
      );
    }

    const rows = await res.json();
    const account = Array.isArray(rows) ? rows[0] : null;

    if (!account) {
      return NextResponse.json(
        { success: false, error: "Sai thông tin đăng nhập." },
        { status: 401 },
      );
    }

    let ok = false;

    if (looksHashed(account.pass_hash)) {
      // Tài khoản đã có hash → so khớp bằng bcrypt.
      ok = await bcrypt.compare(password, account.pass_hash);
    } else {
      // Tài khoản cũ (chưa migrate) → so khớp plaintext, rồi tự hash & lưu lại.
      ok = account.pass != null && account.pass === password;
      if (ok) {
        const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
        await persistHash(account.username, hash);
      }
    }

    if (!ok) {
      return NextResponse.json(
        { success: false, error: "Sai thông tin đăng nhập." },
        { status: 401 },
      );
    }

    // Chỉ trả username, KHÔNG trả mật khẩu ra client.
    return NextResponse.json({ success: true, username: account.username });
  } catch {
    return NextResponse.json(
      { success: false, error: "Lỗi máy chủ khi xác thực." },
      { status: 500 },
    );
  }
}
