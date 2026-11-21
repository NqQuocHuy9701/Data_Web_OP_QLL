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

function formatCreatedAt(record: ClassScheduleRecord) {
  const rawTimestamp = record.timestamp || record.created_at;
  if (!rawTimestamp) return "Không rõ";

  const date = new Date(
    typeof rawTimestamp === "number" || /^\d+$/.test(String(rawTimestamp))
      ? Number(rawTimestamp)
      : String(rawTimestamp),
  );
  if (Number.isNaN(date.getTime())) return "Không rõ";

  const time = new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
  const dateLabel = new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);

  return `${time} - ${dateLabel}`;
}

function formatPersonName(value: string) {
  const name = value.trim();
  return name
    ? `${name.charAt(0).toLocaleUpperCase("vi-VN")}${name.slice(1)}`
    : "Không rõ";
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return jsonResponse({ success: false, error: "Method not allowed." }, 405);
  }

  const webhookSecret = Deno.env.get("CLASS_SCHEDULE_WEBHOOK_SECRET");
  if (!webhookSecret) {
    console.error("CLASS_SCHEDULE_WEBHOOK_SECRET is not configured.");
    return jsonResponse({ success: false, error: "Webhook is not configured." }, 500);
  }
  if (request.headers.get("x-supabase-webhook-secret") !== webhookSecret) {
    return jsonResponse({ success: false, error: "Unauthorized." }, 401);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ success: false, error: "Invalid JSON payload." }, 400);
  }

  if (
    !isRecord(payload) ||
    payload.type !== "INSERT" ||
    payload.schema !== "public" ||
    payload.table !== "class_schedule_requests" ||
    !isClassScheduleRecord(payload.record)
  ) {
    return jsonResponse({ success: false, error: "Unsupported database event." }, 400);
  }

  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
  const chatId = Deno.env.get("TELEGRAM_CHAT_ID");
  const threadIdValue = Deno.env.get("TELEGRAM_MESSAGE_THREAD_ID") || "";
  const messageThreadId = Number(threadIdValue);
  if (
    !botToken ||
    !chatId ||
    !/^\d+$/.test(threadIdValue) ||
    !Number.isSafeInteger(messageThreadId) ||
    messageThreadId <= 0
  ) {
    console.error("Telegram bot, group, or topic secrets are not configured.");
    return jsonResponse({ success: false, error: "Telegram is not configured." }, 500);
  }

  const record = payload.record;
  const message = [
    "🔔 YÊU CẦU THÊM LỚP MỚI",
    "",
    `📚 Mã lớp: ${record.ma_lop}`,
    `📖 Môn học: ${record.mon_hoc?.trim() || "Không rõ"}`,
    `👤 QLL phụ trách: ${formatPersonName(record.nguoi_tao)}`,
    `🏷 Team: ${record.team?.trim() || "Không rõ"}`,
    "",
    `🕐 Thời gian: ${formatCreatedAt(record)}`,
  ].join("\n");

  try {
    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          chat_id: chatId,
          message_thread_id: messageThreadId,
          text: message,
          disable_web_page_preview: true,
        }),
        signal: AbortSignal.timeout(10_000),
      },
    );

    const result: unknown = await telegramResponse.json();
    if (
      !telegramResponse.ok ||
      !isRecord(result) ||
      result.ok !== true
    ) {
      const description =
        isRecord(result) && typeof result.description === "string"
          ? result.description
          : `HTTP ${telegramResponse.status}`;
      console.error("Telegram rejected class schedule notification:", description);
      return jsonResponse({ success: false, error: "Telegram rejected notification." }, 502);
    }

    return jsonResponse({ success: true });
  } catch (error) {
    console.error("Failed to send class schedule Telegram notification:", error);
    return jsonResponse({ success: false, error: "Telegram request failed." }, 502);
  }
});
