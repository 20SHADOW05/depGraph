import { useNavigate } from 'react-router-dom';
import { GoPerson } from "react-icons/go";
import { useAuth } from '../lib/authContext.jsx';
import Logo from '../components/Logo.jsx';
import ProjectNotice from '../components/ProjectNotice.jsx';
import SearchPanel from '../components/SearchPanel.jsx';
import '../styles/landing.css';

export function ProfileIcon({ name }) {
  const navigate = useNavigate();

  return (
    <button
      className="profile-icon-btn"
      onClick={() => navigate('/me')}
      aria-label="Go to profile"
      title="Profile"
    >
      <GoPerson size={18}/>
    </button>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  return (
    <main className="landing">
      <div className="landing-grid" aria-hidden="true" />

      <a className="project-credit" href="https://ankababu.me/" target="_blank" rel="noreferrer">
        built by <span>shad0w_o</span>
      </a>

      <div className="landing-nav">
        <ProjectNotice />
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
