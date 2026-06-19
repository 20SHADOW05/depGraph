import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiTrash2, FiLogOut, FiLock, FiChevronRight } from 'react-icons/fi';
import Logo from '../components/Logo.jsx';
import { userCheck } from '../lib/api.js';
import { API_BASE } from '../lib/api.js';
import '../styles/profile.css';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [graphs, setGraphs] = useState([]);
  const [graphsLoading, setGraphsLoading] = useState(true);
  const [error, setError] = useState('');

  // redirect if not logged in
  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    fetch(`${API_BASE}/graph`, { credentials: 'include' })
      .then((res) => res.ok ? res.json() : Promise.reject())
      .then((data) => setGraphs(data.graphs || []))
      .catch(() => setError('Failed to load saved graphs.'))
      .finally(() => setGraphsLoading(false));
  }, [user]);

  const getInitials = useCallback((name) => {
    if (!name) return '?';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  }, []);

  async function handleLogout() {
    await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' });
    navigate('/');
  }

  async function handleClearAll() {
    if (!confirm('Delete all saved graphs? This cannot be undone.')) return;
    const res = await fetch(`${API_BASE}/graph/all`, { method: 'DELETE', credentials: 'include' });
    if (res.ok) setGraphs([]);
    else setError('Failed to clear graphs.');
  }

  function openGraph(graph) {
    navigate(`/graph?pkg=${encodeURIComponent(graph.rootName)}`, { state: { graph } });
  }

  if (loading) return null;

  return (
    <div className="profile-shell">
      <header className="profile-header">
        <button className="logo-btn" onClick={() => navigate('/')} aria-label="Go home">
          <Logo size={22} />
          <div className="wordmark">
            <span className="wordmark-dep">dep</span>
            <span className="wordmark-graph">graph</span>
          </div>
        </button>
      </header>

      <div className="profile-body">
        {/* avatar + identity */}
        <div className="profile-identity">
          <div className="profile-avatar">{getInitials(user?.name)}</div>
          <div className="profile-meta">
            <span className="profile-name">{user?.name}</span>
            <span className="profile-email">{user?.email}</span>
          </div>
        </div>

        {/* saved graphs */}
        <section className="profile-section">
          <div className="profile-section-head">
            <span className="profile-section-title">saved graphs</span>
            {graphs.length > 0 && (
              <button className="btn-clear-all" onClick={handleClearAll}>
                <FiTrash2 size={12} />
                clear all
              </button>
            )}
          </div>

          {error && <p className="profile-error">{error}</p>}

          {graphsLoading ? (
            <p className="profile-empty">Loading…</p>
          ) : graphs.length === 0 ? (
            <p className="profile-empty">No saved graphs yet.</p>
          ) : (
            <ul className="graphs-list">
              {graphs.map((g) => (
                <li key={g._id} className="graph-item" onClick={() => openGraph(g)}>
                  <div className="graph-item-info">
                    <span className="graph-item-name">{g.rootName}</span>
                    <span className="graph-item-meta">
                      {g.nodes?.length ?? 0} nodes · {new Date(g.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <FiChevronRight size={14} className="graph-item-arrow" />
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* account actions */}
        <section className="profile-section">
          <span className="profile-section-title">account</span>
          <div className="profile-actions">
            {/* only show change password for non-oauth users */}
            {!user?.googleId && (
              <button className="profile-action-btn" onClick={() => navigate('/change-password')}>
                <FiLock size={14} />
                change password
              </button>
            )}
            <button className="profile-action-btn danger" onClick={handleLogout}>
              <FiLogOut size={14} />
              log out
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}