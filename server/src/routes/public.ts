import { Hono } from "hono";
import Product from "../models/Product";
import Order from "../models/Order";
import Transaction from "../models/Transaction";
import Setting from "../models/Setting";
import { sendCapiEvent } from "../utils/metaCapi";
import { sendOrderDeliveryEmail } from "../utils/mailer";
import { createZiniPayInvoice, verifyZiniPayInvoice } from "../utils/zinipay";
import path from "path";
import fs from "fs";

const publicRouter = new Hono();

// Helper to generate a unique readable Order ID
function generateOrderId(): string {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `KB-${num}`;
}

/**
 * Fulfills an order once payment is confirmed via ZiniPay
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
  await order.save();

  // Create or update Transaction record in payment ledger
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

  // Trigger server-side Meta CAPI Purchase event
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

  // Resolve secure download urls
  const downloadUrls: { title: string; link: string }[] = [];
  for (const item of order.items) {
    const prodId = item.productId?._id || item.productId;
    const prod = await Product.findById(prodId);
    if (prod) {
      const link =
        prod.deliveryLink ||
        (prod.filePath ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/${prod.filePath}` : "");
      if (link) {
        downloadUrls.push({ title: prod.title, link });
      }
    }
  }

  // Send delivery email asynchronously
  if (order.email) {
    sendOrderDeliveryEmail({
      toEmail: order.email,
      orderId: order.orderId,
      customerName: order.name || "Customer",
      totalAmount: order.total,
      items: order.items.map((i: any) => ({ title: i.title, price: i.price, quantity: i.quantity })),
      downloadUrls,
    }).catch((err) => console.error("Email delivery send error:", err));
  }
}

// 0. Get public settings
publicRouter.get("/settings/public", async (c) => {
  try {
    const pixelSetting = await Setting.findOne({ key: "meta_pixel" });
    const companySetting = await Setting.findOne({ key: "company_info" });
    return c.json({
      success: true,
      pixelId: pixelSetting?.value?.pixelId || process.env.NEXT_PUBLIC_META_PIXEL_ID || "",
      companyInfo: companySetting?.value || {},
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

    const sent = await sendCapiEvent({
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

    return c.json({ success: true, eventId, dispatched: sent });
  } catch (error: any) {
    console.error("Error in /api/meta-capi relay:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 1. Get all active products
publicRouter.get("/products", async (c) => {
  try {
    const products = await Product.find({ active: true }).select("-filePath");
    return c.json({ success: true, products });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 2. Get product by slug
publicRouter.get("/products/:slug", async (c) => {
  try {
    const slug = c.req.param("slug");
    const product = await Product.findOne({ slug, active: true }).select("-filePath");
    if (!product) {
      return c.json({ success: false, message: "Product not found" }, 404);
    }
    return c.json({ success: true, product });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 3. Initiate Checkout & Create ZiniPay Hosted Invoice
publicRouter.post("/checkout", async (c) => {
  try {
    const body = await c.req.json();
    const { productId, name, email, phone, customerEmail, slotMonths, quantity = 1, metaEventId, fbp, fbc } = body;

    const product = await Product.findById(productId);
    if (!product || !product.active) {
      return c.json({ success: false, message: "Product not found or inactive" }, 404);
    }

    // Check if required checkout fields are provided
    const missingFields: string[] = [];
    if (product.checkoutFields?.includes("name") && !name) missingFields.push("name");
    if (product.checkoutFields?.includes("email") && !email) missingFields.push("email");
    if (product.checkoutFields?.includes("phone") && !phone) missingFields.push("phone");
    
    // For slot products or slot_chatgpt_business, customerEmail is required
    if ((product.type === "slot" || product.purchaseRequirements?.customerEmail) && !customerEmail && !email) {
      missingFields.push("customerEmail");
    }

    if (missingFields.length > 0) {
      return c.json({ success: false, message: `Missing required fields: ${missingFields.join(", ")}` }, 400);
    }

    const orderId = generateOrderId();
    const userAgent = c.req.header("user-agent") || "";
    const ip = c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "127.0.0.1";

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

    // Calculate total price based on duration multiplier or quantity
    const orderQty = Math.max(1, Number(quantity) || 1);
    let orderTotal = product.price * orderQty;
    if (slotMonths && slotMonths > 1) {
      // If product has slotMonths pricing multiplier
      orderTotal = Math.round(product.price * (slotMonths / (product.purchaseRequirements?.allowedMonths?.[0] || 1)));
    }

    const newOrder = new Order({
      orderId,
      name,
      email: email || customerEmail,
      phone,
      customerEmail: customerEmail || email,
      slotMonths: slotMonths ? Number(slotMonths) : undefined,
      quantity: orderQty,
      items: [
        {
          productId: product._id,
          title: product.title,
          price: product.price,
          quantity: orderQty,
        },
      ],
      total: orderTotal,
      status: "pending",
      fulfillmentStatus: "unfulfilled",
      paymentGateway: "zinipay",
      metaEventId,
      fbp,
      fbc,
      userAgent,
      ip,
    });

    // Create ZiniPay Invoice
    const ziniInvoice = await createZiniPayInvoice({
      cus_name: name || "Guest Customer",
      cus_email: email || "customer@kalobazar.com",
      amount: product.price,
      metadata: {
        order_id: orderId,
        product_id: String(product._id),
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
      eventSourceUrl: `${siteUrl}/checkout/${product.slug}`,
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
        value: product.price,
        content_ids: [String(product._id)],
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

    const companySetting = await Setting.findOne({ key: "company_info" });
    const companyInfo = companySetting?.value || {};

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
        fulfillmentStatus: order.fulfillmentStatus || "unfulfilled",
        autoCompleted: order.autoCompleted || false,
        upstreamOrderCode: order.upstreamOrderCode,
        deliveryAccounts: order.deliveryAccounts || [],
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
