# depGraph

See exactly how your npm packages connect to each other.

## What it actually does

Every JavaScript project has a dependency tree: your app depends on packages, those packages depend on other packages, and so on. Most of the time this is invisible, `npm install` just does it silently. depGraph makes that tree visible and clickable, and tells you which packages in it have known security vulnerabilities.

You can either:

* **Search a package by name** (e.g. `express`) and depGraph reconstructs its full dependency tree by resolving versions by doing batched api calls in a breadth first search traversal (BFS)
* **Upload your own `package-lock.json`** and depGraph parses the exact graph npm already resolved for your project.
* Click any node to see its version, whether it's a dev dependency, and whether it has a known vulnerability (with severity and a fixed-version suggestion if one exists).
* Save graphs to your account to come back to later.

## How it actually works

Here's what's actually happening under the hood.

### 1. Building a graph from a package name

If you only type in a package name, depGraph doesn't have a lockfile telling it exact versions. it does a breadth-first search to figure out the tree.

**Requests are batched, not fired one-by-one or all at once.** Each bfs layer is processed in batches of 8 concurrent requests, fast enough to not take forever, but not so aggressive that it hammers the npm registry and get rate-limited.

**Every unique package is only ever fetched and expanded once**, even if 50 different packages in the tree depend on it (this is extremely common, some packages show up everywhere). This is tracked with three separate sets: which nodes have been *added* to the graph, which nodes have already been *expanded* (had their own dependencies queued up), and which *edges* already exist. Without this, the same sub-tree/graph would get re-fetched and re-processed repeatedly, and the graph would balloon into something unusably large.

### 2. Turning version ranges into concrete versions

A package's `package.json` doesn't list exact dependency versions, it lists *ranges*. For example, `next` might declare:

```json
{ "dependencies": { "react": "^19.0.0" } }
```

`^19.0.0` isn't an installable package, it's a rule ("any 19.x.x version is fine"). To build a real graph, every range has to be resolved down to one specific, actually-published version — exactly what `npm install` does behind the scenes.

**The obvious shortcut is to just fetch `/latest` for every package but that doesn't work.** If React's actual latest version is `20.0.0` but the dependency asks for `^19.0.0`, then `20.0.0` doesn't satisfy that range at all. The correct resolved version might be `19.1.1`, which `/latest` would never return.

So instead, depGraph fetches each package's *full* version list and uses `semver.maxSatisfying()` to compute the highest published version that actually satisfies the requested range. This only comes up when resolving from a package name; a `package-lock.json` skips this problem entirely, because npm already did this resolution once and wrote the answer into the file.

### 3. Why it doesn't use jsDelivr/UNPKG, even though they resolve versions for free

Public CDNs like jsDelivr and UNPKG will resolve a version range to a real version for you. but they turned out to be too slow (5-7 second responses) and unreliable for packages with large version histories (`next`, for example, frequently errored out). So depGraph fetches from the npm registry directly and relies on caching instead, which turned out to be the more reliable tradeoff.

### 4. The 24MB response that crashed my browser

While testing using postman, i fetched a single package's *full* registry document (`GET /next`, with every published version and all its metadata) which returned **24MB of JSON**. postman did not format it for me, so pasted that into a browser-based JSON formatter to inspect it. it crashed the browser entirely, spiking system memory from 42% to 93% in seconds.

JSON adds up fast: a 24MB file is already ~48MB as a UTF-16 string, then parsing it into a JS object tree can balloon that 5-10x to ~200MB, and formatting it for syntax highlighting and wrapping every token in its own `<span>` pushes it past 800MB in DOM nodes alone. All of these versions sit in memory simultaneously, since garbage collection can't clear earlier stages while later ones still hold references to them.

This is exactly why depGraph requests npm's lighter `application/vnd.npm.install-v1+json` media type instead of the full document wherever possible, for `express`, this cuts the response from 786KB down to 332KB, and for packages with huge version histories, the savings are far larger. Combined with an LRU cache (so the same package is never re-fetched within an hour), this keeps memory and request volume manageable even for large trees.

### 5. Parsing `package-lock.json`

Lockfiles are more reliable than resolving by name alone, since npm has already done the resolution but we still need to deal with few cases:

* **Nested `node_modules`.** npm doesn't hoist every package to the top level. when two packages need incompatible versions of the same dependency, one gets a nested copy at a different version. To resolve a package's dependency, the parser walks up the nested `node_modules` path until it finds a matching folder.
* **Workspaces.** Monorepo packages don't live under `node_modules` at all. These are detected separately and linked back to the root instead of being treated as regular dependencies.
* **Unmet peer dependencies.** A peer dependency that was never installed still gets a node in the graph, marked visually distinct.

### 6. One consistent graph format, from two very different sources

Whether a graph came from searching a package name (built via BFS + version resolution) or from an uploaded lockfile (parsed directly), the rest of the app shouldn't have to care which one it was. A normalization step takes either source and converts it into one consistent node/edge shape, filtering out invalid edges, deduplicating, and attaching vulnerability data, so the graph rendering and inspection UI only ever has to deal with a single, predictable format.

## Tech Stack

**Frontend:** React (graph rendering handled via XYFlow with automatic layout from ELK.js)

**Backend:** Node.js, Express, MongoDB

## Environment Variables

Create a `.env` file inside `server/`.

```env
PORT
FRONTEND_URL
MONGODB_URI
JWT_SECRET
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_CALLBACK_URL
SMTP_HOST
SMTP_PORT
SMTP_SECURE
SMTP_USER
SMTP_PASS
EMAIL_FROM
```

For a Cloudflare frontend + Heroku backend deployment:

```env
# server/.env on Heroku
FRONTEND_URL=https://your-cloudflare-app.example
GOOGLE_CALLBACK_URL=https://your-heroku-app.example/auth/google/callback

# client/.env.production for the Cloudflare build
VITE_API_BASE_URL=https://your-heroku-app.example
```

The frontend must be built with `VITE_API_BASE_URL` set to the Heroku API URL, and the backend must know the Cloudflare origin through `FRONTEND_URL` so CORS, email links, and auth redirects use the correct hostnames.

## Project Structure

### Frontend (`client/`)

```text
client/src/
├── components/   graph, graphTable, sidebar, search panel components
├── pages/        Route-level pages
├── lib/          API utilities
└── styles/       Global and component styles
```

### Backend (`server/`)

```text
server/src/
├── controllers/  application logic
├── routes/       API endpoints
├── parsers/      Lockfile parsers and dependency extraction
├── models/       MongoDB schemas
├── config/       Database and authentication configuration
└── server.js     Application entry point
```

## Data Sources

* [OSV.dev](https://osv.dev) — vulnerability information
* [npm Registry](https://registry.npmjs.org) — package metadata and dependency information
* [npms.io](https://npms.io) — package quality metrics