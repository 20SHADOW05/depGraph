# depGraph

Visualize npm dependency graphs and inspect package health, versions, and known vulnerabilities.

## Overview

depGraph helps understand how packages relate to each other inside a project.

You can either:

* Search any npm package and explore its dependency tree.
* Upload a `package-lock.json` and visualize the exact dependency graph of your project.
* Inspect package metadata, dependency versions, and known vulnerabilities.
* Save graphs to your account for later access.

### Dependency Graph Visualization

* Interactive dependency graph built with XYFlow.
* Automatic graph layout using ELK.js.
* Zoom, pan, and node inspection.

### Vulnerability Detection

* npm package quality metrics by npms.io
* Vulnerability data powered by OSV.dev.
* Severity classification.
* Vulnerability details and references.
* Fixed-version information when available.


## Tech Stack

### Frontend

* React
* XYFlow, ELK.js

### Backend

* Node.js
* Express
* MongoDB

### Environment Variables

Create a `.env` file inside `server/`.

```env
PORT
FRONTEND_URL
MONGODB_URI
JWT_SECRET
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_CALLBACK_URL
```

## Project Structure

### Frontend (`client/`)

The frontend is a React application responsible for package search, graph visualization, authentication flows, and user interaction.

```text
client/src/
├── components/   graph, graphTable, sidebar, search panel components
├── pages/        Route-level pages
├── lib/          API utilities
└── styles/       Global and component styles
```

### Backend (`server/`)

The backend handles dependency resolution, lockfile parsing, vulnerability aggregation, authentication, and persistence.

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

* OSV.dev — vulnerability information
* npm Registry — package metadata and dependency information
* npms.io — package quality metrics