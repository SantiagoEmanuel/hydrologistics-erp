import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import { authenticateToken } from "./middlewares/auth.middleware";
import accountsRouter from "./routes/accounts.route";
import analyticsRouter from "./routes/analytics.route";
import authRouter from "./routes/auth.routes";
import clientRouter from "./routes/client.route";
import productRouter from "./routes/products.routes";
import routerRouter from "./routes/routes.routes";
import salesRouter from "./routes/sales.routes";
import shiftsRouter from "./routes/shifts.route";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(
  cors({
    origin: ["http://localhost:5173"],
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

// Rutas Protegidas (Aplicamos el middleware globalmente a estas rutas)
app.use("/api/sales", authenticateToken, salesRouter);
app.use("/api/clients", authenticateToken, clientRouter);
app.use("/api/routes", authenticateToken, routerRouter);
app.use("/api/accounts", authenticateToken, accountsRouter);
app.use("/api/products", authenticateToken, productRouter);
app.use("/api/shifts", authenticateToken, shiftsRouter);
app.use("/api/analytics", authenticateToken, analyticsRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
