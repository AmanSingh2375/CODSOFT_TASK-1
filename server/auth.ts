import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'edumanage_jwt_secure_secret_key_default_2026';

export interface TokenPayload {
  id: number;
  username: string;
  email: string;
  role: string;
  full_name: string;
  student_id?: string;
  department?: string;
}

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (err) {
    return null;
  }
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Access token required. Please sign in.',
    });
    return;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(403).json({
      success: false,
      error: 'Invalid or expired authentication token. Please sign in again.',
    });
    return;
  }

  req.user = decoded;
  next();
}
