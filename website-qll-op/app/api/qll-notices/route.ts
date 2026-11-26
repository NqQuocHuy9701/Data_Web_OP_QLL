import { createHmac, timingSafeEqual } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getAdminSessionUsername } from "../_lib/admin-session";
import {
  QLL_NOTICE_EVENT,
  QLL_NOTICE_MAX_BYTES,
  QLL_NOTICE_PAGE_SIZE,
  QLL_NOTICE_SESSION_COOKIE,
  type QllNotice,
} from "../../qllNotices";

const DAY_MS = 86_400_000;
const NOTICE_COLUMNS = "id,sender,body,created_at,read_at";

type StoredNotice = QllNotice & { namecode: string; delivery_id: string };
type NoticeDatabase = {
  public: {
    Tables: {
      qll_notices: {
        Row: StoredNotice;
        Insert: Omit<StoredNotice, "id" | "created_at" | "read_at">;
        Update: Partial<StoredNotice>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      send_qll_notice: {
        Args: { recipient: string; admin_name: string; notice_body: string; delivery: string };
        Returns: boolean;
      };
    };
  };
};
let client: SupabaseClient<NoticeDatabase> | undefined;

function database() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("QLL notices database is unconfigured");
  return client ??= createClient<NoticeDatabase>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
}

function json(data: object, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

function error(message: string, status: number) {
  return json({ error: message }, status);
}

function enabled() {
  return process.env.NEXT_PUBLIC_QLL_NOTICES_ENABLED === "true";
}

function namecode(value: unknown) {
  if (typeof value !== "string") return null;
  const name = value.trim().normalize("NFC").toLowerCase();
  return /^[\p{L}\p{N}_.@ -]{1,80}$/u.test(name) ? name : null;
}

function sign(purpose: "browser" | "topic", value: string) {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("QLL notices signing key is unconfigured");
  return createHmac("sha256", secret).update(`qll-notices:${purpose}:${value}`).digest("hex");
}

function topicFor(recipient: string) {
  return `qll-notice:${sign("topic", recipient)}`;
}

function matchesBrowser(request: Request, recipient: string) {
  const token = request.headers.get("cookie")?.split(";").map((part) => part.trim())
    .find((part) => part.startsWith(`${QLL_NOTICE_SESSION_COOKIE}=`))
    ?.slice(QLL_NOTICE_SESSION_COOKIE.length + 1);
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return false;
  return timingSafeEqual(Buffer.from(token, "hex"), Buffer.from(sign("browser", recipient), "hex"));
}

async function status(recipient: string) {
  const oldest = new Date(Date.now() - 90 * DAY_MS).toISOString();
  const { data, count, error: problem } = await database().from("qll_notices")
    .select(NOTICE_COLUMNS, { count: "exact" }).eq("namecode", recipient)
    .is("read_at", null).gte("created_at", oldest)
    .order("id", { ascending: false }).limit(1);
  if (problem) throw problem;
  return json({ unread: count ?? 0, latest: data?.[0] ?? null, topic: topicFor(recipient) });
}

async function notify(recipient: string) {
  try {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    await fetch(new URL("/realtime/v1/api/broadcast", process.env.NEXT_PUBLIC_SUPABASE_URL), {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ topic: topicFor(recipient), event: QLL_NOTICE_EVENT, payload: {} }],
      }),
      signal: AbortSignal.timeout(1_500),
    });
  } catch {
    // The notice is already persisted and will load when the recipient opens
    // their inbox or returns to the tab.
  }
}

export async function GET(request: Request) {
  if (!enabled()) return error("Tính năng chưa được bật.", 404);
  const { searchParams } = new URL(request.url);
  const recipient = namecode(searchParams.get("namecode"));
  if (!recipient) return error("Namecode không hợp lệ.", 400);

  try {
    if (!matchesBrowser(request, recipient)) return error("Phiên thông báo chưa sẵn sàng.", 401);
    if (searchParams.get("view") === "status") return await status(recipient);
    const oldest = new Date(Date.now() - 90 * DAY_MS).toISOString();

    const before = searchParams.get("before");
    if (before !== null && !/^\d{1,10}$/.test(before)) return error("Trang tin không hợp lệ.", 400);
    let query = database().from("qll_notices").select(NOTICE_COLUMNS)
      .eq("namecode", recipient).gte("created_at", oldest)
      .order("id", { ascending: false }).limit(QLL_NOTICE_PAGE_SIZE + 1);
    if (before !== null) query = query.lt("id", Number(before));
    const { data, error: problem } = await query;
    if (problem) throw problem;
    const rows = data ?? [];
    return json({ notices: rows.slice(0, QLL_NOTICE_PAGE_SIZE), hasMore: rows.length > QLL_NOTICE_PAGE_SIZE });
  } catch {
    return error("Chưa tải được thông báo. Bạn thử lại nhé.", 503);
  }
}

export async function POST(request: Request) {
  if (!enabled()) return error("Tính năng chưa được bật.", 404);
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return error("Yêu cầu không hợp lệ.", 403);

  let input: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (raw.length > 8_192) return error("Yêu cầu quá dài.", 413);
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return error("Yêu cầu không hợp lệ.", 400);
    }
    input = parsed as Record<string, unknown>;
  } catch {
    return error("Yêu cầu không hợp lệ.", 400);
  }

  const recipient = namecode(input.namecode);
  if (!recipient) return error("Namecode không hợp lệ.", 400);

  try {
    if (input.action === "subscribe") {
      // Existing QLL login identifies users by their self-entered namecode.
      // This cookie scopes inbox requests to that namecode on this browser.
      const response = await status(recipient);
      if (!matchesBrowser(request, recipient)) {
        response.cookies.set(QLL_NOTICE_SESSION_COOKIE, sign("browser", recipient), {
          httpOnly: true, sameSite: "strict", path: "/", secure: process.env.NODE_ENV === "production",
        });
      }
      return response;
    }

    if (input.action === "read") {
      if (!matchesBrowser(request, recipient)) return error("Phiên thông báo chưa sẵn sàng.", 401);
      const ids = input.ids;
      if (!Array.isArray(ids) || !ids.length || ids.length > QLL_NOTICE_PAGE_SIZE ||
        !ids.every((id: unknown) => typeof id === "number" && Number.isInteger(id) && id > 0 && id <= 2_147_483_647)) {
        return error("Danh sách tin không hợp lệ.", 400);
      }
      const { data, error: problem } = await database().from("qll_notices")
        .update({ read_at: new Date().toISOString() }).eq("namecode", recipient)
        .is("read_at", null).in("id", ids).select("id");
      if (problem) throw problem;
      return json({ updated: data?.length ?? 0 });
    }

    const admin = getAdminSessionUsername(request);
    if (!admin) return error("Bạn cần đăng nhập Admin.", 401);

    if (input.action === "send") {
      const body = typeof input.body === "string" ? input.body.trim() : "";
      const delivery = input.delivery;
      if (!body || new TextEncoder().encode(body).length > QLL_NOTICE_MAX_BYTES) {
        return error("Nội dung phải từ 1 đến 1.024 byte.", 400);
      }
      if (typeof delivery !== "string" || !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(delivery)) {
        return error("Mã gửi không hợp lệ.", 400);
      }
      const { data, error: problem } = await database().rpc("send_qll_notice", {
        recipient, admin_name: admin, notice_body: body, delivery,
      });
      if (problem) throw problem;
      if (!data) return error("Hộp thông báo đã đạt giới hạn lưu trữ.", 409);
      await notify(recipient);
      return json({ success: true });
    }

    return error("Thao tác không hợp lệ.", 400);
  } catch {
    return error("Chưa thực hiện được. Bạn thử lại nhé.", 503);
  }
}
