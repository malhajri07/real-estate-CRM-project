/**
 * sadad.service.ts — Sadad Payment Processing
 *
 * Generate Sadad bill numbers for commission payments and subscriptions.
 * Stub implementation — replace with actual Sadad bill presentment API.
 */

export interface SadadBillRequest {
  amount: number;
  description: string;
  dueDate: string;
  payerName: string;
  payerNationalId?: string;
}

export interface SadadBillResult {
  success: boolean;
  billNumber?: string;
  sadadNumber?: string;
  status?: string;
  error?: string;
}

export class SadadService {
  private billerCode = process.env.SADAD_BILLER_CODE || "";
  private apiKey = process.env.SADAD_API_KEY || "";

  /**
   * Create a Sadad bill for payment.
   */
  async createBill(data: SadadBillRequest): Promise<SadadBillResult> {
    console.log(`[Sadad] Create bill: ${data.amount} SAR — ${data.description}`);

    const billNumber = `SD-${new Date().getFullYear()}-${String(Date.now()).slice(-8)}`;

    return {
      success: true,
      billNumber,
      sadadNumber: `${this.billerCode || "999"}${billNumber.replace(/\D/g, "")}`,
      status: "PENDING",
    };
  }

  /**
   * Check payment status of a bill.
   */
  async checkPayment(billNumber: string): Promise<{ paid: boolean; paidAt?: string; amount?: number }> {
    console.log(`[Sadad] Check payment: ${billNumber}`);
    return { paid: false };
  }

  /**
   * Handle Sadad payment webhook (called by Sadad when payment is received).
   */
  async processWebhook(payload: Record<string, unknown>): Promise<{ processed: boolean }> {
    console.log(`[Sadad] Webhook received:`, payload);
    return { processed: true };
  }
}

export const sadadService = new SadadService();
