import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import Logo from '../components/Logo.jsx';
import '../styles/auth.css';
import { loginPost } from '../lib/api.js';
import { API_BASE } from '../lib/api.js';

export default function LoginPage() {
	const [email, setEmail]       = useState('');
	const [password, setPassword] = useState('');
	const [showPw, setShowPw]     = useState(false);
	const [busy, setBusy]         = useState(false);
	const [errors, setErrors]     = useState({});
	const [globalErr, setGlobalErr] = useState('');

	function validate() {
		const e = {};
		if (!email.trim()) e.email = 'Email is required';
		else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email';
		if (!password) e.password = 'Password is required';
		return e;
	}

	async function handleSubmit(evt) {
		evt?.preventDefault();
		const e = validate();
		if (Object.keys(e).length) { setErrors(e); return; }

		setErrors({});
		setGlobalErr('');
		setBusy(true);

		try {
			await loginPost(email, password);
		} catch (err) {
			setGlobalErr(err.message);
		} finally {
			setBusy(false);
		}
	}

	function handleGoogle() {
		try {
  			window.location.href = `${API_BASE}/auth/google`; 
		} catch(err) {
			setGlobalErr(err.message);
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
			<h1 className="auth-form-title">Welcome back</h1>
			<p className="auth-form-sub">
				No account?{' '}
				<Link to="/signup">Create one</Link>
			</p>
			</div>

			<button className="btn-google" onClick={handleGoogle} type="button">
			<FcGoogle size={17} />
			Continue with Google
			</button>

			<div className="auth-divider">or continue with email</div>

			{globalErr && (
			<div className="auth-error-banner">
				<FiAlertCircle size={13} className="auth-error-icon" />
				{globalErr}
			</div>
			)}

			<div className="field">
			<label className="field-label" htmlFor="login-email">Email</label>
			<input
				id="login-email"
				className={`field-input ${errors.email ? 'error' : ''}`}
				type="email"
				placeholder="you@example.com"
				value={email}
				autoComplete="email"
				onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: '' })); }}
				onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
			/>
			{errors.email && <span className="field-error">{errors.email}</span>}
			</div>

			<div className="field">
			<label className="field-label" htmlFor="login-password">
				Password
				<a href="/forgot-password">Forgot password?</a>
			</label>
			<div className="field-input-wrap">
				<input
				id="login-password"
				className={`field-input has-toggle ${errors.password ? 'error' : ''}`}
				type={showPw ? 'text' : 'password'}
				placeholder="••••••••"
				value={password}
				autoComplete="current-password"
				onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: '' })); }}
				onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
				/>
				<button
				className="pw-toggle"
				type="button"
				tabIndex={-1}
				onClick={() => setShowPw((v) => !v)}
				aria-label={showPw ? 'Hide password' : 'Show password'}
				>
				{showPw ? <FiEyeOff size={15} /> : <FiEye size={15} />}
				</button>
			</div>
			{errors.password && <span className="field-error">{errors.password}</span>}
			</div>

			<button className="btn-submit" onClick={handleSubmit} disabled={busy} type="submit">
			{busy
				? <><span className="auth-spinner" /> Signing in…</>
				: 'Sign in'
			}
			</button>
		</div>
		</div>
	);
}