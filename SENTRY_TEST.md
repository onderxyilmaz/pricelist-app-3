# Sentry Error Tracking - Test Guide

## Setup Complete ✅

Sentry has been successfully integrated into both frontend and backend.

### What Was Implemented:

#### Backend (Fastify)
- **File**: `backend/src/utils/sentry.js`
- **Configuration**: Initialized in `backend/server.js`
- Features:
  - Automatic error tracking for all uncaught exceptions
  - Performance monitoring (tracing)
  - Node.js profiling
  - Sensitive data filtering (passwords, tokens)
  - Custom error capturing with context
  - Fastify error handler integration

#### Frontend (React)
- **Configuration**: `frontend/src/main.jsx`
- **API Integration**: `frontend/src/utils/api.js`
- Features:
  - React Error Boundary (catches React component errors)
  - Browser tracing for performance monitoring
  - Session replay (captures user sessions with errors)
  - API error tracking (automatically captures HTTP errors)
  - Sensitive data filtering (passwords from forms)
  - Custom error UI in Turkish

### Environment Variables

#### Backend `.env`:
```bash
# Sentry Configuration (Optional - leave empty to disable)
SENTRY_DSN=
SENTRY_ENVIRONMENT=development
SENTRY_TRACES_SAMPLE_RATE=1.0
```

#### Frontend `.env`:
```bash
# Sentry Configuration (Optional - leave empty to disable)
VITE_SENTRY_DSN=
VITE_SENTRY_ENVIRONMENT=development
VITE_SENTRY_TRACES_SAMPLE_RATE=1.0
```

### How to Enable Sentry:

1. **Create a Sentry Account**: Go to https://sentry.io/
2. **Create a Project**:
   - For backend: Create a Node.js/Express project
   - For frontend: Create a React project
3. **Get DSN**: Copy the DSN from project settings
4. **Add to .env files**: Paste DSN into both backend and frontend `.env` files

### Testing Error Tracking (Without DSN):

Even without a DSN configured, you can verify Sentry is working by checking console logs:

#### Test Backend Errors:

1. Open browser console
2. Make an API call that triggers an error
3. Check backend terminal for error logs

#### Test Frontend Errors:

**Method 1: Trigger React Error**
```javascript
// Open browser console and paste:
throw new Error('Test error from console');
```

**Method 2: Trigger API Error**
```javascript
// Open browser console and paste:
import * as Sentry from '@sentry/react';
Sentry.captureMessage('Test message from console', 'info');
```

**Method 3: Force Component Error**
- Temporarily modify any component to throw an error
- You should see the custom error boundary UI in Turkish

### Console Logs to Verify:

#### Backend (when started):
```
ℹ️  Sentry DSN not configured. Error tracking disabled.
ℹ️  To enable Sentry, add SENTRY_DSN to your .env file
ℹ️  Get your DSN from: https://sentry.io/
```

#### Frontend (in browser console):
```
ℹ️  Sentry DSN not configured. Error tracking disabled.
ℹ️  To enable Sentry, add VITE_SENTRY_DSN to your .env file
ℹ️  Get your DSN from: https://sentry.io/
```

### What Gets Tracked:

#### Backend:
- ✅ All uncaught exceptions
- ✅ Route handler errors
- ✅ Database errors
- ✅ JWT authentication errors (with context)
- ✅ API validation errors
- ✅ Performance traces
- ✅ User context (email, role)
- ✅ Request context (method, URL, IP)
- ❌ Passwords (filtered out)
- ❌ Authorization tokens (filtered out)

#### Frontend:
- ✅ React component errors (via Error Boundary)
- ✅ API/HTTP errors (via axios interceptor)
- ✅ Unhandled promise rejections
- ✅ Performance traces
- ✅ User interactions (with session replay)
- ✅ Component stack traces
- ❌ Passwords (filtered out)
- ❌ Form sensitive data (filtered out)

### Benefits:

1. **Production Monitoring**: Track real user errors in production
2. **Performance Insights**: Monitor slow API calls and page loads
3. **Session Replay**: Watch user sessions that encountered errors
4. **User Context**: Know which users are affected by errors
5. **Stack Traces**: Get detailed error information
6. **Alerts**: Get notified when errors occur (via Sentry dashboard)
7. **Error Trends**: See which errors are most common

### Next Steps:

1. ✅ Sentry integration complete
2. ⏭️ Continue with next high-priority task: **Input Validation with Joi/Zod**

### Documentation:

- Sentry Node.js Docs: https://docs.sentry.io/platforms/node/
- Sentry React Docs: https://docs.sentry.io/platforms/javascript/guides/react/
