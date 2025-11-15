/**
 * Authentication Middleware
 * Simple header-based auth for development
 * In production, this should be replaced with proper JWT or session-based auth
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header required' });
  }

  // Extract address from header (in production, this would come from JWT)
  const address = authHeader.replace('Bearer ', '');
  
  // Basic address validation (Algorand addresses are 58 characters)
  if (!/^[A-Z2-7]{58}$/.test(address)) {
    return res.status(401).json({ error: 'Invalid address format' });
  }

  // Add user info to request
  req.user = { address };
  next();
};

module.exports = {
  authenticate
};
