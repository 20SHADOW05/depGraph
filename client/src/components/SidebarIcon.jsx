export default function SidebarIcon({ open }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect
        x="1"
        y="1"
        width="14"
        height="14"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.2"
        fill={open ? 'rgba(29,158,117,0.1)' : 'none'}
      />
      <line x1="10" y1="1" x2="10" y2="15" stroke="currentColor" strokeWidth="1.2" />
      {[4, 8, 12].map((y) => (
        <line key={y} x1="2" y1={y} x2="8" y2={y} stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" />
      ))}
    </svg>
  );
}
