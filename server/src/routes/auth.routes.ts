import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { db } from "../db";
import { users } from "../db/schema";

const authRouter = Router();
const SECRET_KEY =
  process.env.JWT_SECRET || "secreto_super_seguro_cambiar_en_prod";

authRouter.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.username, username),
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.fullName },
      SECRET_KEY,
      { expiresIn: "12h" },
    );

    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 12 * 60 * 60 * 1000,
    });

    res.json({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

authRouter.post("/logout", (req, res) => {
  res.clearCookie("auth_token");
  res.json({ message: "Sesión cerrada" });
});

authRouter.get("/me", async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ error: "No autenticado" });

  try {
    const decoded = jwt.verify(token, SECRET_KEY) as any;
    const user = await db.query.users.findFirst({
      where: eq(users.id, decoded.id),
    });

    if (!user) return res.status(401).json({ error: "Usuario no encontrado" });

    res.json({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
    });
  } catch (error) {
    res.status(401).json({ error: "Token inválido" });
  }
});

authRouter.post("/register-first-admin", async (req, res) => {
  const { username, password, fullName } = req.body;
  const hash = await bcrypt.hash(password, 10);

  await db.insert(users).values({
    username,
    password: hash,
    fullName,
    role: "ADMIN",
  });

  res.json({ message: "Admin creado" });
});

export default authRouter;
