import { Link } from 'react-router-dom';
import Logo from '../components/Logo.jsx';
import '../styles/auth.css';

export default function VerifiedPage() {
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
                    <h1 className="auth-form-title">Email verified</h1>
                    <p className="auth-form-sub">Thanks! Your email has been verified.</p>
                </div>

                <div className="auth-footer">
                    <Link to="/login" className="auth-link-btn">Sign in</Link>
                </div>
            </div>
        </div>
    );
}
