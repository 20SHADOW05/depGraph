import { useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo.jsx';
import '../styles/auth.css';
import { requestReset } from '../lib/api.js';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    async function handleSubmit(e) {
        e?.preventDefault();
        setBusy(true);
        setMessage('');
        setError('');
        try {
            await requestReset(email);
            setMessage('If the email exists, a reset link was sent.');
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
                    <h1 className="auth-form-title">Reset password</h1>
                    <p className="auth-form-sub">Enter your email and we'll send a reset link.</p>
                </div>

                {message && <div className="auth-success">{message}</div>}
                {error && <div className="auth-error-banner">{error}</div>}

                <div className="field">
                    <label className="field-label">Email</label>
                    <input className="field-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>

                <button className="btn-submit" onClick={handleSubmit} disabled={busy}>
                    {busy ? 'Sending…' : 'Send reset link'}
                </button>

                <div className="auth-footer">
                    <Link to="/login" className="auth-link-btn">Back to login</Link>
                </div>
            </div>
        </div>
    );
}
