// import Logo from '../components/Logo.jsx';
// import SearchPanel from '../components/SearchPanel.jsx';
// import '../styles/landing.css';

// export default function HomePage() {
//   return (
//     <main className="landing">
//       <div className="landing-grid" aria-hidden="true" />
//       <div className="landing-shell">
//         <div className="landing-logo">
//           <Logo size={66} />
//           <div className="landing-wordmark">
//             <span className="landing-dep">dep</span>
//             <span className="landing-graph">graph</span>
//           </div>
//         </div>
//         <p className="landing-tagline">visualize dependency trees from package names or lockfiles</p>
//         <SearchPanel />
//       </div>
//     </main>
//   );
// }

import { useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo.jsx';
import SearchPanel from '../components/SearchPanel.jsx';
import { userCheck } from '../lib/api.js';
import '../styles/landing.css';

export default function HomePage() {
  const { user, loading } = userCheck();
  const navigate = useNavigate();

  const getInitials = useCallback((name) => {
    if (!name) return '?';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  }, []);

  return (
    <main className="landing">
      <div className="landing-grid" aria-hidden="true" />
      <div className="landing-bg-glow" aria-hidden="true" />

      {/* top-right auth controls */}
      {!loading && (
        <div className="landing-auth">
          {user ? (
            <button
              className="avatar-btn"
              onClick={() => navigate('/me')}
              aria-label="Go to profile"
              title={user.name}
            >
              {getInitials(user.name)}
            </button>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">log in</Link>
              <Link to="/signup" className="btn btn-solid">sign up</Link>
            </>
          )}
        </div>
      )}

      <div className="landing-shell">
        <div className="landing-logo">
          <Logo size={66} />
          <div className="landing-wordmark">
            <span className="landing-dep">dep</span>
            <span className="landing-graph">graph</span>
          </div>
        </div>
        <p className="landing-tagline">visualize dependency trees from package names or lockfiles</p>
        <SearchPanel />
      </div>
    </main>
  );
}

