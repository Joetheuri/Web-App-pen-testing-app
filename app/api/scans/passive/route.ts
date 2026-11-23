import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const allowedHosts = (process.env.PASSIVE_SCAN_ALLOWED_HOSTS ?? "")
  .split(",").map((host) => host.trim().toLowerCase()).filter(Boolean);

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (typeof body?.assetId !== "string") return NextResponse.json({ error: "An asset ID is required." }, { status: 400 });

  const asset = await prisma.asset.findUnique({ where: { id: body.assetId }, include: { engagement: true } });
  if (!asset || !asset.inScope || asset.excluded || !asset.engagement.authorized) {
    return NextResponse.json({ error: "The asset is not part of an authorized, in-scope engagement." }, { status: 403 });
  }

  let target: URL;
  try { target = new URL(asset.url); } catch { return NextResponse.json({ error: "Invalid stored asset URL." }, { status: 400 }); }
  if (target.protocol !== "https:" || !allowedHosts.includes(target.hostname.toLowerCase())) {
    return NextResponse.json({ error: "This host is not enabled for passive checks. Configure its exact hostname in PASSIVE_SCAN_ALLOWED_HOSTS." }, { status: 403 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    // One HEAD request only: no crawl, payloads, redirects, or state-changing requests.
    const response = await fetch(target.origin, { method: "HEAD", redirect: "manual", signal: controller.signal, headers: { "User-Agent": "Authorized-Passive-Assessment/1.0" } });
    const headers = Object.fromEntries(["strict-transport-security", "content-security-policy", "x-content-type-options", "x-frame-options", "referrer-policy", "permissions-policy"].map((key) => [key, response.headers.get(key)]));
    const findings = [
      ["strict-transport-security", "HTTP Strict Transport Security (HSTS) is not present"],
      ["content-security-policy", "Content Security Policy (CSP) is not present"],
      ["x-content-type-options", "X-Content-Type-Options is not present"],
      ["x-frame-options", "Clickjacking protection header is not present"]
    ].filter(([header]) => !headers[header]);
    const result = {
      status: response.status,
      checkedAt: new Date().toISOString(),
      method: "HEAD",
      note: "Low-impact header observation only; results require manual review.",
      headers,
      observations: findings.map(([, title]) => title)
    };
    const scan = await prisma.scanRun.create({ data: { engagementId: asset.engagementId, assetId: asset.id, result } });
    await prisma.auditEvent.create({ data: { engagementId: asset.engagementId, action: "PASSIVE_CHECK_COMPLETED", detail: `One HTTPS HEAD request to ${target.origin}; scan ${scan.id}` } });
    return NextResponse.json(scan, { status: 201 });
  } catch (error) {
    const message = error instanceof Error && error.name === "AbortError" ? "The request timed out." : "Could not reach the authorized host.";
    return NextResponse.json({ error: message }, { status: 502 });
  } finally { clearTimeout(timeout); }
}
