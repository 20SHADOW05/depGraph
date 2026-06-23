import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchPackageGraph, uploadLockfile } from '../lib/api.js';
import { IoMdSearch } from "react-icons/io";
import { MdOutlineFileUpload } from "react-icons/md";

export default function HeaderSearch({ defaultValue, onSearch, onUpload }) {
  const navigate = useNavigate();
  const [value, setValue] = useState(defaultValue || '');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const fileRef = useRef(null);

  useEffect(() => {
    setValue(defaultValue || '');
  }, [defaultValue]);

  const handleFile = async (event) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file || busy) return;
  
      setBusy(true);
      setStatus(`Parsing ${file.name}...`);
  
      try {
        const graph = await uploadLockfile(file);
        const packageName = graph.rootName || file.name.replace('.json', '');
        navigate(`/graph?pkg=${encodeURIComponent(packageName)}`, { state: { graph } });
        setStatus('');
      } catch (err) {
        setStatus(err.message);
      } finally {
        setBusy(false);
      }
  };

  return (
    <div className="header-search-wrap">
      <div className="header-search">
        <IoMdSearch />
        <input
          placeholder="search package..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return;
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

      <span className="header-search-or">or</span>

      <div>
					<input ref={fileRef} type="file" accept=".json" className="hidden-input" onChange={handleFile} />
					<button className="header-upload-btn" onClick={() => fileRef.current?.click()} disabled={busy}>
						<MdOutlineFileUpload size={20}/>
					</button>
			</div>

			{status && <p className="search-status">{status}</p>}
    </div>
  );
}