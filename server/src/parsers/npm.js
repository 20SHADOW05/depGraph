const parse_npm = (fileContent) => {
    let parsedFile;

    try {
        parsedFile = JSON.parse(fileContent);
    } catch {
        throw new Error("Invalid JSON in package-lock.json");
    }

    if (!parsedFile.packages || typeof parsedFile.packages !== "object") {
        throw new Error(
            'Unsupported lockfile format: missing "packages" field (requires lockfileVersion 2 or 3)'
        );
    }

    const deps = parsedFile.packages;
    const allPaths = new Set(Object.keys(deps));

    const nodesMap = {};
    const edges = [];
    const edgesSet = new Set();

    const addNode = (id, data) => {
        if (!nodesMap[id]) nodesMap[id] = data;
    };

    const addEdge = (source, target, type) => {
        if (!nodesMap[source] || !nodesMap[target]) return;

        const key = `${source}->${target}:${type}`;
        if (edgesSet.has(key)) return;

        edgesSet.add(key);
        edges.push({ source, target, type });
    };

    const resolveDep = (fromPath, depName) => {
        let current = fromPath || "";

        while (true) {
            const candidate = current
                ? `${current}/node_modules/${depName}`
                : `node_modules/${depName}`;

            if (allPaths.has(candidate)) return candidate;

            const idx = current.lastIndexOf("/node_modules/");
            if (idx === -1) break;

            current = current.slice(0, idx);
        }

        const root = `node_modules/${depName}`;
        return allPaths.has(root) ? root : null;
    };

    const isWorkspace = (path, data) =>
        path !== "" &&
        !path.startsWith("node_modules/") &&
        data?.link !== true &&
        data?.name &&
        data?.version;

    // ---- PASS 1: CREATE NODES ----
    for (const [path, data] of Object.entries(deps)) {
        if (path === "") {
            addNode("root", {
                id: "root",
                label: parsedFile.name || data.name || "root",
                name: parsedFile.name || data.name || "root",
                type: "root",
            });
            continue;
        }

        if (isWorkspace(path, data)) {
            addNode(path, {
                id: path,
                label: `${data.name}@${data.version}`,
                name: data.name,
                version: data.version,
                type: "workspace",
            });
            continue;
        }

        if (path.startsWith("node_modules/") && data?.link) {
            continue;
        }

        if (!data?.version) continue;

        const name = data.name || path.split("node_modules/").pop();

        addNode(path, {
            id: path,
            label: `${name}@${data.version}`,
            name,
            version: data.version,
            isDev: data.dev === true,
            type: "package",
        });
    }

    // ---- PASS 1.5: CONNECT ROOT TO WORKSPACE LINKS ----
    for (const [path, data] of Object.entries(deps)) {
        if (
            path.startsWith("node_modules/") &&
            data?.link === true &&
            data?.resolved &&
            deps[data.resolved]
        ) {
            addEdge("root", data.resolved, "workspace");
        }
    }

    // ---- PASS 2: CREATE DEPENDENCY EDGES ----
    const depTypes = [
        ["dependencies", "prod"],
        ["devDependencies", "dev"],
        ["peerDependencies", "peer"],
        ["optionalDependencies", "optional"],
    ];

    for (const [path, data] of Object.entries(deps)) {
        const sourceId = path === "" ? "root" : path;

        if (!nodesMap[sourceId]) continue;

        for (const [field, type] of depTypes) {
            for (const depName of Object.keys(data[field] || {})) {
                let resolved = resolveDep(path, depName);

                if (resolved) {
                    const resolvedData = deps[resolved];

                    if (
                        resolvedData?.link === true &&
                        resolvedData?.resolved &&
                        deps[resolvedData.resolved]
                    ) {
                        resolved = resolvedData.resolved;
                    }
                }

                if (!resolved && type === "peer") {
                    const peerId = `peer:${depName}`;

                    addNode(peerId, {
                        id: peerId,
                        label: `${depName} (peer)`,
                        name: depName,
                        type: "peer",
                    });

                    addEdge(sourceId, peerId, type);
                    continue;
                }

                if (!resolved) continue;

                addEdge(sourceId, resolved, type);
            }
        }
    }

    return {
        nodes: Object.values(nodesMap),
        edges,
    };
};

export default parse_npm;
