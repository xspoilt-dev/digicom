import Setting from "../models/Setting";
import { getSetting, invalidateSettingCache } from "./settingsCache";

export interface ResendAccount {
  id: string;
  name: string;
  apiKey: string;
  fromEmail: string;
  dailyLimit: number;
  sentToday: number;
  lastResetDate: string;
  active: boolean;
  lastUsedAt?: string;
  lastError?: string;
}

export interface MailPayload {
  toEmail: string;
  orderId: string;
  customerName: string;
  totalAmount: number;
  items: { title: string; price: number; quantity: number }[];
  downloadUrls?: { title: string; link: string }[];
  deliveryAccounts?: Array<{
    user: string;
    password?: string;
    verifyEmail?: string;
    expiryText?: string;
    otherInfo?: string;
  }>;
}

/**
 * Normalizes accounts array from settings or falls back to legacy single key
 */
export function normalizeResendAccounts(emailConfig: any): ResendAccount[] {
  const todayStr = new Date().toISOString().split("T")[0];
  let accounts: ResendAccount[] = [];

  if (Array.isArray(emailConfig?.accounts) && emailConfig.accounts.length > 0) {
    accounts = emailConfig.accounts.map((acc: any, idx: number) => {
      const isToday = acc.lastResetDate === todayStr;
      return {
        id: acc.id || `acc_${idx}_${Date.now()}`,
        name: acc.name || `Resend Account #${idx + 1}`,
        apiKey: String(acc.apiKey || "").trim(),
        fromEmail: String(acc.fromEmail || emailConfig.fromEmail || "Kalobazar.shop <noreply@kalobazar.shop>").trim(),
        dailyLimit: Number(acc.dailyLimit) || 100,
        sentToday: isToday ? Number(acc.sentToday) || 0 : 0,
        lastResetDate: todayStr,
        active: acc.active !== false,
        lastUsedAt: acc.lastUsedAt,
        lastError: acc.lastError,
      };
    });
  } else if (emailConfig?.resendApiKey || process.env.RESEND_API_KEY) {
    const isToday = emailConfig?.lastResetDate === todayStr;
    accounts = [
      {
        id: "primary",
        name: "Primary Resend Key",
        apiKey: String(emailConfig?.resendApiKey || process.env.RESEND_API_KEY || "").trim(),
        fromEmail: String(emailConfig?.fromEmail || "Kalobazar.shop <noreply@kalobazar.shop>").trim(),
        dailyLimit: 100,
        sentToday: isToday ? Number(emailConfig?.sentToday) || 0 : 0,
        lastResetDate: todayStr,
        active: true,
      },
    ];
  }

  return accounts;
}

/**
 * Sends an email using the multi-account pool with automatic rotation, quota tracking, and failover
 */
export async function sendEmailWithMultiResendPool(options: {
  toEmail: string;
  subject: string;
  htmlContent: string;
  orderId?: string;
}): Promise<{ success: boolean; accountUsed?: string; error?: string }> {
  const { toEmail, subject, htmlContent, orderId } = options;

  const emailConfig = (await getSetting("email_settings")) || {};
  const accounts = normalizeResendAccounts(emailConfig);

  const activeAccounts = accounts.filter((a) => a.active && a.apiKey);
  if (activeAccounts.length === 0) {
    console.warn("[Mailer] No active Resend accounts configured in pool.");
    return { success: false, error: "No active Resend API keys configured." };
  }

  // Sort candidate accounts:
  // 1. Prioritize accounts that have remaining capacity (< dailyLimit)
  // 2. Then by least sent today (round-robin / balanced distribution)
  const sortedAccounts = [...activeAccounts].sort((a, b) => {
    const aUnder = a.sentToday < a.dailyLimit;
    const bUnder = b.sentToday < b.dailyLimit;
    if (aUnder && !bUnder) return -1;
    if (!aUnder && bUnder) return 1;
    return a.sentToday - b.sentToday;
  });

  let dispatched = false;
  let usedAccountName = "";
  let lastFailureMessage = "";

  for (const account of sortedAccounts) {
    console.log(
      `[Mailer] Attempting send via "${account.name}" (${account.fromEmail}) - Sent today: ${account.sentToday}/${account.dailyLimit}`
    );

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${account.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: account.fromEmail,
          to: [toEmail],
          subject,
          html: htmlContent,
        }),
      });

      if (res.ok) {
        account.sentToday += 1;
        account.lastUsedAt = new Date().toISOString();
        account.lastError = "";
        dispatched = true;
        usedAccountName = account.name;
        console.log(
          `[Mailer] ✓ Email delivered to ${toEmail}${orderId ? ` for Order #${orderId}` : ""} via ${account.name} (Count: ${account.sentToday}/${account.dailyLimit})`
        );
        break;
      } else {
        const errorText = await res.text();
        account.lastError = `[${res.status}] ${errorText}`;
        lastFailureMessage = `Account "${account.name}" failed: ${errorText}`;
        console.warn(`[Mailer] ⚠ Resend API error on "${account.name}":`, errorText);
        console.warn(`[Mailer] Failing over to next available Resend account in pool...`);
      }
    } catch (err: any) {
      account.lastError = err.message || "Network request failed";
      lastFailureMessage = `Account "${account.name}" exception: ${err.message}`;
      console.error(`[Mailer] Network exception sending via "${account.name}":`, err);
    }
  }

  // Update account usage stats in DB asynchronously
  try {
    const updatedAccounts = accounts.map((orig) => {
      const modified = sortedAccounts.find((s) => s.id === orig.id);
      return modified || orig;
    });

    await Setting.findOneAndUpdate(
      { key: "email_settings" },
      {
        value: {
          ...emailConfig,
          accounts: updatedAccounts,
          resendApiKey: updatedAccounts[0]?.apiKey || emailConfig.resendApiKey,
          fromEmail: updatedAccounts[0]?.fromEmail || emailConfig.fromEmail,
        },
      },
      { upsert: true }
    );
    invalidateSettingCache("email_settings");
  } catch (syncErr) {
    console.error("[Mailer] Failed to save updated email counts:", syncErr);
  }

  if (dispatched) {
    return { success: true, accountUsed: usedAccountName };
  }

  return { success: false, error: lastFailureMessage || "All Resend accounts in pool failed." };
}

/**
 * Tests a single Resend API key configuration by sending a verification email
 */
export async function testResendAccount(params: {
  apiKey: string;
  fromEmail: string;
  toEmail: string;
}): Promise<{ success: boolean; message: string }> {
  const { apiKey, fromEmail, toEmail } = params;

  if (!apiKey?.trim()) {
    return { success: false, message: "API Key is required." };
  }
  if (!fromEmail?.trim()) {
    return { success: false, message: "From email is required." };
  }
  if (!toEmail?.trim()) {
    return { success: false, message: "Recipient email is required." };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail.trim(),
        to: [toEmail.trim()],
        subject: "Resend Multi-Key Test - Kalobazar Marketplace",
        html: `
          <div style="font-family: sans-serif; padding: 24px; background-color: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0;">
            <h2 style="color: #0f172a; margin-top: 0;">🎉 Resend API Key Verified Successfully!</h2>
            <p style="color: #475569; font-size: 14px;">
              This test email confirms that your Resend API key and sender email <strong>${fromEmail}</strong> are correctly configured and operational in your pool.
            </p>
            <div style="background-color: #ffffff; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; font-family: monospace; font-size: 12px; color: #16a34a; font-weight: bold;">
              Timestamp: ${new Date().toISOString()}
            </div>
          </div>
        `,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        success: true,
        message: `Test email sent successfully via Resend (ID: ${data.id})! Check inbox at ${toEmail}`,
      };
    } else {
      const errText = await res.text();
      return {
        success: false,
        message: `Resend API returned error [${res.status}]: ${errText}`,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: `Network error connecting to Resend: ${err.message}`,
    };
  }
}

/**
 * Sends order delivery email with credentials and receipt
 */
export async function sendOrderDeliveryEmail(payload: MailPayload) {
  try {
    const companyInfo = (await getSetting("company_info")) || {};
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.FRONTEND_URL || "https://kalobazar.shop";

    const rawWhatsapp = companyInfo.whatsapp || companyInfo.whatsappNumber || "01700000000";
    let cleanNumber = rawWhatsapp.replace(/\D/g, "");
    if (cleanNumber.length === 11 && cleanNumber.startsWith("01")) {
      cleanNumber = "88" + cleanNumber;
    }
    const whatsappLink = `https://wa.me/${cleanNumber}`;

    const { toEmail, orderId, customerName, totalAmount, items, downloadUrls = [], deliveryAccounts = [] } = payload;

    // Build items HTML
    const itemsHtml = items
      .map(
        (item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #1e293b;">${item.title}</td>
        <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; text-align: center; color: #64748b;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 700; color: #d97706;">৳${item.price * item.quantity}</td>
      </tr>`
      )
      .join("");

    // Build Account Credentials Module (for Canboso fulfilled accounts)
    let credentialsHtml = "";
    if (deliveryAccounts && deliveryAccounts.length > 0) {
      const accountsList = deliveryAccounts
        .map(
          (acc, index) => `
        <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; margin-top: 10px;">
          <div style="font-size: 11px; font-weight: 800; color: #d97706; text-transform: uppercase; margin-bottom: 8px;">Account #${index + 1}</div>
          <div style="margin-bottom: 6px;"><strong style="color: #475569; font-size: 12px;">Login / Email:</strong> <code style="background-color: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 13px; font-weight: bold; color: #0f172a;">${acc.user}</code></div>
          ${acc.password ? `<div style="margin-bottom: 6px;"><strong style="color: #475569; font-size: 12px;">Password:</strong> <code style="background-color: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 13px; font-weight: bold; color: #0f172a;">${acc.password}</code></div>` : ""}
          ${acc.verifyEmail ? `<div style="margin-bottom: 6px;"><strong style="color: #475569; font-size: 12px;">Recovery Email:</strong> <code style="background-color: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 12px; color: #475569;">${acc.verifyEmail}</code></div>` : ""}
          ${acc.expiryText ? `<div style="margin-bottom: 4px;"><strong style="color: #475569; font-size: 12px;">Validity / Term:</strong> <span style="font-size: 12px; font-weight: 600; color: #059669;">${acc.expiryText}</span></div>` : ""}
          ${acc.otherInfo ? `<div style="font-size: 11px; color: #64748b; margin-top: 4px; font-style: italic;">Note: ${acc.otherInfo}</div>` : ""}
        </div>`
        )
        .join("");

      credentialsHtml = `
        <div style="background-color: #fefce8; border: 1px solid #fef08a; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
          <span style="font-size: 14px; font-weight: 800; color: #854d0e; display: block; margin-bottom: 4px;">
            Digital Account Credentials & Access
          </span>
          <p style="font-size: 12px; color: #713f12; margin-top: 0; margin-bottom: 12px;">
            Here are your login credentials. Keep this information secure.
          </p>
          ${accountsList}
        </div>
      `;
    }

    // Build traditional download links (if any)
    let linksHtml = "";
    if (downloadUrls && downloadUrls.length > 0) {
      const urlsHtml = downloadUrls
        .map(
          (url) => `
        <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; margin-bottom: 10px; text-align: center;">
          <span style="font-size: 13px; font-weight: 700; color: #1e293b; display: block; margin-bottom: 8px;">${url.title}</span>
          <a href="${url.link}" target="_blank" style="background-color: #fbbf24; color: #0f172a; font-weight: 800; font-size: 13px; text-decoration: none; padding: 8px 20px; border-radius: 8px; display: inline-block;">
            Download Product File
          </a>
        </div>`
        )
        .join("");

      linksHtml = `
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
          <span style="font-size: 13px; font-weight: 800; color: #334155; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 12px;">
            Digital Downloads
          </span>
          ${urlsHtml}
        </div>
      `;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmed</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Inter', system-ui, -apple-system, sans-serif;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 32px 0;">
          <tr>
            <td align="center">
              <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.03);">
                <!-- Header -->
                <tr>
                  <td style="background-color: #fbbf24; padding: 24px 20px; text-align: center;">
                    <table border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto 10px auto;">
                      <tr>
                        <td align="center">
                          <img src="${siteUrl}/horizontal.png" alt="${companyInfo.name || "Kalobazar.shop"}" height="48" style="height: 48px; width: auto; max-width: 220px; display: block; margin: 0 auto;" />
                        </td>
                      </tr>
                    </table>
                    <span style="font-size: 11px; font-weight: 800; color: #78350f; text-transform: uppercase; letter-spacing: 0.1em; display: inline-block; background-color: rgba(255, 255, 255, 0.4); padding: 3px 12px; border-radius: 20px;">
                      অর্ডার ডেলিভারি ইনভয়েস ও এক্সেস রিসিপ্ট
                    </span>
                  </td>
                </tr>

                <!-- Content Body -->
                <tr>
                  <td style="padding: 36px 28px;">
                    <h2 style="font-size: 19px; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 8px;">
                      Thank you for your order!
                    </h2>
                    <p style="font-size: 13px; color: #475569; line-height: 1.6; margin-bottom: 24px;">
                      Hello ${customerName || "Customer"}, your payment has been verified. Below you will find your digital product credentials and receipt breakdown.
                    </p>

                    <!-- Credentials / Downloads -->
                    ${credentialsHtml}
                    ${linksHtml}

                    <!-- Receipt Breakdown -->
                    <div style="margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
                      <div style="font-size: 12px; font-weight: 700; color: #475569; margin-bottom: 10px;">
                        Order ID: <span style="font-family: monospace; color: #0f172a;">${orderId}</span>
                      </div>

                      <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 16px;">
                        <thead>
                          <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                            <th align="left" style="padding: 10px; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase;">Item</th>
                            <th align="center" style="padding: 10px; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase;">Qty</th>
                            <th align="right" style="padding: 10px; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase;">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${itemsHtml}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colspan="2" style="padding: 12px; font-weight: 800; color: #0f172a; font-size: 14px; text-align: right;">Total:</td>
                            <td style="padding: 12px; font-weight: 900; color: #d97706; font-size: 16px; text-align: right;">৳${totalAmount}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    <!-- Support Footer -->
                    <div style="margin-top: 24px; background-color: #f8fafc; border-radius: 12px; padding: 16px; text-align: center;">
                      <span style="font-size: 12px; color: #475569; display: block; margin-bottom: 8px;">
                        Need help or have questions about your subscription?
                      </span>
                      <a href="${whatsappLink}" target="_blank" style="display: inline-block; background-color: #0c0a09; color: #ffffff; text-decoration: none; font-size: 12px; font-weight: 700; padding: 8px 18px; border-radius: 8px;">
                        Contact WhatsApp Support
                      </a>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // Send using multi-account failover pool
    await sendEmailWithMultiResendPool({
      toEmail,
      subject: `Order Confirmed: ${orderId} - ${companyInfo.name || "Kalobazar.shop"}`,
      htmlContent,
      orderId,
    });
  } catch (error) {
    console.error("[Mailer Exception]", error);
  }
}
