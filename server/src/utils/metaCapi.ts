import crypto from "crypto";
import CapiLog from "../models/CapiLog";
import { getSetting } from "./settingsCache";

function hashSha256(value?: string): string | undefined {
  if (!value) return undefined;
  const clean = value.trim().toLowerCase();
  if (!clean) return undefined;
  return crypto.createHash("sha256").update(clean).digest("hex");
}

function normalizeAndHashPhone(phone?: string): string | undefined {
  if (!phone) return undefined;
  let digits = phone.replace(/\D/g, "");
  // Bangladesh phone number normalization
  if (digits.length === 11 && digits.startsWith("01")) {
    digits = "88" + digits;
  } else if (digits.length === 10 && digits.startsWith("1")) {
    digits = "880" + digits;
  }
  if (!digits) return undefined;
  return crypto.createHash("sha256").update(digits).digest("hex");
}

function maskEmail(email?: string): string | undefined {
  if (!email) return undefined;
  const parts = email.split("@");
  if (parts.length !== 2) return "***";
  const name = parts[0];
  const domain = parts[1];
  const maskedName = name.length > 2 ? `${name[0]}***${name[name.length - 1]}` : `${name[0]}***`;
  return `${maskedName}@${domain}`;
}

function maskPhone(phone?: string): string | undefined {
  if (!phone) return undefined;
  const clean = phone.replace(/\D/g, "");
  if (clean.length < 6) return "***";
  return `${clean.slice(0, 3)}****${clean.slice(-3)}`;
}

export interface SendCapiEventArgs {
  eventName: string;
  eventId: string;
  eventSourceUrl?: string;
  userData?: {
    email?: string;
    phone?: string;
    fbp?: string;
    fbc?: string;
    clientIpAddress?: string;
    clientUserAgent?: string;
    externalId?: string;
  };
  customData?: Record<string, unknown>;
  actionSource?: "website" | "system_generated" | "email" | "other";
  testEventCode?: string;
}

export interface CapiResult {
  success: boolean;
  eventId: string;
  statusCode?: number;
  response?: any;
  message?: string;
}

export async function sendCapiEvent({
  eventName,
  eventId,
  eventSourceUrl,
  userData = {},
  customData = {},
  actionSource = "website",
  testEventCode: explicitTestCode,
}: SendCapiEventArgs): Promise<CapiResult> {
  const startTime = Date.now();
  const finalEventId = eventId || `evt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  // Masked user info for diagnostic logging
  const maskedData = {
    emailMasked: maskEmail(userData.email),
    phoneMasked: maskPhone(userData.phone),
    clientIp: userData.clientIpAddress,
    clientUserAgent: userData.clientUserAgent,
    fbp: userData.fbp,
    fbc: userData.fbc,
  };

  try {
    // 1. Retrieve Pixel config from cache or DB
    const pixelConfig = (await getSetting("meta_pixel")) || {};
    const PIXEL_ID = pixelConfig.pixelId || process.env.NEXT_PUBLIC_META_PIXEL_ID;
    const ACCESS_TOKEN = pixelConfig.accessToken || process.env.META_CAPI_ACCESS_TOKEN;
    const TEST_EVENT_CODE =
      explicitTestCode || pixelConfig.testEventCode || process.env.META_TEST_EVENT_CODE || undefined;

    if (!PIXEL_ID || !ACCESS_TOKEN) {
      const warningMsg = "Meta Pixel ID or Access Token is not configured. CAPI dispatch skipped.";
      console.warn(`[Meta CAPI] ${warningMsg}`);

      // Log skipped state asynchronously
      CapiLog.create({
        eventName,
        eventId: finalEventId,
        eventSourceUrl,
        status: "skipped",
        errorMessage: warningMsg,
        userDataMasked: maskedData,
        customData,
        testEventCode: TEST_EVENT_CODE,
        executionTimeMs: Date.now() - startTime,
      }).catch((e) => console.error("[CapiLog Error]", e));

      return {
        success: false,
        eventId: finalEventId,
        message: warningMsg,
      };
    }

    // 2. Prepare user data payload with compliant hashing
    const userDataPayload: Record<string, any> = {};
    if (userData.email) userDataPayload.em = [hashSha256(userData.email)];
    if (userData.phone) userDataPayload.ph = [normalizeAndHashPhone(userData.phone)];
    if (userData.fbp) userDataPayload.fbp = userData.fbp;
    if (userData.fbc) userDataPayload.fbc = userData.fbc;
    if (userData.clientIpAddress) userDataPayload.client_ip_address = userData.clientIpAddress;
    if (userData.clientUserAgent) userDataPayload.client_user_agent = userData.clientUserAgent;
    if (userData.externalId) userDataPayload.external_id = [hashSha256(userData.externalId)];

    const eventPayload: Record<string, any> = {
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      event_id: finalEventId,
      action_source: actionSource,
      user_data: userDataPayload,
      custom_data: customData,
    };

    if (eventSourceUrl) {
      eventPayload.event_source_url = eventSourceUrl;
    }

    const payload: Record<string, any> = {
      data: [eventPayload],
    };

    if (TEST_EVENT_CODE) {
      payload.test_event_code = TEST_EVENT_CODE;
    }

    // 3. Dispatch to Meta Graph API v21.0
    const url = `https://graph.facebook.com/v21.0/${PIXEL_ID}/events?access_token=${encodeURIComponent(ACCESS_TOKEN)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const executionTimeMs = Date.now() - startTime;
    let responseJson: any = null;
    try {
      responseJson = await res.json();
    } catch {
      responseJson = { raw: await res.text() };
    }

    if (!res.ok) {
      const errorDetail = responseJson?.error?.message || res.statusText;
      console.error(`[Meta CAPI] Graph API returned HTTP ${res.status}:`, responseJson);

      CapiLog.create({
        eventName,
        eventId: finalEventId,
        eventSourceUrl,
        status: "failed",
        httpStatusCode: res.status,
        responseBody: responseJson,
        errorMessage: errorDetail,
        userDataMasked: maskedData,
        customData,
        testEventCode: TEST_EVENT_CODE,
        executionTimeMs,
      }).catch((e) => console.error("[CapiLog Error]", e));

      return {
        success: false,
        eventId: finalEventId,
        statusCode: res.status,
        response: responseJson,
        message: errorDetail,
      };
    }

    console.log(`[Meta CAPI] Successfully delivered event "${eventName}" (ID: ${finalEventId}, ${executionTimeMs}ms)`);

    CapiLog.create({
      eventName,
      eventId: finalEventId,
      eventSourceUrl,
      status: "success",
      httpStatusCode: res.status,
      responseBody: responseJson,
      userDataMasked: maskedData,
      customData,
      testEventCode: TEST_EVENT_CODE,
      executionTimeMs,
    }).catch((e) => console.error("[CapiLog Error]", e));

    return {
      success: true,
      eventId: finalEventId,
      statusCode: res.status,
      response: responseJson,
    };
  } catch (error: any) {
    const executionTimeMs = Date.now() - startTime;
    console.error(`[Meta CAPI Exception] Error firing event "${eventName}":`, error);

    CapiLog.create({
      eventName,
      eventId: finalEventId,
      eventSourceUrl,
      status: "failed",
      errorMessage: error.message || String(error),
      userDataMasked: maskedData,
      customData,
      executionTimeMs,
    }).catch((e) => console.error("[CapiLog Error]", e));

    return {
      success: false,
      eventId: finalEventId,
      message: error.message,
    };
  }
}
