import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
const supportedTools = ["Burp Suite", "OWASP ZAP", "Nikto", "SQLmap", "Nmap", "Dirb / Gobuster", "Hydra", "Metasploit", "WFuzz", "Wappalyzer / WhatWeb", "Other"];
const activityTypes = ["Manual assessment", "Proxy review", "Report review", "Other"];

export async function GET(request: Request) {
  const engagementId = new URL(request.url).searchParams.get("engagementId");
  if (!engagementId) return NextResponse.json({ error: "engagementId is required." }, { status: 400 });
  const activities = await prisma.toolActivity.findMany({ where: { engagementId }, orderBy: { createdAt: "desc" }, take: 100 });
  return NextResponse.json(activities);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.engagementId !== "string" || !supportedTools.includes(body.toolName) || !activityTypes.includes(body.activityType) || typeof body.notes !== "string" || body.notes.trim().length < 3 || body.notes.length > 2000) {
    return NextResponse.json({ error: "Provide a supported tool, activity type, engagement, and notes (3–2000 characters)." }, { status: 400 });
  }
  const engagement = await prisma.engagement.findUnique({ where: { id: body.engagementId } });
  if (!engagement) return NextResponse.json({ error: "Assessment not found." }, { status: 404 });
  const [activity] = await prisma.$transaction([
    prisma.toolActivity.create({ data: { engagementId: engagement.id, toolName: body.toolName, activityType: body.activityType, notes: body.notes.trim() } }),
    prisma.auditEvent.create({ data: { engagementId: engagement.id, action: "TOOL_ACTIVITY_RECORDED", detail: `${body.toolName}: ${body.activityType}` } })
  ]);
  return NextResponse.json(activity, { status: 201 });
}
