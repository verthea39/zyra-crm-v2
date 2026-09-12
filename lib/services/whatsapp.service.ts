export class WhatsAppError extends Error {
  constructor(public message: string, public details?: any) {
    super(message);
    this.name = "WhatsAppError";
  }
}

/**
 * Normalizes phone numbers to International format without the plus sign.
 * E.g., '0501234567' -> '971501234567'
 */
function formatWhatsAppNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");
  
  if (cleaned.startsWith("00")) {
    cleaned = cleaned.substring(2);
  }
  
  // Local UAE number missing country code
  if (cleaned.startsWith("05") && cleaned.length === 10) {
    cleaned = "971" + cleaned.substring(1);
  } else if (cleaned.startsWith("5") && cleaned.length === 9) {
    cleaned = "971" + cleaned;
  }

  return cleaned;
}

export async function sendWhatsAppMessage(to: string, text: string): Promise<boolean> {
  const token = process.env.WHATSAPP_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    console.warn("WhatsApp API credentials missing. Skipping message dispatch.");
    return false;
  }

  const formattedTo = formatWhatsAppNumber(to);

  try {
    const res = await fetch(`https://graph.facebook.com/v17.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: formattedTo,
        type: "text",
        text: {
          preview_url: true,
          body: text,
        },
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new WhatsAppError(`Meta API returned ${res.status}`, errorData);
    }

    return true;
  } catch (error) {
    console.error("[WhatsApp] Failed to send message:", error);
    throw error;
  }
}
