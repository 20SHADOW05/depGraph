import Logo from '../components/Logo.jsx';
import SearchPanel from '../components/SearchPanel.jsx';
import '../styles/landing.css';

export default function HomePage() {
  return (
    <main className="landing">
      <div className="landing-grid" aria-hidden="true" />
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
