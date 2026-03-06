import useStore from '../store/useStore';

function MdIcon({ name, style }) {
  return <span className="material-symbols-rounded" style={style}>{name}</span>;
}

const icons = {
  takeoff: { name: 'flight_takeoff', color: '#FF9500' },
  landing: { name: 'flight_land', color: '#34C759' },
  warning: { name: 'warning', color: '#FF3B30' },
  info: { name: 'info', color: '#0A84FF' },
};

export default function ToastContainer() {
  const toasts = useStore(s => s.toasts);
  const removeToast = useStore(s => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[1000] flex flex-col gap-2 w-[90%] max-w-sm">
      {toasts.map(toast => {
        const ic = icons[toast.type] || icons.info;
        return (
          <div
            key={toast.id}
            className="toast-enter glass"
            style={{
              padding: '12px 16px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              cursor: 'pointer',
            }}
            onClick={() => removeToast(toast.id)}
          >
            <div className="flex items-start gap-3">
              <div
                className={toast.type === 'takeoff' ? 'liftoff-icon' : ''}
                style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: `${ic.color}22`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <MdIcon name={ic.name} style={{ fontSize: 16, color: ic.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>{toast.title}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{toast.message}</p>
              </div>
              <button
                className="text-lg leading-none"
                style={{ color: 'var(--color-text-tertiary)', background: 'none', border: 'none' }}
                onClick={(e) => { e.stopPropagation(); removeToast(toast.id); }}
              >
                <MdIcon name="close" style={{ fontSize: 16 }} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
