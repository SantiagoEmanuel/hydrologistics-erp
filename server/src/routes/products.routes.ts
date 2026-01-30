import { and, eq, isNotNull, sql } from "drizzle-orm";
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
      .where(eq(products.isActive, true));

    res.json(allProducts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener productos" });
  }
});

export default productRouter;
