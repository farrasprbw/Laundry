import { env } from "../env.js";

export const whatsappService = {
  /**
   * Send a WhatsApp message via Fonnte API
   * @param target Phone number (e.g. 0812... or 62812...)
   * @param message Text message to send
   */
  async sendMessage(target: string, message: string): Promise<boolean> {
    if (!env.FONNTE_TOKEN) {
      console.warn("[WhatsApp] FONNTE_TOKEN is not set. Simulating message to", target);
      console.log(`[WhatsApp Message]:\n${message}`);
      return false;
    }

    try {
      const response = await fetch("https://api.fonnte.com/send", {
        method: "POST",
        headers: {
          Authorization: env.FONNTE_TOKEN,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          target: target,
          message: message,
          countryCode: "62", // Default to Indonesia if leading 0
        }),
      });

      const data = await response.json();
      
      if (data.status) {
        console.log(`[WhatsApp] Successfully sent to ${target}`);
        return true;
      } else {
        console.error(`[WhatsApp] Failed to send to ${target}:`, data.reason);
        return false;
      }
    } catch (error) {
      console.error("[WhatsApp] API Error:", error);
      return false;
    }
  },
};
