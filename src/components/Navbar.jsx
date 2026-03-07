import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { logOut } from '../services/auth';

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

  const handleLogout = async () => {
    setShowUserMenu(false);
    try { await logOut(); } catch (err) { console.warn('Logout failed:', err); }
  };

  const avatarLetter = user?.displayName?.[0] || user?.email?.[0] || null;
  const photoURL = user?.photoURL;

  return (
    <>
      {/* Desktop frosted glass header — iOS translucent nav */}
      <header
        className="hidden md:flex items-center justify-between px-6 z-50 shrink-0 glass-nav"
        style={{ height: 56 }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center sky-gradient"
            style={{
              width: 32, height: 32, borderRadius: 8,
            }}
          >
            <MdIcon name="flight" style={{ fontSize: 18, color: '#fff' }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: '-0.3px', color: 'var(--color-text-primary)' }}>
            FlightWatch
          </span>
        </div>

        <div className="flex items-center gap-2">
          <nav className="flex items-center gap-1">
            {links.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-150 ${
                    isActive ? 'text-accent' : 'text-text-secondary hover:text-text-primary'
                  }`
                }
                style={({ isActive }) => ({
                  borderRadius: 12,
                  background: isActive ? 'var(--color-accent-dim)' : 'none',
                  border: isActive ? '1px solid rgba(0,122,255,0.3)' : '1px solid transparent',
                })}
              >
                <MdIcon name={link.icon} style={{ fontSize: 18 }} />
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Auth button */}
          <div className="relative ml-2">
            {user ? (
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center justify-center"
                style={{
                  width: 34, height: 34, borderRadius: 99,
                  background: photoURL ? 'none' : 'var(--color-accent-dim)',
                  border: '1px solid rgba(0,122,255,0.3)',
                  cursor: 'pointer',
                  overflow: 'hidden',
                }}
              >
                {photoURL ? (
                  <img src={photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
                ) : avatarLetter ? (
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase' }}>
                    {avatarLetter}
                  </span>
                ) : (
                  <MdIcon name="person" style={{ fontSize: 18, color: 'var(--color-accent)' }} />
                )}
              </button>
            ) : (
              <button
                onClick={onShowLogin}
                className="flex items-center gap-1.5 text-sm font-semibold"
                style={{
                  borderRadius: 999,
                  background: 'var(--color-accent)',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  padding: '8px 20px',
                }}
              >
                Sign In
              </button>
            )}

            {/* User dropdown menu */}
            {showUserMenu && user && (
              <>
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 150 }}
                  onClick={() => setShowUserMenu(false)}
                />
                <div
                  className="fade-in"
                  style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                    background: 'var(--color-card)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 16, padding: 8, minWidth: 220,
                    boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                    zIndex: 200,
                  }}
                >
                  {/* User info */}
                  <div style={{ padding: '10px 12px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div
                        className="flex items-center justify-center shrink-0"
                        style={{
                          width: 36, height: 36, borderRadius: 99,
                          background: photoURL ? 'none' : 'var(--color-accent-dim)',
                          border: '1px solid rgba(0,122,255,0.2)',
                          overflow: 'hidden',
                        }}
                      >
                        {photoURL ? (
                          <img src={photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
                        ) : (
                          <MdIcon name="person" style={{ fontSize: 18, color: 'var(--color-accent)' }} />
                        )}
                      </div>
                      <div className="min-w-0">
                        {user.displayName && (
                          <div className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                            {user.displayName}
                          </div>
                        )}
                        <div className="text-xs truncate" style={{ color: 'var(--color-text-tertiary)' }}>
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sign out */}
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 w-full text-left"
                    style={{
                      padding: '10px 12px', borderRadius: 12,
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--color-nogo)', fontSize: 14, fontWeight: 500,
                      fontFamily: 'inherit',
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

      {/* Mobile bottom nav — sky gradient glass */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center"
        style={{
          height: 64,
          background: 'linear-gradient(180deg, rgba(0,18,51,0.88) 0%, rgba(2,62,138,0.92) 50%, rgba(0,119,182,0.85) 100%)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          borderTop: '1px solid rgba(72,202,228,0.15)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          boxShadow: '0 -4px 20px rgba(0,18,51,0.5)',
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
                    width: 40, height: 32, borderRadius: 12,
                    background: isActive ? 'rgba(72,202,228,0.2)' : 'transparent',
                    border: isActive ? '1px solid rgba(72,202,228,0.25)' : '1px solid transparent',
                    transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                >
                  <MdIcon name={link.icon} style={{ fontSize: 22, color: isActive ? '#48CAE4' : 'rgba(255,255,255,0.45)' }} />
                </div>
                <span style={{ color: isActive ? '#48CAE4' : 'rgba(255,255,255,0.45)' }}>{link.label}</span>
              </>
            )}
          </NavLink>
        ))}
        {/* Mobile account button */}
        <button
          onClick={user ? () => setShowUserMenu(!showUserMenu) : onShowLogin}
          className="flex flex-col items-center gap-1 py-2 text-[10px] font-semibold"
          style={{
            letterSpacing: '0.3px',
            color: user ? '#48CAE4' : 'rgba(255,255,255,0.45)',
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <div
            className="flex items-center justify-center"
            style={{
              width: 40, height: 32, borderRadius: 12,
              background: user ? 'rgba(72,202,228,0.2)' : 'transparent',
              border: user ? '1px solid rgba(72,202,228,0.25)' : '1px solid transparent',
              transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
              overflow: 'hidden',
            }}
          >
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" style={{ width: 22, height: 22, borderRadius: 99, objectFit: 'cover' }} referrerPolicy="no-referrer" />
            ) : (
              <MdIcon name="person" style={{ fontSize: 22, color: 'rgba(255,255,255,0.45)' }} />
            )}
          </div>
          {user ? 'Account' : 'Sign In'}
        </button>
      </nav>

      {/* Mobile user menu (shown as bottom sheet) */}
      {showUserMenu && user && (
        <div className="md:hidden fixed inset-0 z-[700]">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowUserMenu(false)} />
          <div
            className="absolute bottom-16 left-0 right-0 fade-in"
            style={{
              background: 'linear-gradient(180deg, rgba(0,18,51,0.95) 0%, rgba(2,62,138,0.97) 100%)',
              backdropFilter: 'blur(24px) saturate(180%)',
              WebkitBackdropFilter: 'blur(24px) saturate(180%)',
              borderTop: '1px solid rgba(72,202,228,0.15)',
              borderRadius: '22px 22px 0 0',
              padding: '24px 20px',
              boxShadow: '0 -8px 40px rgba(0,18,51,0.6)',
            }}
          >
            <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'rgba(255,255,255,0.15)' }} />

            {/* User info */}
            <div className="flex items-center gap-3 mb-5">
              <div
                className="flex items-center justify-center shrink-0"
                style={{
                  width: 48, height: 48, borderRadius: 99,
                  background: photoURL ? 'none' : 'var(--color-accent-dim)',
                  border: '1px solid rgba(0,122,255,0.2)',
                  overflow: 'hidden',
                }}
              >
                {photoURL ? (
                  <img src={photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
                ) : (
                  <MdIcon name="person" style={{ fontSize: 24, color: 'var(--color-accent)' }} />
                )}
              </div>
              <div className="min-w-0">
                {user.displayName && (
                  <div className="text-base font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>
                    {user.displayName}
                  </div>
                )}
                <div className="text-xs truncate" style={{ color: 'var(--color-text-tertiary)' }}>
                  {user.email}
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold"
              style={{
                borderRadius: 16,
                background: 'rgba(255,69,58,0.12)',
                border: '1px solid rgba(255,69,58,0.2)',
                color: '#FF453A',
                cursor: 'pointer',
                fontFamily: 'inherit',
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
