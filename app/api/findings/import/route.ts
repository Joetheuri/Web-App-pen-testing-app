import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
const severities = ["INFORMATIONAL", "LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > 1_000_000) return NextResponse.json({ error: "Report exceeds the 1 MB import limit." }, { status: 413 });
  let body: any;
  try { body = JSON.parse(raw); } catch { return NextResponse.json({ error: "Import must be valid JSON." }, { status: 400 }); }
  if (typeof body.engagementId !== "string" || !Array.isArray(body.report?.findings) || body.report.findings.length > 100) {
    return NextResponse.json({ error: "Expected a vendor-neutral JSON report with a findings array (maximum 100)." }, { status: 400 });
  }
  const engagement = await prisma.engagement.findUnique({ where: { id: body.engagementId }, include: { assets: true } });
  if (!engagement) return NextResponse.json({ error: "Assessment not found." }, { status: 404 });
  const toolName = typeof body.report.tool === "string" ? body.report.tool.trim().slice(0, 80) : "Imported report";
  const rows = [];
  for (const item of body.report.findings) {
    if (!item || typeof item.title !== "string" || item.title.trim().length < 3 || typeof item.description !== "string" || item.description.trim().length < 10) continue;
    let assetId: string | undefined;
    if (item.assetUrl) {
      const asset = engagement.assets.find((candidate) => candidate.url === item.assetUrl && candidate.inScope && !candidate.excluded);
      if (!asset) return NextResponse.json({ error: `Report asset is not in this assessment scope: ${String(item.assetUrl).slice(0, 180)}` }, { status: 400 });
      assetId = asset.id;
    }
    const severity = severities.includes(item.severity) ? item.severity : "INFORMATIONAL";
    rows.push({ engagementId: engagement.id, assetId, title: item.title.trim().slice(0, 160), description: item.description.trim().slice(0, 5000), severity, status: "OBSERVED" as const, confidence: "Needs validation", impact: typeof item.impact === "string" ? item.impact.slice(0, 3000) : null, remediation: typeof item.remediation === "string" ? item.remediation.slice(0, 3000) : null, evidence: { source: "report-import", tool: toolName, excerpt: JSON.stringify(item).slice(0, 3000) } });
  }
  if (!rows.length) return NextResponse.json({ error: "No valid findings found in the report." }, { status: 400 });
  const created = await prisma.$transaction(async (tx) => {
    const result = await tx.finding.createMany({ data: rows });
    await tx.toolActivity.create({ data: { engagementId: engagement.id, toolName, activityType: "Report review", notes: `Imported ${result.count} finding(s) from a JSON report. Review and validate each item.` } });
    await tx.auditEvent.create({ data: { engagementId: engagement.id, action: "REPORT_IMPORTED", detail: `${result.count} findings from ${toolName}` } });
    return result.count;
  });
  return NextResponse.json({ imported: created }, { status: 201 });
}
