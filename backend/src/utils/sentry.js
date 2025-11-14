/**
 * Sentry Error Tracking Configuration
 *
 * Sentry ile hata takibi ve performance monitoring
 * DSN yoksa otomatik olarak devre dışı kalır
 */

const Sentry = require('@sentry/node');

/**
 * Initialize Sentry
 * DSN yoksa veya boşsa Sentry başlatılmaz
 */
function initSentry() {
  const sentryDsn = process.env.SENTRY_DSN;

  // DSN yoksa Sentry'yi başlatma
  if (!sentryDsn || sentryDsn.trim() === '') {
    console.log('ℹ️  Sentry DSN not configured. Error tracking disabled.');
    console.log('ℹ️  To enable Sentry, add SENTRY_DSN to your .env file');
    console.log('ℹ️  Get your DSN from: https://sentry.io/');
    return false;
  }

  try {
    // Profiling modülünü sadece DSN varsa yükle (native binding gerektirir)
    let nodeProfilingIntegration = null;
    try {
      const profilingModule = require('@sentry/profiling-node');
      nodeProfilingIntegration = profilingModule.nodeProfilingIntegration;
    } catch (profilingError) {
      console.warn('⚠️  Sentry profiling module not available. Profiling disabled.');
      console.warn('   This is normal if native bindings are not installed.');
    }

    const integrations = [];
    if (nodeProfilingIntegration) {
      integrations.push(nodeProfilingIntegration());
    }

    Sentry.init({
      dsn: sentryDsn,
      environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',

      // Performance Monitoring
      tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE) || 1.0,

      // Profiling (sadece modül yüklenebildiyse)
      ...(nodeProfilingIntegration && {
        profilesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE) || 1.0,
      }),
      integrations,

      // Release tracking
      release: process.env.npm_package_version,

      // Beforeeç Send - filter sensitive data
      beforeSend(event, hint) {
        // Filter out passwords from request data
        if (event.request && event.request.data) {
          try {
            const data = JSON.parse(event.request.data);
            if (data.password) {
              data.password = '[FILTERED]';
            }
            event.request.data = JSON.stringify(data);
          } catch (e) {
            // Ignore JSON parse errors
          }
        }

        // Filter query params that might contain sensitive data
        if (event.request && event.request.query_string) {
          event.request.query_string = event.request.query_string
            .replace(/password=[^&]*/gi, 'password=[FILTERED]')
            .replace(/token=[^&]*/gi, 'token=[FILTERED]');
        }

        return event;
      },
    });

    console.log('✅ Sentry initialized successfully');
    console.log(`   Environment: ${process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV}`);
    console.log(`   Traces Sample Rate: ${parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE) || 1.0}`);

    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Sentry:', error.message);
    return false;
  }
}

/**
 * Capture exception manually
 * @param {Error} error - Error object
 * @param {Object} context - Additional context
 */
function captureException(error, context = {}) {
  if (!Sentry.isEnabled()) {
    console.error('Error (Sentry disabled):', error);
    return;
  }

  Sentry.withScope((scope) => {
    // Add context
    if (context.user) {
      scope.setUser({
        id: context.user.id,
        email: context.user.email,
        role: context.user.role,
      });
    }

    if (context.request) {
      scope.setContext('request', {
        method: context.request.method,
        url: context.request.url,
        ip: context.request.ip,
      });
    }

    if (context.tags) {
      Object.keys(context.tags).forEach(key => {
        scope.setTag(key, context.tags[key]);
      });
    }

    if (context.extra) {
      scope.setContext('extra', context.extra);
    }

    Sentry.captureException(error);
  });
}

/**
 * Capture message manually
 * @param {string} message - Message to capture
 * @param {string} level - Severity level (info, warning, error)
 */
function captureMessage(message, level = 'info') {
  if (!Sentry.isEnabled()) {
    console.log(`Message (Sentry disabled - ${level}):`, message);
    return;
  }

  Sentry.captureMessage(message, level);
}

/**
 * Add breadcrumb for debugging
 * @param {Object} breadcrumb - Breadcrumb data
 */
function addBreadcrumb(breadcrumb) {
  if (!Sentry.isEnabled()) {
    return;
  }

  Sentry.addBreadcrumb(breadcrumb);
}

/**
 * Fastify error handler with Sentry integration
 */
function sentryErrorHandler(fastify) {
  fastify.setErrorHandler((error, request, reply) => {
    // Log to Fastify logger
    fastify.log.error(error);

    // Capture to Sentry
    captureException(error, {
      user: request.user,
      request: {
        method: request.method,
        url: request.url,
        ip: request.ip,
      },
      tags: {
        route: request.routerPath,
        method: request.method,
      },
      extra: {
        params: request.params,
        query: request.query,
        headers: {
          ...request.headers,
          authorization: request.headers.authorization ? '[FILTERED]' : undefined,
        },
      },
    });

    // Determine status code
    const statusCode = error.statusCode || 500;

    // Send response
    reply.status(statusCode).send({
      success: false,
      error: error.name || 'Internal Server Error',
      message: process.env.NODE_ENV === 'production'
        ? 'An error occurred. Our team has been notified.'
        : error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    });
  });
}

module.exports = {
  initSentry,
  captureException,
  captureMessage,
  addBreadcrumb,
  sentryErrorHandler,
  Sentry,
};
