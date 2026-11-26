import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE } from "../_lib/admin-session";
import { QLL_NOTICE_SESSION_COOKIE } from "../../qllNotices";

export async function POST() {
  const response = NextResponse.json({ success: true });
  const cookieOptions = {
    httpOnly: true,
    sameSite: "strict" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  };
  response.cookies.set(ADMIN_SESSION_COOKIE, "", cookieOptions);
  response.cookies.set(QLL_NOTICE_SESSION_COOKIE, "", cookieOptions);
  return response;
}
