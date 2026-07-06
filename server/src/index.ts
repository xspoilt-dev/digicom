import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { connectDB } from "./db";
import publicRouter from "./routes/public";
import adminRouter from "./routes/admin";
import RouteRedirect from "./models/RouteRedirect";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const app = new Hono();

// Connect to Database
connectDB();

// Middlewares
app.use(
  "/*",
  cors({
    origin: "*", // allow all or customize to client domain in production
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

// Serve uploads folder static assets (such as thumbnails)
app.get("/uploads/*", async (c) => {
  try {
    const relativePath = c.req.path.replace(/^\/uploads\//, "");
    const filePath = path.resolve(__dirname, "../uploads", relativePath);

    if (fs.existsSync(filePath)) {
      const ext = path.extname(filePath).toLowerCase();
      let contentType = "application/octet-stream";
      
      if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
      else if (ext === ".png") contentType = "image/png";
      else if (ext === ".gif") contentType = "image/gif";
      else if (ext === ".svg") contentType = "image/svg+xml";
      else if (ext === ".pdf") contentType = "application/pdf";
      else if (ext === ".zip") contentType = "application/zip";
      else if (ext === ".mp4") contentType = "video/mp4";

      c.header("Content-Type", contentType);
      const fileBuffer = fs.readFileSync(filePath);
      return c.body(fileBuffer);
    }
  } catch (err) {
    console.error("Static file reading error:", err);
  }
  return c.text("Asset Not Found", 404);
});

// Dynamic Route Resolver Endpoint
// Client middleware or pages can call this to see if a path redirects to a product or dynamic route
app.get("/api/resolve-route", async (c) => {
  try {
    const routePath = c.req.query("path");
    if (!routePath) {
      return c.json({ success: false, message: "Missing path query parameter" }, 400);
    }

    const redirect = await RouteRedirect.findOne({ sourcePath: routePath });
    if (redirect) {
      return c.json({
        success: true,
        resolved: true,
        destinationPath: redirect.destinationPath,
        redirectType: redirect.redirectType,
      });
    }

    return c.json({ success: true, resolved: false });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Mount modular routers
app.route("/api", publicRouter);
app.route("/api/admin", adminRouter);

// Base Route
app.get("/", (c) => c.text("Digicom Hono API Server Running"));

// Start server
const port = Number(process.env.PORT) || 5000;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
