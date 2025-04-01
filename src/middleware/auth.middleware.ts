import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role, RolePermissions } from '../interfaces/role.interface';
import { HttpException } from './error.middleware';
import { User } from '../models/user.model';

interface AuthToken {
  id: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthToken;
    }
  }
}

export const authGuard = (allowedRoles: Role[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new HttpException(401, 'No authentication token provided');
      }

      const token = authHeader.split(' ')[1];
      if (!token) {
        throw new HttpException(401, 'Invalid authentication token');
      }

      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT_SECRET is not configured');
      }

      const decoded = jwt.verify(token, jwtSecret) as AuthToken;
      if (!decoded || !decoded.id || !decoded.role) {
        throw new HttpException(401, 'Invalid token payload');
      }

      const validateRole = await User.exists({
        role: decoded.role,
        _id: decoded.id
      })

      if(!validateRole) {
        throw new HttpException(403, 'Invalid Token');
      }

      if (!allowedRoles.includes(decoded.role)) {
        throw new HttpException(403, 'Insufficient permissions');
      }

      req.user = decoded;
      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        next(new HttpException(401, 'Invalid authentication token'));
      } else {
        next(error);
      }
    }
  };
};

export const actionGuard = (requiredAction: string, requiredResource: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new HttpException(401, 'User not authenticated');
    }

    const userRole = req.user.role;
    const userPermissions = RolePermissions[userRole] || [];

    const hasPermission = userPermissions.some(
      (perm) => perm.action === requiredAction && perm.resource === requiredResource
    );

    if (!hasPermission) {
      throw new HttpException(403, 'Insufficient permissions');
    }

    next();
  };
};

export const depositWebhookToken = () => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new HttpException(401, 'No authentication token provided');
      }
      
      const token = authHeader.split(' ')[1];
      if (!token) {
        throw new HttpException(401, 'Invalid authentication token');
      }

      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT_SECRET is not configured');
      }

      const decoded = jwt.verify(token, jwtSecret) as AuthToken;

      if (!decoded || !decoded.id || !decoded.role) {
        throw new HttpException(401, 'Invalid token payload');
      }

      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        next(new HttpException(401, 'Invalid authentication token'));
      } else {
        next(error);
      }
    }
  };
};

