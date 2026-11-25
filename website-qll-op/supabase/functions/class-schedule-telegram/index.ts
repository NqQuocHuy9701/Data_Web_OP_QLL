interface ClassScheduleRecord {
  ma_lop: string;
  mon_hoc?: string | null;
  nguoi_tao: string;
  sid_cid?: string | null;
  team?: string | null;
  is_done?: boolean | null;
  is_cancelled?: boolean | null;
  cancel_reason?: string | null;
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

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

async function findTelegramQllUsername(nguoiTao: string) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const accessKey = serviceRoleKey || anonKey;
  if (!supabaseUrl || !accessKey) return null;

  try {
    const creator = nguoiTao.trim();
    if (!creator) return null;

    const response = await fetch(
      `${supabaseUrl}/rest/v1/telegram_users_qll?select=username,full_name&username=ilike.*${encodeURIComponent(creator)}*&limit=100`,
      {
        headers: {
          apikey: accessKey,
          Authorization: `Bearer ${accessKey}`,
        },
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (!response.ok) return null;

    const rows: unknown = await response.json();
    if (!Array.isArray(rows) || rows.length === 0) return null;
    const creatorLower = creator.toLocaleLowerCase("vi-VN");
    const candidates = rows.filter(
      (row): row is Record<string, unknown> =>
        isRecord(row) && typeof row.username === "string",
    );

    const exact = candidates.find(
      (row) =>
        (row.username as string).trim().toLocaleLowerCase("vi-VN") === creatorLower,
    );
    const suffix = candidates.find((row) =>
      (row.username as string)
        .trim()
        .toLocaleLowerCase("vi-VN")
        .endsWith(creatorLower),
    );
    const contains = candidates.find((row) =>
      (row.username as string)
        .trim()
        .toLocaleLowerCase("vi-VN")
        .includes(creatorLower),
    );

    const matched = exact || suffix || contains;
    return matched ? (matched.username as string).trim() : null;
  } catch (error) {
    console.error("Failed to map nguoi_tao to Telegram username:", error);
    return null;
  }
}

function formatTelegramMention(username: string) {
  const cleaned = username.trim().replace(/^@/, "");
  return cleaned ? `@${cleaned}` : "";
}

function formatSubjectHashtag(maLop: string) {
  const subjectCode = maLop.trim().slice(0, 4);
  return subjectCode ? `#${subjectCode.toLocaleUpperCase("vi-VN")}` : "";
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function hasWebhookSecret(request: Request) {
  const secret = Deno.env.get("CLASS_SCHEDULE_WEBHOOK_SECRET");
  return Boolean(secret && request.headers.get("x-supabase-webhook-secret") === secret);
}

function getAddRequestTopic() {
  const value = Deno.env.get("TELEGRAM_MESSAGE_THREAD_ID") || "";
  const id = Number(value);
  return /^\d+$/.test(value) && Number.isSafeInteger(id) && id > 0 ? id : undefined;
}

interface OverdueRequest {
  id: number;
  sid_cid: string;
  claimed_at: string;
}

async function sendOverdueAlerts(request: Request) {
  if (!hasWebhookSecret(request)) {
    return jsonResponse({ success: false, error: "Unauthorized." }, 401);
  }

  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
  const chatId = Deno.env.get("TELEGRAM_CHAT_ID");
  const topic = getAddRequestTopic();
  if (!url || !key || !botToken || !chatId || !topic) {
    return jsonResponse({ success: false, error: "Overdue alerts are not configured." }, 500);
  }

  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };

  try {
    const claim = await fetch(`${url}/rest/v1/rpc/claim_overdue_class_schedule_requests`, {
      method: "POST",
      headers,
      body: "{}",
      signal: AbortSignal.timeout(5_000),
    });
    if (!claim.ok) throw new Error(`Claim failed (HTTP ${claim.status}).`);
    const rows: OverdueRequest[] = await claim.json();
    if (rows.length === 0) return jsonResponse({ success: true, sent: 0 });

    const text = [
      `Chị @OP_LinhDK6 @OP_LinhDTT1 ơi, còn ${rows.length} case quá 2 giờ chưa được add lớp ạ !`,
      "",
      "SID/CID:",
      ...rows.map((row) => `• ${row.sid_cid}`),
    ].join("\n");
    const sent = await sendTelegram(botToken, chatId, topic, text);
    if (!sent.ok) return sent;

    const filters = new URLSearchParams({
      request_id: `in.(${rows.map((row) => row.id).join(",")})`,
      claimed_at: `eq.${rows[0].claimed_at}`,
    });
    const saved = await fetch(`${url}/rest/v1/class_schedule_overdue_alerts?${filters}`, {
      method: "PATCH",
      headers: { ...headers, Prefer: "return=minimal" },
      body: JSON.stringify({ sent_at: new Date().toISOString() }),
      signal: AbortSignal.timeout(5_000),
    });
    if (!saved.ok) throw new Error(`Saving alert status failed (HTTP ${saved.status}).`);
    return jsonResponse({ success: true, sent: rows.length });
  } catch (error) {
    console.error("Overdue class schedule alert failed:", error);
    return jsonResponse({ success: false, error: "Overdue alert failed." }, 502);
  }
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return jsonResponse({ success: false, error: "Method not allowed." }, 405);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ success: false, error: "Invalid JSON payload." }, 400);
  }

  if (isRecord(payload) && payload.type === "OVERDUE_CHECK") {
    return sendOverdueAlerts(request);
  }

  if (
    !isRecord(payload) ||
    payload.schema !== "public" ||
    payload.table !== "class_schedule_requests" ||
    !isRecord(payload.record) ||
    !isClassScheduleRecord(payload.record)
  ) {
    return jsonResponse({ success: false, error: "Unsupported database event." }, 400);
  }

  const eventType = payload.type;
  if (eventType !== "INSERT" && eventType !== "UPDATE") {
    return jsonResponse({ success: false, error: "Unsupported database event." }, 400);
  }

  if (eventType === "INSERT" && !hasWebhookSecret(request)) {
    return jsonResponse({ success: false, error: "Unauthorized." }, 401);
  }

  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
  const chatId = Deno.env.get("TELEGRAM_CHAT_ID");
  if (!botToken) {
    console.error("Telegram bot secret is not configured.");
    return jsonResponse({ success: false, error: "Telegram is not configured." }, 500);
  }

  const record = payload.record;
  let targetChatId = chatId;
  let targetThreadId: number | undefined;
  let message: string;

  if (eventType === "INSERT") {
    targetThreadId = getAddRequestTopic();
    if (!chatId || !targetThreadId) {
      console.error("Telegram insert group or topic secrets are not configured.");
      return jsonResponse({ success: false, error: "Telegram insert destination is not configured." }, 500);
    }
    message = [
      "<b>🔔 YÊU CẦU THÊM LỚP MỚI</b>",
      "",
      `📚 <b>Mã lớp:</b> ${escapeHtml(record.ma_lop)}`,
      `📖 <b>Môn học:</b> ${escapeHtml(record.mon_hoc?.trim() || "Không rõ")}`,
      `👤 <b>QLL phụ trách:</b> ${escapeHtml(formatPersonName(record.nguoi_tao))}`,
      `🆔 <b>SID/CID:</b> ${escapeHtml(record.sid_cid?.trim() || "Không rõ")}`,
      `🏷 <b>Team:</b> ${escapeHtml(record.team?.trim() || "Không rõ")}`,
      "",
      `🕐 <b>Thời gian:</b> ${escapeHtml(formatCreatedAt(record))}`,
      "",
      "@OP_LinhDK6 @OP_LinhDTT1",
    ].join("\n");
  } else {
    const cancelled = record.is_cancelled === true;
    if (!cancelled && record.is_done !== true) {
      return jsonResponse({ success: true, ignored: "not_processed" });
    }
    if (
      isRecord(payload.old_record) &&
      (payload.old_record.is_done === true || payload.old_record.is_cancelled === true)
    ) {
      return jsonResponse({ success: true, ignored: "already_processed" });
    }

    const reason = typeof record.cancel_reason === "string" ? record.cancel_reason.trim() : "";
    if (cancelled) {
      const callerKey = request.headers.get("x-class-schedule-service-key");
      const expectedHash = Deno.env.get("CLASS_SCHEDULE_CANCEL_KEY_SHA256");
      if (!callerKey || !expectedHash) {
        return jsonResponse({ success: false, error: "Unauthorized." }, 401);
      }
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(callerKey));
      const callerHash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
      if (callerHash !== expectedHash) {
        return jsonResponse({ success: false, error: "Unauthorized." }, 401);
      }
      if (!reason || reason.length > 500) {
        return jsonResponse({ success: false, error: "Invalid cancellation reason." }, 400);
      }
    }

    targetChatId = Deno.env.get("TELEGRAM_DONE_CHAT_ID") || "-1002273179613";
    const doneThreadIdValue = Deno.env.get("TELEGRAM_DONE_MESSAGE_THREAD_ID") || "";
    if (/^\d+$/.test(doneThreadIdValue)) {
      const doneThreadId = Number(doneThreadIdValue);
      if (Number.isSafeInteger(doneThreadId) && doneThreadId > 0) {
        targetThreadId = doneThreadId;
      }
    }

    const creator = record.nguoi_tao.trim();
    const mappedUsername = await findTelegramQllUsername(creator);
    const mention = escapeHtml(
      mappedUsername
        ? formatTelegramMention(mappedUsername)
        : creator
          ? `@${creator}`
          : "@KhongRo",
    );
    const subjectHashtag = formatSubjectHashtag(record.ma_lop);
    const requestDetails = [
      `🆔 SID/CID: ${escapeHtml(record.sid_cid?.trim() || "Không rõ")}`,
      `Mã lớp: ${escapeHtml(record.ma_lop)}`,
      `QLL: ${mention}`,
    ];
    message = (cancelled
      ? [
          escapeHtml(subjectHashtag),
          ...requestDetails,
          "Trạng thái: <b>HỦY YÊU CẦU</b>",
          `Lý do: ${escapeHtml(reason)}`,
        ]
      : [
          ...requestDetails,
          subjectHashtag,
          "",
          "VH đã add lớp theo thông tin mã lớp QLL báo trên web.",
          "Nhờ QLL kiểm tra lại thông tin lớp học (lịch học, khối lớp) và thông báo đến PH đồng thời hướng dẫn PH nhắn OA để VH hỗ trợ, hướng dẫn học tập cho HS nhé!",
        ]
    ).join("\n");
  }

  return sendTelegram(botToken, targetChatId, targetThreadId, message);
});

async function sendTelegram(
  botToken: string,
  targetChatId: string | undefined,
  targetThreadId: number | undefined,
  message: string,
) {
  try {
    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          chat_id: targetChatId,
          ...(targetThreadId ? { message_thread_id: targetThreadId } : {}),
          text: message,
          parse_mode: "HTML",
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
}
