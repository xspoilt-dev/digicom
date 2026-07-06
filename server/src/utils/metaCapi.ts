import crypto from "crypto";
import Setting from "../models/Setting";

function hash(value?: string) {
  if (!value) return undefined;
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

interface SendCapiEventArgs {
  eventName: string;
  eventId: string;
  eventSourceUrl: string;
  userData: {
    email?: string;
    phone?: string;
    fbp?: string;
    fbc?: string;
    clientIpAddress?: string;
    clientUserAgent?: string;
    externalId?: string;
  };
  customData: Record<string, unknown>;
  actionSource?: "website" | "system_generated" | "other";
}

export async function sendCapiEvent({
  eventName,
  eventId,
  eventSourceUrl,
  userData,
  customData,
  actionSource = "website",
}: SendCapiEventArgs) {
  try {
    // Dynamically retrieve Pixel settings from DB
    const pixelSetting = await Setting.findOne({ key: "meta_pixel" });
    const pixelConfig = pixelSetting?.value || {};

    const PIXEL_ID = pixelConfig.pixelId || process.env.NEXT_PUBLIC_META_PIXEL_ID;
    const ACCESS_TOKEN = pixelConfig.accessToken || process.env.META_CAPI_ACCESS_TOKEN;
    const TEST_EVENT_CODE = pixelConfig.testEventCode || process.env.META_TEST_EVENT_CODE;

    if (!PIXEL_ID || !ACCESS_TOKEN) {
      console.warn("Meta Pixel ID or Access Token is missing from DB and env. Skipping CAPI send.");
      return false;
    }

    const payload = {
      data: [
        {
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: eventId,
          event_source_url: eventSourceUrl,
          action_source: actionSource,
          user_data: {
            em: hash(userData.email),
            ph: hash(userData.phone),
            fbp: userData.fbp,
            fbc: userData.fbc,
            client_ip_address: userData.clientIpAddress,
            client_user_agent: userData.clientUserAgent,
            external_id: hash(userData.externalId),
          },
          custom_data: customData,
        },
      ],
      ...(TEST_EVENT_CODE ? { test_event_code: TEST_EVENT_CODE } : {}),
    };

    const url = `https://graph.facebook.com/v20.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Meta CAPI sending failed:", eventName, err);
      return false;
    }

    console.log(`CAPI Event Sent Successfully: ${eventName}`);
    return true;
  } catch (error) {
    console.error("Meta CAPI exception occurred:", error);
    return false;
  }
}
