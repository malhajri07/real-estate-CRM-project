/**
 * fal-license.middleware.ts — FAL License Enforcement
 *
 * Per نظام الوساطة العقارية (Article 4):
 * "لا يجوز ممارسة الوساطة العقارية أو تقديم الخدمات العقارية إلا بترخيص"
 * No one may practice brokerage or provide real estate services without a license.
 *
 * This middleware checks that the authenticated agent has a valid FAL license
 * before allowing protected operations (create listing, broker request, deal).
 */

import { Request, Response, NextFunction } from "express";
import { prisma } from "../../prismaClient";
import { validateFalExpiry } from "../validators/saudi-regulation.validators";

/**
 * Requires the agent to have a FAL license in their profile.
 * Blocks: listing creation, broker requests, deal creation.
 * Does NOT block: viewing, profile updates, settings.
 */
export async function requireFalLicense(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user;
    if (!user?.id) {
      return res.status(401).json({ message: "يجب تسجيل الدخول" });
    }

    // Admin users bypass FAL check
    const roles = typeof user.roles === "string" ? JSON.parse(user.roles) : user.roles;
    if (Array.isArray(roles) && roles.includes("WEBSITE_ADMIN")) {
      return next();
    }

    const agentProfile = await prisma.agent_profiles.findUnique({
      where: { userId: user.id },
      select: { falLicenseNumber: true, falExpiresAt: true, falStatus: true },
    });

    if (!agentProfile?.falLicenseNumber) {
      return res.status(403).json({
        message: "يجب تسجيل رخصة فال قبل ممارسة النشاط العقاري",
        code: "FAL_REQUIRED",
        details: "حسب المادة 4 من نظام الوساطة العقارية، لا يجوز ممارسة الوساطة أو تقديم الخدمات العقارية إلا بترخيص من الهيئة العامة للعقار.",
      });
    }

    // Check expiry
    const expiryCheck = validateFalExpiry(agentProfile.falExpiresAt);
    if (!expiryCheck.valid) {
      return res.status(403).json({
        message: "رخصة فال منتهية الصلاحية",
        code: "FAL_EXPIRED",
        details: expiryCheck.warning,
      });
    }

    // Attach FAL info to request for downstream use
    (req as any).falLicense = {
      number: agentProfile.falLicenseNumber,
      expiresAt: agentProfile.falExpiresAt,
      status: agentProfile.falStatus,
      daysRemaining: expiryCheck.daysRemaining,
      expiryWarning: expiryCheck.warning,
    };

    next();
  } catch (error) {
    console.error("FAL license check error:", error);
    next(); // Fail open — don't block on DB errors
  }
}
