import { Hono } from "hono";
import Product from "../models/Product";
import Category from "../models/Category";
import Order from "../models/Order";
import Transaction from "../models/Transaction";
import Setting from "../models/Setting";
import { sendCapiEvent } from "../utils/metaCapi";
import { sendOrderDeliveryEmail } from "../utils/mailer";
import { createZiniPayInvoice, verifyZiniPayInvoice } from "../utils/zinipay";
import { getSetting } from "../utils/settingsCache";
import path from "path";
import fs from "fs";

const publicRouter = new Hono();

// Helper to generate a unique readable Order ID
function generateOrderId(): string {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `KB-${num}`;
}

import { executeCanbosoPurchase, getCanbosoConfig } from "../services/canbosoClient";

/**
 * Fulfills an order once payment is confirmed via ZiniPay / bKash / Admin
 */
async function fulfillPaidOrder(
  order: any,
  paymentDetails?: { transactionId?: string; paymentMethod?: string; amount?: number }
) {
  if (order.status === "paid") return;

  order.status = "paid";
  if (paymentDetails?.transactionId) {
    order.transactionId = paymentDetails.transactionId;
  }
  if (paymentDetails?.paymentMethod) {
    order.paymentMethod = paymentDetails.paymentMethod;
  }

  // 1. Canboso Automated Purchasing & Instant Provisioning
  const canbosoConfig = await getCanbosoConfig();
  const dollarRate = canbosoConfig.dollarRate || 127;
  order.dollarRateUsed = dollarRate;

  let totalCostUsd = order.costUsd || 0;
  const downloadUrls: { title: string; link: string }[] = [];

  for (const item of order.items) {
    const prodId = item.productId?._id || item.productId;
    const prod = (await Product.findById(prodId)) as any;

    if (prod) {
      // Check if product is connected to Canboso Buyer API
      if (prod.canbosoProductId && canbosoConfig.autoFulfill && prod.autoFulfill !== false) {
        order.fulfillmentStatus = "processing";
        try {
          const purchaseRes = await executeCanbosoPurchase({
            orderId: order.orderId,
            productId: prod.canbosoProductId,
            quantity: item.quantity || 1,
            customerEmail: order.email,
            slotMonths: order.slotMonths || item.slotMonths,
          });

          if (purchaseRes.success) {
            order.fulfillmentStatus = "completed";
            order.canbosoOrderCode = purchaseRes.orderCode;
            if (purchaseRes.deliveryAccounts && purchaseRes.deliveryAccounts.length > 0) {
              order.deliveryAccounts = (order.deliveryAccounts || []).concat(purchaseRes.deliveryAccounts);
            }
            const itemCost = purchaseRes.costUsd || prod.canbosoCostUsd || 0;
            item.costUsd = itemCost;
            totalCostUsd += itemCost * (item.quantity || 1);
          } else {
            order.fulfillmentStatus = "failed";
            order.fulfillmentError = purchaseRes.errorMessage || "Canboso automated purchase failed";
            console.warn(`[Canboso Fulfillment Warning] Order ${order.orderId}:`, purchaseRes.errorMessage);
          }
        } catch (err: any) {
          order.fulfillmentStatus = "failed";
          order.fulfillmentError = err.message;
          console.error(`[Canboso Fulfillment Exception] Order ${order.orderId}:`, err);
        }
      } else {
        // Static or non-Canboso product
        if (!order.fulfillmentStatus || order.fulfillmentStatus === "unfulfilled") {
          order.fulfillmentStatus = "completed";
        }
      }

      // Resolve traditional download urls if any
      const link =
        prod.deliveryLink ||
        (prod.filePath ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/${prod.filePath}` : "");
      if (link) {
        downloadUrls.push({ title: prod.title, link });
      }
    }
  }

  // 2. Financial Accounting (USD for Admin, BDT for Users)
  order.costUsd = Number(totalCostUsd.toFixed(2));
  order.costBdt = Math.round(order.costUsd * dollarRate);
  order.totalUsd = Number((order.total / dollarRate).toFixed(2));
  order.profitUsd = Number((order.totalUsd - order.costUsd).toFixed(2));
  order.profitBdt = Math.round(order.total - order.costBdt);

  await order.save();

  // 3. Create or update Transaction record in payment ledger
  const trxID = paymentDetails?.transactionId || order.transactionId || `TXN-${order.orderId}-${Date.now()}`;
  await Transaction.findOneAndUpdate(
    { orderId: order._id },
    {
      orderId: order._id,
      amount: paymentDetails?.amount || order.total,
      gateway: "zinipay",
      trxID,
      invoiceId: order.zinipayInvoiceId,
      paymentMethod: paymentDetails?.paymentMethod || order.paymentMethod || "zinipay",
      status: "verified",
      verifiedAt: new Date(),
    },
    { upsert: true, new: true }
  );

  // 4. Trigger server-side Meta CAPI Purchase event
  await sendCapiEvent({
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

  // 5. Send delivery email with credentials & download links
  if (order.email) {
    sendOrderDeliveryEmail({
      toEmail: order.email,
      orderId: order.orderId,
      customerName: order.name || "Customer",
      totalAmount: order.total,
      items: order.items.map((i: any) => ({ title: i.title, price: i.price, quantity: i.quantity })),
      downloadUrls,
      deliveryAccounts: order.deliveryAccounts || [],
    }).catch((err) => console.error("Email delivery send error:", err));
  }
}

// 0. Get public settings (fast in-memory cached)
publicRouter.get("/settings/public", async (c) => {
  try {
    const pixelSetting = await getSetting("meta_pixel");
    const companySetting = await getSetting("company_info");
    return c.json({
      success: true,
      pixelId: pixelSetting?.pixelId || process.env.NEXT_PUBLIC_META_PIXEL_ID || "",
      companyInfo: companySetting || {},
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 0.1 Universal Meta Conversions API (CAPI) Dual-Dispatch Relay for Deduplicated Tracking
publicRouter.post("/meta-capi", async (c) => {
  try {
    const body = await c.req.json();
    const { eventName, eventId, params, fbp, fbc, email, phone, eventSourceUrl } = body;

    if (!eventName || !eventId) {
      return c.json({ success: false, message: "eventName and eventId are required for deduplication" }, 400);
    }

    const userAgent = c.req.header("user-agent") || "";
    const ip = c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "127.0.0.1";
    const sourceUrl = eventSourceUrl || c.req.header("referer") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const result = await sendCapiEvent({
      eventName,
      eventId,
      eventSourceUrl: sourceUrl,
      userData: {
        email,
        phone,
        fbp,
        fbc,
        clientIpAddress: ip,
        clientUserAgent: userAgent,
      },
      customData: params || {},
    });

    return c.json({ success: result.success, eventId: result.eventId, response: result.response });
  } catch (error: any) {
    console.error("Error in /api/meta-capi relay:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 1. Get all active products (optimized lean query)
publicRouter.get("/products", async (c) => {
  try {
    const products = await Product.find({ active: true }).select("-filePath").lean();
    return c.json({ success: true, products });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 2. Get product by slug (lean query)
publicRouter.get("/products/:slug", async (c) => {
  try {
    const slug = c.req.param("slug");
    const product = await Product.findOne({ slug, active: true }).select("-filePath").lean();
    if (!product) {
      return c.json({ success: false, message: "Product not found" }, 404);
    }
    return c.json({ success: true, product });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 2.1 Get active categories (admin-ordered) with their products for homepage (lean queries)
publicRouter.get("/categories", async (c) => {
  try {
    let categories = await Category.find({ active: true }).sort({ order: 1, createdAt: 1 }).lean();

    // If categories table is empty, auto-seed from distinct categories in products
    if (categories.length === 0) {
      const distinctCats = await Product.distinct("category", { active: true });
      const distinctTypes = await Product.distinct("type", { active: true });
      const slugs = Array.from(new Set([...distinctCats.filter(Boolean), ...distinctTypes.filter(Boolean)]));

      const defaultNames: Record<string, { name: string; desc: string }> = {
        ai: { name: "এআই টুলস ও সাবস্ক্রিপশন (AI Tools)", desc: "ChatGPT Plus, Claude 3.5 Pro সহ সেরা প্রিমিয়াম এআই অ্যাকাউন্টস" },
        streaming: { name: "স্ট্রিমিং ও বিনোদন (Streaming & OTT)", desc: "Netflix 4K UHD, Spotify Premium, YouTube Premium এর অফিসিয়াল অফার" },
        creative: { name: "গ্রাফিক্স ও ক্রিয়েটিভ সফটওয়্যার (Creative)", desc: "Canva Pro, Adobe Creative Cloud, CapCut Pro সহ দরকারি সব ডিজাইন টুলস" },
        dev: { name: "ডেভেলপার ও কোডিং টুলস (Dev Tools)", desc: "Cursor Pro, GitHub Copilot সহ আধুনিক প্রোগ্রামিং রিসোর্স" },
        vpn: { name: "ভিপিএন ও অনলাইন সিকিউরিটি (VPN)", desc: "NordVPN সহ প্রিমিয়াম হাই-স্পিড সিকিউর ভিপিএন অ্যাকাউন্ট" },
        account: { name: "প্রাইভেট একাউন্টস", desc: "১০০% ফুল মেয়াদ রিপ্লেসমেন্ট ওয়ারেন্টিসহ পার্সোনাল প্রিমিয়াম একাউন্ট" },
        slot: { name: "টিম ও ফ্যামিলি স্লট", desc: "ব্যক্তিগত জিমেইল বা ইউজারনেমে সাশ্রয়ী সাবস্ক্রিপশন অ্যাক্টিভেশন" },
        license: { name: "সফটওয়্যার লাইসেন্স কী", desc: "অরিজিনাল ভেরিফাইড সফটওয়্যার লাইসেন্স কোড ও ডিজিটাল এক্টিভেশন কি" },
      };

      for (let i = 0; i < slugs.length; i++) {
        const slug = slugs[i];
        const meta = defaultNames[slug] || { name: slug.toUpperCase(), desc: `${slug} ক্যাটাগরির প্রিমিয়াম সেবা` };
        await Category.findOneAndUpdate(
          { slug },
          { $setOnInsert: { name: meta.name, slug, description: meta.desc, order: i + 1, active: true } },
          { upsert: true }
        );
      }
      categories = await Category.find({ active: true }).sort({ order: 1, createdAt: 1 }).lean();
    }

    // For each category, fetch its products efficiently
    const result = await Promise.all(
      categories.map(async (cat: any) => {
        const products = await Product.find({
          active: true,
          $or: [{ category: cat.slug }, { type: cat.slug }],
        })
          .select("-filePath")
          .limit(20)
          .lean();
        return {
          _id: cat._id,
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          order: cat.order,
          products,
        };
      })
    );
    return c.json({ success: true, categories: result });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 2.2 Get products by category slug (for /category/[slug] route pages)
publicRouter.get("/categories/:slug", async (c) => {
  try {
    const slug = c.req.param("slug").toLowerCase();
    const catDoc = await Category.findOne({ slug }).lean() as any;
    const products = await Product.find({
      active: true,
      $or: [{ category: slug }, { type: slug }],
    }).select("-filePath").lean();

    return c.json({
      success: true,
      category: {
        name: catDoc?.name || slug,
        slug,
        description: catDoc?.description || "",
      },
      total: products.length,
      products,
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 3. Initiate Checkout & Create ZiniPay Hosted Invoice
publicRouter.post("/checkout", async (c) => {
  try {
    const body = await c.req.json();
    const { productId, items: rawItems, name, email, phone, customerEmail, slotMonths, quantity = 1, metaEventId, fbp, fbc } = body;

    // Validate customer contact info
    if (!name || !email || !phone) {
      const missingFields: string[] = [];
      if (!name) missingFields.push("name");
      if (!email) missingFields.push("email");
      if (!phone) missingFields.push("phone");
      return c.json({ success: false, message: `Missing required fields: ${missingFields.join(", ")}` }, 400);
    }

    let orderItems: any[] = [];
    let orderTotal = 0;
    let mainProduct: any = null;

    if (rawItems && Array.isArray(rawItems) && rawItems.length > 0) {
      for (const item of rawItems) {
        const id = item.productId || item._id || item.id;
        const p = (await Product.findById(id)) as any;
        if (p && p.active) {
          const qty = Math.max(1, Number(item.quantity) || 1);
          orderItems.push({
            productId: p._id,
            title: p.title,
            price: p.price,
            quantity: qty,
            costUsd: p.canbosoCostUsd || 0,
            canbosoProductId: p.canbosoProductId,
            slotMonths: slotMonths ? Number(slotMonths) : undefined,
          });
          orderTotal += p.price * qty;
          if (!mainProduct) mainProduct = p;
        }
      }
    } else if (productId) {
      const product = (await Product.findById(productId)) as any;
      if (!product || !product.active) {
        return c.json({ success: false, message: "Product not found or inactive" }, 404);
      }
      orderItems = [
        {
          productId: product._id,
          title: product.title,
          price: product.price,
          quantity: 1,
          costUsd: product.canbosoCostUsd || 0,
          canbosoProductId: product.canbosoProductId,
          slotMonths: slotMonths ? Number(slotMonths) : undefined,
        },
      ];
      orderTotal = product.price;
      mainProduct = product;
    }

    if (orderItems.length === 0) {
      return c.json({ success: false, message: "No valid products found for checkout" }, 400);
    }

    const orderId = generateOrderId();
    const userAgent = c.req.header("user-agent") || "";
    const ip = c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "127.0.0.1";

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

    // Financial Accounting setup
    const canbosoConfig = await getCanbosoConfig();
    const dollarRate = canbosoConfig.dollarRate || 127;
    const totalCostUsd = orderItems.reduce((acc, i) => acc + ((i.costUsd || 0) * i.quantity), 0);
    const totalCostBdt = Math.round(totalCostUsd * dollarRate);
    const totalUsd = Number((orderTotal / dollarRate).toFixed(2));
    const profitUsd = Number((totalUsd - totalCostUsd).toFixed(2));
    const profitBdt = Math.round(orderTotal - totalCostBdt);

    const newOrder = new Order({
      orderId,
      name,
      email: email || customerEmail,
      phone,
      customerEmail: customerEmail || email,
      items: orderItems,
      total: orderTotal,
      status: "pending",
      fulfillmentStatus: "unfulfilled",
      paymentGateway: "zinipay",
      metaEventId,
      fbp,
      fbc,
      userAgent,
      ip,
      slotMonths: slotMonths ? Number(slotMonths) : undefined,
      costUsd: totalCostUsd,
      costBdt: totalCostBdt,
      totalUsd,
      profitUsd,
      profitBdt,
      dollarRateUsed: dollarRate,
    });

    // Create ZiniPay Invoice
    const ziniInvoice = await createZiniPayInvoice({
      cus_name: name || "Guest Customer",
      cus_email: email || "customer@digitalcorebd.com",
      amount: orderTotal,
      metadata: {
        order_id: orderId,
        product_id: String(mainProduct?._id || orderItems[0].productId),
        metaEventId,
        customer_phone: phone || "",
      },
      redirect_url: `${siteUrl}/receipt/${orderId}?zinipay_verify=1`,
      cancel_url: `${siteUrl}/receipt/${orderId}?canceled=1`,
      webhook_url: `${apiUrl}/api/zinipay/webhook`,
    });

    if (ziniInvoice.status && ziniInvoice.payment_url) {
      newOrder.zinipayInvoiceId = ziniInvoice.invoice_id;
      newOrder.zinipayPaymentUrl = ziniInvoice.payment_url;
    }

    await newOrder.save();

    // Trigger server-side InitiateCheckout CAPI tracking
    await sendCapiEvent({
      eventName: "InitiateCheckout",
      eventId: metaEventId,
      eventSourceUrl: `${siteUrl}/checkout`,
      userData: {
        email,
        phone,
        fbp,
        fbc,
        clientIpAddress: ip,
        clientUserAgent: userAgent,
        externalId: String(newOrder._id),
      },
      customData: {
        currency: "BDT",
        value: orderTotal,
        content_ids: orderItems.map((i) => String(i.productId)),
        content_type: "product",
      },
    });

    return c.json({
      success: true,
      message: "ZiniPay invoice generated successfully",
      paymentUrl: ziniInvoice.payment_url || `${siteUrl}/receipt/${orderId}`,
      order: {
        id: newOrder._id,
        orderId: newOrder.orderId,
        total: newOrder.total,
        paymentGateway: "zinipay",
        paymentUrl: ziniInvoice.payment_url,
      },
    });
  } catch (error: any) {
    console.error("Checkout creation error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 4. ZiniPay Webhook Callback Flow (POST & GET)
const handleZiniPayWebhook = async (c: any) => {
  try {
    let invoiceId: string | undefined;
    let webhookStatus: string | undefined;

    if (c.req.method === "POST") {
      try {
        const body = await c.req.json();
        invoiceId = body.invoice_id;
        webhookStatus = body.status;
      } catch (e) {
        // Body might be empty or query encoded
      }
    }

    if (!invoiceId) {
      invoiceId = c.req.query("invoice_id");
      webhookStatus = c.req.query("status");
    }

    if (!invoiceId) {
      return c.json({ success: false, message: "Missing invoice_id parameter" }, 400);
    }

    console.log(`[ZiniPay Webhook] Received webhook for invoice: ${invoiceId}, status: ${webhookStatus}`);

    // Verify invoice directly with ZiniPay API
    const verifyResult = await verifyZiniPayInvoice(invoiceId);

    if (verifyResult.success || verifyResult.status === "COMPLETED") {
      const order = await Order.findOne({
        $or: [
          { zinipayInvoiceId: invoiceId },
          { zinipayPaymentUrl: new RegExp(invoiceId, "i") },
        ],
      }).populate("items.productId");

      if (order) {
        await fulfillPaidOrder(order, {
          transactionId: verifyResult.transaction_id,
          paymentMethod: verifyResult.payment_method,
          amount: verifyResult.amount,
        });
        return c.json({ success: true, message: "Payment verified and order fulfilled." });
      } else {
        console.warn(`[ZiniPay Webhook] Order not found for invoice ${invoiceId}`);
      }
    }

    return c.json({ success: true, message: "Webhook processed" });
  } catch (error: any) {
    console.error("[ZiniPay Webhook Error]:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
};

publicRouter.post("/zinipay/webhook", handleZiniPayWebhook);
publicRouter.get("/zinipay/webhook", handleZiniPayWebhook);

// 5. Get Order Status & Auto-verify with ZiniPay
publicRouter.get("/order-status/:orderId", async (c) => {
  try {
    const orderId = c.req.param("orderId");
    let order = await Order.findOne({ orderId }).populate("items.productId");
    if (!order) {
      return c.json({ success: false, message: "Order not found" }, 404);
    }

    // If order is pending and has a ZiniPay invoice, verify with ZiniPay API
    if (order.status !== "paid" && order.zinipayInvoiceId) {
      const verifyResult = await verifyZiniPayInvoice(order.zinipayInvoiceId);
      if (verifyResult.success || verifyResult.status === "COMPLETED") {
        await fulfillPaidOrder(order, {
          transactionId: verifyResult.transaction_id,
          paymentMethod: verifyResult.payment_method,
          amount: verifyResult.amount,
        });
        // Re-fetch populated order
        order = await Order.findOne({ orderId }).populate("items.productId");
      }
    }

    const companyInfo = (await getSetting("company_info")) || {};

    return c.json({
      success: true,
      order: {
        orderId: order.orderId,
        name: order.name,
        email: order.email,
        phone: order.phone,
        customerEmail: order.customerEmail,
        slotMonths: order.slotMonths,
        quantity: order.quantity || 1,
        total: order.total,
        status: order.status,
        fulfillmentStatus: order.fulfillmentStatus || (order.status === "paid" ? "completed" : "unfulfilled"),
        autoCompleted: order.autoCompleted || false,
        upstreamOrderCode: order.upstreamOrderCode,
        canbosoOrderCode: order.canbosoOrderCode,
        deliveryAccounts: order.status === "paid" ? (order.deliveryAccounts || []) : [],
        paymentGateway: order.paymentGateway,
        paymentUrl: order.zinipayPaymentUrl,
        metaEventId: order.metaEventId,
        transactionId: order.transactionId,
        paymentMethod: order.paymentMethod,
        items: order.items.map((item: any) => {
          const prod = item.productId;
          return {
            id: prod?._id,
            title: item.title,
            price: item.price,
            type: prod?.type || "account",
            duration: prod?.duration,
            isWebDisplay: prod?.isWebDisplay,
            deliveryLink: prod?.isWebDisplay ? prod.deliveryLink : undefined,
            downloadUrl:
              order.status === "paid" && prod?.isWebDisplay && prod.filePath
                ? `/api/downloads/${order.orderId}/${prod._id}`
                : undefined,
          };
        }),
      },
      companyInfo,
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 6. Secure file delivery
publicRouter.get("/downloads/:orderId/:productId", async (c) => {
  try {
    const orderId = c.req.param("orderId");
    const productId = c.req.param("productId");

    const order = await Order.findOne({ orderId });
    if (!order) {
      return c.json({ success: false, message: "Order not found" }, 404);
    }

    if (order.status !== "paid") {
      return c.json({ success: false, message: "Order payment verification is pending." }, 403);
    }

    // Verify product exists in order
    const hasProduct = order.items.some((item: any) => String(item.productId) === productId);
    if (!hasProduct) {
      return c.json({ success: false, message: "Unauthorized access to product file" }, 403);
    }

    const product = await Product.findById(productId);
    if (!product || !product.filePath) {
      return c.json({ success: false, message: "Product file not found on server" }, 404);
    }

    const filePath = path.resolve(product.filePath);
    if (!fs.existsSync(filePath)) {
      return c.json({ success: false, message: "Physical file does not exist on disk" }, 404);
    }

    // Stream download
    const filename = path.basename(filePath);
    c.header("Content-Disposition", `attachment; filename="${filename}"`);
    c.header("Content-Type", "application/octet-stream");

    const fileBuffer = fs.readFileSync(filePath);
    return c.body(fileBuffer);
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default publicRouter;
