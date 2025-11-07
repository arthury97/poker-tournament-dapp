# 📊 Error Tracking Setup Guide

This guide will help you set up error tracking and monitoring for the Staked DApp using Sentry (or alternatives).

---

## 🎯 Why Error Tracking?

Error tracking helps you:
- 🐛 Catch bugs before users report them
- 📈 Monitor application health in real-time
- 🔍 Debug issues with full context
- 📊 Track error trends and patterns
- ⚡ Get alerted when critical errors occur

---

## Option 1: Sentry (Recommended)

### Features
- Free tier: 5,000 errors/month
- React integration
- Source map support
- User context tracking
- Performance monitoring
- Release tracking

### Setup Steps

#### 1. Create Sentry Account

1. Go to https://sentry.io/signup/
2. Create a new project
3. Select "React" as platform
4. Copy your DSN (Data Source Name)

#### 2. Install Sentry SDK

```bash
cd frontend
npm install --save @sentry/react
```

#### 3. Configure Sentry

Create `frontend/src/config/sentry.js`:

```javascript
import * as Sentry from "@sentry/react";

export const initSentry = () => {
  // Only initialize in production
  if (process.env.NODE_ENV === 'production') {
    Sentry.init({
      dsn: process.env.REACT_APP_SENTRY_DSN || "YOUR_SENTRY_DSN_HERE",
      environment: process.env.NODE_ENV,
      
      // Set sample rate for performance monitoring
      tracesSampleRate: 0.1, // 10% of transactions
      
      // Capture 100% of errors
      sampleRate: 1.0,
      
      // Filter out some errors
      beforeSend(event, hint) {
        // Don't send errors from browser extensions
        if (event.exception) {
          const error = hint.originalException;
          if (error && error.message && error.message.includes('chrome-extension://')) {
            return null;
          }
        }
        return event;
      },
      
      // Add custom tags
      initialScope: {
        tags: {
          app: "staked-dapp",
          version: "1.0.0"
        }
      }
    });
  }
};

// Export Sentry for use in components
export { Sentry };
```

#### 4. Update `frontend/src/index.js`

```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { initSentry } from './config/sentry';

// Initialize Sentry before app renders
initSentry();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

#### 5. Add Error Boundary

Create `frontend/src/components/ErrorBoundary.js`:

```javascript
import React from 'react';
import { Sentry } from '../config/sentry';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log to Sentry
    if (process.env.NODE_ENV === 'production') {
      Sentry.captureException(error, { contexts: { react: errorInfo } });
    } else {
      console.error('Error caught by boundary:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
          padding: '20px',
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '40px',
            maxWidth: '500px',
            textAlign: 'center',
          }}>
            <h1 style={{ color: '#dc2626', marginBottom: '16px' }}>
              ⚠️ Something went wrong
            </h1>
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>
              We've been notified and are working on a fix. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

#### 6. Wrap App with Error Boundary

Update `frontend/src/App.js`:

```javascript
import ErrorBoundary from './components/ErrorBoundary';

// Wrap your app
function AppWrapper() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}

export default AppWrapper;
```

#### 7. Add Environment Variable

Add to `frontend/.env`:

```bash
REACT_APP_SENTRY_DSN=your_sentry_dsn_here
```

#### 8. Capture Custom Events

In your components, you can manually capture errors:

```javascript
import { Sentry } from './config/sentry';

// Capture exception
try {
  // some code
} catch (error) {
  Sentry.captureException(error);
  toast.error('An error occurred');
}

// Capture custom message
Sentry.captureMessage('User completed onboarding', 'info');

// Add user context
Sentry.setUser({
  id: user.uid,
  email: user.email,
  username: user.name
});

// Add tags
Sentry.setTag('wallet_connected', isConnected);
Sentry.setTag('network', chainId);
```

---

## Option 2: LogRocket

### Features
- Session replay (see what user saw)
- Console logs
- Network requests
- Redux state tracking
- 1,000 sessions/month free

### Setup

```bash
cd frontend
npm install --save logrocket
```

```javascript
// frontend/src/config/logrocket.js
import LogRocket from 'logrocket';

export const initLogRocket = () => {
  if (process.env.NODE_ENV === 'production') {
    LogRocket.init('your-app-id/your-project-name');
  }
};

// Identify users
export const identifyUser = (user) => {
  if (process.env.NODE_ENV === 'production') {
    LogRocket.identify(user.uid, {
      name: user.name,
      email: user.email,
    });
  }
};
```

---

## Option 3: Simple Console Logging (Free)

For basic monitoring without third-party services:

```javascript
// frontend/src/utils/logger.js
export const logger = {
  error: (message, error, context = {}) => {
    console.error(`[ERROR] ${message}`, {
      error: error?.message || error,
      stack: error?.stack,
      timestamp: new Date().toISOString(),
      ...context
    });
    
    // Could send to your own backend
    if (process.env.NODE_ENV === 'production') {
      fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 'error',
          message,
          error: error?.message,
          stack: error?.stack,
          context,
          timestamp: new Date().toISOString()
        })
      }).catch(() => {}); // Silent fail
    }
  },
  
  warn: (message, context = {}) => {
    console.warn(`[WARN] ${message}`, context);
  },
  
  info: (message, context = {}) => {
    console.log(`[INFO] ${message}`, context);
  }
};
```

Usage:

```javascript
import { logger } from './utils/logger';

try {
  // some code
} catch (error) {
  logger.error('Failed to create token', error, {
    tournamentName,
    userId: user.uid
  });
  toast.error('Failed to create token');
}
```

---

## 🎯 What to Track

### Critical Errors (Always Track)
- Contract transaction failures
- Wallet connection errors
- Authentication failures
- Token creation errors
- Token purchase errors

### Important Events (Track in Production)
- User sign ups
- Wallet connections
- Token creations
- Token purchases
- Large transactions (> $1000)

### Performance Metrics (Optional)
- Page load times
- Transaction confirmation times
- API response times
- RPC provider response times

---

## 📊 Monitoring Checklist

### Daily Monitoring
- [ ] Check error dashboard
- [ ] Review new errors
- [ ] Respond to critical alerts

### Weekly Monitoring
- [ ] Review error trends
- [ ] Analyze most common errors
- [ ] Review performance metrics
- [ ] Check user feedback correlation

### Monthly Monitoring
- [ ] Review error rates over time
- [ ] Analyze user behavior patterns
- [ ] Update error handling based on data
- [ ] Optimize based on performance data

---

## 🚨 Alert Configuration

### Critical Alerts (Immediate Response)
- Contract exploit detected
- Authentication system down
- RPC provider failure
- Mass transaction failures

### High Priority Alerts (1 hour response)
- Error rate > 10%
- Single error affecting > 100 users
- Performance degradation > 50%

### Medium Priority Alerts (24 hour response)
- New error type detected
- Error rate increase > 50%
- User complaints via support

---

## 📝 Implementation Checklist

### Before Launch
- [ ] Choose error tracking service
- [ ] Install and configure SDK
- [ ] Add Error Boundary
- [ ] Test error capturing in dev
- [ ] Configure alerts
- [ ] Set up notification channels

### After Launch (Week 1)
- [ ] Monitor daily
- [ ] Respond to all critical errors
- [ ] Tune alert thresholds
- [ ] Add additional context to errors
- [ ] Document common errors

### Ongoing
- [ ] Weekly error review
- [ ] Monthly trend analysis
- [ ] Quarterly service evaluation
- [ ] Continuous improvement

---

## 💡 Best Practices

1. **Don't Over-Capture**
   - Only log errors that matter
   - Filter out noise (browser extensions, etc.)
   - Respect user privacy

2. **Add Context**
   - User ID (anonymized if needed)
   - Network (mainnet/testnet)
   - Wallet connected (yes/no)
   - Transaction hash (if applicable)

3. **Sensitive Data**
   - Never log private keys
   - Never log passwords
   - Redact email addresses if needed
   - Follow GDPR guidelines

4. **Performance**
   - Use sampling in production
   - Lazy load tracking SDKs
   - Don't block app initialization

5. **Testing**
   - Test error capture in dev
   - Verify alerts work
   - Practice incident response

---

## 🔗 Resources

- **Sentry React Docs:** https://docs.sentry.io/platforms/javascript/guides/react/
- **LogRocket Docs:** https://docs.logrocket.com/
- **Error Tracking Best Practices:** https://sentry.io/resources/error-tracking-best-practices/

---

**Recommendation:** Start with Sentry free tier for comprehensive error tracking and easy setup.

