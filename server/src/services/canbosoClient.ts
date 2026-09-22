import { getSetting } from "../utils/settingsCache";
import { Provider, IProvider } from "../models/Provider";

const CANBOSO_BASE_URL = "https://canboso.com";

export interface CanbosoConfig {
  apiKey: string;
  dollarRate: number; // e.g. 127 BDT per 1 USD
  autoFulfill: boolean;
  baseUrl?: string;
  providerId?: string;
  providerName?: string;
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
  providerId?: string;
  providerName?: string;
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
  providerId?: string;
  providerName?: string;
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

// In-memory catalog cache keyed by providerId or "default" (TTL: 2 minutes)
const providerCatalogCache: Record<string, { products: CanbosoProduct[]; expiresAt: number }> = {};
const CACHE_TTL_MS = 2 * 60 * 1000;

/**
 * Automatically creates initial default Provider record if none exist yet
 */
export async function ensureDefaultProviderMigrated(): Promise<void> {
  try {
    const count = await Provider.countDocuments();
    if (count === 0) {
      const settings = (await getSetting("canboso_settings")) || {};
      const apiKey = (settings.apiKey || process.env.CANBOSO_BUYER_API_KEY || "").trim();
      if (apiKey) {
        await Provider.create({
          name: "Canboso Primary",
          slug: "canboso-primary",
          type: "canboso",
          apiKey,
          baseUrl: CANBOSO_BASE_URL,
          dollarRate: Number(settings.dollarRate) > 0 ? Number(settings.dollarRate) : 127,
          autoFulfill: settings.autoFulfill !== false,
          isActive: true,
          isDefault: true,
          notes: "Auto-migrated from initial Canboso settings",
        });
        console.log("[Provider] Created initial default provider from canboso_settings.");
      }
    }
  } catch (err) {
    console.error("[Provider] Error ensuring default provider:", err);
  }
}

/**
 * Resolves provider configuration by specific ID or falls back to default active provider
 */
export async function resolveProvider(providerId?: string): Promise<{
  id?: string;
  name: string;
  apiKey: string;
  baseUrl: string;
  dollarRate: number;
  autoFulfill: boolean;
}> {
  await ensureDefaultProviderMigrated();

  if (providerId) {
    try {
      const p = await Provider.findById(providerId);
      if (p) {
        return {
          id: p._id.toString(),
          name: p.name,
          apiKey: p.apiKey.trim(),
          baseUrl: (p.baseUrl || CANBOSO_BASE_URL).trim().replace(/\/+$/, ""),
          dollarRate: Number(p.dollarRate) > 0 ? Number(p.dollarRate) : 127,
          autoFulfill: p.autoFulfill !== false,
        };
      }
    } catch (_) {}
  }

  // 1. Find default active provider
  const defaultProv = await Provider.findOne({ isActive: true, isDefault: true });
  if (defaultProv) {
    return {
      id: defaultProv._id.toString(),
      name: defaultProv.name,
      apiKey: defaultProv.apiKey.trim(),
      baseUrl: (defaultProv.baseUrl || CANBOSO_BASE_URL).trim().replace(/\/+$/, ""),
      dollarRate: Number(defaultProv.dollarRate) > 0 ? Number(defaultProv.dollarRate) : 127,
      autoFulfill: defaultProv.autoFulfill !== false,
    };
  }

  // 2. Find any active provider
  const anyProv = await Provider.findOne({ isActive: true });
  if (anyProv) {
    return {
      id: anyProv._id.toString(),
      name: anyProv.name,
      apiKey: anyProv.apiKey.trim(),
      baseUrl: (anyProv.baseUrl || CANBOSO_BASE_URL).trim().replace(/\/+$/, ""),
      dollarRate: Number(anyProv.dollarRate) > 0 ? Number(anyProv.dollarRate) : 127,
      autoFulfill: anyProv.autoFulfill !== false,
    };
  }

  // 3. Fallback to settings / env
  const settings = (await getSetting("canboso_settings")) || {};
  const apiKey = (settings.apiKey || process.env.CANBOSO_BUYER_API_KEY || "").trim();
  const dollarRate = Number(settings.dollarRate) > 0 ? Number(settings.dollarRate) : 127;
  const autoFulfill = settings.autoFulfill !== false;

  return {
    name: "Default Provider",
    apiKey,
    baseUrl: CANBOSO_BASE_URL,
    dollarRate,
    autoFulfill,
  };
}

/**
 * Retrieve Canboso configuration (backward compatible)
 */
export async function getCanbosoConfig(providerId?: string): Promise<CanbosoConfig> {
  const p = await resolveProvider(providerId);
  return {
    apiKey: p.apiKey,
    dollarRate: p.dollarRate,
    autoFulfill: p.autoFulfill,
    baseUrl: p.baseUrl,
    providerId: p.id,
    providerName: p.name,
  };
}

/**
 * Fetch spendable upstream wallet balance for a specific provider
 */
export async function fetchCanbosoBalance(providerId?: string) {
  const provider = await resolveProvider(providerId);
  if (!provider.apiKey) {
    return {
      success: false,
      message: `Provider "${provider.name}" API Key is not configured.`,
      providerName: provider.name,
      providerId: provider.id,
    };
  }

  try {
    const url = `${provider.baseUrl}/api/v2/telegram-buyer/balance?key=${encodeURIComponent(provider.apiKey)}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.success) {
      return {
        success: false,
        message: data.message || `Upstream error: HTTP ${res.status}`,
        code: data.code,
        providerName: provider.name,
        providerId: provider.id,
      };
    }

    const balanceVnd = Number(data.balanceVnd || data.balance || 0);
    const balanceUsd = Number(data.balanceUsd || (balanceVnd > 0 ? balanceVnd / 27000 : 0));

    // Update balance in database if provider has record
    if (provider.id) {
      await Provider.findByIdAndUpdate(provider.id, {
        balanceUsd: Number(balanceUsd.toFixed(2)),
        balanceVnd,
        lastSyncAt: new Date(),
      }).catch(() => {});
    }

    return {
      success: true,
      balanceVnd,
      balanceUsd: Number(balanceUsd.toFixed(2)),
      balanceText: data.balanceText || `${balanceVnd.toLocaleString()} ₫`,
      providerName: provider.name,
      providerId: provider.id,
      requester: data.requester || {},
      botSource: data.botSource,
      updatedAt: data.updatedAt,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to reach provider server",
      providerName: provider.name,
      providerId: provider.id,
    };
  }
}

/**
 * Fetch available upstream products with stock and converted USD / BDT pricing for a provider
 */
export async function fetchCanbosoProducts(
  forceRefresh = false,
  providerId?: string
): Promise<{
  success: boolean;
  products: CanbosoProduct[];
  providerName?: string;
  providerId?: string;
  dollarRate?: number;
  message?: string;
  fromCache?: boolean;
}> {
  const provider = await resolveProvider(providerId);
  const cacheKey = provider.id || "default";
  const now = Date.now();

  if (!forceRefresh && providerCatalogCache[cacheKey]?.expiresAt > now) {
    return {
      success: true,
      products: providerCatalogCache[cacheKey].products,
      providerName: provider.name,
      providerId: provider.id,
      dollarRate: provider.dollarRate,
      fromCache: true,
    };
  }

  if (!provider.apiKey) {
    return {
      success: false,
      products: [],
      providerName: provider.name,
      providerId: provider.id,
      dollarRate: provider.dollarRate,
      message: `Provider "${provider.name}" API Key is not configured.`,
    };
  }

  try {
    const url = `${provider.baseUrl}/api/v2/telegram-buyer/products?key=${encodeURIComponent(provider.apiKey)}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.success) {
      return {
        success: false,
        products: [],
        providerName: provider.name,
        providerId: provider.id,
        dollarRate: provider.dollarRate,
        message: data.message || `Provider HTTP ${res.status}`,
      };
    }

    const rawProducts = Array.isArray(data.products) ? data.products : [];
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

      const calculatedBdt = Math.round(amountUsd * provider.dollarRate);
      const id = String(p.productId || p._id || p.id);
      const stock = Number(p.availability?.available ?? p.stock ?? 0);
      const costVnd = currency === "VND" ? amount : Math.round(amountUsd * VND_TO_USD);
      const type = p.productType || p.type || "account";

      return {
        id,
        productId: id,
        name: p.name || "Digital Product",
        code: p.code || "",
        description: p.description || "",
        image: p.image || "",
        emoji: p.emoji || "",
        productType: type,
        type,
        costUsd: amountUsd,
        costVnd,
        stock,
        providerId: provider.id,
        providerName: provider.name,
        price: {
          amount,
          currency,
          text: rawPrice.text || `${amount.toLocaleString()} ${currency}`,
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

    providerCatalogCache[cacheKey] = {
      products: normalized,
      expiresAt: now + CACHE_TTL_MS,
    };

    return {
      success: true,
      products: normalized,
      providerName: provider.name,
      providerId: provider.id,
      dollarRate: provider.dollarRate,
      fromCache: false,
    };
  } catch (error: any) {
    if (providerCatalogCache[cacheKey]?.products?.length > 0) {
      return {
        success: true,
        products: providerCatalogCache[cacheKey].products,
        providerName: provider.name,
        providerId: provider.id,
        dollarRate: provider.dollarRate,
        fromCache: true,
      };
    }
    return {
      success: false,
      products: [],
      providerName: provider.name,
      providerId: provider.id,
      dollarRate: provider.dollarRate,
      message: error.message,
    };
  }
}

/**
 * Execute automated purchase against a specific provider's API
 */
export async function executeCanbosoPurchase(options: {
  orderId: string;
  productId: string;
  quantity?: number;
  customerEmail?: string;
  slotMonths?: number;
  providerId?: string;
}): Promise<CanbosoPurchaseResult> {
  const provider = await resolveProvider(options.providerId);
  if (!provider.apiKey) {
    return {
      success: false,
      fulfillmentStatus: "failed",
      errorMessage: `Provider "${provider.name}" API Key is missing. Manual fulfillment required.`,
      providerName: provider.name,
      providerId: provider.id,
    };
  }

  const { orderId, productId, quantity = 1, customerEmail, slotMonths } = options;
  const idempotencyKey = `purchase-${orderId}-${productId}-${Date.now()}`;

  const payload: Record<string, any> = {
    key: provider.apiKey,
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
    const url = `${provider.baseUrl}/api/v2/telegram-buyer/purchase`;
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
      const errorMsg = data.message || `Upstream provider (${provider.name}) purchase failed with HTTP ${res.status}`;
      console.error(`[Provider Purchase Error] Provider: ${provider.name}, Order: ${orderId}, Product: ${productId}:`, errorMsg, data);
      return {
        success: false,
        fulfillmentStatus: "failed",
        errorMessage: errorMsg,
        providerName: provider.name,
        providerId: provider.id,
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
      orderCode: orderData.orderCode || `ORDER-${orderId}`,
      fulfillmentStatus: "completed",
      costUsd,
      costVnd,
      providerName: provider.name,
      providerId: provider.id,
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
    console.error(`[Provider Network Error] Provider: ${provider.name}, Order: ${orderId}:`, error);
    return {
      success: false,
      fulfillmentStatus: "failed",
      errorMessage: error.message || `Failed to communicate with provider ${provider.name} server.`,
      providerName: provider.name,
      providerId: provider.id,
    };
  }
}
