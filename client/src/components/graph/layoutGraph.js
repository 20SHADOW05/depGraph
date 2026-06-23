import ELK from 'elkjs/lib/elk.bundled.js';

const elk = new ELK();
const MIN_NODE_WIDTH = 190;
const MAX_NODE_WIDTH = 340;
const NODE_HEIGHT = 44;

function getNodeWidth(node) {
  const text = node.name || node.label || node.id;
  return Math.max(MIN_NODE_WIDTH, Math.min(MAX_NODE_WIDTH, text.length * 10 + 44));
}

export async function layoutGraph(graph) {
  const sourcePortId = (nodeId) => `${nodeId}::out`;
  const targetPortId = (nodeId) => `${nodeId}::in`;
  const nodeIds = new Set((graph.nodes || []).map((node) => node.id));
  const validEdges = (graph.edges || []).filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target));

  const elkGraph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'RIGHT',
      'elk.spacing.nodeNode': '74',
      'elk.spacing.edgeNode': '34',
      'elk.spacing.edgeEdge': '24',
      'elk.layered.spacing.edgeNodeBetweenLayers': '44',
      'elk.layered.spacing.edgeEdgeBetweenLayers': '26',
      'elk.layered.spacing.nodeNodeBetweenLayers': '150',
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
      'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
      'elk.edgeRouting': 'SPLINES',
      'elk.portConstraints': 'FIXED_SIDE'
    },
    children: (graph.nodes || []).map((node) => {
      const width = getNodeWidth(node);

      return {
        id: node.id,
        width,
        height: NODE_HEIGHT,
        ports: [
          {
            id: targetPortId(node.id),
            width: 1,
            height: 1,
            properties: {
              'elk.port.side': 'WEST'
            }
          },
          {
            id: sourcePortId(node.id),
            width: 1,
            height: 1,
            properties: {
              'elk.port.side': 'EAST'
            }
          }
        ],
        layoutOptions: {
          'elk.portConstraints': 'FIXED_SIDE'
        }
      };
    }),
    edges: validEdges.map((edge) => ({
      id: edge.id,
      sources: [sourcePortId(edge.source)],
      targets: [targetPortId(edge.target)]
    }))
  };

  const layout = await elk.layout(elkGraph);
  const positions = new Map((layout.children || []).map((node) => [node.id, { x: node.x || 0, y: node.y || 0 }]));

  return {
    nodes: (graph.nodes || []).map((node) => ({
      id: node.id,
      type: 'packageNode',
      position: positions.get(node.id) || { x: 0, y: 0 },
      data: {
        ...node,
        width: getNodeWidth(node)
      },
      draggable: false
    })),
    edges: validEdges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: 'dependencyEdge',
      data: edge,
      markerEnd: {
        type: 'arrowclosed',
        width: 16,
        height: 16,
        color: 'rgba(148, 163, 184, 0.72)'
      }
    }))
  };
}

export function getConnectedPathIds(graph, selectedNodeId) {
  if (!selectedNodeId) {
    return { nodeRoles: new Map(), edgeRoles: new Map() };
  }

  const parents = new Map();
  const children = new Map();

  for (const edge of graph.edges) {
    if (!parents.has(edge.target)) parents.set(edge.target, []);
    parents.get(edge.target).push(edge);

    if (!children.has(edge.source)) children.set(edge.source, []);
    children.get(edge.source).push(edge);
  }

  const nodeRoles = new Map([[selectedNodeId, 'selected-path']]);
  const edgeRoles = new Map();

  // immediate parents
  for (const edge of parents.get(selectedNodeId) || []) {
    edgeRoles.set(edge.id, 'ancestor-path');
    nodeRoles.set(edge.source, 'ancestor-path');
  }

  // immediate children
  for (const edge of children.get(selectedNodeId) || []) {
    edgeRoles.set(edge.id, 'dependency-path');
    nodeRoles.set(edge.target, 'dependency-path');
  }

  return { nodeRoles, edgeRoles };
}
