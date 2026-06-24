# depGraph

Visualize npm dependency graphs and inspect package health, versions, and known vulnerabilities.

## Overview

depGraph helps understand how packages relate to each other inside a project.

You can either:

* Search any npm package and explore its dependency tree.
* Upload a `package-lock.json` and visualize the exact dependency graph of your project.
* Inspect package metadata, dependency versions, and known vulnerabilities.
* Save graphs to your account for later access.

## Features

### Dependency Graph Visualization

* Interactive dependency graph built with XYFlow.
* Automatic graph layout using ELK.js.
* Zoom, pan, and node inspection.

### Package Analysis

* Dependency relationships.
* Package versions.
* Package metadata from npm.
* npm package quality metrics.

### Vulnerability Detection

* Vulnerability data powered by OSV.dev.
* Severity classification.
* Vulnerability details and references.
* Fixed-version information when available.

### Authentication

* Email and password authentication.
* Google OAuth login.
* JWT-based sessions.

## Tech Stack

### Frontend

* React
* Vite
* React Router
* XYFlow
* ELK.js

### Backend

* Node.js
* Express
* MongoDB
* Mongoose
* Passport.js (strategy: passport-google-oauth20)
* JWT

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

## Data Sources

* OSV.dev — vulnerability information
* npm Registry — package metadata and dependency information
* npms.io — package quality metrics