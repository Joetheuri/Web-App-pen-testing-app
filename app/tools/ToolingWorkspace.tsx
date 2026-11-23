"use client";

import { FormEvent, useEffect, useState } from "react";

type Asset = { id: string; url: string; inScope: boolean; excluded: boolean };
type Engagement = { id: string; name: string; assets: Asset[] };
type Activity = { id: string; toolName: string; activityType: string; notes: string; createdAt: string };
const tools = ["Burp Suite", "OWASP ZAP", "Nikto", "SQLmap", "Nmap", "Dirb / Gobuster", "Hydra", "Metasploit", "WFuzz", "Wappalyzer / WhatWeb", "Other"];

export default function ToolingWorkspace({ workstationUrl }: { workstationUrl: string | null }) {
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [engagementId, setEngagementId] = useState("");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [message, setMessage] = useState("");
  const [launchConfirmed, setLaunchConfirmed] = useState(false);

  async function loadEngagements() {
    const res = await fetch("/api/engagements", { cache: "no-store" });
    if (!res.ok) throw new Error("Could not load assessments.");
    const data = await res.json() as Engagement[];
    setEngagements(data);
    if (!engagementId && data[0]) setEngagementId(data[0].id);
  }
  async function loadActivities(id: string) {
    if (!id) { setActivities([]); return; }
    const res = await fetch(`/api/tool-activity?engagementId=${encodeURIComponent(id)}`, { cache: "no-store" });
    if (res.ok) setActivities(await res.json());
  }
  useEffect(() => { void loadEngagements().catch((e) => setMessage(e.message)); }, []);
  useEffect(() => { void loadActivities(engagementId); }, [engagementId]);

  async function submitActivity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/tool-activity", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ engagementId, toolName: form.get("toolName"), activityType: form.get("activityType"), notes: form.get("notes") }) });
    const data = await res.json();
    if (!res.ok) { setMessage(data.error ?? "Could not save tool activity."); return; }
    event.currentTarget.reset(); setMessage("Tool activity saved."); await loadActivities(engagementId);
  }
  async function submitFinding(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/findings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ engagementId, assetId: form.get("assetId") || undefined, title: form.get("title"), description: form.get("description"), severity: form.get("severity"), evidence: form.get("evidence"), remediation: form.get("remediation") }) });
    const data = await res.json();
    if (!res.ok) { setMessage(data.error ?? "Could not save finding."); return; }
    event.currentTarget.reset(); setMessage("Finding and evidence saved for review.");
  }
  async function importReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = event.currentTarget.elements.namedItem("report") as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || file.size > 1_000_000) { setMessage("Choose a JSON report no larger than 1 MB."); return; }
    try {
      const report = JSON.parse(await file.text());
      const res = await fetch("/api/findings/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ engagementId, report }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import failed.");
      setMessage(`Imported ${data.imported} finding(s). Review each before treating it as confirmed.`);
      event.currentTarget.reset(); await loadActivities(engagementId);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not import report."); }
  }

  const selected = engagements.find((item) => item.id === engagementId);
  return <main className="workspace">
    <header className="workspace-header"><a className="brand" href="/">PENTEST <span>WORKSPACE</span></a><a href="/">← Dashboard</a></header>
    <section className="intro"><div><p className="eyebrow">ASSESSMENT OPERATIONS</p><h1>Tool log, reports & findings</h1><p className="subheading">Record authorized tester-operated work, import structured reports, and preserve evidence. This app does not execute tools.</p></div></section>
    {message && <div className="notice" role="status">{message}</div>}
    {!engagements.length ? <section className="panel"><p>Create an authorized assessment on the dashboard before adding activity or findings.</p></section> : <>
      <section className="panel engagement-picker"><label>Assessment<select value={engagementId} onChange={(e) => setEngagementId(e.target.value)}>{engagements.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></section>
      <div className="workspace-grid">
        <section className="panel form-panel"><p className="eyebrow">TESTER ACTIVITY</p><h2>Record tool usage</h2><form onSubmit={submitActivity}>
          <label>Tool<select name="toolName">{tools.map((tool) => <option key={tool}>{tool}</option>)}</select></label>
          <label>Activity type<select name="activityType"><option>Manual assessment</option><option>Proxy review</option><option>Report review</option><option>Other</option></select></label>
          <label>Notes<textarea name="notes" minLength={3} maxLength={2000} required placeholder="Record what was reviewed and the relevant in-scope asset. Do not paste credentials or secrets." /></label>
          <button className="primary-button">Save activity</button>
        </form>
        <hr />
        <p className="eyebrow">REPORT IMPORT</p><h2>Import JSON findings</h2><form onSubmit={importReport}><label>Vendor-neutral JSON report<input name="report" type="file" accept="application/json,.json" required /></label><small>Max 1 MB, 100 findings. Imported observations are unverified until reviewed.</small><button className="secondary-button">Import report</button></form></section>
        <section className="panel form-panel"><p className="eyebrow">FINDING & EVIDENCE</p><h2>Record a finding</h2><form onSubmit={submitFinding}>
          <label>Title<input name="title" minLength={3} maxLength={160} required /></label>
          <label>In-scope asset<select name="assetId"><option value="">Not linked to an asset</option>{selected?.assets.filter((asset) => asset.inScope && !asset.excluded).map((asset) => <option key={asset.id} value={asset.id}>{asset.url}</option>)}</select></label>
          <label>Severity<select name="severity"><option value="INFORMATIONAL">Informational</option><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="CRITICAL">Critical</option></select></label>
          <label>Description<textarea name="description" minLength={10} maxLength={5000} required /></label>
          <label>Evidence notes<textarea name="evidence" maxLength={5000} placeholder="Use redacted notes; avoid secrets or personal data." /></label>
          <label>Remediation<textarea name="remediation" maxLength={3000} /></label>
          <button className="primary-button">Save finding</button>
        </form></section>
      </div>
      <section className="panel activity-panel"><div className="section-title"><div><p className="eyebrow">AUDITABLE WORK LOG</p><h2>Recent recorded activity</h2></div></div>{activities.length ? activities.map((item) => <article className="activity-row" key={item.id}><strong>{item.toolName} · {item.activityType}</strong><time>{new Date(item.createdAt).toLocaleString()}</time><p>{item.notes}</p></article>) : <p className="empty">No tool activity recorded for this assessment.</p>}</section>
    </>}
    <section className="panel workstation-panel"><p className="eyebrow">EXTERNAL WORKSTATION</p><h2>Open reviewed workstation</h2><p className="empty">This opens a separately managed workstation. No tools or commands are sent by this app.</p>{workstationUrl ? <><label className="confirm"><input type="checkbox" checked={launchConfirmed} onChange={(event) => setLaunchConfirmed(event.target.checked)} /> I reviewed the engagement scope and will use the workstation only for explicitly authorized testing.</label><a className={`primary-button workstation-link ${!launchConfirmed ? "disabled-link" : ""}`} href={launchConfirmed ? workstationUrl : undefined} target="_blank" rel="noopener noreferrer" aria-disabled={!launchConfirmed} onClick={(event) => { if (!launchConfirmed) event.preventDefault(); }}>Open external workstation ↗</a></> : <p className="empty">Workstation launch is not configured. Set EXTERNAL_WORKSTATION_URL to your organization’s HTTPS workstation portal.</p>}</section>
    <footer className="disclaimer"><strong>Safety:</strong> Tool execution is not provided. Import only reports you are authorized to handle; use in-scope asset URLs only. Redact secrets and personal information from notes and evidence.</footer>
  </main>;
}
