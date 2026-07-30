import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Logo from '../components/Logo.jsx';
import { verifyEmail } from '../lib/api.js';
import '../styles/auth.css';

export default function VerifyPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('loading');
    const [error, setError] = useState('');
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    useEffect(() => {
        async function run() {
            if (!token || !email) {
                setStatus('error');
                setError('Invalid verification link');
                return;
            }

            try {
                const data = await verifyEmail(token, email);
                if (data.redirectTo) {
                    navigate(data.redirectTo, { replace: true });
                    return;
                }
                setStatus('success');
            } catch (err) {
                setStatus('error');
                setError(err.message || 'Verification failed');
            }
        }

        run();
    }, [token, email, navigate]);

    return (
        <div className="auth-shell">
            <div className="auth-bg-grid" />
            <div className="auth-bg-glow" />

            <div className="auth-form-wrap verify-card">
                <Link to="/" className="auth-brand-center">
                    <Logo size={40} />
                    <span className="auth-brand-dep">dep</span>
                    <span className="auth-brand-graph">graph</span>
                </Link>

                <div className="auth-form-header">
                    <div className={`verify-icon ${status === 'loading' ? 'is-loading' : status === 'success' ? 'is-success' : 'is-error'}`}>
                        {status === 'loading' ? '•' : status === 'success' ? '✓' : '!'}
                    </div>
                    <h1 className="auth-form-title">
                        {status === 'loading' ? 'Verifying email…' : status === 'success' ? 'Email verified' : 'Verification failed'}
                    </h1>
                    <p className="auth-form-sub">
                        {status === 'loading'
                            ? 'Please wait while we confirm your account.'
                            : status === 'success'
                                ? 'Your email is now verified. You can sign in and continue.'
                                : 'The verification link is invalid or has expired.'}
                    </p>
                </div>

                {error ? (
                    <div className="auth-global-error">
                        {error}
                    </div>
                ) : null}

                <div className="verify-footer">
                    <Link to="/login" className="auth-link-btn">Back to sign in</Link>
                </div>
            </div>
        </div>
    );
}
