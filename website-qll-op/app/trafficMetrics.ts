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

export function recentTrafficSlots(timeSlot: string) {
  const [hour, minute] = timeSlot.split(":").map(Number);
  const end = hour * 60 + minute;
  return Array.from({ length: Math.min(end + 1, 120) }, (_, index) => {
    const slot = Math.max(0, end - 119) + index;
    return `${String(Math.floor(slot / 60)).padStart(2, "0")}:${String(slot % 60).padStart(2, "0")}`;
  });
}

export function buildTrafficPoints(slots: string[], rows: { time_slot: string; request_count: number | null }[]) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    if (row.request_count === null || !Number.isFinite(row.request_count) || row.request_count < 0) continue;
    const time = row.time_slot.slice(0, 5);
    counts.set(time, Math.max(counts.get(time) ?? 0, row.request_count));
  }
  return slots.map((time) => ({ time, requests: counts.get(time) ?? null }));
}
