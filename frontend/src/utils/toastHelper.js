import { toast as hotToast } from 'react-hot-toast';

// Custom toast wrapper that adds a close button
const createToastWithClose = (message, type = 'success', options = {}) => {
  return hotToast.custom(
    (t) => (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#1f2937',
          color: '#fff',
          border: '2px solid #2563eb',
          borderRadius: '12px',
          padding: '12px 16px',
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          gap: '12px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flex: 1,
          }}
        >
          {type === 'success' && (
            <span style={{ fontSize: '20px' }}>✅</span>
          )}
          {type === 'error' && (
            <span style={{ fontSize: '20px' }}>❌</span>
          )}
          {type === 'loading' && (
            <span style={{ fontSize: '20px' }}>⏳</span>
          )}
          <span style={{ fontSize: '14px', lineHeight: '1.5' }}>{message}</span>
        </div>
        <button
          onClick={() => hotToast.dismiss(t.id)}
          style={{
            color: '#fff',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            fontSize: '24px',
            fontWeight: 'bold',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '6px',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'all 0.2s ease',
            lineHeight: '1',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          aria-label="Close notification"
          title="Close"
        >
          ×
        </button>
      </div>
    ),
    {
      duration: type === 'error' ? 5000 : type === 'loading' ? Infinity : 3000,
      position: 'top-right',
      ...options,
    }
  );
};

// Export custom toast functions
export const toast = {
  success: (message, options) => createToastWithClose(message, 'success', options),
  error: (message, options) => createToastWithClose(message, 'error', options),
  loading: (message, options) => createToastWithClose(message, 'loading', options),
  dismiss: hotToast.dismiss,
};

