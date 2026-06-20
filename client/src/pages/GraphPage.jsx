import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import HeaderSearch from '../components/HeaderSearch.jsx';
import Logo from '../components/Logo.jsx';
import { ProfileIcon } from './HomePage.jsx';
import { FiSidebar } from "react-icons/fi";
import DependencyGraph from '../components/graph/DependencyGraph.jsx';
import Sidebar from '../components/sidebar/Sidebar.jsx';
import { fetchPackageGraph } from '../lib/api.js';
import { userCheck } from '../lib/api.js';
import '../styles/header.css';
import '../styles/graph.css';
import '../styles/sidebar.css';
import '../styles/profile.css';

function filterGraph(graph, visibility) {
	const nodes = graph.nodes || [];
	const hiddenEdgeTypes = new Set();

	if (!visibility.showDevDependencies) hiddenEdgeTypes.add('dev');
	if (!visibility.showOptionalDependencies) hiddenEdgeTypes.add('optional');

	const edges = (graph.edges || []).filter((edge) => !hiddenEdgeTypes.has(edge.type));
	const incoming = new Set(edges.map((edge) => edge.target));
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
	const { user, loading: authLoading } = userCheck();
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [graph, setGraph] = useState(location.state?.graph || { nodes: [], edges: [], source: null, rootName: pkgName });
	const [selectedNode, setSelectedNode] = useState(null);
	const [showDevDependencies, setShowDevDependencies] = useState(false);
	const [showOptionalDependencies, setShowOptionalDependencies] = useState(false);
	const [status, setStatus] = useState('');
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
		navigate(`/graph?pkg=${encodeURIComponent(nextPkg)}`, { state: { graph: nextGraph } });
		},
		[navigate]
	);

	useEffect(() => {
		if (!pkgName || location.state?.graph) return;

		setStatus(`Loading ${pkgName}...`);
		fetchPackageGraph(pkgName)
		.then((nextGraph) => {
			setGraph(nextGraph);
			setSelectedNode(null);
			setStatus('');
		})
		.catch((err) => setStatus(err.message));
	}, [location.state, pkgName]);

	useEffect(() => {
		if (!selectedNode) return;
		if (visibleGraph.nodes.some((node) => node.id === selectedNode.id)) return;

		setSelectedNode(null);
	}, [selectedNode, visibleGraph]);

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

			<HeaderSearch defaultValue={pkgName} onSearch={goToGraph} />

			<div className="header-right">
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
				title="Toggle sidebar"
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
			) : (
				<DependencyGraph graph={visibleGraph} selectedNodeId={selectedNode?.id || null} onNodeSelect={setSelectedNode} />
			)}
			</div>

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
		</div>
		</div>
	);
}