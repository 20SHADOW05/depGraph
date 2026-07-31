import '../styles/projectNotice.css';

export default function ProjectNotice() {
  return (
    <div className="project-notice" tabIndex={0} aria-describedby="project-notice-dialog">
      <span className="project-notice-trigger">NOTE</span>

      <div id="project-notice-dialog" className="project-notice-dialog" role="note">
        <p>
          This site uses different frontend and backend domains. login session cannot be established unless third-party cookies are enabled.
        </p>
      </div>
    </div>
  );
}
