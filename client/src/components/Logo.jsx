export default function Logo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="-90 -90 180 180" aria-hidden="true">
      <line x1="0" y1="0" x2="0" y2="-70" stroke="#1D9E75" strokeWidth="6" strokeLinecap="round" />
      <line x1="0" y1="0" x2="66" y2="22" stroke="#1D9E75" strokeWidth="6" strokeLinecap="round" />
      <line x1="0" y1="0" x2="-66" y2="22" stroke="#1D9E75" strokeWidth="6" strokeLinecap="round" />
      <line x1="0" y1="0" x2="0" y2="60" stroke="#1D9E75" strokeWidth="6" strokeLinecap="round" />
      <line x1="0" y1="-70" x2="66" y2="22" stroke="#5DCAA5" strokeWidth="4" strokeLinecap="round" />
      <line x1="-66" y1="22" x2="0" y2="-70" stroke="#5DCAA5" strokeWidth="4" strokeLinecap="round" />
      <line x1="66" y1="22" x2="0" y2="60" stroke="#5DCAA5" strokeWidth="4" strokeLinecap="round" />
      <circle cx="0" cy="-70" r="12" fill="#1D9E75" />
      <circle cx="66" cy="22" r="12" fill="#1D9E75" />
      <circle cx="-66" cy="22" r="12" fill="#1D9E75" />
      <circle cx="0" cy="60" r="12" fill="#1D9E75" />
      <circle cx="0" cy="0" r="22" fill="#0F6E56" />
      <circle cx="0" cy="0" r="9" fill="white" />
    </svg>
  );
}
