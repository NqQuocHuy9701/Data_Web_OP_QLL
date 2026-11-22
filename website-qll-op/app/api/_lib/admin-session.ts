import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_COOKIE = "qll_admin_session";

function getSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
}

export function hasAdminSessionSecret() {
  return Boolean(getSessionSecret());
}

export function createAdminSessionToken(username: string) {
  const secret = getSessionSecret();
  if (!secret) return null;

  const payload = Buffer.from(
    JSON.stringify({
      username,
    }),
  ).toString("base64url");
  const signature = createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");

  return `${payload}.${signature}`;
}

export function getAdminSessionUsername(request: Request) {
  const secret = getSessionSecret();
  if (!secret) return null;

  const cookie = request.headers
    .get("cookie")
    ?.split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${ADMIN_SESSION_COOKIE}=`));
  const token = cookie?.slice(ADMIN_SESSION_COOKIE.length + 1);
  if (!token) return null;

  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return null;

  const expectedSignature = createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");
  const received = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);
  if (
    received.length !== expected.length ||
    !timingSafeEqual(received, expected)
  ) {
    return null;
  }

  try {
    const session: unknown = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    );
    if (
      typeof session !== "object" ||
      session === null ||
      !("username" in session) ||
      typeof session.username !== "string" ||
      !session.username
    ) {
      return null;
    }

    return session.username;
  } catch {
    return null;
  }
}

export function hasAdminSession(request: Request) {
  return getAdminSessionUsername(request) !== null;
}
