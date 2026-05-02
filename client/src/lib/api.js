const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

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
