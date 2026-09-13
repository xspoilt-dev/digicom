import { Hono } from "hono";
import { sign, verify } from "hono/jwt";
import Product from "../models/Product";
import Order from "../models/Order";
import Transaction from "../models/Transaction";
import Setting from "../models/Setting";
import RouteRedirect from "../models/RouteRedirect";
import { sendCapiEvent } from "../utils/metaCapi";
import { sendOrderDeliveryEmail } from "../utils/mailer";
import path from "path";
import fs from "fs";

const adminRouter = new Hono();

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || "digicom_super_secret_jwt_admin_token_2026";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@digitalcorebd.com";
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

// 1. Dashboard Stats
adminRouter.get("/stats", async (c) => {
  try {
    const totalSalesAggregate = await Order.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]);
    const totalSales = totalSalesAggregate[0]?.total || 0;

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
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        },
      },
      { $sort: { salesCount: -1 } },
      { $limit: 5 },
    ]);

    // Recent Transactions
    const recentTransactions = await Transaction.find()
      .populate("orderId", "orderId email phone")
      .sort({ createdAt: -1 })
      .limit(10);

    return c.json({
      success: true,
      stats: {
        totalSales,
        totalOrders,
        paidOrders,
        pendingOrders,
        processingOrders,
        failedOrders,
        topProducts,
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

    const query: any = {};
    if (status) {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { orderId: new RegExp(search, "i") },
        { email: new RegExp(search, "i") },
        { phone: new RegExp(search, "i") },
        { zinipayInvoiceId: new RegExp(search, "i") },
        { transactionId: new RegExp(search, "i") },
        { bkashTrxID: new RegExp(search, "i") },
      ];
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });
    return c.json({ success: true, orders });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Approve/Verify Order manually (ZiniPay / manual validation)
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

    // Set order status to paid
    order.status = "paid";
    if (!order.paymentMethod) {
      order.paymentMethod = "admin_approval";
    }
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

    // Trigger server-side Meta CAPI Purchase event (counts as Purchase in Meta Pixel/CAPI)
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

    // Resolve secure download urls
    const downloadUrls: { title: string; link: string }[] = [];
    for (const item of order.items) {
      const prodId = item.productId?._id || item.productId;
      const prod = await Product.findById(prodId);
      if (prod) {
        const link = prod.deliveryLink || (prod.filePath ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/${prod.filePath}` : "");
        if (link) {
          downloadUrls.push({ title: prod.title, link });
        }
      }
    }

    // Send delivery email asynchronously so it doesn't block response
    if (order.email) {
      sendOrderDeliveryEmail({
        toEmail: order.email,
        orderId: order.orderId,
        customerName: order.name || "Customer",
        totalAmount: order.total,
        items: order.items.map((i: any) => ({ title: i.title, price: i.price, quantity: i.quantity })),
        downloadUrls,
      }).catch(err => console.error("[Admin Order Approval] Email send error:", err));
    }

    return c.json({
      success: true,
      message: "Order approved, payment recorded, delivery email dispatched, and Meta CAPI Purchase event fired.",
      capiDispatched,
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
      .sort({ createdAt: -1 });
    return c.json({ success: true, transactions });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 4. Products CRUD
adminRouter.get("/products", async (c) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    return c.json({ success: true, products });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

adminRouter.post("/products", async (c) => {
  try {
    const body = await c.req.json();
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
    const uploadPathDir = path.resolve(__dirname, "../../uploads", uploadDirName);

    // Create folder structure if not exist
    if (!fs.existsSync(uploadPathDir)) {
      fs.mkdirSync(uploadPathDir, { recursive: true });
    }

    const fileExt = path.extname(file.name);
    const uniqueFilename = `${Date.now()}-${Math.floor(Math.random() * 1000)}${fileExt}`;
    const fullWritePath = path.join(uploadPathDir, uniqueFilename);

    // Write file to disk
    const arrayBuffer = await file.arrayBuffer();
    fs.writeFileSync(fullWritePath, Buffer.from(arrayBuffer));

    // Return the server path to store in database
    const relativePath = `uploads/${uploadDirName}/${uniqueFilename}`;

    return c.json({
      success: true,
      filePath: relativePath,
      filename: file.name,
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
    return c.json({ success: true, setting });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
});

// 7. Route redirects CRUD
adminRouter.get("/redirects", async (c) => {
  try {
    const redirects = await RouteRedirect.find();
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

export default adminRouter;
