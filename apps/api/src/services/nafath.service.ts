/**
 * nafath.service.ts — Nafath National Identity Verification
 *
 * Saudi national ID verification via Nafath SSO (نفاذ الوطني).
 * Stub implementation — replace with actual Nafath API when credentials available.
 *
 * Flow: initiate verification → user completes on Nafath app → callback confirms
 */

export interface NafathVerificationResult {
  verified: boolean;
  nationalId?: string;
  fullName?: string;
  dateOfBirth?: string;
  error?: string;
}

export class NafathService {
  private baseUrl = process.env.NAFATH_API_URL || "https://nafath.api.gov.sa";
  private apiKey = process.env.NAFATH_API_KEY || "";

  /**
   * Initiate identity verification request.
   * Returns a transaction ID that the user completes on Nafath app.
   */
  async initiateVerification(nationalId: string): Promise<{ transactionId: string; status: string }> {
    // STUB: In production, call Nafath API
    // POST {baseUrl}/api/v1/verify
    // Body: { nationalId, service: "REAL_ESTATE_CRM", locale: "ar" }
    console.log(`[Nafath] Initiate verification for NID: ${nationalId.substring(0, 4)}****`);

    return {
      transactionId: `NFT-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      status: "PENDING",
    };
  }

  /**
   * Check verification status (polling or callback).
   */
  async checkStatus(transactionId: string): Promise<NafathVerificationResult> {
    // STUB: In production, call Nafath API
    // GET {baseUrl}/api/v1/verify/{transactionId}/status
    console.log(`[Nafath] Check status for: ${transactionId}`);

    // For dev: auto-approve
    return {
      verified: true,
      nationalId: "1*********",
      fullName: "مستخدم تجريبي",
    };
  }
}

export const nafathService = new NafathService();
