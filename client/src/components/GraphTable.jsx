import { useState, useMemo, useCallback, useEffect, Fragment } from 'react';
import { FiChevronDown, FiChevronRight, FiExternalLink } from 'react-icons/fi';
import { HiArrowLongLeft } from "react-icons/hi2";
import '../styles/table.css';

function parseSeverity(vuln) {
    const s = vuln.database_specific?.severity;
    if (s) {
        const norm = s.toLowerCase();
        if (norm === 'moderate') return 'medium';
        if (['critical','high','medium','low'].includes(norm)) return norm;
    }
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

const SEV_ORDER = { critical: 0, high: 1, medium: 2, low: 3, unknown: 4 };

function ExpandedRow({ node }) {
    const [data, setData]   = useState(null);
    const [error, setError] = useState('');
    const [openVuln, setOpenVuln] = useState(null);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const [npmsRes, osvRes] = await Promise.all([
                    fetch(`https://api.npms.io/v2/package/${encodeURIComponent(node.name)}`).then(r => r.json()),
                    fetch('https://api.osv.dev/v1/query', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            package: { ecosystem: 'npm', name: node.name },
                            version: node.version,
                        }),
                    }).then(r => r.json()),
                ]);
                if (cancelled) return;
                const score = npmsRes.score || null;
                const vulns = (osvRes.vulns || []).sort(
                    (a, b) => (SEV_ORDER[parseSeverity(a)] ?? 4) - (SEV_ORDER[parseSeverity(b)] ?? 4)
                );
                setData({ score, vulns });
            } catch {
                if (!cancelled) setError('Failed to load package data.');
            }
        }

        load();
        return () => { cancelled = true; };
    }, [node.name, node.version]);

    if (error) return <div className="gt-expanded-body gt-error">{error}</div>;
    if (!data)  return <div className="gt-expanded-body gt-loading">Loading…</div>;

    const { score, vulns } = data;

    return (
        <div className="gt-expanded-body">
            <div className="score-health">
                <div className="sh-section">
                    <div className="sh-title">Score</div>

                    {score ? (
                        <div className="sh-inline">
                            <span><strong>Overall</strong> {(score.final * 100).toFixed(0)}</span>
                            <span>•</span>

                            <span>Quality {((score.detail?.quality || 0) * 100).toFixed(0)}</span>
                            <span>•</span>

                            <span>Popularity {((score.detail?.popularity || 0) * 100).toFixed(0)}</span>
                            <span>•</span>

                            <span>Maintenance {((score.detail?.maintenance || 0) * 100).toFixed(0)}</span>
                        </div>
                    ) : (
                        <span className="sh-na">—</span>
                    )}
                </div>

                <div className="sh-section">
                    <div className="sh-title">Exposure</div>

                    {vulns.length > 0 ? (
                        <div className="sh-inline">
                            {['critical', 'high', 'medium']
                                .map(sev => ({
                                    sev,
                                    count: vulns.filter(v => parseSeverity(v) === sev).length
                                }))
                                .filter(x => x.count > 0)
                                .map((x, i) => (
                                    <Fragment key={x.sev}>
                                        {i > 0 && <span>•</span>}
                                        <span className={`sh-${x.sev}`}>
                                            {x.sev} {x.count}
                                        </span>
                                    </Fragment>
                                ))}
                        </div>
                    ) : (
                        <span className="sh-na">No known vulnerabilities</span>
                    )}
                </div>
            </div>

            {/* vuln table */}
            {vulns.length > 0 && (
                <div className="vuln-table" style={{ marginTop: 10 }}>
                    <div className="vuln-thead">
                        <span>Severity</span>
                        <span>ID</span>
                        <span>Fixed</span>
                    </div>
                    {vulns.map((v) => {
                        const sev     = (v.severity?.[0]?.type || 'UNKNOWN').toUpperCase();
                        const fixed   = parseFixed(v);
                        const isOpen  = openVuln === v.id;
                        const aliases = v.aliases || [];
                        const refs    = v.references?.slice(0, 3) || [];

                        return (
                            <div className="vuln-row-wrap" key={v.id}>
                                <div
                                    className={`vuln-row ${isOpen ? 'vuln-row-open' : ''}`}
                                    onClick={() => setOpenVuln(isOpen ? null : v.id)}
                                >
                                    <span className={`vuln-sev-cell sev-${parseSeverity(v)}`}>{parseSeverity(v)}</span>
                                    <span className="vuln-id">{v.id}</span>
                                    <span className="vuln-fixed">{fixed || '—'}</span>
                                </div>
                                {isOpen && (
                                    <div className="vuln-detail">
                                        {v.summary && (
                                            <div className="vd-row">
                                                <span className="vd-key">Summary</span>
                                                <span className="vd-val">{v.summary}</span>
                                            </div>
                                        )}
                                        {aliases.length > 0 && (
                                            <div className="vd-row">
                                                <span className="vd-key">Aliases</span>
                                                <span className="vd-val">{aliases.join(', ')}</span>
                                            </div>
                                        )}
                                        {fixed && (
                                            <div className="vd-row">
                                                <span className="vd-key">Fixed in</span>
                                                <span className="vd-val">{fixed}</span>
                                            </div>
                                        )}
                                        {refs.length > 0 && (
                                            <div className="vd-row vd-refs">
                                                <span className="vd-key">Refs</span>
                                                <div className="vd-val">
                                                    {refs.map((r) => (
                                                        <a
                                                            key={r.url}
                                                            href={r.url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="vd-ref-link"
                                                        >
                                                            {r.url}
                                                        </a>
                                                    ))}
                                                </div>
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
    );
}

function buildParentChain(nodeId, edges, nodesById) {
    const parents = [];
    let current = nodeId;

    while (true) {
        const parentEdge = edges.find(e => e.target === current);
        if (!parentEdge) break;
        const parentNode = nodesById.get(parentEdge.source);
        if (!parentNode) break;
        parents.push(parentNode.name + '@' + parentNode.version);
        current = parentEdge.source;
    }

    return parents; // nearest first
}

export default function GraphTable({ graph }) {
    const [expandedId, setExpandedId] = useState(null);

    const { nodes, edges } = graph;

    const nodesById = useMemo(() => {
        const map = new Map();
        for (const n of nodes) map.set(n.id, n);
        return map;
    }, [nodes]);

    const rows = useMemo(() => {
        return nodes.map(node => ({
            node,
            parents: buildParentChain(node.id, edges, nodesById),
        }));
    }, [nodes, edges, nodesById]);

    const toggle = useCallback((id) => {
        setExpandedId(prev => prev === id ? null : id);
    }, []);

    if (!nodes.length) {
        return (
            <div className="gt-empty">No packages to display.</div>
        );
    }

    return (
        <div className="gt-wrap">
            <table className="gt-table">
                <thead>
                    <tr>
                        <th className="gt-th gt-th-expand" />
                        <th className="gt-th">Depth</th>
                        <th className="gt-th">Package</th>
                        <th className="gt-th">Version</th>
                        <th className="gt-th">Parent chain</th>
                        <th className="gt-th">Type</th>
                        <th className="gt-th gt-th-vuln">Vuln</th>
                    </tr>
                </thead>
                {rows.map(({ node, parents }) => {
                    const isOpen = expandedId === node.id;
                    return (
                        <tbody key={node.id} className={isOpen ? 'gt-group-open' : ''}>
                            <tr
                                className={`gt-row ${isOpen ? 'gt-row-open' : ''} ${node.vuln ? 'gt-row-vuln' : ''}`}
                                onClick={() => toggle(node.id)}
                            >
                                <td className="gt-td gt-td-expand">
                                    {isOpen ? <FiChevronDown size={13} /> : <FiChevronRight size={13} />}
                                </td>
                                <td className="gt-td gt-td-depth">{node.depth ?? '—'}</td>
                                <td className="gt-td gt-td-name">
                                    <div className="gt-td-name-inner">
                                        <span className="gt-pkg-name">{node.name}</span>
                                        {node.deprecated && <span className="gt-badge gt-badge-deprecated">deprecated</span>}
                                        <a
                                            href={`https://www.npmjs.com/package/${node.name}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="gt-npm-link"
                                            onClick={e => e.stopPropagation()}
                                        >
                                            <FiExternalLink size={11} />
                                        </a>
                                    </div>
                                </td>
                                <td className="gt-td gt-td-ver">
                                    <span className="gt-version">{node.version ?? '—'}</span>
                                </td>
                                <td className="gt-td gt-td-parents">
                                    {parents.length === 0 ? (
                                        <span className="gt-root-badge">root</span>
                                    ) : (
                                        <span className="gt-parents">
                                            {parents.map((p, i) => (
                                                <span key={i} className="gt-parent-crumb">
                                                    {p}
                                                    {i < parents.length - 1 && (
                                                        <span className="gt-crumb-sep">
                                                            <HiArrowLongLeft size={20} />
                                                        </span>
                                                    )}
                                                </span>
                                            ))}
                                        </span>
                                    )}
                                </td>
                                <td className="gt-td gt-td-type">
                                    <span className={`gt-type-badge gt-type-${node.type}`}>{node.type}</span>
                                </td>
                                <td className="gt-td gt-td-vuln">
                                    {node.vuln
                                        ? <span className="gt-vuln-dot" title="Known vulnerabilities" />
                                        : <span className="gt-vuln-clean">—</span>
                                    }
                                </td>
                            </tr>
                            {isOpen && (
                                <tr className="gt-expanded-row">
                                    <td colSpan={7} className="gt-expanded-cell">
                                        <ExpandedRow node={node} />
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    );
                })}
            </table>
        </div>
    );
}