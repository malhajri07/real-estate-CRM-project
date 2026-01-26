import { Request, Response, NextFunction } from 'express';

export const localeMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers['accept-language'];
    const locale = header?.split(',')[0]?.split('-')[0] || 'ar'; // Default to Arabic

    // Inject into request/response cycle
    (req as any).locale = locale;
    res.locals.locale = locale;

    next();
};
