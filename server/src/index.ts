import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import accountsRouter from "./routes/accounts.route";
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
    origin: "http://localhost:5173",
  }),
);
app.use(helmet());
app.use(express.json());
app.use(cookieParser());
// app.use(authenticateToken);

// TEST
app.get("/ok", (req, res) => {
  return res.json({ message: "OK", status: 200 }).status(200);
});

// ROUTES
app.use("/api/products", productRouter);
app.use("/api/sales", salesRouter);
app.use("/api/clients", clientRouter);
app.use("/api/shifts", shiftsRouter);
app.use("/api/routes", routerRouter);
app.use("/api/accounts", accountsRouter);
app.use("/api/auth", authRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
