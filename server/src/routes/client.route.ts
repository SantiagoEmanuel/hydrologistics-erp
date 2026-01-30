import { desc, eq } from "drizzle-orm";
import { Router } from "express";
import { db } from "../db";
import { clients } from "../db/schema";

const clientRouter = Router();

clientRouter.get("/", async (req, res) => {
  try {
    const allClients = await db
      .select()
      .from(clients)
      .where(eq(clients.isActive, true))
      .orderBy(desc(clients.createdAt));

    res.json(allClients);
  } catch (error) {
    console.error("Error fetching clients:", error);
    res.status(500).json({ error: "Error al obtener clientes" });
  }
});

clientRouter.post("/", async (req, res) => {
  const { name, type = "FINAL" } = req.body;

  if (!name) {
    return res.status(400).json({ error: "El nombre es obligatorio" });
  }

  try {
    const [newClient] = await db
      .insert(clients)
      .values({
        name: name,
        type: type,
        isActive: true,
      })
      .returning();

    return res.status(201).json(newClient);
  } catch (error) {
    return res.status(500).json({ error: "Error al crear cliente" });
  }
});

export default clientRouter;
