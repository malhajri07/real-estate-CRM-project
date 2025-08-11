// Mock WhatsApp service for development (in production, use whatsapp-web.js)
export class WhatsAppService {
  private isReady = true; // Mock as ready for demo purposes

  constructor() {
    console.log('WhatsApp Mock Service initialized - ready for sending messages');
  }

  async sendMessage(phoneNumber: string, message: string): Promise<boolean> {
    if (!this.isReady) {
      console.error('WhatsApp service is not ready');
      return false;
    }

    try {
      // Mock sending - in production this would use whatsapp-web.js
      console.log(`📱 WhatsApp Mock: Sending message to ${phoneNumber}`);
      console.log(`📝 Message: ${message}`);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log(`✅ WhatsApp Mock: Message sent successfully to ${phoneNumber}`);
      return true;
    } catch (error) {
      console.error('Error in mock WhatsApp service:', error);
      return false;
    }
  }

  isClientReady(): boolean {
    return this.isReady;
  }

  async getQRCode(): Promise<string | null> {
    // Mock QR code for demo
    return "Mock QR Code - In production, scan with WhatsApp";
  }

  async disconnect() {
    console.log('WhatsApp Mock Service disconnected');
    this.isReady = false;
  }
}

export const whatsappService = new WhatsAppService();