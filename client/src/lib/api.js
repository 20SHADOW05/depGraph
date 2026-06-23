import { useState, useEffect } from 'react';
export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

async function readJson(res) {
	const data = await res.json().catch(() => ({}));

	if (!res.ok) {
		throw new Error(data.error || 'Request failed');
	}

	return data;
}

export async function fetchPackageGraph(pkgName) {
	const res = await fetch(`${API_BASE}/graph/pkg`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ pkgName })
	});

	return readJson(res);
}

export async function uploadLockfile(file) {
	const formData = new FormData();
	formData.append('file', file);

	const res = await fetch(`${API_BASE}/graph`, {
		method: 'POST',
		body: formData
	});

	return readJson(res);
}

export async function signupPost(name, email, password) {
	const res = await fetch(`${API_BASE}/auth/signup`, {
		method: 'POST',
		credentials: 'include',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ name, email, password })
	});
	const data = await res.json();
  	if (!res.ok) throw new Error(data.message || 'Signup failed');
}

export async function loginPost(email, password) {
	const res = await fetch(`${API_BASE}/auth/login`, {
		method: 'POST',
		credentials: 'include',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email, password} )
	});

	const data = await res.json();
	if(!res.ok) throw new Error(data.message || 'Logi failed');
}

// export function userCheck() {
// 	const [user, setUser] = useState(null);
// 	const [loading, setLoading] = useState(true);

// 	useEffect(() => {
// 		fetch(`${API_BASE}/auth/me`, { credentials: 'include' })
// 		.then((res) => (res.ok ? res.json() : null))
// 		.then((data) => setUser(data?.user || null))
// 		.catch(() => setUser(null))
// 		.finally(() => setLoading(false));
// 	}, []);

// 	return { user, loading };
// }

export async function fetchMyGraphs() {
  const res = await fetch(`${API_BASE}/graph/saved`, { credentials: 'include' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to load saved graphs');
  return data.graphs;
}

export async function clearAllGraphsRequest() {
  const res = await fetch(`${API_BASE}/graph/saved`, { method: 'DELETE', credentials: 'include' });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || 'Failed to clear graphs');
  }
}

export async function logoutPost() {
  await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' });
}

export async function saveGraphRequest(graph) {
  const res = await fetch(`${API_BASE}/graph/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(graph)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || data.error || 'Failed to save graph');
  return data;
}

export const packageScores = async (packages) => {
    const res = await fetch('https://api.npms.io/v2/package/mget', {
        method: 'POST',
    	headers: { 'Content-Type': 'application/json' },
    	body: packages
    })
    return res.data;
}

export const packageVuln = async (packages) => {
    const res = await fetch('https://api.osv.dev/v1/querybatch', {
        method: 'POST',
    	headers: { 'Content-Type': 'application/json' },
    	body: packages
    })
    return res.data;
}