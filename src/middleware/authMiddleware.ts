import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    username: string;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'No token, authorization denied' });
  }

  const secret = process.env.JWT_SECRET || 'secret';

  try {
    const decoded = jwt.verify(token, secret) as { id: string; role: string; username: string };
    req.user = decoded;
    next();
  } catch (error) {
    console.error(`Auth failed for token: ${token.substring(0, 10)}... Error:`, (error as any).message);
    res.status(401).json({ error: 'Token is not valid' });
  }
};

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(403).json({ error: 'Access denied: Insufficient permissions' });
    }

    if (req.user.role === 'SYSTEM_ADMINISTRATOR' || roles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({ error: 'Access denied: Insufficient permissions' });
  };
};
