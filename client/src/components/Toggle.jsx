export default function Toggle({ on, onClick, ariaLabel }) {
  return (
    <button className={`toggle ${on ? 'on' : ''}`} onClick={onClick} role="switch" aria-checked={on} aria-label={ariaLabel} type="button">
      <span className="toggle-knob" />
    </button>
  );
}
