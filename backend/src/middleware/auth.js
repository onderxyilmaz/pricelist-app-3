/**
 * JWT Authentication Middleware
 * Verifies JWT tokens and attaches user data to request
 */

/**
 * Middleware to verify JWT token
 * Adds user data to request.user if token is valid
 */
async function authenticate(request, reply) {
  try {
    // Verify JWT token from Authorization header
    await request.jwtVerify();

    // Token is valid, user data is now available in request.user
    // Format: { id, email, role, iat, exp }
  } catch (err) {
    reply.code(401).send({
      error: 'Unauthorized',
      message: 'Invalid or expired token'
    });
  }
}

/**
 * Middleware to check if user has admin or super_admin role
 */
async function requireAdmin(request, reply) {
  try {
    // First authenticate
    await request.jwtVerify();

    const { role } = request.user;

    if (role !== 'admin' && role !== 'super_admin') {
      reply.code(403).send({
        error: 'Forbidden',
        message: 'Admin access required'
      });
      return;
    }
  } catch (err) {
    reply.code(401).send({
      error: 'Unauthorized',
      message: 'Invalid or expired token'
    });
  }
}

/**
 * Middleware to check if user has super_admin role
 */
async function requireSuperAdmin(request, reply) {
  try {
    // First authenticate
    await request.jwtVerify();

    const { role } = request.user;

    if (role !== 'super_admin') {
      reply.code(403).send({
        error: 'Forbidden',
        message: 'Super admin access required'
      });
      return;
    }
  } catch (err) {
    reply.code(401).send({
      error: 'Unauthorized',
      message: 'Invalid or expired token'
    });
  }
}

/**
 * Optional authentication - doesn't fail if no token
 * Just attaches user data if token exists and is valid
 */
async function optionalAuth(request, reply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    // Ignore errors, make it optional
    request.user = null;
  }
}

module.exports = {
  authenticate,
  requireAdmin,
  requireSuperAdmin,
  optionalAuth
};
