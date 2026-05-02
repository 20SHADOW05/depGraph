import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchPackageGraph } from '../lib/api.js';

export default function HeaderSearch({ defaultValue, onSearch }) {
  const navigate = useNavigate();
  const [value, setValue] = useState(defaultValue || '');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setValue(defaultValue || '');
  }, [defaultValue]);

  return (
    <div className="header-search">
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5" />
        <line x1="10" y1="10" x2="14" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <input
        placeholder="search package..."
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== 'Enter') return;

          const pkgName = value.trim();
          if (!pkgName || busy) return;

          setBusy(true);
          fetchPackageGraph(pkgName)
            .then((graph) => {
              if (onSearch) {
                onSearch({ graph, pkgName });
              } else {
                navigate(`/graph?pkg=${encodeURIComponent(pkgName)}`, { state: { graph } });
              }
            })
            .finally(() => setBusy(false));
        }}
      />
    </div>
  );
}
