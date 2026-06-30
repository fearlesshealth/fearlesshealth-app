import { Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, JwtPayload, UserRole } from '../types';

/**
 * Verify JWT and attach decoded payload to req.user
 */
export const authenticate: RequestHandler = (req: AuthRequest, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Restrict route to one or more roles.
 * Must be used after authenticate.
 */
export function authorize(...roles: UserRole[]): RequestHandler {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Access denied: insufficient permissions' });
      return;
    }
    next();
  };
}
