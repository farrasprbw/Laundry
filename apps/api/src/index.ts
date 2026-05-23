import express from "express";
import cors from "cors";
import { env } from "./env.js";
import { db } from "./db/index.js";
import { sql } from "drizzle-orm";

// Route imports
import authRoutes from "./routes/auth.routes.js";
import customerRoutes from "./routes/customer.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import orderRoutes from "./routes/order.routes.js";
import expenseRoutes from "./routes/expense.routes.js";
import reportRoutes from "./routes/report.routes.js";
import paymentMethodRoutes from "./routes/payment-method.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import userRoutes from "./routes/user.routes.js";
import publicRoutes from "./routes/public.routes.js";
import cronRoutes from "./routes/cron.routes.js";
import { autoFinishService } from "./services/auto-finish.service.js";

const app = express();

// ── Middleware ──
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());

// ── Health check ──
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

// ── Routes ──
app.use("/api/public", publicRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/payment-methods", paymentMethodRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/users", userRoutes);
app.use("/api/cron", cronRoutes);

// ── Export for Vercel serverless ──
export default app;

// ── Start server (local development only) ──
if (process.env.NODE_ENV !== "production") {
  app.listen(env.PORT, () => {
    console.log(`🚀 Laundry API running on http://localhost:${env.PORT}`);
    console.log(`   Health: http://localhost:${env.PORT}/api/health`);

    // ── Auto-finish cron (every 5 minutes in dev) ──
    const CRON_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
    setInterval(async () => {
      try {
        const count = await autoFinishService.autoFinishOrders();
        if (count > 0) {
          console.log(`⏱️  Auto-finished ${count} order(s)`);
        }
      } catch (err) {
        console.error("[CRON] Auto-finish error:", err);
      }
    }, CRON_INTERVAL_MS);
    console.log(`   ⏱️  Auto-finish cron: every 5 minutes`);
  });
}
