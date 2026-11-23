import { NextResponse } from "next/server";

export function middleware(request: Request) {
  if (process.env.NODE_ENV !== "production") return NextResponse.next();
  const user = process.env.APP_BASIC_AUTH_USER;
  const password = process.env.APP_BASIC_AUTH_PASSWORD;
  if (!user || !password) return new NextResponse("Configure APP_BASIC_AUTH_USER and APP_BASIC_AUTH_PASSWORD before production use.", { status: 503 });
  const header = request.headers.get("authorization") ?? "";
  const expected = `Basic ${btoa(`${user}:${password}`)}`;
  if (header !== expected) return new NextResponse("Authentication required.", { status: 401, headers: { "WWW-Authenticate": 'Basic realm="Pentest Workspace", charset="UTF-8"' } });
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
