/**
 * national-address.service.ts — Saudi National Address Auto-Complete
 *
 * Auto-complete Saudi addresses using Saudi Post (SPL) National Address API.
 * Stub implementation — replace with actual NAddress API.
 */

export interface AddressSuggestion {
  buildingNo: string;
  street: string;
  district: string;
  city: string;
  postalCode: string;
  additionalNo: string;
  shortAddress: string;
  fullAddress: string;
}

export class NationalAddressService {
  private baseUrl = process.env.NATIONAL_ADDRESS_API_URL || "https://apina.address.gov.sa";
  private apiKey = process.env.NATIONAL_ADDRESS_API_KEY || "";

  /**
   * Search for addresses by query string.
   */
  async search(query: string): Promise<AddressSuggestion[]> {
    if (!query || query.length < 3) return [];

    // STUB: In production, call Saudi Post API
    // GET {baseUrl}/NationalAddress/v3.1/Address/address-geocode?language=A&format=json&addressstring={query}
    console.log(`[NAddress] Search: ${query}`);

    // Return stub results for common Saudi cities
    const stubs: AddressSuggestion[] = [
      {
        buildingNo: "1234",
        street: "شارع الملك فهد",
        district: "حي العليا",
        city: "الرياض",
        postalCode: "12211",
        additionalNo: "5678",
        shortAddress: "RAAA1234",
        fullAddress: "1234 شارع الملك فهد، حي العليا، الرياض 12211",
      },
    ];

    return stubs.filter((s) =>
      s.fullAddress.includes(query) || s.city.includes(query) || s.district.includes(query)
    );
  }

  /**
   * Validate a national address short code.
   */
  async validate(shortAddress: string): Promise<{ valid: boolean; address?: AddressSuggestion }> {
    console.log(`[NAddress] Validate: ${shortAddress}`);
    return { valid: shortAddress.length >= 8 };
  }
}

export const nationalAddressService = new NationalAddressService();
