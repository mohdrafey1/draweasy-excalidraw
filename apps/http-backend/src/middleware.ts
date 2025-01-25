import { NextFunction, Response, Request } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { JWT_SECRET } from './config';

interface DecodedToken extends JwtPayload {
    userId: string;
}

declare global {
    namespace Express {
        interface Request {
            userId?: string;
        }
    }
}

export function middleware(req: Request, res: Response, next: NextFunction) {
    const token = req.headers['authorization'] ?? '';

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;

        if (decoded && decoded.userId) {
            req.userId = decoded.userId;
            next();
        } else {
            res.status(403).json({
                message: 'Unauthorized',
            });
        }
    } catch (error) {
        res.status(403).json({
            message: 'Invalid token',
        });
    }
}
