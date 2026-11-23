import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
const severities = ["INFORMATIONAL", "LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > 1_000_000) return NextResponse.json({ error: "Request exceeds the 1 MB limit." }, { status: 413 });
  let body: any;
  try { body = JSON.parse(raw); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }
  if (typeof body.engagementId !== "string" || typeof body.title !== "string" || body.title.trim().length < 3 || body.title.length > 160 || typeof body.description !== "string" || body.description.trim().length < 10 || body.description.length > 5000) {
    return NextResponse.json({ error: "Provide an assessment, title, and description." }, { status: 400 });
  }
  const severity = severities.includes(body.severity) ? body.severity : "INFORMATIONAL";
  const engagement = await prisma.engagement.findUnique({ where: { id: body.engagementId }, include: { assets: true } });
  if (!engagement) return NextResponse.json({ error: "Assessment not found." }, { status: 404 });
  let assetId: string | undefined;
  if (body.assetId) {
    const asset = engagement.assets.find((item) => item.id === body.assetId && item.inScope && !item.excluded);
    if (!asset) return NextResponse.json({ error: "Select an in-scope asset from this assessment." }, { status: 400 });
    assetId = asset.id;
  }
  const evidence = typeof body.evidence === "string" ? body.evidence.trim().slice(0, 5000) : "";
  const remediation = typeof body.remediation === "string" ? body.remediation.trim().slice(0, 3000) : "";
  const finding = await prisma.finding.create({ data: {
    engagementId: engagement.id, assetId, title: body.title.trim(), description: body.description.trim(),
    severity, remediation: remediation || null, status: "OBSERVED", confidence: "Needs validation",
    evidence: evidence ? { note: evidence, source: "manual-entry" } : undefined
  } });
  await prisma.auditEvent.create({ data: { engagementId: engagement.id, action: "FINDING_RECORDED", detail: finding.title } });
  return NextResponse.json(finding, { status: 201 });
}
