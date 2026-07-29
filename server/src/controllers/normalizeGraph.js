function normalizeNode(node, source) {
    const type = node.type || (node.id === "root" ? "root" : "package");
    const normalized = {
        id: node.id,
        label: node.label || node.name || node.id,
        name: node.name || node.label || node.id,
        version: node.version || null,
        type,
        source,
        vuln: node.vuln,
        deprecated: node.deprecated || null,
    };

    return normalized;
}

function normalizeGraph({ nodes = [], edges = [], source, rootName, fileName }) {
    const nodeIds = new Set(nodes.map((node) => node.id));
    const validEdges = edges.filter(
        (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target)
    );
    const connectedNodeIds = new Set();
    for (const edge of validEdges) {
        connectedNodeIds.add(edge.source);
        connectedNodeIds.add(edge.target);
    }

    const normalizedNodes = nodes
        .filter((node) => {
            if (source !== "lockfile") return true;
            if (node.type !== "peer") return true;

            return connectedNodeIds.has(node.id);
        })
        .map((node) => normalizeNode(node, source));

    const normalizedNodeIds = new Set(normalizedNodes.map((node) => node.id));
    const normalizedEdges = validEdges
        .filter(
            (edge) =>
                normalizedNodeIds.has(edge.source) &&
                normalizedNodeIds.has(edge.target)
        )
        .map((edge) => ({
            id: edge.id || `${edge.source}->${edge.target}:${edge.type || "dependency"}`,
            source: edge.source,
            target: edge.target,
            type: edge.type || "dependency",
        }));

    const root = normalizedNodes.find((node) => node.id === "root");

    return {
        source,
        rootName: rootName || root?.label || fileName || "root",
        fileName: fileName || null,
        nodes: normalizedNodes,
        edges: normalizedEdges,
    };
}

export default normalizeGraph;
