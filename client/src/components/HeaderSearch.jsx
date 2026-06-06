import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchPackageGraph } from '../lib/api.js';
import { IoMdSearch } from "react-icons/io";

export default function HeaderSearch({ defaultValue, onSearch }) {
  const navigate = useNavigate();
  const [value, setValue] = useState(defaultValue || '');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setValue(defaultValue || '');
  }, [defaultValue]);

  return (
    <div className="header-search">
      <IoMdSearch />
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
