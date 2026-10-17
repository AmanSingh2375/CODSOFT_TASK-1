import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'edumanage-super-secure-secret-key-college-project-2026';

export interface UserPayload {
  id: number;
  email: string;
  role: 'admin' | 'teacher' | 'student';
  name: string;
  studentId?: number; // Primary key in students table if student
  studentCode?: string; // e.g. STU2024001
  teacherId?: number; // Primary key in teachers table if teacher
  teacherCode?: string; // e.g. TCH-101
}

export interface AuthRequest extends Request {
  user?: UserPayload;
}

export function generateToken(payload: UserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): UserPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserPayload;
  } catch (err) {
    return null;
  }
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access denied. No token provided.' });
    return;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(403).json({ error: 'Invalid or expired token.' });
    return;
  }

  req.user = decoded;
  next();
}

export function requireRole(allowedRoles: Array<'admin' | 'teacher' | 'student'>) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Forbidden. Requires one of [${allowedRoles.join(', ')}] role, but you are [${req.user.role}].`
      });
      return;
    }

    next();
  };
}
