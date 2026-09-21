import Setting from "../models/Setting";
import { getSetting } from "./settingsCache";

interface MailPayload {
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

export async function sendOrderDeliveryEmail(payload: MailPayload) {
  try {
    // 1. Fetch Email Settings and Company Info from cache/db
    const emailConfig = (await getSetting("email_settings")) || {};
    const apiKey = emailConfig.resendApiKey || process.env.RESEND_API_KEY;
    const fromEmail = emailConfig.fromEmail || "Kalobazar.shop <noreply@kalobazar.shop>";
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.FRONTEND_URL || "https://kalobazar.shop";
    const logoUrl = `${siteUrl}/android-chrome-192x192.png`;

    const companyInfo = (await getSetting("company_info")) || {};
    const rawWhatsapp = companyInfo.whatsapp || companyInfo.whatsappNumber || "01700000000";
    let cleanNumber = rawWhatsapp.replace(/\D/g, "");
    if (cleanNumber.length === 11 && cleanNumber.startsWith("01")) {
      cleanNumber = "88" + cleanNumber;
    }
    const whatsappLink = `https://wa.me/${cleanNumber}`;

    if (!apiKey) {
      console.warn("Resend API Key is not configured. Email skipped.");
      return;
    }

    const { toEmail, orderId, customerName, totalAmount, items, downloadUrls = [], deliveryAccounts = [] } = payload;

    // 2. Build items HTML
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

    // 3. Build Account Credentials Module (for Canboso fulfilled accounts)
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

    // 4. Build traditional download links (if any)
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
                  <td style="background-color: #fbbf24; padding: 26px 20px; text-align: center;">
                    <table border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto 10px auto;">
                      <tr>
                        <td align="center">
                          <img src="${logoUrl}" alt="${companyInfo.name || "Kalobazar.shop"}" width="56" height="56" style="border-radius: 14px; display: block; border: 2px solid rgba(255, 255, 255, 0.8); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);" />
                        </td>
                      </tr>
                    </table>
                    <div style="font-size: 22px; font-weight: 900; color: #0c0a09; letter-spacing: -0.025em; margin-bottom: 2px;">
                      ${companyInfo.name || "Kalobazar.shop"}
                    </div>
                    <span style="font-size: 11px; font-weight: 700; color: #78350f; text-transform: uppercase; letter-spacing: 0.1em;">
                      Order Delivery Receipt
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

    // 5. Send via Resend API
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        subject: `Order Confirmed: ${orderId} - ${companyInfo.name || "Kalobazar.shop"}`,
        html: htmlContent,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[Mailer] Resend API dispatch error:", err);
    } else {
      console.log(`[Mailer] Delivery receipt sent to ${toEmail} for Order #${orderId}`);
    }
  } catch (error) {
    console.error("[Mailer Exception]", error);
  }
}
