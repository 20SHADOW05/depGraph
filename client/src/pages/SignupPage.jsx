import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import Logo from '../components/Logo.jsx';
import '../styles/auth.css';
import { signupPost, API_BASE } from '../lib/api.js';


/* ── password strength helpers ── */
function getStrength(pw) {
  	if (!pw) return 0;
  	let s = 0;
  	if (pw.length >= 8)           s++;
  	if (/[A-Z]/.test(pw))         s++;
  	if (/[0-9]/.test(pw))         s++;
  	if (/[^A-Za-z0-9]/.test(pw))  s++;
  	return s;
}

const STRENGTH_LABEL = ['', 'weak', 'fair', 'fair', 'strong'];
const STRENGTH_TEXT  = ['', 'Weak', 'Fair', 'Good', 'Strong'];

function PasswordStrength({ value }) {
  	const s = getStrength(value);
  	if (!value) return null;
  	const cls = STRENGTH_LABEL[s];
	return (
		<div className="pw-strength">
		<div className="pw-bars">
			{[1, 2, 3, 4].map((i) => (
			<div key={i} className={`pw-bar ${i <= s ? `active-${cls}` : ''}`} />
			))}
		</div>
		<span className={`pw-strength-label ${cls}`}>{STRENGTH_TEXT[s]}</span>
		</div>
	);
}

export default function SignupPage() {
    const [firstName, setFirstName] = useState('');
   	const [lastName,  setLastName]  = useState('');
   	const [email,     setEmail]     = useState('');
   	const [password,  setPassword]  = useState('');
   	const [showPw,    setShowPw]    = useState(false);
   	const [busy,      setBusy]      = useState(false);
   	const [errors,    setErrors]    = useState({});
   	const [globalErr, setGlobalErr] = useState('');

  	function validate() {
		const e = {};
		if (!firstName.trim()) e.firstName = 'Required';
		if (!lastName.trim())  e.lastName  = 'Required';
		if (!email.trim()) e.email = 'Email is required';
		else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email';
		if (!password) e.password = 'Password is required';
		else if (password.length < 8)  e.password = 'At least 8 characters';
		else if (getStrength(password) < 2) e.password = 'Choose a stronger password';
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
			const name = `${firstName.trim()} ${lastName.trim()}`;
			await signupPost(name, email, password);
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

  	function clearError(key) {
		setErrors((p) => ({ ...p, [key]: '' }));
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
		  	<h1 className="auth-form-title">Create an account</h1>
		  	<p className="auth-form-sub">
				Already have one?{' '}
				<Link to="/login">login</Link>
		  	</p>
			</div>

			<button className="btn-google" onClick={handleGoogle} type="button">
		  	<FcGoogle size={17} />
		  	Continue with Google
			</button>

			<div className="auth-divider">or sign up with email</div>

			{globalErr && (
		  	<div className="auth-error-banner">
				<FiAlertCircle size={13} className="auth-error-icon" />
				{globalErr}
		  	</div>
			)}

			<div className="name-row">
		  	<div className="field">
				<label className="field-label" htmlFor="signup-first">First name</label>
				<input
			  	id="signup-first"
			  	className={`field-input ${errors.firstName ? 'error' : ''}`}
			  	type="text"
			  	placeholder="Ada"
			  	value={firstName}
			  	autoComplete="given-name"
			  	onChange={(e) => { setFirstName(e.target.value); clearError('firstName'); }}
				/>
				{errors.firstName && <span className="field-error">{errors.firstName}</span>}
		  	</div>
		  	<div className="field">
				<label className="field-label" htmlFor="signup-last">Last name</label>
				<input
			  	id="signup-last"
			  	className={`field-input ${errors.lastName ? 'error' : ''}`}
			  	type="text"
			  	placeholder="Lovelace"
			  	value={lastName}
			  	autoComplete="family-name"
			  	onChange={(e) => { setLastName(e.target.value); clearError('lastName'); }}
				/>
				{errors.lastName && <span className="field-error">{errors.lastName}</span>}
		  	</div>
			</div>

			<div className="field">
		  	<label className="field-label" htmlFor="signup-email">Email</label>
		  	<input
				id="signup-email"
				className={`field-input ${errors.email ? 'error' : ''}`}
				type="email"
				placeholder="you@example.com"
				value={email}
				autoComplete="email"
				onChange={(e) => { setEmail(e.target.value); clearError('email'); }}
		  	/>
		  	{errors.email && <span className="field-error">{errors.email}</span>}
			</div>

			<div className="field">
		  	<label className="field-label" htmlFor="signup-password">Password</label>
		  	<div className="field-input-wrap">
				<input
			  	id="signup-password"
			  	className={`field-input has-toggle ${errors.password ? 'error' : ''}`}
			  	type={showPw ? 'text' : 'password'}
			  	placeholder="min. 8 characters"
			  	value={password}
			  	autoComplete="new-password"
			  	onChange={(e) => { setPassword(e.target.value); clearError('password'); }}
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
		  	<PasswordStrength value={password} />
		  	{errors.password && <span className="field-error">{errors.password}</span>}
			</div>

			<button className="btn-submit" onClick={handleSubmit} disabled={busy} type="submit">
		  	{busy
				? <><span className="auth-spinner" /> Creating account…</>
				: 'Create account'
		  	}
			</button>
	  	</div>
		</div>
  	);
}