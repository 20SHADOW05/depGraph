import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { TbBinaryTree } from 'react-icons/tb';
import { GoShieldCheck, GoPackage } from 'react-icons/go';
import { LuGitBranch, LuBoxes } from 'react-icons/lu';
import Logo from '../components/Logo.jsx';
import '../styles/auth.css';

/* left panel feature list */
const FEATURES = [
  { icon: <LuBoxes size={14} />,       label: 'Interactive dependency graphs' },
  { icon: <GoPackage size={14} />,     label: 'Bundle size & treemap analysis' },
  { icon: <GoShieldCheck size={14} />, label: 'Vulnerability scanning via OSV' },
  { icon: <LuGitBranch size={14} />,   label: 'Release timeline & package scores' },
];

function AuthLeft() {
  return (
    <div className="auth-left">
      <div className="auth-left-grid" />
      <div className="auth-left-glow" />

      <div className="auth-brand">
        <Logo size={24} />
        <span className="auth-brand-dep">dep</span>
        <span className="auth-brand-graph">graph</span>
      </div>

      <div className="auth-left-body">
        <h2 className="auth-left-headline">
          Map every dependency at a glance
        </h2>
        <p className="auth-left-sub">
          Search any npm package or upload a lockfile. Visualize the full dependency graph in seconds.
        </p>
        <ul className="auth-left-features">
          {FEATURES.map(({ icon, label }) => (
            <li key={label} className="auth-feature">
              <span className="auth-feature-icon">{icon}</span>
              {label}
            </li>
          ))}
        </ul>
      </div>

      <span className="auth-left-footer">depgraph.dev</span>
    </div>
  );
}

export default function LoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [busy, setBusy]         = useState(false);
  const [errors, setErrors]     = useState({});
  const [globalErr, setGlobalErr] = useState('');

  /* ── validation ── */
  function validate() {
    const e = {};
    if (!email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email';
    if (!password) e.password = 'Password is required';
    return e;
  }

  /* ── email / password submit ── */
  async function handleSubmit(evt) {
    evt?.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    setErrors({});
    setGlobalErr('');
    setBusy(true);

    try {
      // POST /auth/login  →  { token: "eyJ..." }
      // const res  = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/login`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email, password }),
      // });
      // const data = await res.json();
      // if (!res.ok) throw new Error(data.error || 'Invalid credentials');
      // localStorage.setItem('token', data.token);   // or use httpOnly cookie
      // navigate('/');

      await new Promise((r) => setTimeout(r, 1100)); // demo delay — remove
      setGlobalErr('Invalid email or password.');     // demo error  — remove
    } catch (err) {
      setGlobalErr(err.message);
    } finally {
      setBusy(false);
    }
  }

  /* ── google SSO ── */
  function handleGoogle() {
    // Redirect to backend which handles Google OAuth and issues JWT
    // window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/google`;
    console.log('→ redirect to Google OAuth');
  }

  return (
    <div className="auth-shell">
      <AuthLeft />

      <div className="auth-right">
        <div className="auth-form-wrap">

          <div className="auth-form-header">
            <h1 className="auth-form-title">Welcome back</h1>
            <p className="auth-form-sub">
              No account?{' '}
              <Link to="/signup">Create one</Link>
            </p>
          </div>

          {/* Google */}
          <button className="btn-google" onClick={handleGoogle} type="button">
            <FcGoogle size={17} />
            Continue with Google
          </button>

          <div className="auth-divider">or continue with email</div>

          {/* global error */}
          {globalErr && (
            <div className="auth-error-banner">
              <FiAlertCircle size={13} className="auth-error-icon" />
              {globalErr}
            </div>
          )}

          {/* email */}
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

          {/* password */}
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

          {/* submit */}
          <button className="btn-submit" onClick={handleSubmit} disabled={busy} type="submit">
            {busy
              ? <><span className="auth-spinner" /> Signing in…</>
              : 'Sign in'
            }
          </button>

        </div>
      </div>
    </div>
  );
}

export { AuthLeft };