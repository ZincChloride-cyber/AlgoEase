import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded;
  } catch (error) {
    return null;
  }
}

export function authenticateRequest(authHeader: string | null): string | null {
  if (!authHeader) return null;
  
  const token = authHeader.replace('Bearer ', '');
  const decoded = verifyToken(token);
  return decoded?.userId || null;
}

