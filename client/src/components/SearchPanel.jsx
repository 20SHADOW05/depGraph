import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchPackageGraph, uploadLockfile } from '../lib/api.js';

const hints = ['react', 'lodash', 'express', 'next', 'axios'];

export default function SearchPanel({ onSearch }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const fileRef = useRef(null);

  const doSearch = async (value) => {
    const packageName = (value || query).trim();
    if (!packageName || busy) return;

    setBusy(true);
    setStatus(`Loading ${packageName}...`);

    try {
      const graph = await fetchPackageGraph(packageName);
      setStatus('');
      if (onSearch) {
        onSearch({ graph, pkgName: packageName });
      } else {
        navigate(`/graph?pkg=${encodeURIComponent(packageName)}`, { state: { graph } });
      }
    } catch (err) {
      setStatus(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || busy) return;

    setBusy(true);
    setStatus(`Parsing ${file.name}...`);

    try {
      const graph = await uploadLockfile(file);
      const packageName = graph.rootName || file.name.replace('.json', '');
      if (onSearch) {
        onSearch({ graph, pkgName: packageName });
      } else {
        navigate(`/graph?pkg=${encodeURIComponent(packageName)}`, { state: { graph } });
      }
      setStatus('');
    } catch (err) {
      setStatus(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="landing-card">
        <div className="search-row">
          <span className="search-icon" aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5" />
              <line x1="10" y1="10" x2="14" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>
          <input
            className="search-input"
            placeholder="package name, e.g. express"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && doSearch()}
            autoFocus
          />
          <button className="search-btn" onClick={() => doSearch()} disabled={busy}>
            {busy ? 'loading...' : 'explore ->'}
          </button>
        </div>

        <div className="search-divider">or</div>

        <div className="upload-wrap">
          <input ref={fileRef} type="file" accept=".json" className="hidden-input" onChange={handleFile} />
          <button className="upload-btn" onClick={() => fileRef.current?.click()} disabled={busy}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M8 2v8M5 5l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 11v2a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            upload package-lock.json
          </button>
        </div>

        {status && <p className="search-status">{status}</p>}
      </div>

      <div className="hint-chips">
        {hints.map((hint) => (
          <button key={hint} className="hint-chip" onClick={() => doSearch(hint)}>
            {hint}
          </button>
        ))}
      </div>
    </>
  );
}
