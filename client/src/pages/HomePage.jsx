// import Logo from '../components/Logo.jsx';
// import SearchPanel from '../components/SearchPanel.jsx';
// import '../styles/landing.css';

import { useNavigate } from 'react-router-dom';

export function ProfileIcon({ name }) {
  const navigate = useNavigate();
  const initial = name?.trim()?.[0]?.toUpperCase() || '?';

  return (
    <button
      className="profile-icon-btn"
      onClick={() => navigate('/me')}
      aria-label="Go to profile"
      title="Profile"
    >
      {initial}
    </button>
  );
}

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

import { userCheck } from '../lib/api.js';
import Logo from '../components/Logo.jsx';
import SearchPanel from '../components/SearchPanel.jsx';
import '../styles/landing.css';
import '../styles/header.css'; // reuses .btn / .btn-ghost / .btn-solid
import '../styles/profile.css'; // reuses .profile-icon-btn

export default function HomePage() {
  const navigate = useNavigate();
  const { user, loading } = userCheck();

  return (
    <main className="landing">
      <div className="landing-grid" aria-hidden="true" />

      <div className="landing-nav">
        {!loading && (
          user ? (
            <ProfileIcon name={user.name} />
          ) : (
            <>
              <button className="btn btn-ghost" onClick={() => navigate('/login')}>log in</button>
              <button className="btn btn-solid" onClick={() => navigate('/signup')}>sign up</button>
            </>
          )
        )}
      </div>

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

