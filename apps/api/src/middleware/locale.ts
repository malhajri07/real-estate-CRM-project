import { Request, Response, NextFunction } from 'express';
import { t } from '../../i18n';

// Extend Express Request interface locally or assume global declaration exists
declare global {
    namespace Express {
        interface Request {
            t: (key: string) => string;
            locale: string;
        }
    }
}

export const localeMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers['accept-language'];
    const locale = header?.split(',')[0]?.split('-')[0] || 'ar'; // Default to Arabic

    // Inject into request/response cycle
    (req as any).locale = locale;
    res.locals.locale = locale;

    // Inject translation helper
    (req as any).t = (key: string) => t(key as any, locale);

    next();
};
