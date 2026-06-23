function normalizeNode(node, source, requestedRangesByTarget) {
    const type = node.type || (node.id === "root" ? "root" : "package");
    const normalized = {
        id: node.id,
        label: node.label || node.name || node.id,
        name: node.name || node.label || node.id,
        version: node.version || null,
        type,
        source,
        vuln: node.vuln,
        isDev: node.isDev === true,
    };

    if (source === "package-name") {
        normalized.requestedRange =
            node.requestedRange || requestedRangesByTarget.get(node.id) || null;
    }

    return normalized;
}

function normalizeGraph({ nodes = [], edges = [], source, rootName, fileName }) {
    const nodeIds = new Set(nodes.map((node) => node.id));
    const validEdges = edges.filter(
        (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target)
    );
    const connectedNodeIds = new Set();
    const requestedRangesByTarget = new Map();

    for (const edge of validEdges) {
        connectedNodeIds.add(edge.source);
        connectedNodeIds.add(edge.target);

        if (
            source === "package-name" &&
            edge.requestedRange &&
            !requestedRangesByTarget.has(edge.target)
        ) {
            requestedRangesByTarget.set(edge.target, edge.requestedRange);
        }
    }

    const normalizedNodes = nodes
        .filter((node) => {
            if (source !== "lockfile") return true;
            if (node.type !== "peer") return true;

            return connectedNodeIds.has(node.id);
        })
        .map((node) => normalizeNode(node, source, requestedRangesByTarget));

    const normalizedNodeIds = new Set(normalizedNodes.map((node) => node.id));
    const normalizedEdges = validEdges
        .filter(
            (edge) =>
                normalizedNodeIds.has(edge.source) &&
                normalizedNodeIds.has(edge.target)
        )
        .map((edge, index) => ({
            id: edge.id || `${edge.source}->${edge.target}:${index}`,
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
