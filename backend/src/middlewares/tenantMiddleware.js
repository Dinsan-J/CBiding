// Strict Multi-Tenancy Middleware
// Ensures all queries and creations are scoped to the authenticated tenant
exports.enforceTenant = (req, res, next) => {
  // Super admins have cross-tenant clearance when explicitly specified
  if (req.user && req.user.role === 'SUPER_ADMIN') {
    if (req.headers['x-tenant-id']) {
      req.tenantId = req.headers['x-tenant-id'];
    }
    return next();
  }

  if (!req.tenantId) {
    return res.status(403).json({
      success: false,
      error: 'Tenant context missing. Access denied.'
    });
  }

  next();
};
