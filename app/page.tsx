"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type Asset = { id: string; url: string; inScope: boolean; excluded: boolean; scans: { result: { status: number; checkedAt: string; observations: string[]; headers: Record<string, string | null> } }[] };
type Engagement = { id: string; name: string; authorization: string; assets: Asset[]; _count: { findings: number } };

export default function Home() {
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/engagements", { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to load stored assessments. Check database and server configuration.");
      setEngagements(await response.json());
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to load assessments."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);

  async function createAssessment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage("Creating assessment…");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/engagements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: form.get("name"), origin: form.get("origin"), authorization: form.get("authorization"), confirmAuthorization: form.get("confirmAuthorization") === "on" }) });
    const data = await response.json();
    if (!response.ok) { setMessage(data.error ?? "Could not create assessment."); return; }
    event.currentTarget.reset(); setMessage("Assessment saved."); await refresh();
  }

  async function runCheck(assetId: string) {
    setBusy(assetId); setMessage("Running one low-impact HTTPS header check…");
    try {
      const response = await fetch("/api/scans/passive", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ assetId }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Check failed.");
      setMessage("Passive check saved. Review observations before treating them as findings."); await refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Check failed."); }
    finally { setBusy(null); }
  }

  return <main className="workspace">
    <header className="workspace-header"><a className="brand" href="#">PENTEST <span>WORKSPACE</span></a><span className="safe-label">AUTHORIZED ASSESSMENTS ONLY</span></header>
    <section className="intro"><div><p className="eyebrow">ASSESSMENT WORKSPACE</p><h1>Web application assessments</h1><p className="subheading">Document authorization, keep assets in scope, and run a single passive HTTPS header check.</p></div></section>
    {message && <div className="notice" role="status">{message}</div>}
    <div className="workspace-grid">
      <section className="panel form-panel"><p className="eyebrow">NEW ENGAGEMENT</p><h2>Record authorization and scope</h2><form onSubmit={createAssessment}>
        <label>Engagement name<input name="name" minLength={2} maxLength={120} required placeholder="e.g. Company website review" /></label>
        <label>Authorized HTTPS origin<input name="origin" type="url" required placeholder="https://app.example.com" /><small>Only the exact hosts configured by the operator are accepted.</small></label>
        <label>Authorization notes<textarea name="authorization" minLength={10} maxLength={5000} required placeholder="Record who authorized this assessment and the approved dates or boundaries." /></label>
        <label className="confirm"><input type="checkbox" name="confirmAuthorization" required /> I have explicit permission to assess this system and confirm this target is in scope.</label>
        <button className="primary-button" type="submit">Save authorized assessment</button>
      </form></section>
      <section className="panel assessments"><div className="section-title"><div><p className="eyebrow">SAVED TO POSTGRESQL</p><h2>Your assessments</h2></div><button className="secondary-button" onClick={() => void refresh()}>Refresh</button></div>
        {loading ? <p className="empty">Loading assessments…</p> : engagements.length === 0 ? <p className="empty">No saved assessments yet. Create one after configuring your database and allowed hostnames.</p> : engagements.map((engagement) => <article className="assessment" key={engagement.id}><div className="assessment-heading"><div><h3>{engagement.name}</h3><span>{engagement.assets.length} scoped asset{engagement.assets.length === 1 ? "" : "s"}</span></div><span className="authorized-badge">Authorized</span></div>{engagement.assets.map((asset) => <div className="asset" key={asset.id}><div><strong>{asset.url}</strong><small>In scope · HTTPS only</small></div><button className="primary-button scan-button" disabled={busy === asset.id} onClick={() => void runCheck(asset.id)}>{busy === asset.id ? "Checking…" : "Run passive check"}</button></div>)}{engagement.assets.map((asset) => asset.scans?.[0] && <div className="scan-result" key={asset.scans[0].result.checkedAt}><strong>Latest check · HTTP {asset.scans[0].result.status}</strong><span>{new Date(asset.scans[0].result.checkedAt).toLocaleString()}</span>{asset.scans[0].result.observations.length ? <ul>{asset.scans[0].result.observations.map((observation) => <li key={observation}>{observation}</li>)}</ul> : <p>No missing checked headers were observed. This is not a comprehensive security assessment.</p>}</div>)}</article>)}
      </section>
    </div>
    <footer className="disclaimer"><strong>Check limits:</strong> The check sends one HTTPS HEAD request to the configured origin. It does not crawl pages, submit forms, test vulnerabilities, run exploits, or use brute force. Only configure hosts for which you have written authorization. Results are observations, not confirmed vulnerabilities.</footer>
  </main>;
}
