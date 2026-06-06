import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchPackageGraph, uploadLockfile } from '../lib/api.js';
import { MdOutlineFileUpload } from "react-icons/md";
import { IoMdSearch } from "react-icons/io";

const hints = ['react', 'lodash', 'express', 'next', 'axios'];

export default function SearchPanel() {
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
			navigate(`/graph?pkg=${encodeURIComponent(packageName)}`, { state: { graph } });
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
			navigate(`/graph?pkg=${encodeURIComponent(packageName)}`, { state: { graph } });
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
					<IoMdSearch />
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
						<MdOutlineFileUpload />
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
