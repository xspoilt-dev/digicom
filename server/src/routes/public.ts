import { Hono } from "hono";
import Product from "../models/Product";
import Order from "../models/Order";
import Transaction from "../models/Transaction";
import Setting from "../models/Setting";
import { sendCapiEvent } from "../utils/metaCapi";
import path from "path";
import fs from "fs";

const publicRouter = new Hono();

// Helper to generate a unique readable Order ID
function generateOrderId(): string {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `DIGI-${num}`;
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

// 3. Initiate Checkout
publicRouter.post("/checkout", async (c) => {
  try {
    const body = await c.req.json();
    const { productId, name, email, phone, paymentGateway, metaEventId, fbp, fbc } = body;

    const product = await Product.findById(productId);
    if (!product || !product.active) {
      return c.json({ success: false, message: "Product not found or inactive" }, 404);
    }

    // Check if required checkout fields are provided
    const missingFields: string[] = [];
    if (product.checkoutFields.includes("name") && !name) missingFields.push("name");
    if (product.checkoutFields.includes("email") && !email) missingFields.push("email");
    if (product.checkoutFields.includes("phone") && !phone) missingFields.push("phone");

    if (missingFields.length > 0) {
      return c.json({ success: false, message: `Missing required fields: ${missingFields.join(", ")}` }, 400);
    }

    const orderId = generateOrderId();
    const userAgent = c.req.header("user-agent") || "";
    const ip = c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "127.0.0.1";

    const newOrder = new Order({
      orderId,
      name,
      email,
      phone,
      items: [
        {
          productId: product._id,
          title: product.title,
          price: product.price,
          quantity: 1,
        },
      ],
      total: product.price,
      status: "pending",
      paymentGateway,
      metaEventId,
      fbp,
      fbc,
      userAgent,
      ip,
    });

    await newOrder.save();

    // Trigger server-side InitiateCheckout CAPI tracking
    await sendCapiEvent({
      eventName: "InitiateCheckout",
      eventId: metaEventId,
      eventSourceUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/checkout/${product.slug}`,
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
      message: "Order initiated",
      order: {
        id: newOrder._id,
        orderId: newOrder.orderId,
        total: newOrder.total,
        paymentGateway: newOrder.paymentGateway,
      },
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 4. Submit bKash Manual Payment Info
publicRouter.post("/checkout/verify-bkash", async (c) => {
  try {
    const { orderId, trxID, senderNumber } = await c.req.json();

    const order = await Order.findOne({ orderId });
    if (!order) {
      return c.json({ success: false, message: "Order not found" }, 404);
    }

    // Save bKash sender details on Order
    order.bkashTrxID = trxID;
    order.bkashSender = senderNumber;
    order.status = "processing"; // Order shifts to processing state waiting for admin approval
    await order.save();

    // Create a transaction log
    const transaction = new Transaction({
      orderId: order._id,
      amount: order.total,
      gateway: "bkash",
      trxID,
      senderNumber,
      status: "pending",
    });
    await transaction.save();

    return c.json({
      success: true,
      message: "Payment transaction details submitted. Awaiting verification by administrator.",
      orderStatus: order.status,
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 5. EPS Payment Webhook (Automated Callback)
publicRouter.post("/checkout/eps-callback", async (c) => {
  try {
    const body = await c.req.json();
    // EPS Gateway payload simulation (status, transaction_id, order_id, amount, hash)
    const { status, transaction_id, order_id, amount } = body;

    const order = await Order.findOne({ orderId: order_id });
    if (!order) {
      return c.json({ success: false, message: "Order not found" }, 404);
    }

    if (status === "success") {
      order.status = "paid";
      order.epsTransactionId = transaction_id;
      await order.save();

      // Create a verified transaction log
      const transaction = new Transaction({
        orderId: order._id,
        amount: Number(amount) || order.total,
        gateway: "eps",
        trxID: transaction_id,
        status: "verified",
        verifiedAt: new Date(),
      });
      await transaction.save();

      // Trigger server-side CAPI Purchase event
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
          content_ids: order.items.map((item: any) => String(item.productId)),
          content_type: "product",
          order_id: order.orderId,
        },
      });

      return c.json({ success: true, message: "Payment processed successfully" });
    } else {
      order.status = "failed";
      await order.save();
      return c.json({ success: true, message: "Payment status marked as failed" });
    }
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 6. Get Order Status
publicRouter.get("/order-status/:orderId", async (c) => {
  try {
    const orderId = c.req.param("orderId");
    const order = await Order.findOne({ orderId }).populate("items.productId");
    if (!order) {
      return c.json({ success: false, message: "Order not found" }, 404);
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
        total: order.total,
        status: order.status,
        paymentGateway: order.paymentGateway,
        items: order.items.map((item: any) => {
          const prod = item.productId;
          return {
            id: prod?._id,
            title: item.title,
            price: item.price,
            type: prod?.type,
            isWebDisplay: prod?.isWebDisplay,
            deliveryLink: prod?.isWebDisplay ? prod.deliveryLink : undefined,
            // Generate secure link if paid
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

// 7. Secure file delivery
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
