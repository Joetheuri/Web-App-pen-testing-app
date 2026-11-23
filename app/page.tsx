const stats = [
  { label: "Engagements", value: "01", note: "1 active" },
  { label: "In-scope assets", value: "03", note: "Across 1 engagement" },
  { label: "Findings", value: "04", note: "2 need validation" },
  { label: "Open findings", value: "03", note: "1 high priority" }
];

const findings = [
  { title: "Session token not revoked on sign-out", asset: "app.example.test", severity: "High", status: "Validated" },
  { title: "Missing content security policy", asset: "app.example.test", severity: "Medium", status: "Observed" },
  { title: "Verbose error response", asset: "api.example.test", severity: "Low", status: "Needs review" }
];

export default function Home() {
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#overview"><span className="brand-mark">P</span><span>Pentest<span className="brand-blue">Workspace</span></span></a>
        <p className="nav-label">WORKSPACE</p>
        <nav aria-label="Main navigation">
          <a className="nav-item active" href="#overview"><span>▦</span> Overview</a>
          <a className="nav-item" href="#engagement"><span>◫</span> Engagements</a>
          <a className="nav-item" href="#scope"><span>◎</span> Scope & assets</a>
          <a className="nav-item" href="#findings"><span>◇</span> Findings</a>
          <a className="nav-item" href="#report"><span>▤</span> Reports</a>
        </nav>
        <div className="sidebar-bottom">
          <div className="authorization-card"><span className="shield">✓</span><strong>Authorized testing only</strong><p>Only assess systems you own or have explicit permission to test.</p></div>
          <div className="profile"><div className="avatar">JT</div><div><strong>Joe Tester</strong><small>Workspace owner</small></div><span className="more">···</span></div>
        </div>
      </aside>

      <section className="main-content" id="overview">
        <header className="topbar"><div className="breadcrumbs">Workspace <span>/</span> Overview</div><div className="top-actions"><span className="demo-chip">DEMO DATA</span><button className="icon-button" aria-label="Notifications">♧<i /></button><div className="avatar small-avatar">JT</div></div></header>
        <div className="page-heading"><div><p className="eyebrow">MONDAY, NOVEMBER 23, 2026</p><h1>Good morning, Joe <span>✦</span></h1><p className="subheading">Here’s the latest on your security assessments.</p></div><a className="button primary-button" href="#engagement">＋ New engagement</a></div>

        <section className="stats-grid" aria-label="Workspace summary">
          {stats.map((item, index) => <article className="stat-card" key={item.label}><div className={`stat-icon icon-${index}`}>{["▣", "◎", "◇", "↗"][index]}</div><span className="stat-note">{item.note}</span><p>{item.label}</p><strong>{item.value}</strong></article>)}
        </section>

        <div className="dashboard-grid">
          <section className="card engagement-card" id="engagement">
            <div className="card-heading"><div><p className="eyebrow">CURRENT ENGAGEMENT</p><h2>Example Web Application</h2></div><span className="pill pill-green"><i /> Authorized</span></div>
            <div className="engagement-meta"><span>◷ &nbsp;Nov 20 – Dec 04, 2026</span><span>♧ &nbsp;Web application</span><span>▧ &nbsp;12 endpoints documented</span></div>
            <div className="progress-label"><span>Assessment progress</span><strong>58%</strong></div><div className="progress-track"><span /></div>
            <div className="workflow"><div className="workflow-step complete"><span>✓</span><div><strong>Authorization</strong><small>Confirmed</small></div></div><div className="workflow-step complete"><span>✓</span><div><strong>Scope & inventory</strong><small>3 assets documented</small></div></div><div className="workflow-step current"><span>3</span><div><strong>Assessment</strong><small>In progress</small></div></div><div className="workflow-step"><span>4</span><div><strong>Report & retest</strong><small>Not started</small></div></div></div>
            <a className="text-link" href="#scope">View engagement details <span>→</span></a>
          </section>

          <section className="card scope-card" id="scope">
            <div className="card-heading"><div><p className="eyebrow">SAFETY CHECK</p><h2>Scope health</h2></div><span className="pill pill-blue">All clear</span></div>
            <div className="scope-summary"><div className="scope-ring"><div><strong>100%</strong><small>Confirmed</small></div></div><div><strong>3 assets</strong><p>2 in scope<br />1 excluded</p></div></div>
            <ul className="scope-list"><li><span>✓</span> Written authorization recorded</li><li><span>✓</span> In-scope assets documented</li><li><span>✓</span> Exclusions clearly marked</li></ul>
            <a className="text-link" href="#scope">Review scope <span>→</span></a>
          </section>
        </div>

        <section className="card findings-card" id="findings">
          <div className="card-heading"><div><p className="eyebrow">LATEST ACTIVITY</p><h2>Recent findings</h2></div><a className="button secondary-button" href="#findings">View all findings <span>→</span></a></div>
          <div className="table-wrap"><table><thead><tr><th>FINDING</th><th>ASSET</th><th>SEVERITY</th><th>STATUS</th><th>UPDATED</th><th /></tr></thead><tbody>{findings.map((item, index) => <tr key={item.title}><td><span className={`finding-icon finding-${index}`}>{index === 0 ? "↑" : "◇"}</span><strong>{item.title}</strong></td><td className="muted-cell">{item.asset}</td><td><span className={`severity severity-${item.severity.toLowerCase()}`}>{item.severity}</span></td><td><span className="finding-status"><i className={index === 0 ? "dot-purple" : "dot-gray"} />{item.status}</span></td><td className="muted-cell">{index === 0 ? "2 hours ago" : `${index + 1} days ago`}</td><td className="row-more">···</td></tr>)}</tbody></table></div>
        </section>

        <footer className="footer-note" id="report"><span>◈</span> This workspace does not run scans or exploitation tools. Record authorized, tester-verified assessment results here.</footer>
      </section>
    </main>
  );
}
