import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLogOut, FiTrash2, FiLock, FiX } from 'react-icons/fi';
import { IoReturnUpBackSharp } from "react-icons/io5";
import { fetchMyGraphs, clearAllGraphsRequest, deleteGraphRequest, logoutPost, changePassword } from '../lib/api.js';
import { useAuth } from '../lib/authContext.jsx';
import Logo from '../components/Logo.jsx';
import '../styles/profile.css';

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="dialog-overlay">
      <div className="dialog">
        <p className="dialog-message">{message}</p>
        <div className="dialog-actions">
          <button className="dialog-btn-cancel" onClick={onCancel}>Cancel</button>
          <button className="dialog-btn-confirm" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

function ChangePasswordDialog({ onCancel, onSuccess }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    setError('');
    if (!currentPassword || !newPassword) return setError('All fields required');
    if (newPassword !== confirm) return setError('Passwords do not match');

    setBusy(true);
    try {
      await changePassword(currentPassword, newPassword);
      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to change password');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="dialog-overlay">
      <div className="dialog">
        <h3>Change password</h3>
        {error && <p className="dialog-error">{error}</p>}
        <div className="field">
          <label className="field-label">Current password</label>
          <input className="field-input" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        </div>
        <div className="field">
          <label className="field-label">New password</label>
          <input className="field-input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </div>
        <div className="field">
          <label className="field-label">Confirm new password</label>
          <input className="field-input" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
        <div className="dialog-actions">
          <button className="dialog-btn-cancel" onClick={onCancel}>Cancel</button>
          <button className="dialog-btn-confirm" onClick={handleSubmit} disabled={busy}>{busy ? 'Updating…' : 'Update'}</button>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [graphs, setGraphs] = useState([]);
  const [graphsLoading, setGraphsLoading] = useState(true);
  const [busyAction, setBusyAction] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');
  const [dialog, setDialog] = useState(null); // { message, onConfirm }
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [pwMessage, setPwMessage] = useState('');

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

  function confirmClearAll() {
    setDialog({
      message: 'Delete all saved graphs? This cannot be undone.',
      onConfirm: async () => {
        setDialog(null);
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
    });
  }

  function confirmDeleteOne(id) {
    setDialog({
      message: 'Delete this graph?',
      onConfirm: async () => {
        setDialog(null);
        setDeletingId(id);
        try {
          await deleteGraphRequest(id);
          setGraphs((prev) => prev.filter((g) => g._id !== id));
        } catch (err) {
          setError(err.message);
        } finally {
          setDeletingId(null);
        }
      }
    });
  }

  async function handleLogout() {
    await logoutPost();
    window.location.href = '/';
  }

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  if (authLoading || !user) {
    return (
      <div className="profile-loading">
        <Logo size={40} />
      </div>
    );
  }

  return (
    <div className="profile-shell">
      <div className="profile-bg-grid" />

      {dialog && (
        <ConfirmDialog
          message={dialog.message}
          onConfirm={dialog.onConfirm}
          onCancel={() => setDialog(null)}
        />
      )}

      <div className="profile-content">
        <button className="profile-back" onClick={handleBack}>
          <IoReturnUpBackSharp size={18} /> back
        </button>

        <h1 className="profile-name">{user.name}</h1>
        <p className="profile-email">{user.email}</p>
        <div className="profile-divider" />

        <div className="profile-section">
          <div className="profile-section-header">
            <h2>Saved graphs</h2>
            {graphs.length > 0 && (
              <button className="btn-text-danger" onClick={confirmClearAll} disabled={busyAction}>
                <FiTrash2 size={13} /> CLEAR ALL
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
                <li key={g._id} className="saved-graph-item">
                  <span
                    className="saved-graph-name"
                    onClick={() => navigate(`/graph?pkg=${encodeURIComponent(g.rootName)}`, { state: { graph: g } })}
                  >
                    {g.rootName}
                  </span>
                  <div className="saved-graph-meta">
                    <span className="saved-graph-date">{new Date(g.createdAt).toLocaleDateString()}</span>
                    <button
                      className="saved-graph-delete"
                      onClick={() => confirmDeleteOne(g._id)}
                      disabled={deletingId === g._id}
                      aria-label="Delete graph"
                    >
                      <FiX size={14} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && <p className="profile-error">{error}</p>}

        <div className="profile-actions">
          <button className="btn-secondary" onClick={() => setShowChangePassword(true)}>
            <FiLock size={14} /> Change password
          </button>
          <button className="btn-logout" onClick={handleLogout}>
            <FiLogOut size={14} /> Log out
          </button>
        </div>
        {pwMessage && <p className="profile-success">{pwMessage}</p>}
        {showChangePassword && (
          <ChangePasswordDialog
            onCancel={() => setShowChangePassword(false)}
            onSuccess={() => { setShowChangePassword(false); setPwMessage('Password changed successfully'); }}
          />
        )}
      </div>
    </div>
  );
}