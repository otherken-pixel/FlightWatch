import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', icon: '🗺️', label: 'Map' },
  { to: '/history', icon: '📋', label: 'History' },
  { to: '/settings', icon: '⚙️', label: 'Settings' },
];

export default function Navbar() {
  return (
    <>
      {/* Desktop top bar */}
      <header className="hidden md:flex items-center justify-between px-6 py-3 bg-navy border-b border-navy-light z-50">
        <div className="flex items-center gap-3">
          <span className="text-2xl">✈️</span>
          <h1 className="font-display text-xl font-bold text-amber tracking-wide">FlightWatch</h1>
        </div>
        <nav className="flex items-center gap-1">
          {links.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-navy-light text-amber' : 'text-sky-dim hover:text-sky hover:bg-navy-light/50'
                }`
              }
            >
              <span>{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>
      </header>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-navy border-t border-navy-light z-50 flex">
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs transition-colors ${
                isActive ? 'text-amber' : 'text-sky-dim'
              }`
            }
          >
            <span className="text-lg">{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
