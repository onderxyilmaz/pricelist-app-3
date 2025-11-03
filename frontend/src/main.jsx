import React from 'react'
import ReactDOM from 'react-dom/client'
import * as Sentry from '@sentry/react'
import App from './App.jsx'
import './index.css'

// Initialize Sentry - only if DSN is configured
const sentryDsn = import.meta.env.VITE_SENTRY_DSN;

if (sentryDsn && sentryDsn.trim() !== '') {
  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE || 'development',

    // Performance Monitoring
    tracesSampleRate: parseFloat(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE) || 1.0,

    // Session Replay (optional)
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],

    // Filter sensitive data
    beforeSend(event, hint) {
      // Remove passwords from form data
      if (event.request && event.request.data) {
        try {
          const data = typeof event.request.data === 'string'
            ? JSON.parse(event.request.data)
            : event.request.data;

          if (data.password) {
            data.password = '[FILTERED]';
          }

          event.request.data = typeof event.request.data === 'string'
            ? JSON.stringify(data)
            : data;
        } catch (e) {
          // Ignore JSON parse errors
        }
      }

      return event;
    },
  });

  console.log('✅ Sentry initialized successfully');
  console.log(`   Environment: ${import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE}`);
} else {
  console.log('ℹ️  Sentry DSN not configured. Error tracking disabled.');
  console.log('ℹ️  To enable Sentry, add VITE_SENTRY_DSN to your .env file');
  console.log('ℹ️  Get your DSN from: https://sentry.io/');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <Sentry.ErrorBoundary
    fallback={({ error, componentStack, resetError }) => (
      <div style={{
        padding: '40px',
        maxWidth: '800px',
        margin: '0 auto',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          background: '#fee',
          border: '2px solid #c33',
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '20px'
        }}>
          <h1 style={{ color: '#c33', margin: '0 0 16px 0' }}>
            Bir Hata Oluştu
          </h1>
          <p style={{ margin: '0 0 16px 0', color: '#666' }}>
            Üzgünüz, bir şeyler ters gitti. Lütfen sayfayı yenilemeyi deneyin.
          </p>
          {import.meta.env.MODE === 'development' && (
            <details style={{ marginTop: '20px' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '8px' }}>
                Hata Detayları (Sadece Geliştirme Ortamı)
              </summary>
              <pre style={{
                background: '#f5f5f5',
                padding: '12px',
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '12px',
                margin: '8px 0 0 0'
              }}>
                {error.toString()}
                {componentStack}
              </pre>
            </details>
          )}
          <button
            onClick={resetError}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              background: '#1890ff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    )}
    showDialog
  >
    <App />
  </Sentry.ErrorBoundary>
)
