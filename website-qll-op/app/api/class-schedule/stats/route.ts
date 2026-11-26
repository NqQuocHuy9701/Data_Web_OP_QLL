import { NextResponse } from "next/server";
import { hasAdminSession } from "../../_lib/admin-session";
import { firstDailyReportDay, firstMonthlyReportDay } from "../../../classScheduleReportRange";

const dayMs = 86_400_000;
const vietnamDate = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit",
});

type DailyStats = { day: string; requests: number; added: number; cancelled: number };
type RequestRow = { id: number; created_at: string; is_done: boolean | null; is_cancelled: boolean | null };

export async function GET(request: Request) {
  const headers = { "Cache-Control": "private, no-store" };
  if (!hasAdminSession(request)) {
    return NextResponse.json({ error: "Phiên Admin đã hết hiệu lực." }, { status: 401, headers });
  }

  const params = new URL(request.url).searchParams;
  const start = params.get("start") ?? "";
  const end = params.get("end") ?? "";
  const startTime = parseDay(start);
  const endTime = parseDay(end);
  const year = params.get("year");
  const today = vietnamDate.format(new Date());
  const valid = year === null
    ? startTime !== null && endTime !== null && endTime >= startTime && endTime - startTime < 31 * dayMs && start >= firstDailyReportDay && end <= today
    : /^\d{4}$/.test(year) && year >= firstMonthlyReportDay.slice(0, 4) && year <= today.slice(0, 4);
  if (!valid) {
    return NextResponse.json({ error: "Khoảng thời gian không hợp lệ." }, { status: 400, headers });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: "Máy chủ chưa cấu hình Supabase." }, { status: 503, headers });
  }

  try {
    const endpoint = new URL(year === null ? "/rest/v1/rpc/class_schedule_daily_stats" : "/rest/v1/rpc/class_schedule_monthly_stats", url);
    if (year === null) {
      endpoint.searchParams.set("start_day", start);
      endpoint.searchParams.set("end_day", end);
    } else {
      endpoint.searchParams.set("report_year", year);
    }
    const options = {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: "no-store" as const,
      signal: request.signal,
    };
    const response = await fetch(endpoint, options);
    if (response.ok) {
      const data: unknown = await response.json();
      if (Array.isArray(data) && data.length > 0) return NextResponse.json({ data }, { headers });
      throw new Error("Supabase did not return the requested date buckets.");
    }
    if (response.status === 404) {
      const problem = await response.json();
      if (problem.code === "PGRST202") {
        const first = year === null ? start : `${year}-01-01` < firstMonthlyReportDay ? firstMonthlyReportDay : `${year}-01-01`;
        const last = year === null ? end : `${year}-12-31` < today ? `${year}-12-31` : today;
        const data = await readExistingRequests(url, first, last, year !== null, options);
        return NextResponse.json({ data }, { headers });
      }
    }
  } catch {
    // The request can be aborted when the Admin changes the time range.
  }
  return NextResponse.json({ error: "Chưa tải được thống kê. Vui lòng thử lại." }, { status: 502, headers });
}

async function readExistingRequests(url: string, first: string, last: string, monthly: boolean, options: RequestInit) {
  const endpoint = new URL("/rest/v1/class_schedule_requests", url);
  const time = (day: string) => Date.parse(day + "T00:00:00+07:00");
  endpoint.searchParams.set("select", "id,created_at,is_done,is_cancelled");
  endpoint.searchParams.append("created_at", `gte.${new Date(time(first)).toISOString()}`);
  endpoint.searchParams.append("created_at", `lt.${new Date(time(last) + dayMs).toISOString()}`);
  endpoint.searchParams.set("order", "id.asc");
  endpoint.searchParams.set("limit", "1000");

  const totals = new Map<string, DailyStats>();
  for (let date = time(first); date <= time(last); date += dayMs) {
    const day = bucket(vietnamDate.format(date), monthly);
    if (!totals.has(day)) totals.set(day, { day, requests: 0, added: 0, cancelled: 0 });
  }

  let cursor = 0;
  for (;;) {
    endpoint.searchParams.set("id", `gt.${cursor}`);
    const response = await fetch(endpoint, options);
    if (!response.ok) throw new Error("Could not read class schedule requests.");
    const rows: RequestRow[] = await response.json();
    if (!Array.isArray(rows)) throw new Error("Invalid class schedule response.");
    if (!rows.length) break;

    for (const row of rows) {
      const date = new Date(row.created_at);
      if (!Number.isSafeInteger(row.id) || row.id <= cursor || !Number.isFinite(date.getTime())) {
        throw new Error("Invalid class schedule row.");
      }
      cursor = row.id;
      const stats = totals.get(bucket(vietnamDate.format(date), monthly));
      if (!stats) throw new Error("Class schedule row is outside the requested range.");
      stats.requests++;
      if (row.is_cancelled) stats.cancelled++;
      else if (row.is_done) stats.added++;
    }
  }
  return Array.from(totals.values());
}

function bucket(day: string, monthly: boolean) {
  return monthly ? day.slice(0, 7) + "-01" : day;
}

function parseDay(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith("0000")) return null;
  const time = Date.parse(`${value}T00:00:00Z`);
  if (!Number.isFinite(time) || new Date(time).toISOString().slice(0, 10) !== value) return null;
  return time;
}
