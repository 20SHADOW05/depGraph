import { useEffect, useMemo, useState } from 'react';
import {
  Background,
  Controls,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  useEdgesState,
  useNodesState
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import DependencyEdge from './DependencyEdge.jsx';
import PackageNode from './PackageNode.jsx';
import { getConnectedPathIds, layoutGraph } from './layoutGraph.js';

const nodeTypes = { packageNode: PackageNode };
const edgeTypes = { dependencyEdge: DependencyEdge };

function FlowCanvas({ graph, selectedNodeId, onNodeSelect }) {
  const { fitView } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [layoutReady, setLayoutReady] = useState(false);
  const highlighted = useMemo(() => getConnectedPathIds(graph, selectedNodeId), [graph, selectedNodeId]);

  useEffect(() => {
    let cancelled = false;
    setLayoutReady(false);

    layoutGraph(graph).then((layouted) => {
      if (cancelled) return;
      setNodes(layouted.nodes);
      setEdges(layouted.edges);
      setLayoutReady(true);
      window.requestAnimationFrame(() => {
        fitView({
          padding: graph.nodes.length > 40 ? 0.04 : 0.1,
          duration: 500,
          maxZoom: graph.nodes.length > 40 ? 1.15 : 1.5
        });
      });
    });

    return () => {
      cancelled = true;
    };
  }, [graph, setEdges, setNodes]);

  useEffect(() => {
    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        const role = highlighted.nodeRoles.get(node.id) || '';

        return {
          ...node,
          selected: node.id === selectedNodeId,
          data: {
            ...node.data,
            pathRole: role,
            dimmed: selectedNodeId ? !role : false
          }
        };
      })
    );

    setEdges((currentEdges) =>
      currentEdges.map((edge) => {
        const role = highlighted.edgeRoles.get(edge.id) || '';

        return {
          ...edge,
          zIndex: role ? 20 : 0,
          data: {
            ...edge.data,
            pathRole: role,
            dimmed: selectedNodeId ? !role : false
          },
          markerEnd: {
            ...edge.markerEnd,
            color: role === 'dependency-path' ? '#f59e0b' : role === 'ancestor-path' ? '#60a5fa' : 'rgba(148, 163, 184, 0.72)'
          }
        };
      })
    );
  }, [highlighted, selectedNodeId, setEdges, setNodes]);

  if (!graph.nodes.length) {
    return <div className="graph-empty-message">Search for a package or upload package-lock.json to draw the graph.</div>;
  }

  if (!layoutReady) {
    return <div className="graph-empty-message">Laying out dependency graph...</div>;
  }

  return (
    <div className="graph-flow">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(_, node) => onNodeSelect(node.data)}
        onPaneClick={() => onNodeSelect(null)}
        fitView
        fitViewOptions={{
          padding: graph.nodes.length > 40 ? 0.04 : 0.1,
          maxZoom: graph.nodes.length > 40 ? 1.15 : 1.5
        }}
        minZoom={0.1}
        maxZoom={2.5}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
      >
        <Background color="rgba(148, 163, 184, 0.12)" gap={24} />
        <Controls showInteractive={false} fitViewOptions={{ padding: 0.12, duration: 400 }} />
        <Panel position="bottom-left" className="graph-legend" aria-label="Package type legend">
          <span className="graph-legend-title">Package types</span>
          <span className="graph-legend-item"><i className="graph-legend-swatch root" />Root</span>
          <span className="graph-legend-item"><i className="graph-legend-swatch workspace" />Workspace</span>
          <span className="graph-legend-item"><i className="graph-legend-swatch package" />Package</span>
          <span className="graph-legend-item"><i className="graph-legend-swatch peer" />Peer</span>
        </Panel>
      </ReactFlow>
    </div>
  );
}

export default function DependencyGraph(props) {
  return (
    <ReactFlowProvider>
      <FlowCanvas {...props} />
    </ReactFlowProvider>
  );
}
