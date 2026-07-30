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
	return data;
}

export async function loginPost(email, password) {
	const res = await fetch(`${API_BASE}/auth/login`, {
		method: 'POST',
		credentials: 'include',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email, password })
	});

	const data = await res.json();
	if (!res.ok) throw new Error(data.message || 'Login failed');
	return data;
}

export async function fetchMyGraphs() {
	const res = await fetch(`${API_BASE}/auth/saved`, { credentials: 'include' });
	const data = await res.json();
	if (!res.ok) throw new Error(data.message || 'Failed to load saved graphs');
	return data.graphs;
}

export async function clearAllGraphsRequest() {
	const res = await fetch(`${API_BASE}/auth/saved`, { method: 'DELETE', credentials: 'include' });
	if (!res.ok) {
		const data = await res.json();
		throw new Error(data.message || 'Failed to clear graphs');
	}
}

export async function logoutPost() {
	await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' });
}

export async function requestVerify(email) {
	const res = await fetch(`${API_BASE}/auth/request-verify`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email })
	});
	const data = await res.json().catch(() => ({}));
	if (!res.ok) throw new Error(data.message || 'Failed to send verification email');
}

export async function verifyEmail(token, email) {
	const params = new URLSearchParams({ token, email });
	const res = await fetch(`${API_BASE}/auth/verify?${params.toString()}`, {
		method: 'GET',
		headers: { 'Accept': 'application/json' }
	});
	const data = await res.json().catch(() => ({}));
	if (!res.ok) throw new Error(data.message || 'Failed to verify email');
	return data;
}

export async function requestReset(email) {
	const res = await fetch(`${API_BASE}/auth/request-reset`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email })
	});
	const data = await res.json().catch(() => ({}));
	if (!res.ok) throw new Error(data.message || 'Failed to send reset email');
}

export async function resetPost(token, email, password) {
	const res = await fetch(`${API_BASE}/auth/reset`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ token, email, password })
	});
	const data = await res.json().catch(() => ({}));
	if (!res.ok) throw new Error(data.message || 'Failed to reset password');
}

export async function changePassword(currentPassword, newPassword) {
	const res = await fetch(`${API_BASE}/auth/change-password`, {
		method: 'POST',
		credentials: 'include',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ currentPassword, newPassword })
	});
	const data = await res.json().catch(() => ({}));
	if (!res.ok) throw new Error(data.message || 'Failed to change password');
}

export async function saveGraphRequest(graph) {
	const res = await fetch(`${API_BASE}/auth/save`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		credentials: 'include',
		body: JSON.stringify(graph)
	});
	const data = await res.json().catch(() => ({}));
	if (!res.ok) throw new Error(data.message || data.error || 'Failed to save graph');
	return data;
}

export async function deleteGraphRequest(id) {
	const res = await fetch(`${API_BASE}/auth/saved/${id}`, {
		method: 'DELETE',
		credentials: 'include'
	});
	if (!res.ok) {
		const data = await res.json().catch(() => ({}));
		throw new Error(data.message || 'Failed to delete graph');
	}
}
