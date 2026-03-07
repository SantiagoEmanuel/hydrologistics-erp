import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { db } from "../db";
import { users } from "../db/schema";
import { authenticateToken } from "../middlewares/auth.middleware";

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
      sameSite: process.env.NODE_ENV !== "production" ? "lax" : "lax",
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

authRouter.post("/register", authenticateToken, async (req, res) => {
  const { username, fullName, password, role } = req.body;

  if (!username || !fullName || !password) {
    return res
      .status(400)
      .json({ error: "Error al ingresar los datos del usuario" });
  }

  try {
    const passwordHashed = bcrypt.hashSync(password, 10);

    const [newUser] = await db
      .insert(users)
      .values({
        username,
        fullName,
        password: passwordHashed,
        role: role ?? null,
      })
      .returning();

    if (!newUser) {
      return res.status(400).json({
        error: "Error al crear el usuario",
      });
    }
    const token = jwt.sign(
      { id: newUser.id, role: newUser.role, name: newUser.fullName },
      SECRET_KEY,
      { expiresIn: "12h" },
    );

    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV !== "production" ? "lax" : "lax",
      maxAge: 12 * 60 * 60 * 1000,
    });

    res.json({
      id: newUser.id,
      username: newUser.username,
      fullName: newUser.fullName,
      role: newUser.role,
    });
  } catch {
    return res.status(500).json({
      error: "Error al crear el usuario",
    });
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
      columns: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      res.clearCookie("auth_token");
      return res
        .status(401)
        .json({ error: "Usuario no encontrado o inactivo" });
    }

    res.json(user);
  } catch (error) {
    res.clearCookie("auth_token");
    res.status(401).json({ error: "Token inválido" });
  }
});

authRouter.get("/all", async (req, res) => {
  try {
    const response = await db.select().from(users);
    return res.json(response);
  } catch {
    res.status(500).json({ error: "No se pudieron obtener los usuarios" });
  }
});

export default authRouter;
