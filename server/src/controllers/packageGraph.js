import axios from "axios";
import semver from "semver";
import { LRUCache } from "lru-cache";

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

const cache = new LRUCache({
    max: 500,
    ttl: 1000 * 60 * 60,
});

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

export const packageVuln = async (packages) => {
    const res = await axios.post('https://api.osv.dev/v1/querybatch', packages, {
        headers: {
            Accept: 'application/json',
	        'Content-Type': 'application/json'
        }
    })
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

    const nodeQueries = []; // for fetching osv data

    const queue = new Queue();

    queue.enqueue({
        name: root,
        range: "latest",
        parent: null,
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

                nodeQueries.push({
                    package: {
                        ecosystem: "npm",
                        name: pkg.name,
                    },
                    version: resolved,
                });

                nodes.push({
                    id,
                    label: id,
                    name: pkg.name,
                    version: resolved,
                    type: "package",
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
                });
            }
        }
    }

    const data = await packageVuln({ queries: nodeQueries });
    for (let i = 0; i < nodes.length; i++) {
        nodes[i].vuln = data.results[i]?.vulns?.length > 0 ? true : false;
    }

    return { nodes, edges };
}

export default buildGraph;

/* 

```Accept: "application/vnd.npm.install-v1+json"```
npm introduced this media type to return a lighter-weight representation optimized for installation. It omits some fields that aren't needed by npm clients.

for reference, https://registry.npmjs.org/express returns 786.69KB of data , same request with the above mentioned accept header returns 331.86KB of data.

initially, it didnt seem like i am using too much memory(i thought the response for every package might be 300-400 KB). for every package request i make, i store it in a Map() so i dont fetch again for already fetched package data.

after few days, i wanted to fetch some open source vulnerability data of the packages. i wanted to check the data returned from osv.dev using postman. then i fetched "next" package GET https://registry.npmjs.org/next for some reason.
the response was HUGE, it was 24 MB. it was huge because it contains: `dist-tags`, all published versions, metadata for each version

initially i didnt notice the size of the data. the issue was that postman didnt format it properly. so i copied it and pasted it in an online json formatter. then my browser crashed and quit, saying out of memory. i tried it again to check whats happening, the moment i pasted it, my system's memory usage jumped from 42% to 93% which again crashed the browser. i didnt know why so asked claude

this is the summary:
Your browser stores strings as UTF-16, so the 24MB JSON immediately doubled to ~48MB in memory just sitting in the textarea. When the formatter ran `JSON.parse()`, it exploded that into a full JavaScript object tree — deeply nested structures like npm packuments expand 5–10x, so you're now at ~200MB. Then the formatter serialized it back to a highlighted, indented string and wrapped every token in a `<span>` for syntax coloring, which can mean millions of DOM nodes at ~300–500 bytes each, pushing total memory consumption to 500MB+. All of these representations (original string, parsed object, formatted string, DOM nodes) exist simultaneously because GC can't free earlier stages while later ones still reference them. Your physical RAM hit its ceiling, the OS either killed the Brave process itself. 
i still need to read about this cuz even if it takes 1gb, the memory usage should not exceed 75% or 80% !?

# so why don't i just fetch `/latest` for every package then ?
> because depGraph isn't trying to show the latest dependencies. it is trying to reconstruct the dependency graph that npm itself would build.

suppose the user enters: next
the latest version may be: 16.2.9

and its `package.json` contains:

{
    "dependencies": {
        "react": "^19.0.0",
        "styled-jsx": "^5.1.6"
    }
}

the issue is that dependencies don't specify exact versions, they specify version ranges
react       ^19.0.0
styled-jsx  ^5.1.6

# why do I need to resolve these ranges?

because a dependency graph is made of concrete package versions, not ranges. a node like: react@^19.0.0 isn't a real package.
The actual installed package might be: react@19.1.1 , so for the range ^19.0.0 --> 19.1.1 is the resolved version. we only run into this issue when a building a graph from packageName rather than parsing a package-lock.json file (npm does the resolution for us)

# why can't `/latest` do that?

suppose React's latest version is: 20.0.0, but the dependency asks for: ^19.0.0, doing GET /react/latest would give: 20.0.0
which does not satisfy the dependency requirement. The package actually needs something like: 19.1.1. so we cannot just do /latest for every package. that's why you fetch the whole package document because it contains doc.versions , which allows:

semver.maxSatisfying(
    Object.keys(doc.versions),
    "^19.0.0"
)
to compute: 19.1.1

> depGraph reconstructs the dependency graph using npm's semver rules. Since dependencies are declared as version ranges rather than exact versions, the application resolves each range to the highest compatible published version before expanding the graph. This ensures that every node represents a concrete package version rather than an abstract version constraint.

then i got to know about public CDNs for npm packages like jsDelivr and UNPKG. they resolve the version for us and send tiny responses. so i will be using jsDelivr. if its down, i will fetch from npm registry. also i will be using LRU cache.

just now tested the public CDNs, they are too slow. getting a response takes 5-7 sec and for high packument size packages like "next", it returns an error message most of the time. guess using npm registry is better and reliable, should be manageable if caching is improved

*/
