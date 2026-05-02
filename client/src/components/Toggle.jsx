export default function Toggle({ on, onClick }) {
  return (
    <button className={`toggle ${on ? 'on' : ''}`} onClick={onClick} role="switch" aria-checked={on} type="button">
      <span className="toggle-knob" />
    </button>
  );
}
