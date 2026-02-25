import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import { authenticateToken } from "./middlewares/auth.middleware";
import accountsRouter from "./routes/account.routes";
import analyticsRouter from "./routes/analytic.routes";
import authRouter from "./routes/auth.routes";
import clientRouter from "./routes/client.routes";
import productRouter from "./routes/product.routes";
import routerRouter from "./routes/routes.routes";
import salesRouter from "./routes/sale.routes";
import shiftsRouter from "./routes/shift.routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://hydrologistics-erp-client.vercel.app",
    ],
    credentials: true,
  }),
);
app.use(helmet());
app.use(express.json());
app.use(cookieParser());

// TEST
app.get("/ok", (req, res) => {
  return res.json({ message: "OK", status: 200 }).status(200);
});

// Rutas Públicas
app.use("/api/auth", authRouter);

// Rutas Protegidas ç
app.use("/api/sales", authenticateToken, salesRouter);
app.use("/api/clients", authenticateToken, clientRouter);
app.use("/api/routes", authenticateToken, routerRouter);
app.use("/api/accounts", authenticateToken, accountsRouter);
app.use("/api/products", authenticateToken, productRouter);
app.use("/api/shifts", authenticateToken, shiftsRouter);
app.use("/api/analytics", authenticateToken, analyticsRouter);

app.listen(PORT, () => {
  console.log(`Server running`);
});
