import { getSetting } from "../utils/settingsCache";

const CANBOSO_BASE_URL = "https://canboso.com";

export interface CanbosoConfig {
  apiKey: string;
  dollarRate: number; // e.g. 127 BDT per 1 USD
  autoFulfill: boolean;
}

export interface CanbosoProductPrice {
  amount: number;
  currency: string;
  text?: string;
  amountUsd: number;
  calculatedBdt: number;
}

export interface CanbosoProduct {
  id?: string;
  productId: string;
  name: string;
  code?: string;
  description?: string;
  image?: string;
  emoji?: string;
  productType: "account" | "slot" | "slot_chatgpt_business" | "other" | string;
  type?: string;
  costUsd?: number;
  costVnd?: number;
  stock?: number;
  price: CanbosoProductPrice;
  availability: {
    available: number;
    sold: number;
  };
  promotions?: any[];
  purchaseRequirements?: {
    customerEmail?: boolean;
    slotMonths?: boolean;
    quantityFixed?: number;
    allowedMonths?: number[];
  };
}

export interface CanbosoPurchaseResult {
  success: boolean;
  orderCode?: string;
  fulfillmentStatus: "completed" | "failed" | "waiting_seller";
  costUsd?: number;
  costVnd?: number;
  deliveryAccounts?: Array<{
    user: string;
    password?: string;
    verifyEmail?: string;
    expiryText?: string;
    otherInfo?: string;
  }>;
  rawResponse?: any;
  errorMessage?: string;
}

// In-memory catalog cache to honor Canboso 30 req/min quota
let cachedProducts: CanbosoProduct[] = [];
let cacheExpiresAt = 0;
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

export async function getCanbosoConfig(): Promise<CanbosoConfig> {
  const settings = (await getSetting("canboso_settings")) || {};
  const apiKey = (settings.apiKey || process.env.CANBOSO_BUYER_API_KEY || "").trim();
  const dollarRate = Number(settings.dollarRate) > 0 ? Number(settings.dollarRate) : 127;
  const autoFulfill = settings.autoFulfill !== false;

  return { apiKey, dollarRate, autoFulfill };
}

/**
 * Fetch spendable upstream wallet balance
 */
export async function fetchCanbosoBalance() {
  const { apiKey } = await getCanbosoConfig();
  if (!apiKey) {
    return { success: false, message: "Canboso Buyer API Key is not configured." };
  }

  try {
    const url = `${CANBOSO_BASE_URL}/api/v2/telegram-buyer/balance?key=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    const data = await res.json();

    if (!res.ok || !data.success) {
      return {
        success: false,
        message: data.message || `Upstream error: HTTP ${res.status}`,
        code: data.code,
      };
    }

    const balanceVnd = Number(data.balanceVnd || data.balance || 0);
    const balanceUsd = Number(data.balanceUsd || (balanceVnd > 0 ? balanceVnd / 27000 : 0));

    return {
      success: true,
      balanceVnd,
      balanceUsd: Number(balanceUsd.toFixed(2)),
      balanceText: data.balanceText || `${balanceVnd.toLocaleString()} ₫`,
      requester: data.requester || {},
      botSource: data.botSource,
      updatedAt: data.updatedAt,
    };
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to reach Canboso server" };
  }
}

/**
 * Fetch available upstream products with stock and converted USD / BDT pricing
 */
export async function fetchCanbosoProducts(forceRefresh = false): Promise<{
  success: boolean;
  products: CanbosoProduct[];
  message?: string;
  fromCache?: boolean;
}> {
  const now = Date.now();
  if (!forceRefresh && cachedProducts.length > 0 && now < cacheExpiresAt) {
    return { success: true, products: cachedProducts, fromCache: true };
  }

  const { apiKey, dollarRate } = await getCanbosoConfig();
  if (!apiKey) {
    return {
      success: false,
      products: [],
      message: "Canboso Buyer API Key is not configured. Please set it in Admin Settings.",
    };
  }

  try {
    const url = `${CANBOSO_BASE_URL}/api/v2/telegram-buyer/products?key=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    const data = await res.json();

    if (!res.ok || !data.success) {
      return {
        success: false,
        products: [],
        message: data.message || `Canboso HTTP ${res.status}`,
      };
    }

    const rawProducts = Array.isArray(data.products) ? data.products : [];

    // Approximate VND to USD rate if upstream currency is VND (~27,000 VND = $1 USD)
    const VND_TO_USD = 27000;

    const normalized: CanbosoProduct[] = rawProducts.map((p: any) => {
      const rawPrice = p.price || {};
      const amount = Number(rawPrice.amount) || 0;
      const currency = String(rawPrice.currency || "VND").toUpperCase();

      let amountUsd = 0;
      if (currency === "USD") {
        amountUsd = amount;
      } else if (currency === "VND") {
        amountUsd = Number((amount / VND_TO_USD).toFixed(2));
      } else {
        amountUsd = Number((amount / VND_TO_USD).toFixed(2));
      }

      // Converted BDT equivalent using admin's configured dollarRate
      const calculatedBdt = Math.round(amountUsd * dollarRate);

      const id = String(p.productId || p._id || p.id);
      const stock = Number(p.availability?.available ?? p.stock ?? 0);
      const costVnd = currency === "VND" ? amount : Math.round(amountUsd * VND_TO_USD);
      const type = p.productType || p.type || "account";

      return {
        id,
        productId: id,
        name: String(p.name || "Canboso Product"),
        code: p.code || "",
        description: p.description || "",
        image: p.image || "",
        emoji: p.emoji || "",
        productType: type,
        type,
        costUsd: amountUsd,
        costVnd,
        stock,
        price: {
          amount,
          currency,
          text: rawPrice.text || `${amount} ${currency}`,
          amountUsd,
          calculatedBdt,
        },
        availability: {
          available: stock,
          sold: Number(p.availability?.sold ?? 0),
        },
        promotions: Array.isArray(p.promotions) ? p.promotions : [],
        purchaseRequirements: p.purchaseRequirements || {},
      };
    });

    cachedProducts = normalized;
    cacheExpiresAt = now + CACHE_TTL_MS;

    return { success: true, products: normalized, fromCache: false };
  } catch (error: any) {
    if (cachedProducts.length > 0) {
      return { success: true, products: cachedProducts, fromCache: true };
    }
    return { success: false, products: [], message: error.message };
  }
}

/**
 * Execute automated purchase against Canboso Buyer API
 */
export async function executeCanbosoPurchase(options: {
  orderId: string;
  productId: string;
  quantity?: number;
  customerEmail?: string;
  slotMonths?: number;
}): Promise<CanbosoPurchaseResult> {
  const { apiKey } = await getCanbosoConfig();
  if (!apiKey) {
    return {
      success: false,
      fulfillmentStatus: "failed",
      errorMessage: "Canboso Buyer API Key is missing. Manual fulfillment required.",
    };
  }

  const { orderId, productId, quantity = 1, customerEmail, slotMonths } = options;
  const idempotencyKey = `purchase-${orderId}-${productId}-${Date.now()}`;

  const payload: Record<string, any> = {
    key: apiKey,
    product_id: productId,
    quantity: Math.max(1, quantity),
  };

  if (customerEmail) {
    payload.customer_email = customerEmail;
  }
  if (slotMonths && Number(slotMonths) > 0) {
    payload.slot_months = Number(slotMonths);
  }

  try {
    const url = `${CANBOSO_BASE_URL}/api/v2/telegram-buyer/purchase`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.success) {
      const errorMsg = data.message || `Canboso purchase failed with HTTP ${res.status}`;
      console.error(`[Canboso Purchase Error] Order ${orderId}, Product ${productId}:`, errorMsg, data);
      return {
        success: false,
        fulfillmentStatus: "failed",
        errorMessage: errorMsg,
        rawResponse: data,
      };
    }

    const orderData = data.order || {};
    const delivery = data.delivery || {};
    const accounts = Array.isArray(delivery.accounts) ? delivery.accounts : [];
    const payment = data.payment || {};

    const costVnd = Number(payment.amount || 0);
    const costUsd = costVnd > 0 ? Number((costVnd / 27000).toFixed(2)) : 0;

    return {
      success: true,
      orderCode: orderData.orderCode || `CANBOSO-${orderId}`,
      fulfillmentStatus: "completed",
      costUsd,
      costVnd,
      deliveryAccounts: accounts.map((acc: any) => ({
        user: String(acc.user || acc.email || acc.username || ""),
        password: String(acc.password || acc.pass || ""),
        verifyEmail: acc.verifyEmail ? String(acc.verifyEmail) : undefined,
        expiryText: acc.expiryText ? String(acc.expiryText) : undefined,
        otherInfo: acc.otherInfo ? String(acc.otherInfo) : undefined,
      })),
      rawResponse: data,
    };
  } catch (error: any) {
    console.error(`[Canboso Network Error] Order ${orderId}:`, error);
    return {
      success: false,
      fulfillmentStatus: "failed",
      errorMessage: error.message || "Failed to communicate with Canboso upstream server.",
    };
  }
}
