import { Request, Response, NextFunction } from 'express';
import { t } from '../../i18n';

// Express Request interface is declared in auth.middleware.ts

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
