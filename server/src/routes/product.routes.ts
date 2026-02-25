import { and, asc, eq, isNotNull, sql } from "drizzle-orm";
import { Router } from "express";
import { db } from "../db";
import { products } from "../db/schema";

const productRouter = Router();

productRouter.get("/", async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    await db
      .update(products)
      .set({
        stock: sql`${products.dailyResetStock}`,
        lastResetAt: new Date(),
      })
      .where(
        and(
          isNotNull(products.dailyResetStock),

          sql`(${products.lastResetAt} IS NULL OR ${products.lastResetAt} < ${todayStart.getTime()})`,
        ),
      );

    const allProducts = await db
      .select()
      .from(products)
      .where(eq(products.isActive, true))
      .orderBy(asc(products.name));

    res.json(allProducts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener productos" });
  }
});

productRouter.patch("/:id/stock", async (req, res) => {
  const { id } = req.params;
  const { adjustment } = req.body;

  if (typeof adjustment !== "number") {
    return res
      .status(400)
      .json({ error: "Se requiere un valor numérico para 'adjustment'" });
  }

  try {
    const [updatedProduct] = await db
      .update(products)
      .set({
        stock: sql`${products.stock} + ${adjustment}`,
      })
      .where(eq(products.id, Number(id)))
      .returning();

    if (!updatedProduct) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json(updatedProduct);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al ajustar stock" });
  }
});

productRouter.post("/", async (req, res) => {
  const product: Product = req.body;

  if (!product) {
    return res
      .status(400)
      .json({ error: "Faltan datos para generar el producto" });
  }

  try {
    const newProduct = await db.insert(products).values(product).returning();
    if (newProduct.length === 0) {
      return res.status(500).json({
        error: "Error al guardar el producto",
      });
    }

    return res.status(201).json(newProduct);
  } catch {
    return res.status(500).json({
      error: "Error al guardar el producto",
    });
  }
});

productRouter.post("/:id/update", async (req, res) => {
  const product: Product = req.body;
  const id = req.params;

  if (!product) {
    return res.status(400).json({
      error: "Faltan datos para actualizar",
    });
  }

  try {
    const response = await db
      .update(products)
      .set(product)
      .where(eq(products.id, Number(id)))
      .returning();

    if (response.length === 0) {
      return res.status(500).json({
        error: "No se pudo actualizar el producto",
      });
    }

    return res.status(201).json(response);
  } catch {}
});

export default productRouter;

interface Product {
  name: string;
  price: number;
  wholesalePrice: number;
  stock: number;
  trackStock: boolean;
  isRefill: boolean;
  isReturnable: boolean;
  isActive: boolean;
}
