import { and, desc, eq, gte, inArray, isNull, lte, sql } from "drizzle-orm";
import { Router } from "express";
import { db } from "../db";
import {
  cashShifts,
  clients,
  paymentMethods,
  products,
  saleItems,
  sales,
} from "../db/schema";
import { generateTicketCode } from "../utils/codeGenerator";
import productRouter from "./products.routes";

const salesRouter = Router();

salesRouter.post("/", async (req, res) => {
  const { items, clientId, paidStatus = "UNPAID", paymentMethodId } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: "No hay productos en la venta" });
  }

  const activeShift = await db.query.cashShifts.findFirst({
    where: isNull(cashShifts.closedAt),
    orderBy: [desc(cashShifts.openedAt)],
  });

  if (!activeShift) {
    return res
      .status(409)
      .json({ error: "La caja está cerrada. Abra una sesión para vender." });
  }

  try {
    const result = await db.transaction(async (tx) => {
      const productIds = items.map((i: any) => i.productId);

      const dbProducts = await tx
        .select()
        .from(products)
        .where(inArray(products.id, productIds));

      const client = clientId
        ? await tx.query.clients.findFirst({ where: eq(clients.id, clientId) })
        : null;

      const isReseller = client?.type === "REVENDEDOR";

      let totalAmount = 0;
      const itemsToInsert = [];

      for (const item of items) {
        const product = dbProducts.find((p) => p.id === item.productId);

        if (!product) {
          throw new Error(`Producto ID ${item.productId} no encontrado`);
        }

        if (product.trackStock && product.stock < item.quantity) {
          throw new Error(
            `Stock insuficiente para ${product.name}. Disponible: ${product.stock}`,
          );
        }

        const unitPrice =
          isReseller && product.wholesalePrice
            ? product.wholesalePrice
            : product.price;

        if (product.trackStock) {
          await tx
            .update(products)
            .set({
              stock: sql`${products.stock} - ${item.quantity}`,
            })
            .where(eq(products.id, product.id));
        }

        totalAmount += unitPrice * item.quantity;

        itemsToInsert.push({
          productId: product.id,
          quantity: item.quantity,
          price: unitPrice,
        });
      }

      const [newSale] = await tx
        .insert(sales)
        .values({
          ticketCode: generateTicketCode(),
          totalAmount,
          clientId: clientId || null,
          paymentStatus: paidStatus,
          paidAmount: totalAmount,
          shiftId: paidStatus !== "UNPAID" ? activeShift.id : null,
          paymentMethodId,
        })
        .returning();

      const saleItemsData = itemsToInsert.map((item) => ({
        ...item,
        saleId: newSale.id,
      }));

      await tx.insert(saleItems).values(saleItemsData);

      return newSale;
    });

    return res.status(201).json(result);
  } catch (error: any) {
    console.error("Error procesando venta:", error);

    const status =
      error.message.includes("Stock") || error.message.includes("Producto")
        ? 400
        : 500;
    res
      .status(status)
      .json({ error: error.message || "Error al procesar la venta" });
  }
});

salesRouter.get("/", async (req, res) => {
  const { from, to } = req.query;

  try {
    const filters = [];

    // Si mandan fechas, filtramos
    if (from && typeof from === "string") {
      const fromDate = new Date(`${from}T00:00:00.000Z`);
      filters.push(gte(sales.createdAt, fromDate));
    }

    if (to && typeof to === "string") {
      const toDate = new Date(`${to}T23:59:59.999Z`);
      filters.push(lte(sales.createdAt, toDate));
    }

    const salesHistory = await db.query.sales.findMany({
      limit: 100, // Límite de seguridad
      where: and(...filters, isNull(sales.routeId)),
      orderBy: [desc(sales.createdAt)],
      with: {
        items: { with: { product: true } },
        client: true,
        paymentMethods: true, // Asegúrate de tener la relación en schema
      },
    });

    return res.json(salesHistory);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error al obtener historial" });
  }
});

// 2. ANULAR VENTA (DELETE lógico o físico con restauración de stock)
salesRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await db.transaction(async (tx) => {
      // A. Buscar la venta y sus items
      const sale = await tx.query.sales.findFirst({
        where: eq(sales.id, id),
        with: { items: true },
      });

      if (!sale) throw new Error("Venta no encontrada");
      if (sale.paymentStatus === "CANCELLED")
        throw new Error("Esta venta ya está anulada");

      // B. Restaurar Stock (Efecto Inverso)
      for (const item of sale.items) {
        // Solo restauramos si el producto tiene control de stock
        const product = await tx.query.products.findFirst({
          where: eq(products.id, item.productId),
        });

        if (product && product.trackStock) {
          await tx
            .update(products)
            .set({ stock: sql`${products.stock} + ${item.quantity}` })
            .where(eq(products.id, item.productId));
        }
      }

      // C. Opción 1: Hard Delete (Borrar todo)
      // await tx.delete(saleItems).where(eq(saleItems.saleId, id));
      // await tx.delete(sales).where(eq(sales.id, id));

      // C. Opción 2: Soft Delete (Recomendada - Marcar como ANULADA)
      // Esto mantiene el registro pero lo invalida para la caja
      await tx
        .update(sales)
        .set({
          paymentStatus: "CANCELLED",
          totalAmount: 0, // Para que no sume en reportes simples
          paidAmount: 0,
        })
        .where(eq(sales.id, id));
    });

    res.json({ message: "Venta anulada y stock restaurado" });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
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

salesRouter.patch("/:id/paid-sale", async (req, res) => {
  const { id } = req.params;
  const { paymentMethodId, shiftId } = req.body;

  if (!id || !paymentMethodId || !shiftId) {
    return res.status(500).json({ error: "No se encontró la venta" });
  }

  try {
    const [us] = await db
      .update(sales)
      .set({
        paymentStatus: sql`${"PAID"}`,
        paymentMethodId: sql`${paymentMethodId}`,
        shiftId: sql`${shiftId}`,
      })
      .where(eq(sales.id, id.toString()))
      .returning();

    if (!us) {
      return res.status(404).json({ error: "Venta no encontrada" });
    }

    const salesUpdate = await db.query.sales.findFirst({
      where: eq(sales.id, id.toString()),
      with: {
        items: {
          with: {
            product: true,
          },
        },
        client: true,
        paymentMethods: true,
      },
    });

    return res.json(salesUpdate);
  } catch (error) {
    console.log({ error });
    return res.status(500).json({ error: "Error al actualizar la venta" });
  }
});

salesRouter.get("/get-payments-methods", async (req, res) => {
  try {
    const paymentMethod = await db.select().from(paymentMethods);

    if (paymentMethod.length === 0) {
      return res
        .status(404)
        .json({ error: "No se encontraron métodos de pagos" });
    }

    return res.json(paymentMethod);
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Error al obtener los métodos de pagos" });
  }
});

export default salesRouter;
