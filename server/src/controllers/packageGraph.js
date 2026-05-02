import axios from "axios";
import semver from "semver";

class Queue {
    constructor() {
        this.items = {};
        this.head = 0;
        this.tail = 0;
    }

    enqueue(value) {
        this.items[this.tail++] = value;
    }

    dequeue() {
        if (this.isEmpty()) return null;

        const value = this.items[this.head];
        delete this.items[this.head++];

        return value;
    }

    isEmpty() {
        return this.head === this.tail;
    }
}

const cache = new Map();

async function fetchPackageDoc(name) {
    if (cache.has(name)) return cache.get(name);

    const res = await axios.get(
        `https://registry.npmjs.org/${encodeURIComponent(name)}`,
        {
            headers: {
                Accept: "application/vnd.npm.install-v1+json",
            },
        }
    );

    cache.set(name, res.data);
    return res.data;
}

function resolveVersion(doc, range) {
    if (doc["dist-tags"]?.[range]) return doc["dist-tags"][range];

    if (doc.versions?.[range]) return range;

    return semver.maxSatisfying(Object.keys(doc.versions || {}), range);
}

async function buildGraph(root) {
    const nodes = [];
    const edges = [];

    const addedNodes = new Set();
    const expandedNodes = new Set();
    const addedEdges = new Set();

    const queue = new Queue();

    queue.enqueue({
        name: root,
        range: "latest",
        parent: null,
        depth: 0,
    });

    const BATCH_SIZE = 8;

    while (!queue.isEmpty()) {
        const batch = [];

        while (!queue.isEmpty() && batch.length < BATCH_SIZE) {
            batch.push(queue.dequeue());
        }

        const results = await Promise.all(
            batch.map(async (item) => {
                try {
                    const doc = await fetchPackageDoc(item.name);
                    const resolved = resolveVersion(doc, item.range);

                    if (!resolved) return null;

                    const pkg = doc.versions?.[resolved];

                    if (!pkg) return null;

                    return { item, pkg, resolved };
                } catch {
                    return null;
                }
            })
        );

        for (const result of results) {
            if (!result) continue;

            const { item, pkg, resolved } = result;
            const id = `${pkg.name}@${resolved}`;

            if (!addedNodes.has(id)) {
                addedNodes.add(id);

                nodes.push({
                    id,
                    label: id,
                    name: pkg.name,
                    version: resolved,
                    type: "package",
                    depth: item.depth,
                    requestedRange: item.parent ? item.range : null,
                    source: "package-name",
                    deprecated: pkg.deprecated || null,
                });
            }

            if (item.parent) {
                const edgeId = `${item.parent}->${id}:${item.range}`;

                if (!addedEdges.has(edgeId)) {
                    addedEdges.add(edgeId);

                    edges.push({
                        source: item.parent,
                        target: id,
                        requestedRange: item.range,
                    });
                }
            }

            if (expandedNodes.has(id)) continue;
            expandedNodes.add(id);

            for (const [depName, depRange] of Object.entries(
                pkg.dependencies || {}
            )) {
                queue.enqueue({
                    name: depName,
                    range: depRange,
                    parent: id,
                    depth: item.depth + 1,
                });
            }
        }
    }

    return { nodes, edges };
}

export default buildGraph;
