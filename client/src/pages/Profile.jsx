import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLogOut, FiTrash2, FiLock } from 'react-icons/fi';
import { userCheck } from '../lib/api.js';
import { fetchMyGraphs, clearAllGraphsRequest, logoutPost } from '../lib/api.js';
import Logo from '../components/Logo.jsx';
import '../styles/profile.css';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, loading: authLoading, logout } = userCheck();
  const [graphs, setGraphs] = useState([]);
  const [graphsLoading, setGraphsLoading] = useState(true);
  const [busyAction, setBusyAction] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    fetchMyGraphs()
      .then(setGraphs)
      .catch((err) => setError(err.message))
      .finally(() => setGraphsLoading(false));
  }, [user]);

  async function handleClearGraphs() {
    if (!window.confirm('Delete all saved graphs? This cannot be undone.')) return;
    setBusyAction(true);
    try {
      await clearAllGraphsRequest();
      setGraphs([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyAction(false);
    }
  }

  async function handleLogout() {
    try {
      await logoutPost();
    } finally {
      logout();
      navigate('/');
    }
  }

  function handleChangePassword() {
    navigate('/me/change-password'); // TODO: build this page
  }

  if (authLoading || !user) {
    return (
      <div className="profile-loading">
        <Logo size={40} />
      </div>
    );
  }

  const initial = user.name?.trim()?.[0]?.toUpperCase() || '?';

  return (
    <div className="profile-shell">
      <div className="profile-bg-grid" />

      <div className="profile-card">
        <button className="profile-back" onClick={() => navigate('/')}>← back</button>

        <div className="profile-avatar">{initial}</div>

        <h1 className="profile-name">{user.name}</h1>
        <p className="profile-email">{user.email}</p>

        <div className="profile-section">
          <div className="profile-section-header">
            <h2>Saved graphs</h2>
            {graphs.length > 0 && (
              <button className="btn-text-danger" onClick={handleClearGraphs} disabled={busyAction}>
                <FiTrash2 size={13} /> clear all
              </button>
            )}
          </div>

          {graphsLoading ? (
            <p className="profile-empty-msg">Loading...</p>
          ) : graphs.length === 0 ? (
            <p className="profile-empty-msg">No saved graphs yet.</p>
          ) : (
            <ul className="saved-graph-list">
              {graphs.map((g) => (
                <li
                  key={g._id}
                  className="saved-graph-item"
                  onClick={() => navigate(`/graph?pkg=${encodeURIComponent(g.rootName)}`, { state: { graph: g } })}
                >
                  <span className="saved-graph-name">{g.rootName}</span>
                  <span className="saved-graph-date">{new Date(g.createdAt).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && <p className="profile-error">{error}</p>}

        <div className="profile-actions">
          <button className="btn-secondary" onClick={handleChangePassword}>
            <FiLock size={14} /> Change password
          </button>
          <button className="btn-logout" onClick={handleLogout}>
            <FiLogOut size={14} /> Log out
          </button>
        </div>
      </div>
    </div>
  );
}