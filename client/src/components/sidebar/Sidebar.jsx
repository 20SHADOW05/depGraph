import Toggle from '../Toggle.jsx';

export default function Sidebar({
  open,
  pkgName,
  graph,
  selectedNode,
  showDevDependencies,
  showOptionalDependencies,
  onToggleDevDependencies,
  onToggleOptionalDependencies
}) {
  const packageName = selectedNode?.name || graph?.rootName || pkgName || 'select a package';
  const version = selectedNode?.version || null;
  const nodeType = selectedNode?.type || (graph?.source === 'lockfile' ? 'root' : 'package');
  const packageUrl = selectedNode?.name
    ? `https://www.npmjs.com/package/${selectedNode.name}`
    : null;

  return (
    <aside className={`sidebar ${open ? '' : 'closed'}`}>
      <div className="sidebar-inner">
        <div className="sidebar-section">
          <div className="section-label">Selected package</div>
          <div className="pkg-name">
            {packageName}
            {packageUrl && (
              <a href={packageUrl} target="_blank" rel="noreferrer" className="pkg-link">
                npm
              </a>
            )}
          </div>
          <div className="pkg-meta">
            {version && <span className="badge badge-ver">{version}</span>}
            <span className="badge badge-npm">npm</span>
            <span className="badge badge-eco">{nodeType}</span>
          </div>
        </div>

        <div className="sidebar-section">
          <div className="toggle-row">
            <span className="toggle-label">Show dev dependencies</span>
            <Toggle on={showDevDependencies} onClick={onToggleDevDependencies} />
          </div>
          <div className="toggle-row">
            <span className="toggle-label">Show optional dependencies</span>
            <Toggle on={showOptionalDependencies} onClick={onToggleOptionalDependencies} />
          </div>
        </div>
      </div>
    </aside>
  );
}
