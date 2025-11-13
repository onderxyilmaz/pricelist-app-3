const jwt = require('jsonwebtoken');

/**
 * JWT Authentication Middleware
 * Verifies JWT token from Authorization header
 */
async function authMiddleware(request, reply) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.code(401).send({
        success: false,
        message: 'Token bulunamadı. Lütfen giriş yapın.'
      });
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Add user info to request object
    request.user = decoded;

    // Continue to next handler
    return;

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return reply.code(401).send({
        success: false,
        message: 'Geçersiz token. Lütfen tekrar giriş yapın.'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return reply.code(401).send({
        success: false,
        message: 'Token süresi doldu. Lütfen tekrar giriş yapın.'
      });
    }

    return reply.code(500).send({
      success: false,
      message: 'Token doğrulanırken bir hata oluştu.'
    });
  }
}

/**
 * Role-based authorization middleware
 * Checks if user has required role
 */
function requireRole(allowedRoles) {
  return async function(request, reply) {
    if (!request.user) {
      return reply.code(401).send({
        success: false,
        message: 'Kimlik doğrulaması gerekli.'
      });
    }

    if (!allowedRoles.includes(request.user.role)) {
      return reply.code(403).send({
        success: false,
        message: 'Bu işlem için yetkiniz yok.'
      });
    }

    // Continue to next handler
    return;
  };
}

module.exports = { authMiddleware, requireRole };
