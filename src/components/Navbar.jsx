import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', icon: 'map', label: 'Map' },
  { to: '/history', icon: 'history', label: 'History' },
  { to: '/settings', icon: 'settings', label: 'Settings' },
];

function MdIcon({ name, style, className = '' }) {
  return <span className={`material-symbols-rounded ${className}`} style={style}>{name}</span>;
}

export default function Navbar() {
  return (
    <>
      {/* Desktop frosted glass header */}
      <header
        className="hidden md:flex items-center justify-between px-5 z-50 shrink-0"
        style={{
          height: 56,
          background: 'rgba(10,10,15,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center justify-center"
            style={{
              width: 34, height: 34, borderRadius: 10,
              background: 'var(--color-accent)',
              boxShadow: '0 0 20px rgba(10,132,255,0.35)',
            }}
          >
            <MdIcon name="flight" style={{ fontSize: 20, color: '#fff' }} />
          </div>
          <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.3px', color: 'var(--color-text-primary)' }}>
            FlightWatch
          </span>
        </div>
        <nav className="flex items-center gap-1">
          {links.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'text-accent'
                    : 'text-text-secondary hover:text-text-primary'
                }`
              }
              style={({ isActive }) => ({
                borderRadius: 10,
                background: isActive ? 'var(--color-accent-dim)' : 'none',
                border: isActive ? '1px solid rgba(10,132,255,0.3)' : '1px solid transparent',
              })}
            >
              <MdIcon name={link.icon} style={{ fontSize: 18 }} />
              {link.label}
            </NavLink>
          ))}
        </nav>
      </header>

      {/* Mobile bottom nav — frosted glass */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center"
        style={{
          height: 60,
          background: 'rgba(10,10,15,0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-2 text-[10px] font-semibold transition-colors ${
                isActive ? 'text-accent' : 'text-text-tertiary'
              }`
            }
            style={{ letterSpacing: '0.3px' }}
          >
            {({ isActive }) => (
              <>
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 36, height: 32, borderRadius: 10,
                    background: isActive ? 'var(--color-accent-dim)' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                >
                  <MdIcon name={link.icon} style={{ fontSize: 22 }} />
                </div>
                {link.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
