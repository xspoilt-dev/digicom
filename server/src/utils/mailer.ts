import Setting from "../models/Setting";
import Product from "../models/Product";

interface MailPayload {
  toEmail: string;
  orderId: string;
  customerName: string;
  totalAmount: number;
  items: { title: string; price: number; quantity: number }[];
  downloadUrls: { title: string; link: string }[];
}

export async function sendOrderDeliveryEmail(payload: MailPayload) {
  try {
    // 1. Fetch Email Settings from database
    const emailConfigSetting = await Setting.findOne({ key: "email_settings" });
    const apiKey = emailConfigSetting?.value?.resendApiKey || process.env.RESEND_API_KEY;
    const fromEmail = emailConfigSetting?.value?.fromEmail || "Digitalcorebd.com <noreply@digitalcorebd.com>";

    if (!apiKey) {
      console.warn("Resend API Key is not configured in settings. Email skipped.");
      return;
    }

    const { toEmail, orderId, customerName, totalAmount, items, downloadUrls } = payload;

    // 2. Build premium email template
    const itemsHtml = items
      .map(
        (item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #1e293b;">${item.title}</td>
        <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; text-align: center; color: #64748b;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 700; color: #10b981;">৳${item.price}</td>
      </tr>`
      )
      .join("");

    const linksHtml = downloadUrls
      .map(
        (url) => `
      <div style="background-color: #feffec; border: 1px dashed #fbbf24; border-radius: 12px; padding: 16px; margin-bottom: 12px; text-align: center;">
        <span style="font-size: 13px; font-weight: 700; color: #451a03; display: block; margin-bottom: 6px;">${url.title}</span>
        <a href="${url.link}" target="_blank" style="background-color: #facc15; color: #451a03; font-weight: 800; font-size: 14px; text-decoration: none; padding: 10px 24px; border-radius: 8px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(250, 204, 21, 0.2);">
          Download Product
        </a>
      </div>`
      )
      .join("");

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmed</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Inter', system-ui, -apple-system, sans-serif; -webkit-font-smoothing: antialiased;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 32px 0;">
          <tr>
            <td align="center">
              <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.03);">
                <!-- Header -->
                <tr>
                  <td style="background-color: #facc15; padding: 32px; text-align: center;">
                    <div style="font-size: 28px; font-weight: 900; color: #451a03; letter-spacing: -0.025em; margin-bottom: 4px;">
                      Digitalcorebd.com
                    </div>
                    <span style="font-size: 12px; font-weight: 700; color: #78350f; text-transform: uppercase; letter-spacing: 0.1em;">
                      Order Delivery Receipt
                    </span>
                  </td>
                </tr>

                <!-- Content Body -->
                <tr>
                  <td style="padding: 40px 32px;">
                    <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 8px;">
                      Thank you for your purchase!
                    </h2>
                    <p style="font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 24px;">
                      Hello ${customerName || "Customer"}, your payment has been verified. Below you will find your secure digital download link(s) and receipt summary.
                    </p>

                    <!-- DOWNLOAD MODULES -->
                    <div style="margin-bottom: 32px;">
                      <span style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 12px;">
                        Your Downloads
                      </span>
                      ${linksHtml || `<p style="font-size: 13px; color: #94a3b8; italic;">No files attached to this product catalog</p>`}
                    </div>

                    <!-- ORDER RECEIPTS -->
                    <div style="margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 24px;">
                      <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                        <span style="font-size: 13px; font-weight: 700; color: #475569;">Order ID: ${orderId}</span>
                        <span style="font-size: 13px; font-weight: 700; color: #475569;">Date: ${new Date().toLocaleDateString()}</span>
                      </div>

                      <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-top: 16px; margin-bottom: 24px;">
                        <thead>
                          <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                            <th align="left" style="padding: 12px; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase;">Product</th>
                            <th align="center" style="padding: 12px; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase;">Qty</th>
                            <th align="right" style="padding: 12px; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase;">Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${itemsHtml}
                        </tbody>
                      </table>

                      <table width="100%" cellspacing="0" cellpadding="0">
                        <tr>
                          <td align="right" style="font-size: 14px; font-weight: 600; color: #64748b; padding-right: 12px;">Total Paid:</td>
                          <td align="right" width="100" style="font-size: 20px; font-weight: 900; color: #10b981;">৳${totalAmount}</td>
                        </tr>
                      </table>
                    </div>

                    <!-- Support Info -->
                    <div style="margin-top: 40px; background-color: #f1f5f9; border-radius: 16px; padding: 20px; text-align: center;">
                      <span style="font-size: 13px; font-weight: 700; color: #334155; display: block; margin-bottom: 4px;">Need Help?</span>
                      <p style="font-size: 12px; color: #64748b; margin: 0 0 12px 0;">If you face any issues with download, contact support instantly.</p>
                      <a href="https://t.me/monervideo" target="_blank" style="font-size: 12px; font-weight: 700; color: #0088cc; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
                        Contact Telegram Support &rarr;
                      </a>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #0f172a; padding: 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #1e293b;">
                    &copy; 2026 Digitalcorebd.com. All rights reserved.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // 3. Make POST request to Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        subject: `Your Order ${orderId} - Digitalcorebd.com`,
        html: htmlContent,
      }),
    });

    const resJson = await res.json();
    console.log("Resend API response:", resJson);
  } catch (error) {
    console.error("Failed to send order delivery email via Resend:", error);
  }
}
