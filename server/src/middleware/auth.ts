import { Request, Response, NextFunction } from 'express';

// Mock authentication middleware for development
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  // For development, always allow access
  // In production, this would verify JWT tokens, check user permissions, etc.
  
  // Mock user data
  req.user = {
    id: 'admin-1',
    email: 'admin@aqaraty.com',
    roles: ['WEBSITE_ADMIN'],
    name: 'Website Admin'
  };
  
  next();
};

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        roles: string[];
        name: string;
      };
    }
  }
}
