// Simple authentication middleware
// In production, this should be replaced with proper JWT or session-based auth
const authenticate = (req, res, next) => {
  // For now, we'll use a simple header-based auth
  // In a real app, this would validate JWT tokens or session cookies
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header required' });
  }

  // Extract address from header (in production, this would come from JWT)
  const address = authHeader.replace('Bearer ', '');
  
  // Basic address validation
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
