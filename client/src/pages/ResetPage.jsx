import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo.jsx';
import '../styles/auth.css';
import { resetPost } from '../lib/api.js';

export default function ResetPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token') || '';
    const email = searchParams.get('email') || '';

    const [password, setPassword] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!token || !email) setError('Invalid reset link');
    }, [token, email]);

    async function handleSubmit(e) {
        e?.preventDefault();
        setBusy(true);
        setError('');
        try {
            await resetPost(token, email, password);
            navigate('/login');
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="auth-shell">
            <div className="auth-bg-grid" />
            <div className="auth-bg-glow" />

            <div className="auth-form-wrap">
                <Link to="/" className="auth-brand-center">
                    <Logo size={40} />
                    <span className="auth-brand-dep">dep</span>
                    <span className="auth-brand-graph">graph</span>
                </Link>

                <div className="auth-form-header">
                    <h1 className="auth-form-title">Choose a new password</h1>
                    <p className="auth-form-sub">Set a new password for your account.</p>
                </div>

                {error && <div className="auth-error-banner">{error}</div>}

                <div className="field">
                    <label className="field-label">New password</label>
                    <input className="field-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>

                <button className="btn-submit" onClick={handleSubmit} disabled={busy || !password}>
                    {busy ? 'Updating…' : 'Update password'}
                </button>

                <div className="auth-footer">
                    <Link to="/login" className="auth-link-btn">Back to login</Link>
                </div>
            </div>
        </div>
    );
}
