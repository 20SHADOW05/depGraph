import { useState, useEffect } from 'react';
import Toggle from './Toggle.jsx';

async function fetchNpmScore(name) {
    const res = await fetch(`https://api.npms.io/v2/package/${encodeURIComponent(name)}`);
    if (!res.ok) return null;
    const data = await res.json();
    const s = data.score?.detail;
    if (!s) return null;
    return {
        overall:     Math.round((data.score.final      || 0) * 100),
        quality:     Math.round((s.quality             || 0) * 100),
        popularity:  Math.round((s.popularity          || 0) * 100),
        maintenance: Math.round((s.maintenance         || 0) * 100),
    };
}

async function fetchVulns(name, version) {
    const res = await fetch('https://api.osv.dev/v1/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version, package: { name, ecosystem: 'npm' } }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.vulns || [];
}

function parseSeverity(vuln) {
    const s = vuln.database_specific?.severity;
    if (s) {
        const norm = s.toLowerCase();
        if (norm === 'moderate') return 'medium';
        if (norm === 'critical' || norm === 'high' || norm === 'medium' || norm === 'low') return norm;
    }
    const cvss = vuln.severity?.[0]?.score || '';
    if (!cvss) return 'unknown';
    // CVSS:3.1/AV:N/... — extract base score from the vector
    const base = vuln.severity?.[0]?.score?.match(/(\d+\.\d+)$/)?.[1];
    const score = parseFloat(base || 0);
    if (score >= 9) return 'critical';
    if (score >= 7) return 'high';
    if (score >= 4) return 'medium';
    return 'low';
}

function parseFixed(vuln) {
    for (const affected of vuln.affected || []) {
        for (const range of affected.ranges || []) {
            for (const ev of range.events || []) {
                if (ev.fixed) return ev.fixed;
            }
        }
    }
    return '—';
}

function parseAffected(vuln) {
    for (const affected of vuln.affected || []) {
        for (const range of affected.ranges || []) {
            const intro = range.events?.find(e => e.introduced)?.introduced;
            const fixed = range.events?.find(e => e.fixed)?.fixed;
            if (intro || fixed) {
                return `${intro || '0'} to ${fixed ? `< ${fixed}` : 'unfixed'}`;
            }
        }
    }
    return '—';
}

const SEV_ORDER = { critical: 0, high: 1, medium: 2, low: 3, unknown: 4 };

function healthFromVulns(vulns) {
    const h = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const v of vulns) {
        const s = parseSeverity(v);
        if (s in h) h[s]++;
    }
    return h;
}

export default function Sidebar({
    open,
    pkgName,
    graph,
    selectedNode,
    showDevDependencies,
    showOptionalDependencies,
    onToggleDevDependencies,
    onToggleOptionalDependencies,
}) {
    const packageName = selectedNode?.name || graph?.rootName || pkgName || null;
    const version     = selectedNode?.version || null;
    const nodeType    = selectedNode?.type || (graph?.source === 'lockfile' ? 'root' : 'package');
    const packageUrl  = selectedNode?.name
        ? `https://www.npmjs.com/package/${selectedNode.name}`
        : null;
    const isLockfile  = graph?.source === 'lockfile';

    const [score,      setScore]      = useState(null);
    const [health,     setHealth]     = useState(null);
    const [vulns,      setVulns]      = useState([]);
    const [loading,    setLoading]    = useState(false);
    const [expandedId, setExpandedId] = useState(null);

    useEffect(() => {
        if (!open || !selectedNode?.name || !selectedNode?.version) return;

        let cancelled = false;
        setScore(null);
        setHealth(null);
        setVulns([]);
        setExpandedId(null);
        setLoading(true);

        Promise.all([
            fetchNpmScore(selectedNode.name),
            fetchVulns(selectedNode.name, selectedNode.version),
        ]).then(([sc, vl]) => {
            if (cancelled) return;
            setScore(sc);
            setVulns(vl);
            setHealth(healthFromVulns(vl));
            setLoading(false);
        }).catch(() => {
            if (!cancelled) setLoading(false);
        });

        return () => { cancelled = true; };
    }, [open, selectedNode?.name, selectedNode?.version]);

    const sortedVulns = [...vulns].sort(
        (a, b) => (SEV_ORDER[parseSeverity(a)] ?? 4) - (SEV_ORDER[parseSeverity(b)] ?? 4)
    );

    return (
        <aside className={`sidebar ${open ? '' : 'closed'}`}>
            <div className="sidebar-inner">

                {/* ── package header ── */}
                <div className="sidebar-section">
                    <div className="section-label">Selected package</div>
                    {packageName ? (
                        <>
                            <div className="pkg-name">
                                {packageName}
                                {packageUrl && (
                                    <a href={packageUrl} target="_blank" rel="noreferrer" className="pkg-link">
                                        npm
                                    </a>
                                )}
                            </div>
                            <div className="pkg-meta">
                                {version && <span className="badge badge-ver">{version}</span>}
                                <span className="badge badge-npm">npm</span>
                                <span className="badge badge-eco">{nodeType}</span>
                            </div>
                        </>
                    ) : (
                        <div className="pkg-empty">Click a node to inspect it</div>
                    )}
                </div>

                {/* ── toggles ── */}
                <div className="sidebar-section">
                    <div className="toggle-row">
                        <span className="toggle-label">Show dev dependencies</span>
                        <Toggle on={showDevDependencies} onClick={onToggleDevDependencies} />
                    </div>
                    <div className="toggle-row">
                        <span className="toggle-label">Show optional dependencies</span>
                        <Toggle on={showOptionalDependencies} onClick={onToggleOptionalDependencies} />
                    </div>
                    {!isLockfile && (
                        <div className="toggle-note">
                            Only available when a package-lock.json is uploaded
                        </div>
                    )}
                </div>

                {/* ── score + health ── */}
                {packageName && (
                    <div className="sidebar-section">
                        <div className="section-label">Score &amp; Exposure</div>
                        {loading ? (
                            <div className="sb-loading">Fetching…</div>
                        ) : (
                            <div className="score-health-grid">
                                {/* npm score */}
                                <div className="sh-col">
                                    <div className="sh-col-head">NPM Score</div>
                                    {score ? (
                                        <>
                                            <div className="sh-row">
                                                <span className="sh-key">Overall</span>
                                                <span className="sh-val sh-overall">{score.overall}</span>
                                            </div>
                                            <div className="sh-row">
                                                <span className="sh-key">Quality</span>
                                                <span className="sh-val">{score.quality}</span>
                                            </div>
                                            <div className="sh-row">
                                                <span className="sh-key">Popularity</span>
                                                <span className="sh-val">{score.popularity}</span>
                                            </div>
                                            <div className="sh-row">
                                                <span className="sh-key">Maintenance</span>
                                                <span className="sh-val">{score.maintenance}</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="sh-na">N/A</div>
                                    )}
                                </div>

                                <div className="sh-divider" />

                                {/* health */}
                                <div className="sh-col">
                                    <div className="sh-col-head">Exposure</div>
                                    {health ? (
                                        <>
                                            <div className="sh-row">
                                                <span className="sh-key">Critical</span>
                                                <span className={`sh-val ${health.critical > 0 ? 'sh-critical' : ''}`}>{health.critical}</span>
                                            </div>
                                            <div className="sh-row">
                                                <span className="sh-key">High</span>
                                                <span className={`sh-val ${health.high > 0 ? 'sh-high' : ''}`}>{health.high}</span>
                                            </div>
                                            <div className="sh-row">
                                                <span className="sh-key">Medium</span>
                                                <span className={`sh-val ${health.medium > 0 ? 'sh-medium' : ''}`}>{health.medium}</span>
                                            </div>
                                            <div className="sh-row">
                                                <span className="sh-key">Low</span>
                                                <span className="sh-val">{health.low}</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="sh-na">N/A</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── vulnerabilities ── */}
                {packageName && !loading && (
                    <div className="sidebar-section">
                        <div className="section-label">
                            Vulnerabilities
                            {vulns.length > 0 && (
                                <span className="vuln-count">{vulns.length}</span>
                            )}
                        </div>

                        {sortedVulns.length === 0 ? (
                            <div className="vuln-none">No known vulnerabilities found</div>
                        ) : (
                            <div className="vuln-table">
                                <div className="vuln-thead">
                                    <span>Severity</span>
                                    <span>ID</span>
                                    <span>Fixed</span>
                                </div>
                                {sortedVulns.map((v) => {
                                    const sev     = parseSeverity(v);
                                    const fixed   = parseFixed(v);
                                    const isOpen  = expandedId === v.id;
                                    return (
                                        <div key={v.id} className="vuln-row-wrap">
                                            <div
                                                className={`vuln-row ${isOpen ? 'vuln-row-open' : ''}`}
                                                onClick={() => setExpandedId(isOpen ? null : v.id)}
                                            >
                                                <span className={`vuln-sev-cell sev-${sev}`}>{sev}</span>
                                                <span className="vuln-id">{v.id}</span>
                                                <span className="vuln-fixed">{fixed}</span>
                                            </div>
                                            {isOpen && (
                                                <div className="vuln-detail">
                                                    {v.summary && (
                                                        <div className="vd-row">
                                                            <span className="vd-key">Summary</span>
                                                            <span className="vd-val">{v.summary}</span>
                                                        </div>
                                                    )}
                                                    <div className="vd-row">
                                                        <span className="vd-key">Affected</span>
                                                        <span className="vd-val">{parseAffected(v)}</span>
                                                    </div>
                                                    <div className="vd-row">
                                                        <span className="vd-key">Fixed</span>
                                                        <span className="vd-val">{fixed}</span>
                                                    </div>
                                                    {v.published && (
                                                        <div className="vd-row">
                                                            <span className="vd-key">Published</span>
                                                            <span className="vd-val">{v.published.slice(0, 10)}</span>
                                                        </div>
                                                    )}
                                                    {v.references?.length > 0 && (
                                                        <div className="vd-row vd-refs">
                                                            <span className="vd-key">References</span>
                                                            <span className="vd-val">
                                                                {v.references.slice(0, 3).map((r) => (
                                                                    <a key={r.url} href={r.url} target="_blank" rel="noreferrer" className="vd-ref-link">
                                                                        {r.type || 'Link'}
                                                                    </a>
                                                                ))}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

            </div>
        </aside>
    );
}