/**
 * rega.service.ts — REGA FAL License Live Verification
 *
 * Verify FAL license numbers against REGA's database in real-time.
 * Stub implementation — replace with actual REGA verification API.
 */

export interface FalVerificationResult {
  valid: boolean;
  licenseNumber: string;
  holderName?: string;
  licenseType?: string;
  issuedAt?: string;
  expiresAt?: string;
  status?: string;  // ACTIVE, EXPIRED, SUSPENDED, REVOKED
  error?: string;
}

export class RegaService {
  private baseUrl = process.env.REGA_API_URL || "https://api.rega.gov.sa";
  private apiKey = process.env.REGA_API_KEY || "";

  /**
   * Verify a FAL license number against REGA's database.
   * Cache results for 24 hours.
   */
  private cache = new Map<string, { result: FalVerificationResult; expiresAt: number }>();

  async verifyFalLicense(licenseNumber: string): Promise<FalVerificationResult> {
    // Check cache
    const cached = this.cache.get(licenseNumber);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.result;
    }

    // STUB: In production, call REGA API
    // GET {baseUrl}/api/v1/licenses/{licenseNumber}/verify
    console.log(`[REGA] Verify FAL: ${licenseNumber}`);

    // For dev: validate format (10 digits starting with 7)
    const isValidFormat = /^7\d{9}$/.test(licenseNumber) || /^\d{10}$/.test(licenseNumber);

    const result: FalVerificationResult = isValidFormat ? {
      valid: true,
      licenseNumber,
      holderName: "وسيط عقاري",
      licenseType: "BROKERAGE_MARKETING",
      status: "ACTIVE",
      issuedAt: "2024-01-01",
      expiresAt: "2026-12-31",
    } : {
      valid: false,
      licenseNumber,
      error: "رقم رخصة فال غير صالح",
    };

    // Cache for 24 hours
    this.cache.set(licenseNumber, { result, expiresAt: Date.now() + 24 * 60 * 60 * 1000 });

    return result;
  }

  /**
   * Verify a REGA advertising license number.
   */
  async verifyAdLicense(adLicenseNumber: string): Promise<{ valid: boolean; error?: string }> {
    console.log(`[REGA] Verify ad license: ${adLicenseNumber}`);
    // STUB: validate format
    return { valid: adLicenseNumber.length >= 5 };
  }
}

export const regaService = new RegaService();
