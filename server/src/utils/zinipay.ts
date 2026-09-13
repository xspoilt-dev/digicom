import Setting from "../models/Setting";

export async function getZiniPayApiKey(): Promise<string> {
  try {
    const setting = await Setting.findOne({ key: "zinipay_settings" });
    if (setting?.value?.apiKey && String(setting.value.apiKey).trim()) {
      return String(setting.value.apiKey).trim();
    }
  } catch (error) {
    console.error("Error fetching ZiniPay API key from DB:", error);
  }

  return process.env.ZINIPAY_API_KEY || "sandbox_test_8f4c9a2e7b31";
}

export interface CreateInvoiceParams {
  cus_name?: string;
  cus_email?: string;
  amount: number;
  metadata?: Record<string, any>;
  redirect_url: string;
  cancel_url?: string;
  webhook_url?: string;
}

export interface CreateInvoiceResponse {
  status: boolean;
  message: string;
  payment_url?: string;
  invoice_id?: string;
  error?: string;
}

export interface VerifyInvoiceResponse {
  success: boolean;
  cus_name?: string;
  cus_email?: string;
  amount?: number;
  invoice_id?: string;
  payment_method?: string;
  transaction_id?: string;
  status: "COMPLETED" | "PENDING" | "FAILED" | "UNKNOWN";
  raw?: any;
  error?: string;
}

/**
 * Creates a hosted invoice on ZiniPay and returns the payment URL
 */
export async function createZiniPayInvoice(params: CreateInvoiceParams): Promise<CreateInvoiceResponse> {
  const apiKey = await getZiniPayApiKey();

  try {
    const payload = {
      cus_name: params.cus_name || "Customer",
      cus_email: params.cus_email || "customer@example.com",
      amount: Number(params.amount),
      metadata: params.metadata || {},
      redirect_url: params.redirect_url,
      cancel_url: params.cancel_url || params.redirect_url,
      ...(params.webhook_url ? { webhook_url: params.webhook_url } : {}),
    };

    console.log("[ZiniPay] Creating Invoice:", payload);

    const res = await fetch("https://api.zinipay.com/v1/payment/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "zini-api-key": apiKey,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    console.log("[ZiniPay] Create Invoice Response:", data);

    if (data.status && data.payment_url) {
      // Extract invoice_id from payment_url if not explicitly provided
      let invoiceId = data.invoice_id;
      if (!invoiceId && typeof data.payment_url === "string") {
        const parts = data.payment_url.split("/");
        invoiceId = parts[parts.length - 1] || parts[parts.length - 2];
      }

      return {
        status: true,
        message: data.message || "Invoice created successfully.",
        payment_url: data.payment_url,
        invoice_id: invoiceId,
      };
    }

    return {
      status: false,
      message: data.message || "Failed to create ZiniPay invoice.",
      error: data.message,
    };
  } catch (error: any) {
    console.error("[ZiniPay] Create Invoice Error:", error);
    return {
      status: false,
      message: error.message || "Network exception while creating ZiniPay invoice.",
      error: error.message,
    };
  }
}

/**
 * Verifies an invoice on ZiniPay directly from backend
 */
export async function verifyZiniPayInvoice(invoiceId: string): Promise<VerifyInvoiceResponse> {
  const apiKey = await getZiniPayApiKey();

  try {
    console.log(`[ZiniPay] Verifying Invoice: ${invoiceId}`);

    const res = await fetch("https://api.zinipay.com/v1/payment/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "zini-api-key": apiKey,
      },
      body: JSON.stringify({
        invoice_id: invoiceId,
      }),
    });

    const data = await res.json();
    console.log(`[ZiniPay] Verify Response for ${invoiceId}:`, data);

    const statusUpper = (data.status || "").toUpperCase();

    return {
      success: statusUpper === "COMPLETED" || data.status === true || data.status === "true",
      cus_name: data.cus_name,
      cus_email: data.cus_email,
      amount: Number(data.amount) || undefined,
      invoice_id: data.invoice_id || invoiceId,
      payment_method: data.payment_method || "zinipay",
      transaction_id: data.transaction_id || `TXN-${Date.now()}`,
      status: statusUpper === "COMPLETED" ? "COMPLETED" : statusUpper === "FAILED" ? "FAILED" : "PENDING",
      raw: data,
    };
  } catch (error: any) {
    console.error(`[ZiniPay] Verify Invoice Exception for ${invoiceId}:`, error);
    return {
      success: false,
      status: "UNKNOWN",
      error: error.message,
    };
  }
}
