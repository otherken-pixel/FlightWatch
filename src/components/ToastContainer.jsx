import useStore from '../store/useStore';

const icons = {
  takeoff: '🛫',
  landing: '🛬',
  warning: '⚠️',
  info: 'ℹ️',
};

const bgColors = {
  takeoff: 'bg-navy-light border-amber/40',
  landing: 'bg-navy-light border-green-500/40',
  warning: 'bg-navy-light border-warning/40',
  info: 'bg-navy-light border-sky-dim/40',
};

export default function ToastContainer() {
  const toasts = useStore(s => s.toasts);
  const removeToast = useStore(s => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[1000] flex flex-col gap-2 w-[90%] max-w-sm">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`toast-enter rounded-xl border px-4 py-3 shadow-xl backdrop-blur-sm ${bgColors[toast.type] || bgColors.info}`}
          onClick={() => removeToast(toast.id)}
        >
          <div className="flex items-start gap-3">
            <span className={`text-xl ${toast.type === 'takeoff' ? 'liftoff-icon' : ''}`}>
              {icons[toast.type] || icons.info}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-display font-semibold text-sm text-sky">{toast.title}</p>
              <p className="text-xs text-sky-dim mt-0.5">{toast.message}</p>
            </div>
            <button
              className="text-sky-dim hover:text-sky text-lg leading-none"
              onClick={(e) => { e.stopPropagation(); removeToast(toast.id); }}
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
