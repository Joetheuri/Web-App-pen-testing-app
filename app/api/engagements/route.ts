import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const allowedHosts = (process.env.PASSIVE_SCAN_ALLOWED_HOSTS ?? "")
  .split(",").map((host) => host.trim().toLowerCase()).filter(Boolean);

function authorizedOrigin(value: unknown): URL | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.pathname !== "/" || url.search || url.hash) return null;
    if (!allowedHosts.includes(url.hostname.toLowerCase())) return null;
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(url.hostname) || url.hostname.includes(":")) return null;
    return url;
  } catch { return null; }
}

export async function GET() {
  const engagements = await prisma.engagement.findMany({
    include: { assets: { include: { scans: { orderBy: { createdAt: "desc" }, take: 1 } } }, _count: { select: { findings: true } } },
    orderBy: { updatedAt: "desc" }
  });
  return NextResponse.json(engagements);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const authorization = typeof body?.authorization === "string" ? body.authorization.trim() : "";
  const origin = authorizedOrigin(body?.origin);
  if (name.length < 2 || name.length > 120 || authorization.length < 10 || !origin || body?.confirmAuthorization !== true) {
    return NextResponse.json({ error: "Provide a name, written authorization notes, confirm authorization, and an HTTPS origin configured in PASSIVE_SCAN_ALLOWED_HOSTS." }, { status: 400 });
  }
  const engagement = await prisma.engagement.create({
    data: {
      name, authorization, authorized: true, status: "ACTIVE",
      assets: { create: { url: origin.origin, inScope: true, environment: "Production" } },
      auditEvents: { create: { action: "ENGAGEMENT_CREATED", detail: `Authorized scope recorded for ${origin.origin}` } }
    },
    include: { assets: true }
  });
  return NextResponse.json(engagement, { status: 201 });
}
