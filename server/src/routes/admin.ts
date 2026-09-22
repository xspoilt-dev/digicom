import { Hono } from "hono";
import { sign, verify } from "hono/jwt";
import Product from "../models/Product";
import Category from "../models/Category";
import Order from "../models/Order";
import Transaction from "../models/Transaction";
import Setting from "../models/Setting";
import RouteRedirect from "../models/RouteRedirect";
import CapiLog from "../models/CapiLog";
import Provider from "../models/Provider";
import { sendCapiEvent } from "../utils/metaCapi";
import { sendOrderDeliveryEmail } from "../utils/mailer";
import { invalidateSettingCache } from "../utils/settingsCache";
import {
  fetchCanbosoBalance,
  fetchCanbosoProducts,
  executeCanbosoPurchase,
  getCanbosoConfig,
  resolveProvider,
  ensureDefaultProviderMigrated,
} from "../services/canbosoClient";
import {
  testOpenRouterConnection,
  generateBanglaProductCopy,
  getOpenRouterConfig,
  ensureFormattedHtml,
} from "../services/openrouterService";
import { getZiniPayApiKey } from "../utils/zinipay";
import path from "path";
import fs from "fs";
import sharp from "sharp";

const adminRouter = new Hono();

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || "kalobazar_super_secret_jwt_admin_token_2026";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@kalobazar.shop";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@2026!Secured";
const LEGACY_ADMIN_TOKEN = process.env.ADMIN_TOKEN || "admin-secret-token";

// 0. Public Admin Login Endpoint (Email + Password)
adminRouter.post("/login", async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ success: false, message: "Email and password are required." }, 400);
    }

    const inputEmail = String(email).trim().toLowerCase();
    const targetEmail = (process.env.ADMIN_EMAIL || ADMIN_EMAIL).trim().toLowerCase();
    const targetPassword = process.env.ADMIN_PASSWORD || ADMIN_PASSWORD;

    if (inputEmail !== targetEmail || String(password) !== targetPassword) {
      return c.json({ success: false, message: "Invalid administrator email or password." }, 401);
    }

    // Generate JWT token valid for 7 days
    const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7;
    const token = await sign(
      {
        email: targetEmail,
        role: "admin",
        name: "Store Administrator",
        exp,
      },
      process.env.ADMIN_JWT_SECRET || ADMIN_JWT_SECRET,
      "HS256"
    );

    return c.json({
      success: true,
      message: "Admin authentication successful.",
      token,
      user: {
        email: targetEmail,
        name: "Store Administrator",
        role: "admin",
        expiresAt: new Date(exp * 1000).toISOString(),
      },
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 0.1 Session Profile Verification Endpoint
adminRouter.get("/me", async (c) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ success: false, message: "No authentication token provided" }, 401);
  }

  const token = authHeader.replace(/^Bearer\s+/, "");
  try {
    if (token === (process.env.ADMIN_TOKEN || LEGACY_ADMIN_TOKEN)) {
      return c.json({
        success: true,
        user: { email: process.env.ADMIN_EMAIL || ADMIN_EMAIL, name: "Store Administrator", role: "admin" },
      });
    }

    const payload = (await verify(
      token,
      process.env.ADMIN_JWT_SECRET || ADMIN_JWT_SECRET,
      "HS256"
    )) as any;
    return c.json({
      success: true,
      user: {
        email: payload.email,
        name: payload.name || "Store Administrator",
        role: payload.role || "admin",
      },
    });
  } catch (err) {
    return c.json({ success: false, message: "Invalid or expired session token" }, 401);
  }
});

// Auth Middleware: Protects all subsequent /api/admin/* routes
adminRouter.use("/*", async (c, next) => {
  if (c.req.path.endsWith("/login") || c.req.path.endsWith("/me")) {
    return next();
  }

  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ success: false, message: "Unauthorized admin access: Missing bearer token" }, 401);
  }

  const token = authHeader.replace(/^Bearer\s+/, "");

  // Legacy fallback check
  if (token === (process.env.ADMIN_TOKEN || LEGACY_ADMIN_TOKEN)) {
    return next();
  }

  // Verify JWT
  try {
    const payload = (await verify(
      token,
      process.env.ADMIN_JWT_SECRET || ADMIN_JWT_SECRET,
      "HS256"
    )) as any;
    if (payload && payload.role === "admin") {
      c.set("adminUser" as any, payload);
      return next();
    }
  } catch (err) {
    return c.json({ success: false, message: "Session expired or invalid token" }, 401);
  }

  return c.json({ success: false, message: "Unauthorized admin access" }, 401);
});

// 1. Dashboard Stats (USD for Admin, BDT for Storefront)
adminRouter.get("/stats", async (c) => {
  try {
    const totalSalesAggregate = await Order.aggregate([
      { $match: { status: "paid" } },
      {
        $group: {
          _id: null,
          totalBdt: { $sum: "$total" },
          totalUsd: { $sum: "$totalUsd" },
          costUsd: { $sum: "$costUsd" },
          profitUsd: { $sum: "$profitUsd" },
          costBdt: { $sum: "$costBdt" },
          profitBdt: { $sum: "$profitBdt" },
        },
      },
    ]);
    const totals = totalSalesAggregate[0] || {};
    const canbosoConfig = await getCanbosoConfig();
    const dollarRate = canbosoConfig.dollarRate || 127;

    const totalSales = totals.totalBdt || 0;
    const totalSalesUsd = totals.totalUsd || Number((totalSales / dollarRate).toFixed(2));
    const totalCostUsd = totals.costUsd || 0;
    const netProfitUsd = totals.profitUsd || Number((totalSalesUsd - totalCostUsd).toFixed(2));
    const totalCostBdt = totals.costBdt || Math.round(totalCostUsd * dollarRate);
    const netProfitBdt = totals.profitBdt || (totalSales - totalCostBdt);
    const profitMargin = totalSalesUsd > 0 ? Number(((netProfitUsd / totalSalesUsd) * 100).toFixed(1)) : 0;

    const totalOrders = await Order.countDocuments();
    const paidOrders = await Order.countDocuments({ status: "paid" });
    const pendingOrders = await Order.countDocuments({ status: "pending" });
    const processingOrders = await Order.countDocuments({ status: "processing" });
    const failedOrders = await Order.countDocuments({ status: "failed" });

    // Top Products
    const topProducts = await Order.aggregate([
      { $match: { status: "paid" } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          title: { $first: "$items.title" },
          salesCount: { $sum: "$items.quantity" },
          revenueBdt: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        },
      },
      { $sort: { salesCount: -1 } },
      { $limit: 5 },
    ]);

    const formattedTopProducts = topProducts.map((p) => ({
      ...p,
      revenueBdt: p.revenueBdt,
      revenueUsd: Number((p.revenueBdt / dollarRate).toFixed(2)),
    }));

    // Recent Transactions
    const recentTransactions = await Transaction.find()
      .populate("orderId", "orderId email phone total")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return c.json({
      success: true,
      stats: {
        totalSales,
        totalSalesUsd,
        totalCostUsd,
        netProfitUsd,
        totalCostBdt,
        netProfitBdt,
        profitMargin,
        dollarRate,
        totalOrders,
        paidOrders,
        pendingOrders,
        processingOrders,
        failedOrders,
        topProducts: formattedTopProducts,
        recentTransactions,
      },
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 2. Orders Management
adminRouter.get("/orders", async (c) => {
  try {
    const status = c.req.query("status");
    const search = c.req.query("search");
    const providerId = c.req.query("providerId");

    const query: any = {};
    if (status) {
      query.status = status;
    }
    if (providerId) {
      query.$or = [{ providerId }, { "items.providerId": providerId }];
    }
    if (search) {
      const searchConditions = [
        { orderId: new RegExp(search, "i") },
        { email: new RegExp(search, "i") },
        { phone: new RegExp(search, "i") },
        { providerName: new RegExp(search, "i") },
        { upstreamOrderCode: new RegExp(search, "i") },
        { canbosoOrderCode: new RegExp(search, "i") },
        { zinipayInvoiceId: new RegExp(search, "i") },
        { transactionId: new RegExp(search, "i") },
        { bkashTrxID: new RegExp(search, "i") },
      ];
      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchConditions }];
        delete query.$or;
      } else {
        query.$or = searchConditions;
      }
    }

    const orders = await Order.find(query).sort({ createdAt: -1 }).lean();
    return c.json({ success: true, orders });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Approve/Verify Order manually (ZiniPay / manual validation / Canboso fulfillment)
adminRouter.post("/orders/:id/verify", async (c) => {
  try {
    const id = c.req.param("id");
    const order = await Order.findById(id);

    if (!order) {
      return c.json({ success: false, message: "Order not found" }, 404);
    }

    if (order.status === "paid") {
      return c.json({ success: false, message: "Order is already marked as paid" }, 400);
    }

    // Ensure order has a metaEventId for CAPI deduplication
    if (!order.metaEventId) {
      order.metaEventId = `order_${order.orderId}_${Date.now()}`;
    }

    order.status = "paid";
    if (!order.paymentMethod) {
      order.paymentMethod = "admin_approval";
    }

    // Automated Multi-Provider Purchase Execution
    const canbosoConfig = await getCanbosoConfig();
    const dollarRate = canbosoConfig.dollarRate || 127;
    order.dollarRateUsed = dollarRate;

    let totalCostUsd = order.costUsd || 0;
    const downloadUrls: { title: string; link: string }[] = [];

    for (const item of order.items) {
      const prodId = item.productId?._id || item.productId;
      const prod = (await Product.findById(prodId)) as any;

      if (prod) {
        const targetUpstreamId = prod.canbosoProductId || prod.upstreamProductId;
        const targetProviderId = (prod.providerId || item.providerId)?.toString();

        if (targetUpstreamId && canbosoConfig.autoFulfill && prod.autoFulfill !== false) {
          order.fulfillmentStatus = "processing";
          try {
            const purchaseRes = await executeCanbosoPurchase({
              orderId: order.orderId,
              productId: targetUpstreamId,
              quantity: item.quantity || 1,
              customerEmail: order.email,
              slotMonths: order.slotMonths || item.slotMonths,
              providerId: targetProviderId,
            });

            if (purchaseRes.success) {
              order.fulfillmentStatus = "completed";
              order.canbosoOrderCode = purchaseRes.orderCode;
              order.upstreamOrderCode = purchaseRes.orderCode;
              if (purchaseRes.providerName) {
                order.providerName = purchaseRes.providerName;
                item.providerName = purchaseRes.providerName;
              }
              if (purchaseRes.providerId) {
                order.providerId = purchaseRes.providerId as any;
                item.providerId = purchaseRes.providerId as any;
              }
              item.upstreamOrderCode = purchaseRes.orderCode;
              item.upstreamProductId = targetUpstreamId;
              if (purchaseRes.deliveryAccounts && purchaseRes.deliveryAccounts.length > 0) {
                order.deliveryAccounts = (order.deliveryAccounts || []).concat(purchaseRes.deliveryAccounts);
              }
              const itemCost = purchaseRes.costUsd || prod.canbosoCostUsd || 0;
              item.costUsd = itemCost;
              totalCostUsd += itemCost * (item.quantity || 1);
            } else {
              order.fulfillmentStatus = "failed";
              order.fulfillmentError = purchaseRes.errorMessage || "Automated purchase failed";
              if (purchaseRes.providerName) {
                order.providerName = purchaseRes.providerName;
                item.providerName = purchaseRes.providerName;
              }
            }
          } catch (err: any) {
            order.fulfillmentStatus = "failed";
            order.fulfillmentError = err.message;
          }
        } else {
          if (!order.fulfillmentStatus || order.fulfillmentStatus === "unfulfilled") {
            order.fulfillmentStatus = "completed";
          }
        }

        const link = prod.deliveryLink || (prod.filePath ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/${prod.filePath}` : "");
        if (link) {
          downloadUrls.push({ title: prod.title, link });
        }
      }
    }

    // Accounting calculations
    order.costUsd = Number(totalCostUsd.toFixed(2));
    order.costBdt = Math.round(order.costUsd * dollarRate);
    order.totalUsd = Number((order.total / dollarRate).toFixed(2));
    order.profitUsd = Number((order.totalUsd - order.costUsd).toFixed(2));
    order.profitBdt = Math.round(order.total - order.costBdt);

    await order.save();

    // Update or create associated transaction in ledger
    const trxID = order.transactionId || order.zinipayInvoiceId || order.bkashTrxID || `MANUAL-${order.orderId}-${Date.now()}`;
    await Transaction.findOneAndUpdate(
      { orderId: order._id },
      {
        orderId: order._id,
        amount: order.total,
        gateway: order.paymentGateway || "zinipay",
        trxID,
        invoiceId: order.zinipayInvoiceId,
        paymentMethod: order.paymentMethod || "admin_approval",
        status: "verified",
        verifiedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    // Trigger server-side Meta CAPI Purchase event
    const capiDispatched = await sendCapiEvent({
      eventName: "Purchase",
      eventId: order.metaEventId,
      eventSourceUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/receipt/${order.orderId}`,
      userData: {
        email: order.email,
        phone: order.phone,
        fbp: order.fbp,
        fbc: order.fbc,
        clientIpAddress: order.ip,
        clientUserAgent: order.userAgent,
        externalId: String(order._id),
      },
      customData: {
        currency: "BDT",
        value: order.total,
        content_ids: order.items.map((item: any) => String(item.productId?._id || item.productId)),
        content_type: "product",
        order_id: order.orderId,
      },
    });

    console.log(`[Admin Order Approval] Order ${order.orderId} approved by admin. CAPI Purchase dispatched: ${capiDispatched}`);

    // Send delivery email asynchronously
    if (order.email) {
      sendOrderDeliveryEmail({
        toEmail: order.email,
        orderId: order.orderId,
        customerName: order.name || "Customer",
        totalAmount: order.total,
        items: order.items.map((i: any) => ({ title: i.title, price: i.price, quantity: i.quantity })),
        downloadUrls,
        deliveryAccounts: order.deliveryAccounts || [],
      }).catch(err => console.error("[Admin Order Approval] Email send error:", err));
    }

    return c.json({
      success: true,
      message: "Order approved, Canboso fulfillment processed, payment recorded, delivery email dispatched, and Meta CAPI Purchase event fired.",
      capiDispatched,
      fulfillmentStatus: order.fulfillmentStatus,
      deliveryAccounts: order.deliveryAccounts || [],
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 2.05 Retry/Manual fulfillment for an order
adminRouter.post("/orders/:id/fulfill", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json().catch(() => ({}));
    const overrideProviderId = body.providerId;
    const order = await Order.findById(id);
    if (!order) {
      return c.json({ success: false, message: "Order not found" }, 404);
    }

    let fulfilledCount = 0;
    let lastError = "";

    for (const item of order.items) {
      const prodId = item.productId?._id || item.productId;
      const prod = (await Product.findById(prodId)) as any;
      if (!prod) continue;

      const targetUpstreamId = prod.canbosoProductId || prod.upstreamProductId;
      const targetProviderId = overrideProviderId || (prod.providerId || item.providerId)?.toString();

      if (targetUpstreamId) {
        order.fulfillmentStatus = "processing";
        const purchaseRes = await executeCanbosoPurchase({
          orderId: order.orderId,
          productId: targetUpstreamId,
          quantity: item.quantity || 1,
          customerEmail: order.email,
          slotMonths: order.slotMonths || item.slotMonths,
          providerId: targetProviderId,
        });

        if (purchaseRes.success) {
          fulfilledCount++;
          order.fulfillmentStatus = "completed";
          order.canbosoOrderCode = purchaseRes.orderCode;
          order.upstreamOrderCode = purchaseRes.orderCode;
          if (purchaseRes.providerName) {
            order.providerName = purchaseRes.providerName;
            item.providerName = purchaseRes.providerName;
          }
          if (purchaseRes.providerId) {
            order.providerId = purchaseRes.providerId as any;
            item.providerId = purchaseRes.providerId as any;
          }
          item.upstreamOrderCode = purchaseRes.orderCode;
          if (purchaseRes.deliveryAccounts && purchaseRes.deliveryAccounts.length > 0) {
            order.deliveryAccounts = (order.deliveryAccounts || []).concat(purchaseRes.deliveryAccounts);
          }
          const itemCost = purchaseRes.costUsd || prod.canbosoCostUsd || 0;
          item.costUsd = itemCost;
        } else {
          lastError = purchaseRes.errorMessage || "Fulfillment failed";
          order.fulfillmentStatus = "failed";
          order.fulfillmentError = lastError;
          if (purchaseRes.providerName) {
            order.providerName = purchaseRes.providerName;
            item.providerName = purchaseRes.providerName;
          }
        }
      }
    }

    await order.save();

    if (fulfilledCount > 0) {
      return c.json({ success: true, message: "Order fulfilled successfully!", order });
    } else {
      return c.json({ success: false, message: lastError || "No upstream products could be fulfilled.", order }, 400);
    }
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 2.1 Upstream Wallet Balance
adminRouter.get("/canboso/balance", async (c) => {
  try {
    const providerId = c.req.query("providerId");
    const result = await fetchCanbosoBalance(providerId);
    return c.json(result);
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 2.2 Upstream Live Products List
adminRouter.get("/canboso/products", async (c) => {
  try {
    const forceRefresh = c.req.query("refresh") === "1";
    const providerId = c.req.query("providerId");
    const result = await fetchCanbosoProducts(forceRefresh, providerId);
    return c.json(result);
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 2.3 Import & Connect Upstream Product to Storefront with Provider Connection
adminRouter.post("/canboso/import", async (c) => {
  try {
    const body = await c.req.json();
    const {
      canbosoProductId,
      title,
      slug,
      description,
      price,
      compareAtPrice,
      comparePrice,
      type,
      category,
      thumbnailPath,
      image,
      showInSlider,
      isSlider,
      isFeatured,
      autoFulfill,
      purchaseRequirements,
      costUsd,
      providerId,
    } = body;

    if (!canbosoProductId || !title || !slug || !price) {
      return c.json({ success: false, message: "canbosoProductId, title, slug, and price are required." }, 400);
    }

    const provider = await resolveProvider(providerId);
    const cleanSlug = String(slug).toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-");
    const finalThumbnail = thumbnailPath || image || undefined;
    const finalComparePrice =
      compareAtPrice !== undefined && compareAtPrice !== null
        ? Number(compareAtPrice)
        : comparePrice !== undefined && comparePrice !== null
        ? Number(comparePrice)
        : undefined;
    const finalShowInSlider =
      showInSlider !== undefined
        ? Boolean(showInSlider)
        : isSlider !== undefined
        ? Boolean(isSlider)
        : false;

    const product = await Product.findOneAndUpdate(
      { $or: [{ canbosoProductId, providerId: provider.id }, { slug: cleanSlug }] },
      {
        title,
        slug: cleanSlug,
        description: ensureFormattedHtml(description || `${title} - Premium Digital Subscription`),
        price: Number(price),
        compareAtPrice: finalComparePrice,
        type: type || "account",
        category: category || "account",
        thumbnailPath: finalThumbnail,
        showInSlider: finalShowInSlider,
        isFeatured: Boolean(isFeatured),
        autoFulfill: autoFulfill !== false,
        canbosoProductId,
        providerId: provider.id,
        providerName: provider.name,
        canbosoCostUsd: Number(costUsd) || 0,
        purchaseRequirements: purchaseRequirements || {},
        active: true,
      },
      { upsert: true, new: true }
    );

    return c.json({ success: true, message: `Product imported & connected to provider "${provider.name}" successfully!`, product });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 2.4 Full Financial Accounting Dashboard API (in USD & BDT)
adminRouter.get("/accounting", async (c) => {
  try {
    const canbosoConfig = await getCanbosoConfig();
    const dollarRate = canbosoConfig.dollarRate || 127;

    const paidOrders = await Order.find({ status: "paid" }).sort({ createdAt: -1 }).lean();

    let totalRevenueUsd = 0;
    let totalCostUsd = 0;
    let totalRevenueBdt = 0;
    let totalCostBdt = 0;

    const ordersAccounting = paidOrders.map((o: any) => {
      const revUsd = o.totalUsd || Number((o.total / (o.dollarRateUsed || dollarRate)).toFixed(2));
      const costU = o.costUsd || 0;
      const profitU = Number((revUsd - costU).toFixed(2));
      const profitB = Math.round(o.total - (o.costBdt || Math.round(costU * (o.dollarRateUsed || dollarRate))));

      totalRevenueUsd += revUsd;
      totalCostUsd += costU;
      totalRevenueBdt += o.total;
      totalCostBdt += (o.costBdt || Math.round(costU * (o.dollarRateUsed || dollarRate)));

      return {
        _id: o._id,
        orderId: o.orderId,
        customerName: o.name,
        customerPhone: o.phone,
        customerEmail: o.email,
        itemsCount: o.items?.length || 1,
        totalBdt: o.total,
        totalUsd: revUsd,
        costUsd: costU,
        costBdt: o.costBdt || Math.round(costU * (o.dollarRateUsed || dollarRate)),
        profitUsd: profitU,
        profitBdt: profitB,
        dollarRateUsed: o.dollarRateUsed || dollarRate,
        canbosoOrderCode: o.canbosoOrderCode,
        fulfillmentStatus: o.fulfillmentStatus || "completed",
        deliveryAccountsCount: o.deliveryAccounts?.length || 0,
        createdAt: o.createdAt,
      };
    });

    const netProfitUsd = Number((totalRevenueUsd - totalCostUsd).toFixed(2));
    const netProfitBdt = Math.round(totalRevenueBdt - totalCostBdt);
    const profitMarginPercent = totalRevenueUsd > 0 ? Number(((netProfitUsd / totalRevenueUsd) * 100).toFixed(1)) : 0;

    return c.json({
      success: true,
      accounting: {
        totalRevenueUsd: Number(totalRevenueUsd.toFixed(2)),
        totalCostUsd: Number(totalCostUsd.toFixed(2)),
        netProfitUsd,
        profitMarginPercent,
        totalRevenueBdt,
        totalCostBdt,
        netProfitBdt,
        currentDollarRate: dollarRate,
        paidOrdersCount: paidOrders.length,
        orders: ordersAccounting,
      },
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Reject/Cancel Order
adminRouter.post("/orders/:id/cancel", async (c) => {
  try {
    const id = c.req.param("id");
    const order = await Order.findById(id);

    if (!order) {
      return c.json({ success: false, message: "Order not found" }, 404);
    }

    order.status = "cancelled";
    await order.save();

    if (order.bkashTrxID) {
      await Transaction.findOneAndUpdate({ trxID: order.bkashTrxID }, { status: "failed" });
    }

    return c.json({ success: true, message: "Order cancelled successfully." });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 3. Transactions Register
adminRouter.get("/transactions", async (c) => {
  try {
    const transactions = await Transaction.find()
      .populate("orderId", "orderId email phone total")
      .sort({ createdAt: -1 })
      .lean();
    return c.json({ success: true, transactions });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 4. Products CRUD
adminRouter.get("/products", async (c) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 }).lean();
    return c.json({ success: true, products });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

adminRouter.post("/products", async (c) => {
  try {
    const body = await c.req.json();
    if (body.description) {
      body.description = ensureFormattedHtml(body.description);
    }
    if (body.providerId) {
      const prov = await resolveProvider(body.providerId);
      body.providerName = prov.name;
    }
    const product = new Product(body);
    await product.save();
    return c.json({ success: true, product });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
});

adminRouter.put("/products/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    if (body.description) {
      body.description = ensureFormattedHtml(body.description);
    }
    if (body.providerId) {
      const prov = await resolveProvider(body.providerId);
      body.providerName = prov.name;
    } else if (body.providerId === "" || body.providerId === null) {
      body.providerId = undefined;
      body.providerName = undefined;
    }
    const product = await Product.findByIdAndUpdate(id, body, { new: true });
    if (!product) {
      return c.json({ success: false, message: "Product not found" }, 404);
    }
    return c.json({ success: true, product });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
});

adminRouter.delete("/products/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return c.json({ success: false, message: "Product not found" }, 404);
    }
    return c.json({ success: true, message: "Product deleted successfully" });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 5. File Upload API (Thumbnail images & Digital Product assets)
adminRouter.post("/upload", async (c) => {
  try {
    const body = await c.req.parseBody();
    const file = body["file"];
    const type = body["type"]; // "thumbnail" or "product-file"

    if (!file || !(file instanceof File)) {
      return c.json({ success: false, message: "No valid file uploaded" }, 400);
    }

    const uploadDirName = type === "thumbnail" ? "thumbnails" : "products";
    const uploadsBaseDir = process.env.UPLOADS_DIR || path.resolve(__dirname, "../../uploads");
    const uploadPathDir = path.resolve(uploadsBaseDir, uploadDirName);

    // Create folder structure if not exist
    if (!fs.existsSync(uploadPathDir)) {
      fs.mkdirSync(uploadPathDir, { recursive: true });
    }

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    let savedFilename: string;
    let relativePath: string;

    if (type === "thumbnail") {
      // Auto-convert product thumbnails to WebP for maximum compression and instant load speed
      try {
        const uniqueBase = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        savedFilename = `${uniqueBase}.webp`;
        const fullWritePath = path.join(uploadPathDir, savedFilename);

        await sharp(fileBuffer)
          .rotate() // Respect EXIF orientation
          .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
          .webp({ quality: 85, effort: 4 })
          .toFile(fullWritePath);

        relativePath = `uploads/thumbnails/${savedFilename}`;
      } catch (sharpError: any) {
        console.warn("Sharp WebP optimization failed, falling back to original format:", sharpError);
        const fileExt = path.extname(file.name) || ".png";
        savedFilename = `${Date.now()}-${Math.floor(Math.random() * 1000)}${fileExt}`;
        const fullWritePath = path.join(uploadPathDir, savedFilename);
        fs.writeFileSync(fullWritePath, fileBuffer);
        relativePath = `uploads/thumbnails/${savedFilename}`;
      }
    } else {
      const fileExt = path.extname(file.name);
      savedFilename = `${Date.now()}-${Math.floor(Math.random() * 1000)}${fileExt}`;
      const fullWritePath = path.join(uploadPathDir, savedFilename);
      fs.writeFileSync(fullWritePath, fileBuffer);
      relativePath = `uploads/${uploadDirName}/${savedFilename}`;
    }

    return c.json({
      success: true,
      filePath: relativePath,
      filename: savedFilename,
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 6. Settings Page configuration endpoints
adminRouter.get("/settings", async (c) => {
  try {
    const settings = await Setting.find();
    const mapped = settings.reduce((acc: any, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
    return c.json({ success: true, settings: mapped });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

adminRouter.post("/settings", async (c) => {
  try {
    const { key, value } = await c.req.json();
    const setting = await Setting.findOneAndUpdate(
      { key },
      { value },
      { upsert: true, new: true }
    );
    // Invalidate in-memory cache immediately
    invalidateSettingCache(key);
    return c.json({ success: true, setting });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
});

// 6.1 Meta Conversions API (CAPI) Live Test Dispatcher
adminRouter.post("/capi/test", async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const eventName = body.eventName || "TestEvent";
    const testCode = body.testEventCode;
    const testEmail = body.email || "admin.test@kalobazar.shop";
    const testPhone = body.phone || "01711000000";

    const testEventId = `test_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const result = await sendCapiEvent({
      eventName,
      eventId: testEventId,
      eventSourceUrl: `${siteUrl}/admin/settings`,
      userData: {
        email: testEmail,
        phone: testPhone,
        clientIpAddress: c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "127.0.0.1",
        clientUserAgent: c.req.header("user-agent") || "Mozilla/5.0 (Admin CAPI Diagnostics Tool)",
      },
      customData: {
        currency: "BDT",
        value: 100,
        test_mode: true,
        sent_by: "Admin Diagnostic Console",
      },
      actionSource: "website",
      testEventCode: testCode,
    });

    return c.json({
      success: result.success,
      eventId: result.eventId,
      statusCode: result.statusCode,
      response: result.response,
      message: result.message || (result.success ? "CAPI Test Event successfully received by Meta Graph API!" : "CAPI dispatch failed"),
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 6.2 Meta CAPI Real-Time Delivery Logs & Diagnostics
adminRouter.get("/capi/logs", async (c) => {
  try {
    const page = Math.max(1, Number(c.req.query("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(c.req.query("limit")) || 30));
    const status = c.req.query("status");
    const eventName = c.req.query("eventName");

    const query: any = {};
    if (status) query.status = status;
    if (eventName) query.eventName = new RegExp(eventName, "i");

    const [total, logs] = await Promise.all([
      CapiLog.countDocuments(query),
      CapiLog.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    return c.json({
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      logs,
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 6.3 Clear Meta CAPI Logs
adminRouter.delete("/capi/logs", async (c) => {
  try {
    await CapiLog.deleteMany({});
    return c.json({ success: true, message: "All CAPI diagnostic logs cleared successfully." });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 7. Route redirects CRUD
adminRouter.get("/redirects", async (c) => {
  try {
    const redirects = await RouteRedirect.find().lean();
    return c.json({ success: true, redirects });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

adminRouter.post("/redirects", async (c) => {
  try {
    const body = await c.req.json();
    const redirect = await RouteRedirect.findOneAndUpdate(
      { sourcePath: body.sourcePath },
      body,
      { upsert: true, new: true }
    );
    return c.json({ success: true, redirect });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
});

adminRouter.delete("/redirects/:id", async (c) => {
  try {
    const id = c.req.param("id");
    await RouteRedirect.findByIdAndDelete(id);
    return c.json({ success: true, message: "Redirect deleted successfully." });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ─── CATEGORY MANAGEMENT ───────────────────────────────────────────────────

// List all categories (sorted by order)
adminRouter.get("/categories", async (c) => {
  try {
    const categories = await Category.find().sort({ order: 1, createdAt: 1 }).lean();
    return c.json({ success: true, categories });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Create category
adminRouter.post("/categories", async (c) => {
  try {
    const body = await c.req.json();
    const { name, slug, description, order, active } = body;
    if (!name || !slug) {
      return c.json({ success: false, message: "name and slug are required" }, 400);
    }
    const cat = new Category({ name, slug, description, order: order ?? 0, active: active ?? true });
    await cat.save();
    return c.json({ success: true, category: cat });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
});

// Reorder categories batch
adminRouter.put("/categories/reorder", async (c) => {
  try {
    const body = await c.req.json();
    const { categoryIds } = body;
    if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
      return c.json({ success: false, message: "categoryIds array is required" }, 400);
    }

    const bulkOps = categoryIds.map((id: string, index: number) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { order: index + 1 } },
      },
    }));

    await Category.bulkWrite(bulkOps);
    const updated = await Category.find().sort({ order: 1, createdAt: 1 }).lean();
    return c.json({ success: true, categories: updated });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Update category (name, slug, description, order, active)
adminRouter.put("/categories/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    if (body.order !== undefined) {
      body.order = Math.max(1, Number(body.order) || 1);
    }
    const cat = await Category.findByIdAndUpdate(id, body, { new: true });
    if (!cat) return c.json({ success: false, message: "Category not found" }, 404);
    return c.json({ success: true, category: cat });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
});

// Delete category
adminRouter.delete("/categories/:id", async (c) => {
  try {
    const id = c.req.param("id");
    await Category.findByIdAndDelete(id);
    return c.json({ success: true, message: "Category deleted." });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ─── OPENROUTER AI MARKETING COPYWRITING ────────────────────────────────────

// Test OpenRouter AI Connection
adminRouter.post("/ai/test", async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const result = await testOpenRouterConnection(body.apiKey, body.model);
    return c.json(result);
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Generate Bangla marketing copy (title, slug, description)
adminRouter.post("/ai/generate-copy", async (c) => {
  try {
    const body = await c.req.json();
    const { name, description, code, type, category, apiKey, model } = body;
    if (!name || !name.trim()) {
      return c.json({ success: false, message: "Product name is required for AI copy generation." }, 400);
    }
    const result = await generateBanglaProductCopy(
      { name, description, code, type, category },
      apiKey,
      model
    );
    return c.json(result);
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 400);
  }
});

// ─── ZINIPAY GATEWAY TEST ───────────────────────────────────────────────────

// Test ZiniPay Connection & API Key
adminRouter.post("/zinipay/test", async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const apiKey = (body.apiKey || (await getZiniPayApiKey())).trim();

    if (!apiKey) {
      return c.json({ success: false, message: "No ZiniPay API key provided" }, 400);
    }

    const res = await fetch("https://api.zinipay.com/v1/payment/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "zini-api-key": apiKey,
      },
      body: JSON.stringify({ invoice_id: "PROBE_AUTH_TEST" }),
    });

    const data = await res.json().catch(() => ({}));

    if (
      res.status === 401 ||
      res.status === 403 ||
      data.message?.toLowerCase().includes("unauthorized") ||
      data.message?.toLowerCase().includes("invalid api key")
    ) {
      return c.json({
        success: false,
        message: data.message || "Invalid or unauthorized ZiniPay API Key.",
      });
    }

    return c.json({
      success: true,
      message: "ZiniPay API credentials verified successfully!",
      isSandbox: apiKey.startsWith("sandbox_"),
      raw: data,
    });
  } catch (error: any) {
    return c.json({
      success: false,
      message: `Failed to connect to ZiniPay API: ${error.message}`,
    });
  }
});

// ─── UPSTREAM PROVIDERS MANAGEMENT (MULTI-PROVIDER SYSTEM) ───────────────────

// List all providers with product counts
adminRouter.get("/providers", async (c) => {
  try {
    await ensureDefaultProviderMigrated();
    const providers = await Provider.find().sort({ isDefault: -1, createdAt: -1 }).lean();

    // Aggregate product counts per provider
    const counts = await Product.aggregate([
      { $match: { providerId: { $exists: true, $ne: null } } },
      { $group: { _id: "$providerId", count: { $sum: 1 } } },
    ]);
    const countMap: Record<string, number> = {};
    counts.forEach((item: any) => {
      if (item._id) countMap[item._id.toString()] = item.count;
    });

    const enriched = providers.map((p: any) => ({
      ...p,
      productCount: countMap[p._id.toString()] || 0,
    }));

    return c.json({ success: true, providers: enriched });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Add new provider
adminRouter.post("/providers", async (c) => {
  try {
    const body = await c.req.json();
    const { name, apiKey, baseUrl, dollarRate, autoFulfill, isDefault, isActive, notes } = body;

    if (!name || !name.trim() || !apiKey || !apiKey.trim()) {
      return c.json({ success: false, message: "Provider name and API key are required." }, 400);
    }

    const cleanName = name.trim();
    const slug =
      cleanName
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-") +
      "-" +
      Date.now().toString().slice(-4);

    if (isDefault) {
      await Provider.updateMany({}, { isDefault: false });
    }

    const provider = new Provider({
      name: cleanName,
      slug,
      type: "canboso",
      apiKey: apiKey.trim(),
      baseUrl: (baseUrl || "https://canboso.com").trim().replace(/\/+$/, ""),
      dollarRate: Number(dollarRate) > 0 ? Number(dollarRate) : 127,
      autoFulfill: autoFulfill !== false,
      isActive: isActive !== false,
      isDefault: Boolean(isDefault),
      notes: notes ? notes.trim() : undefined,
    });

    await provider.save();

    // Check balance in background upon creation
    fetchCanbosoBalance(provider._id.toString()).catch(() => {});

    return c.json({ success: true, message: "Provider added successfully!", provider });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 400);
  }
});

// Update provider
adminRouter.put("/providers/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();

    if (body.isDefault) {
      await Provider.updateMany({ _id: { $ne: id } }, { isDefault: false });
    }
    if (body.name) {
      body.name = body.name.trim();
    }
    if (body.apiKey) {
      body.apiKey = body.apiKey.trim();
    }
    if (body.baseUrl) {
      body.baseUrl = body.baseUrl.trim().replace(/\/+$/, "");
    }
    if (body.dollarRate) {
      body.dollarRate = Number(body.dollarRate) > 0 ? Number(body.dollarRate) : 127;
    }

    const provider = await Provider.findByIdAndUpdate(id, body, { new: true });
    if (!provider) {
      return c.json({ success: false, message: "Provider not found" }, 404);
    }

    // Sync provider name to connected products
    if (body.name) {
      await Product.updateMany({ providerId: id }, { providerName: body.name });
    }

    return c.json({ success: true, message: "Provider updated successfully!", provider });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 400);
  }
});

// Delete provider
adminRouter.delete("/providers/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const count = await Product.countDocuments({ providerId: id });
    if (count > 0) {
      return c.json(
        {
          success: false,
          message: `Cannot delete provider: ${count} product(s) are currently connected to this provider. Please reassign them to another provider first.`,
        },
        400
      );
    }

    await Provider.findByIdAndDelete(id);
    return c.json({ success: true, message: "Provider removed successfully!" });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Test connection and fetch live balance for a saved provider
adminRouter.post("/providers/:id/test", async (c) => {
  try {
    const id = c.req.param("id");
    const result = await fetchCanbosoBalance(id);
    return c.json(result);
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Test raw API key & endpoint before saving
adminRouter.post("/providers/test-key", async (c) => {
  try {
    const body = await c.req.json();
    const apiKey = (body.apiKey || "").trim();
    const baseUrl = (body.baseUrl || "https://canboso.com").trim().replace(/\/+$/, "");

    if (!apiKey) {
      return c.json({ success: false, message: "API key is required" }, 400);
    }

    const res = await fetch(`${baseUrl}/api/v2/telegram-buyer/balance?key=${encodeURIComponent(apiKey)}`, {
      headers: { Accept: "application/json" },
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.success) {
      return c.json({ success: false, message: data.message || `Upstream error: HTTP ${res.status}` }, 400);
    }

    const balanceVnd = Number(data.balanceVnd || data.balance || 0);
    const balanceUsd = Number(data.balanceUsd || (balanceVnd > 0 ? balanceVnd / 27000 : 0));

    return c.json({
      success: true,
      message: `Connection successful! Balance: $${balanceUsd.toFixed(2)} USD (${balanceVnd.toLocaleString()} ₫)`,
      balanceUsd: Number(balanceUsd.toFixed(2)),
      balanceVnd,
    });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

export default adminRouter;
