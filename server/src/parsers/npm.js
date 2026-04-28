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

  // Node-style resolution (supports root + nested)
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

  // Better workspace detection
  const isWorkspace = (path, data) =>
    path !== "" &&
    !path.startsWith("node_modules/") &&
    (data?.name || data?.version);

  const nodesMap = {};
  const edges = [];
  const edgesSet = new Set();

  const addNode = (id, data) => {
    if (!nodesMap[id]) nodesMap[id] = data;
  };

  // ---- PASS 1: CREATE NODES ----
  for (const [path, data] of Object.entries(deps)) {
    // Root
    if (path === "") {
      addNode("root", {
        id: "root",
        label: parsedFile.name || "root",
        type: "root"
      });
      continue;
    }

    // Workspace packages
    if (isWorkspace(path, data)) {
      const label =
        data?.name && data?.version
          ? `${data.name}@${data.version}`
          : data?.name || path;

      addNode(path, {
        id: path,
        label,
        name: data?.name,
        version: data?.version,
        type: "workspace"
      });
      continue;
    }

    // Skip symlink entries (node_modules links to workspaces)
    if (path.startsWith("node_modules/") && data?.link) continue;

    if (!data?.version) continue;

    const name = path.split("node_modules/").pop();

    addNode(path, {
      id: path,
      label: `${name}@${data.version}`,
      name,
      version: data.version,
      isDev: data.dev === true,
      type: "package"
    });
  }

  // ---- PASS 2: CREATE EDGES ----
  const depTypes = [
    ["dependencies", "prod"],
    ["devDependencies", "dev"],
    ["peerDependencies", "peer"]
  ];

  for (const [path, data] of Object.entries(deps)) {
    const sourceId = path === "" ? "root" : path;

    for (const [field, type] of depTypes) {
      for (const depName of Object.keys(data[field] || {})) {
        let resolved = resolveDep(path, depName);

        // Redirect workspace links
        if (resolved) {
          const resolvedData = deps[resolved];
          if (resolvedData?.link && resolvedData?.resolved) {
            resolved = resolvedData.resolved;
          }
        }

        // Peer fallback (not installed)
        if (!resolved && type === "peer") {
          const peerId = `peer:${depName}`;

          addNode(peerId, {
            id: peerId,
            label: `${depName} (peer)`,
            type: "peer"
          });

          const key = `${sourceId}->${peerId}:${type}`;
          if (!edgesSet.has(key)) {
            edgesSet.add(key);
            edges.push({
              source: sourceId,
              target: peerId,
              type
            });
          }
          continue;
        }

        if (!resolved) continue;

        const key = `${sourceId}->${resolved}:${type}`;
        if (edgesSet.has(key)) continue;

        edgesSet.add(key);

        edges.push({
          source: sourceId,
          target: resolved,
          type
        });
      }
    }
  }

  return {
    nodes: Object.values(nodesMap),
    edges
  };
};

export default parse_npm;