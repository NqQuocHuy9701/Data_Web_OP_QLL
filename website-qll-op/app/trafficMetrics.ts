type PresenceState = Record<string, unknown[]>;

function isMetadata(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function readOnlineUsers(state: PresenceState, now = Date.now()) {
  const people = new Map<string, { namecode: string; teamLead: string; onlineAt: number }>();
  for (const [key, sessions] of Object.entries(state)) {
    for (const session of sessions) {
      if (!isMetadata(session)) continue;
      const namecode = (typeof session.user_name === "string" ? session.user_name : key).trim();
      if (!namecode) continue;
      const identity = namecode.toLowerCase();
      const onlineAt = typeof session.online_at === "number" && Number.isFinite(session.online_at)
        ? session.online_at
        : now;
      const existing = people.get(identity);
      if (!existing || onlineAt < existing.onlineAt) {
        people.set(identity, {
          namecode,
          teamLead: typeof session.team_lead === "string" && session.team_lead.trim()
            ? session.team_lead
            : "Vận hành chung",
          onlineAt,
        });
      }
    }
  }
  return [...people.values()].sort((left, right) => left.namecode.localeCompare(right.namecode));
}

export function selectTrafficWriter(state: PresenceState) {
  let writer: string | undefined;
  for (const sessions of Object.values(state)) {
    for (const session of sessions) {
      if (!isMetadata(session)) continue;
      const id = session.traffic_session_id;
      if (typeof id === "string" && id && (!writer || id < writer)) writer = id;
    }
  }
  return writer;
}

const THREE_MINUTES = 180_000;
const trafficTime = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Ho_Chi_Minh",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export interface OnlinePeakPoint {
  time: string;
  interval: string;
  peak: number | null;
}

export function buildMinuteTrafficPoints(
  rows: { time_slot: string; request_count: number | null }[],
  now: number,
): OnlinePeakPoint[] {
  const samples = new Map(rows.map((row) => [row.time_slot.slice(0, 5), row.request_count]));
  const [hour, minute] = trafficTime.format(now).split(":").map(Number);
  const length = Math.min(120, hour * 60 + minute + 1);
  return Array.from({ length }, (_, index) => {
    const time = trafficTime.format(now - (length - 1 - index) * 60_000);
    return { time, interval: time, peak: samples.get(time) ?? null };
  });
}

export function buildOnlinePeakPoints(
  rows: { bucket_end: string; peak_online: number | null }[],
  now = Date.now(),
): OnlinePeakPoint[] {
  const sealed = new Map(rows.map((row) => [Date.parse(row.bucket_end), row.peak_online]));
  const lastEnd = rows.length > 0
    ? Math.max(...sealed.keys())
    : Math.floor(now / THREE_MINUTES) * THREE_MINUTES;

  return Array.from({ length: 40 }, (_, index) => {
    const end = lastEnd - (39 - index) * THREE_MINUTES;
    const time = trafficTime.format(end);
    return {
      time,
      interval: `${trafficTime.format(end - THREE_MINUTES)}–${time}`,
      peak: sealed.get(end) ?? null,
    };
  });
}
