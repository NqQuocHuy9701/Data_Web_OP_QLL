import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface ClassScheduleRecord {
  ma_lop: string;
  mon_hoc?: string | null;
  nguoi_tao: string;
  team?: string | null;
  timestamp?: number | string | null;
  created_at?: string | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isClassScheduleRecord(value: unknown): value is ClassScheduleRecord {
  return (
    isRecord(value) &&
    typeof value.ma_lop === "string" &&
    typeof value.nguoi_tao === "string"
  );
}

function hasValidWebhookSecret(request: Request, secret: string) {
  const provided = request.headers.get("x-supabase-webhook-secret");
  if (!provided) return false;

  const providedBuffer = Buffer.from(provided);
  const secretBuffer = Buffer.from(secret);
  return (
    providedBuffer.length === secretBuffer.length &&
    timingSafeEqual(providedBuffer, secretBuffer)
  );
}

function formatCreatedAt(record: ClassScheduleRecord) {
  const rawTimestamp = record.timestamp || record.created_at;
  if (!rawTimestamp) return "Không rõ";

  const date = new Date(
    typeof rawTimestamp === "number" || /^\d+$/.test(String(rawTimestamp))
      ? Number(rawTimestamp)
      : String(rawTimestamp),
  );
  if (Number.isNaN(date.getTime())) return "Không rõ";

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "medium",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
}

export async function POST(request: Request) {
  const webhookSecret = process.env.SUPABASE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { success: false, error: "Webhook chưa được cấu hình." },
      { status: 503 },
    );
  }

  if (!hasValidWebhookSecret(request, webhookSecret)) {
    return NextResponse.json(
      { success: false, error: "Webhook secret không hợp lệ." },
      { status: 401 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Payload webhook không hợp lệ." },
      { status: 400 },
    );
  }

  if (
    !isRecord(payload) ||
    payload.type !== "INSERT" ||
    payload.schema !== "public" ||
    payload.table !== "class_schedule_requests" ||
    !isClassScheduleRecord(payload.record)
  ) {
    return NextResponse.json(
      { success: false, error: "Sự kiện webhook không được hỗ trợ." },
      { status: 400 },
    );
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const messageThreadId = Number(process.env.TELEGRAM_MESSAGE_THREAD_ID);
  if (
    !botToken ||
    !chatId ||
    !Number.isSafeInteger(messageThreadId) ||
    messageThreadId <= 0
  ) {
    return NextResponse.json(
      {
        success: false,
        error: "Telegram bot, group hoặc topic chưa được cấu hình đầy đủ.",
      },
      { status: 503 },
    );
  }

  const record = payload.record;
  const message = [
    "🔔 YÊU CẦU ADD LỚP MỚI",
    `Mã lớp: ${record.ma_lop}`,
    `Môn học: ${record.mon_hoc || "Không rõ"}`,
    `QLL: ${record.nguoi_tao}`,
    `Team: ${record.team || "Không rõ"}`,
    `Thời gian: ${formatCreatedAt(record)}`,
  ].join("\n");

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          message_thread_id: messageThreadId,
          text: message,
          disable_web_page_preview: true,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      },
    );

    const result: unknown = await response.json();
    if (
      !response.ok ||
      !isRecord(result) ||
      result.ok !== true
    ) {
      const description =
        isRecord(result) && typeof result.description === "string"
          ? result.description
          : `HTTP ${response.status}`;
      console.error("Telegram rejected class schedule notification:", description);
      return NextResponse.json(
        { success: false, error: "Telegram không nhận được thông báo." },
        { status: 502 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to send class schedule Telegram notification:", error);
    return NextResponse.json(
      { success: false, error: "Không thể kết nối tới Telegram." },
      { status: 502 },
    );
  }
}
