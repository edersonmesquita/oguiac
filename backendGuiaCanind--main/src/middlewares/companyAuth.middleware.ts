import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';

interface TokenPayload {
  id: string;
  email: string;
  type: string;
}

// Extend the Request type to include companyId
declare global {
  namespace Express {
    interface Request {
      companyId?: string;
    }
  }
}

export const companyAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2) {
    return res.status(401).json({ error: 'Token error' });
  }

  const [scheme, token] = parts;

  if (!/^Bearer$/i.test(scheme)) {
    return res.status(401).json({ error: 'Token malformatted' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as TokenPayload;
    
    if (decoded.type !== 'company') {
      return res.status(403).json({ error: 'Not authorized as company' });
    }
    
    const company = await prisma.company.findUnique({
      where: { id: decoded.id }
    });
    
    if (!company) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    req.companyId = decoded.id;
    
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}; 