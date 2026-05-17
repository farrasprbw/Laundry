import express from "express";
import cors from "cors";
import { env } from "./env.js";

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
app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/payment-methods", paymentMethodRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/users", userRoutes);

// ── Export for Vercel serverless ──
export default app;

// ── Start server (local development only) ──
if (process.env.NODE_ENV !== "production") {
  app.listen(env.PORT, () => {
    console.log(`🚀 Laundry API running on http://localhost:${env.PORT}`);
    console.log(`   Health: http://localhost:${env.PORT}/api/health`);
  });
}
