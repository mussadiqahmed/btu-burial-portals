import { Request, Response, NextFunction } from 'express';

export type PensionersRole = 'admin' | 'manager' | 'data_analyst';

const ACCESS_ROLES: PensionersRole[] = ['admin', 'manager', 'data_analyst'];
const WRITE_ROLES: PensionersRole[] = ['admin', 'manager'];

export function getUserRole(req: Request): string {
  const header = req.headers['x-user-role'];
  if (typeof header === 'string') {
    return header.trim().toLowerCase();
  }
  return '';
}

export function canAccessPensioners(role: string): boolean {
  return ACCESS_ROLES.includes(role as PensionersRole);
}

export function canWritePensioners(role: string): boolean {
  return WRITE_ROLES.includes(role as PensionersRole);
}

export function isAdmin(role: string): boolean {
  return role === 'admin';
}

export function requireAccess(req: Request, res: Response, next: NextFunction): void {
  const role = getUserRole(req);
  if (!canAccessPensioners(role)) {
    res.status(403).json({ detail: 'Access denied' });
    return;
  }
  next();
}

export function requireWrite(req: Request, res: Response, next: NextFunction): void {
  const role = getUserRole(req);
  if (!canWritePensioners(role)) {
    res.status(403).json({ detail: 'Write access denied' });
    return;
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const role = getUserRole(req);
  if (!isAdmin(role)) {
    res.status(403).json({ detail: 'Admin access required' });
    return;
  }
  next();
}
