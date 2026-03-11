import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { logOut } from '../services/auth';
import useStore from '../store/useStore';

const links = [
  { to: '/', icon: 'flight', label: 'Aircraft' },
  { to: '/history', icon: 'history', label: 'History' },
  { to: '/settings', icon: 'settings', label: 'Settings' },
];

function MdIcon({ name, style, className = '' }) {
  return <span className={`material-symbols-rounded ${className}`} style={style}>{name}</span>;
}

export default function Navbar({ user, onShowLogin }) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const theme = useStore(s => s.settings.theme) || 'system';
  const updateSettings = useStore(s => s.updateSettings);

  const cycleTheme = () => {
    const next = theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system';
    updateSettings({ theme: next });
  };

  const themeIcon = theme === 'dark' ? 'dark_mode' : theme === 'light' ? 'light_mode' : 'brightness_auto';

  const handleLogout = async () => {
    setShowUserMenu(false);
    try { await logOut(); } catch (err) { console.warn('Logout failed:', err); }
  };

  const avatarLetter = user?.displayName?.[0] || user?.email?.[0] || null;
  const photoURL = user?.photoURL;

  return (
    <>
      {/* ── Desktop header ── */}
      <header
        className="hidden md:flex items-center justify-between px-6 z-50 shrink-0 glass-nav"
        style={{ height: 52 }}
      >
        <div className="flex items-center gap-2.5">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="30" height="30" style={{ borderRadius: 8 }}>
            <defs>
              <linearGradient id="nav-bg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#001233"/>
                <stop offset="100%" stopColor="#0077B6"/>
              </linearGradient>
              <linearGradient id="nav-shine" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#48CAE4" stopOpacity="0.4"/>
                <stop offset="100%" stopColor="#001233" stopOpacity="0"/>
              </linearGradient>
            </defs>
            <rect width="100" height="100" rx="22" fill="url(#nav-bg)"/>
            <rect width="100" height="100" rx="22" fill="url(#nav-shine)"/>
            <circle cx="50" cy="50" r="36" fill="none" stroke="#48CAE4" strokeOpacity="0.12" strokeWidth="1"/>
            <circle cx="50" cy="50" r="26" fill="none" stroke="#48CAE4" strokeOpacity="0.18" strokeWidth="1"/>
            <circle cx="50" cy="50" r="16" fill="none" stroke="#48CAE4" strokeOpacity="0.25" strokeWidth="1"/>
            <g transform="translate(50,48) rotate(-45)">
              <path d="M0-28 C2-26 4-17 4-8 L13-3 C14.5-2.2 14.5 0 13 0.8 L4 5 C4 14 2 24 0 28 C-2 24 -4 14 -4 5 L-13 0.8 C-14.5 0 -14.5-2.2 -13-3 L-4-8 C-4-17 -2-26 0-28Z" fill="white" opacity="0.95"/>
              <path d="M0 18 L3 24 L0 22 L-3 24Z" fill="white" opacity="0.8"/>
            </g>
            <circle cx="62" cy="36" r="3" fill="#48CAE4" opacity="0.9"/>
            <circle cx="62" cy="36" r="5" fill="#48CAE4" opacity="0.3"/>
          </svg>
          <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: '-0.3px', color: 'var(--color-text-primary)' }}>
            FlightWatch
          </span>
        </div>

        <div className="flex items-center gap-1">
          <nav className="flex items-center gap-1">
            {links.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 text-[14px] font-medium transition-all ${
                    isActive ? '' : ''
                  }`
                }
                style={({ isActive }) => ({
                  borderRadius: 10,
                  background: isActive ? 'var(--color-accent-dim)' : 'transparent',
                  color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                })}
              >
                <MdIcon name={link.icon} style={{ fontSize: 18 }} />
                {link.label}
              </NavLink>
            ))}
          </nav>

          <button
            onClick={cycleTheme}
            title={`Theme: ${theme}`}
            className="flex items-center justify-center ml-1"
            style={{
              width: 34, height: 34, borderRadius: 10,
              background: 'var(--color-accent-dim)', border: 'none',
              cursor: 'pointer',
            }}
          >
            <MdIcon name={themeIcon} style={{ fontSize: 18, color: 'var(--color-accent)' }} />
          </button>

          <div className="relative ml-2">
            {user ? (
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center justify-center"
                style={{
                  width: 32, height: 32, borderRadius: 99,
                  background: photoURL ? 'none' : 'var(--color-accent-dim)',
                  border: '1px solid var(--color-separator)',
                  cursor: 'pointer', overflow: 'hidden',
                }}
              >
                {photoURL ? (
                  <img src={photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
                ) : avatarLetter ? (
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase' }}>{avatarLetter}</span>
                ) : (
                  <MdIcon name="person" style={{ fontSize: 16, color: 'var(--color-accent)' }} />
                )}
              </button>
            ) : (
              <button
                onClick={onShowLogin}
                className="flex items-center gap-1.5 text-[14px] font-semibold"
                style={{
                  borderRadius: 10, background: 'var(--color-accent)',
                  border: 'none', color: '#fff', cursor: 'pointer', padding: '7px 18px',
                  fontFamily: 'inherit',
                }}
              >
                Sign In
              </button>
            )}

            {showUserMenu && user && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 150 }} onClick={() => setShowUserMenu(false)} />
                <div
                  className="fade-in"
                  style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                    background: 'var(--color-card)',
                    border: '1px solid var(--color-separator)',
                    borderRadius: 14, padding: 6, minWidth: 200,
                    boxShadow: 'var(--shadow-lg)', zIndex: 200,
                  }}
                >
                  <div style={{ padding: '10px 12px 10px', borderBottom: '1px solid var(--color-separator)' }}>
                    <div className="flex items-center gap-2.5 mb-1">
                      <div
                        className="flex items-center justify-center shrink-0"
                        style={{
                          width: 34, height: 34, borderRadius: 99,
                          background: photoURL ? 'none' : 'var(--color-accent-dim)',
                          border: '1px solid var(--color-separator)', overflow: 'hidden',
                        }}
                      >
                        {photoURL ? (
                          <img src={photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
                        ) : (
                          <MdIcon name="person" style={{ fontSize: 16, color: 'var(--color-accent)' }} />
                        )}
                      </div>
                      <div className="min-w-0">
                        {user.displayName && (
                          <div className="text-[14px] font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>{user.displayName}</div>
                        )}
                        <div className="text-[12px] truncate" style={{ color: 'var(--color-text-tertiary)' }}>{user.email}</div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full text-left"
                    style={{
                      padding: '10px 12px', borderRadius: 10,
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--color-nogo)', fontSize: 14, fontWeight: 500, fontFamily: 'inherit',
                    }}
                  >
                    <MdIcon name="logout" style={{ fontSize: 18 }} />
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Mobile bottom nav ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center glass-nav"
        style={{
          height: 56,
          borderTop: '1px solid var(--color-separator)',
          borderBottom: 'none',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            className="flex flex-col items-center gap-0.5 py-1.5"
            style={{ minWidth: 64 }}
          >
            {({ isActive }) => (
              <>
                <MdIcon
                  name={link.icon}
                  style={{
                    fontSize: 24,
                    color: isActive ? 'var(--color-accent)' : 'var(--color-text-tertiary)',
                    fontVariationSettings: isActive ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" : undefined,
                  }}
                />
                <span className="text-[10px] font-semibold" style={{
                  color: isActive ? 'var(--color-accent)' : 'var(--color-text-tertiary)',
                }}>
                  {link.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
        <button
          onClick={user ? () => setShowUserMenu(!showUserMenu) : onShowLogin}
          className="flex flex-col items-center gap-0.5 py-1.5"
          style={{ minWidth: 64, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          {user?.photoURL ? (
            <img src={user.photoURL} alt="" style={{ width: 24, height: 24, borderRadius: 99, objectFit: 'cover' }} referrerPolicy="no-referrer" />
          ) : (
            <MdIcon name="person" style={{ fontSize: 24, color: 'var(--color-text-tertiary)' }} />
          )}
          <span className="text-[10px] font-semibold" style={{ color: 'var(--color-text-tertiary)' }}>
            {user ? 'Account' : 'Sign In'}
          </span>
        </button>
      </nav>

      {/* Mobile user sheet */}
      {showUserMenu && user && (
        <div className="md:hidden fixed inset-0 z-[700]">
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }} onClick={() => setShowUserMenu(false)} />
          <div
            className="absolute bottom-16 left-3 right-3 fade-in"
            style={{
              background: 'var(--color-card)',
              border: '1px solid var(--color-separator)',
              borderRadius: 16,
              padding: '20px',
              boxShadow: 'var(--shadow-lg)',
              marginBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="flex items-center justify-center shrink-0"
                style={{
                  width: 44, height: 44, borderRadius: 99,
                  background: photoURL ? 'none' : 'var(--color-accent-dim)',
                  border: '1px solid var(--color-separator)', overflow: 'hidden',
                }}
              >
                {photoURL ? (
                  <img src={photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
                ) : (
                  <MdIcon name="person" style={{ fontSize: 22, color: 'var(--color-accent)' }} />
                )}
              </div>
              <div className="min-w-0">
                {user.displayName && (
                  <div className="text-[16px] font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>{user.displayName}</div>
                )}
                <div className="text-[13px] truncate" style={{ color: 'var(--color-text-tertiary)' }}>{user.email}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-[15px] font-semibold"
              style={{
                borderRadius: 10, background: 'var(--color-accent-dim)',
                border: 'none', color: 'var(--color-nogo)', cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <MdIcon name="logout" style={{ fontSize: 18 }} />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </>
  );
}
