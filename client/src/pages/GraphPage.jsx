import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import HeaderSearch from '../components/HeaderSearch.jsx';
import Logo from '../components/Logo.jsx';
import { ProfileIcon } from './HomePage.jsx';
import { FiSidebar } from "react-icons/fi";
import DependencyGraph from '../components/graph/DependencyGraph.jsx';
import GraphTable from '../components/GraphTable.jsx';
import Sidebar from '../components/Sidebar.jsx';
import { fetchPackageGraph, saveGraphRequest } from '../lib/api.js';
import { useAuth } from '../lib/authContext.jsx';
import '../styles/header.css';
import '../styles/graph.css';
import '../styles/sidebar.css';
import '../styles/table.css';

function filterGraph(graph, visibility) {
	const nodes = graph.nodes || [];
	const hiddenEdgeTypes = new Set();

	if (!visibility.showDevDependencies) hiddenEdgeTypes.add('dev');
	if (!visibility.showOptionalDependencies) hiddenEdgeTypes.add('optional');

	const edges = (graph.edges || []).filter((edge) => !hiddenEdgeTypes.has(edge.type));
	const incoming = new Set((graph.edges || []).map((edge) => edge.target));
	const rootIds = nodes.some((node) => node.id === 'root')
		? ['root']
		: nodes.filter((node) => !incoming.has(node.id)).map((node) => node.id);
	const adjacency = new Map();
	const visibleIds = new Set(rootIds.length ? rootIds : nodes.map((node) => node.id));
	const queue = [...visibleIds];

	for (const edge of edges) {
		if (!adjacency.has(edge.source)) adjacency.set(edge.source, []);
		adjacency.get(edge.source).push(edge.target);
	}

	while (queue.length) {
		const currentId = queue.shift();

		for (const nextId of adjacency.get(currentId) || []) {
		if (visibleIds.has(nextId)) continue;
		visibleIds.add(nextId);
		queue.push(nextId);
		}
  	}

  	const visibleNodes = nodes.filter((node) => visibleIds.has(node.id));

	return {
		...graph,
		nodes: visibleNodes,
		edges: edges.filter((edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target))
	};	
}

export default function GraphPage() {
	const navigate = useNavigate();
	const location = useLocation();
	const [searchParams] = useSearchParams();
	const pkgName = searchParams.get('pkg') || '';
	const { user, loading: authLoading } = useAuth();
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [viewMode, setViewMode] = useState('graph'); // 'graph' | 'table'
	const [graph, setGraph] = useState(location.state?.graph || { nodes: [], edges: [], source: null, rootName: pkgName });
	const [selectedNode, setSelectedNode] = useState(null);
	const [showDevDependencies, setShowDevDependencies] = useState(false);
	const [showOptionalDependencies, setShowOptionalDependencies] = useState(false);
	const [showOnlyVulnerable, setShowOnlyVulnerable] = useState(false);
	const [status, setStatus] = useState('');
	const [saving, setSaving] = useState(false);
	const [saveError, setSaveError] = useState('');
	const visibleGraph = useMemo(
		() => filterGraph(graph, { showDevDependencies, showOptionalDependencies }),
		[graph, showDevDependencies, showOptionalDependencies]
	);

	const goHome = useCallback(() => {
		navigate('/');
	}, [navigate]);

	const goToLogin = useCallback(() => {
		navigate('/login');
	}, [navigate]);

	const goToSignup = useCallback(() => {
		navigate('/signup');
	}, [navigate]);

	const goToGraph = useCallback(
		({ graph: nextGraph, pkgName: nextPkgName }) => {
			const nextPkg = nextPkgName.trim();
			if (!nextPkg) return;
			setGraph(nextGraph);
			setSelectedNode(null);
			setStatus('');
			navigate(`/graph?pkg=${encodeURIComponent(nextPkg)}`, { state: { graph: nextGraph } });
		},
		[navigate]
	);

	async function handleSave() {
		if (!user) {
			navigate('/login');
			return;
		}
		if (!graph.nodes?.length) return;

		setSaving(true);
		setSaveError('');
		try {
			await saveGraphRequest(graph);
		} catch (err) {
			setSaveError(err.message);
		} finally {
			setSaving(false);
		}
	}

	useEffect(() => {
		if (!pkgName || location.state?.graph) {
			setStatus(''); // clear any lingering loading text
			return;
		}

		let cancelled = false;
		setStatus(`Loading ${pkgName}...`);

		fetchPackageGraph(pkgName)
			.then((nextGraph) => {
				if (cancelled) return; // prevents old fetch overwriting new graph
				setGraph(nextGraph);
				setSelectedNode(null);
				setStatus('');
			})
			.catch((err) => {
				if (cancelled) return;
				setStatus(err.message);
			});

		return () => { cancelled = true; };
	}, [location.state, pkgName]);

	useEffect(() => {
		if (!selectedNode) return;
		if (visibleGraph.nodes.some((node) => node.id === selectedNode.id)) return;

		setSelectedNode(null);
	}, [selectedNode, visibleGraph]);

	useEffect(() => {
		if (viewMode === 'table') setSidebarOpen(false);
	}, [viewMode]);

	const handleUpload = useCallback((nextGraph) => {
		setGraph(nextGraph);
		setSelectedNode(null);
		setStatus('');
		const name = nextGraph.rootName || 'lockfile';
		navigate(`/graph?pkg=${encodeURIComponent(name)}`, { state: { graph: nextGraph } });
	}, [navigate]);

	return (
		<div className="graph-shell">
		<header className="header">
			<button className="logo-btn" onClick={goHome} aria-label="Go home">
			<Logo size={26} />
			<div className="wordmark">
				<span className="wordmark-dep">dep</span>
				<span className="wordmark-graph">graph</span>
			</div>
			</button>

			<HeaderSearch defaultValue={pkgName} onSearch={goToGraph} onUpload={handleUpload}/>

			<div className="header-right">
				<div className="view-toggle">
				<button className={`view-btn ${viewMode === 'graph' ? 'active' : ''}`} onClick={() => setViewMode('graph')}>graph</button>
				<button className={`view-btn ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')}>table</button>
				</div>

				<button className="btn-save" onClick={handleSave} disabled={saving || !graph.nodes?.length} title={saveError || undefined}>
					{saving ? 'saving…' : 'save'}
				</button>

				{!authLoading && (
					user ? (
					<ProfileIcon name={user.name} />
					) : (
					<>
						<button className="btn btn-ghost" onClick={goToLogin}>log in</button>
						<button className="btn btn-solid" onClick={goToSignup}>sign up</button>
					</>
					)
				)}
				<button
					className={`sidebar-toggle ${sidebarOpen ? 'active' : ''}`}
					onClick={() => setSidebarOpen((value) => !value)}
					disabled={viewMode === 'table'}
					title={viewMode === 'table' ? 'Sidebar is unavailable in table view' : 'Toggle sidebar'}
					aria-label="Toggle sidebar"
				>
					<FiSidebar />
				</button>
			</div>
		</header>

		<div className="graph-page">
			<div className="graph-area">
			{status ? (
				<div className="graph-empty">
				<Logo size={48} />
				<p>{status}</p>
				</div>
			) : viewMode === 'table' ? (
				<GraphTable
				graph={visibleGraph}
				showDevDependencies={showDevDependencies}
				showOptionalDependencies={showOptionalDependencies}
				onToggleDevDependencies={() => setShowDevDependencies((value) => !value)}
				onToggleOptionalDependencies={() => setShowOptionalDependencies((value) => !value)}
				showOnlyVulnerable={showOnlyVulnerable}
				onToggleOnlyVulnerable={() => setShowOnlyVulnerable((value) => !value)}
				/>
			) : (
				<DependencyGraph graph={visibleGraph} selectedNodeId={selectedNode?.id || null} onNodeSelect={setSelectedNode} />
			)}
			</div>

			{viewMode === 'graph' && (
				<Sidebar
				open={sidebarOpen}
				pkgName={pkgName}
				graph={graph}
				selectedNode={selectedNode}
				showDevDependencies={showDevDependencies}
				showOptionalDependencies={showOptionalDependencies}
				onToggleDevDependencies={() => setShowDevDependencies((value) => !value)}
				onToggleOptionalDependencies={() => setShowOptionalDependencies((value) => !value)}
				/>
			)}
		</div>
		</div>
	);
}
