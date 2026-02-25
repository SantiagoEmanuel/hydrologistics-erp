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
import { getArgDate } from "../utils/date";

const salesRouter = Router();

salesRouter.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { items, paymentMethodId, paymentStatus, clientId, newDate } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: "La venta debe tener productos" });
  }

  try {
    await db.transaction(async (tx) => {
      const originalItems = await tx.query.saleItems.findMany({
        where: eq(saleItems.saleId, id),
      });

      for (const item of originalItems) {
        await tx
          .update(products)
          .set({
            stock: sql`${products.stock} + ${item.quantity}`,
          })
          .where(
            and(eq(products.id, item.productId), eq(products.trackStock, true)),
          );
      }

      await tx.delete(saleItems).where(eq(saleItems.saleId, id));

      const productIds = items.map((i: any) => i.productId);
      const dbProducts = await tx.query.products.findMany({
        where: inArray(products.id, productIds),
      });

      const productsMap = new Map(dbProducts.map((p) => [p.id, p]));

      let newTotal = 0;
      const itemsToInsert = [];

      for (const item of items) {
        const product = productsMap.get(item.productId);

        if (!product) {
          throw new Error(`Producto ID ${item.productId} no encontrado`);
        }

        if (product.trackStock && product.stock < item.quantity) {
          throw new Error(
            `Stock insuficiente para ${product.name}. Stock actual: ${product.stock}`,
          );
        }

        const subtotal = item.quantity * item.price;
        newTotal += subtotal;

        if (product.trackStock) {
          await tx
            .update(products)
            .set({
              stock: sql`${products.stock} - ${item.quantity}`,
            })
            .where(eq(products.id, item.productId));
        }

        itemsToInsert.push({
          saleId: id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        });
      }

      if (itemsToInsert.length > 0) {
        await tx.insert(saleItems).values(itemsToInsert as any);
      }

      await tx
        .update(sales)
        .set({
          totalAmount: newTotal,
          paymentMethodId: paymentMethodId,
          paymentStatus: paymentStatus,
          clientId: clientId,
          createdAt: getArgDate(newDate).toJSDate(),
        })
        .where(eq(sales.id, id));
    });

    return res.json({
      success: true,
      message: "Venta actualizada correctamente",
    });
  } catch (error: any) {
    console.error("Error editando venta:", error);

    return res
      .status(400)
      .json({ error: error.message || "Error al editar la venta" });
  }
});

salesRouter.post("/save-sale/:shiftId", async (req, res) => {
  const {
    items,
    clientId,
    paidStatus = "UNPAID",
    paymentMethodId,
    newDate,
  } = req.body;
  const { shiftId } = req.params;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "No hay productos en la venta" });
  }

  try {
    const result = await db.transaction(async (tx) => {
      const shift = await tx.query.cashShifts.findFirst({
        where: eq(cashShifts.id, shiftId),
      });

      if (!shift || (shift.status !== "OPEN" && shift.status !== "EDITING")) {
        throw new Error("No se puede registrar ventas en una caja CERRADA.");
      }

      const saleDate =
        shift.status === "EDITING"
          ? getArgDate(newDate).toJSDate()
          : getArgDate().toJSDate();

      const paymentMethod = await tx.query.paymentMethods.findFirst({
        where: eq(paymentMethods.id, paymentMethodId),
      });

      if (!paymentMethod) throw new Error("Método de pago inválido");

      const methodName = paymentMethod.name.trim().toUpperCase();
      const isBoleta = methodName.includes("BOLETA");
      const isDonacion = methodName.includes("DONACION");

      if (isBoleta && (!clientId || clientId === "")) {
        throw new Error(
          "RESTRICCIÓN: Para emitir una BOLETA debe seleccionar un Cliente.",
        );
      }

      const productIds = items.map((i: any) => i.productId);
      const dbProducts = await tx
        .select()
        .from(products)
        .where(inArray(products.id, productIds));

      const productsMap = new Map(dbProducts.map((p) => [p.id, p]));

      const client = clientId
        ? await tx.query.clients.findFirst({ where: eq(clients.id, clientId) })
        : null;
      const isReseller = client?.type === "REVENDEDOR";

      let totalAmount = 0;
      const itemsToInsert = [];

      for (const item of items) {
        const product = productsMap.get(item.productId);
        if (!product)
          throw new Error(`Producto ${item.productId} no encontrado`);

        if (product.trackStock && product.stock < item.quantity) {
          throw new Error(`Stock insuficiente: ${product.name}`);
        }

        let unitPrice = product.price;
        if (isDonacion) unitPrice = 0;
        else if (isReseller && product.wholesalePrice)
          unitPrice = product.wholesalePrice;

        if (product.trackStock) {
          await tx
            .update(products)
            .set({ stock: sql`${products.stock} - ${item.quantity}` })
            .where(eq(products.id, product.id));
        }

        totalAmount += unitPrice * item.quantity;
        itemsToInsert.push({
          productId: product.id,
          quantity: item.quantity,
          price: unitPrice,
        });
      }

      let finalPaymentStatus = paidStatus;
      let finalPaidAmount = 0;

      if (isBoleta) {
        finalPaymentStatus = paidStatus === "PAID" ? "BOLETA" : "UNPAID";
        finalPaidAmount = 0;
      } else if (isDonacion) {
        finalPaymentStatus = "PAID";
        finalPaidAmount = 0;
      } else {
        if (paidStatus === "PAID") finalPaidAmount = totalAmount;
        else finalPaidAmount = 0;
      }

      const [newSale] = await tx
        .insert(sales)
        .values({
          ticketCode: generateTicketCode(),
          totalAmount,
          clientId: clientId || null,
          paymentStatus: finalPaymentStatus,
          paidAmount: finalPaidAmount,
          shiftId: shiftId,
          paymentMethodId,
          createdAt: saleDate,
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
    console.error("❌ Error en venta:", error.message);
    const status =
      error.message.includes("RESTRICCIÓN") ||
      error.message.includes("Stock") ||
      error.message.includes("CERRADA")
        ? 400
        : 500;
    return res
      .status(status)
      .json({ error: error.message || "Error al procesar venta" });
  }
});

salesRouter.get("/", async (req, res) => {
  const { from, to } = req.query;

  try {
    const filters = [];

    if (from && typeof from === "string") {
      const fromDate = getArgDate(from).startOf("day").toJSDate();
      filters.push(gte(sales.createdAt, fromDate));
    }

    if (to && typeof to === "string") {
      const toDate = getArgDate(to).endOf("day").toJSDate();
      filters.push(lte(sales.createdAt, toDate));
    }

    const salesHistory = await db.query.sales.findMany({
      limit: 100,
      where: and(...filters, isNull(sales.routeId)),
      orderBy: [desc(sales.createdAt)],
      with: {
        items: { with: { product: true } },
        client: true,
        paymentMethods: true,
      },
    });

    return res.json(salesHistory);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error al obtener historial" });
  }
});

salesRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await db.transaction(async (tx) => {
      const sale = await tx.query.sales.findFirst({
        where: eq(sales.id, id),
        with: { items: true },
      });

      if (!sale) throw new Error("Venta no encontrada");
      if (sale.paymentStatus === "CANCELLED")
        throw new Error("Esta venta ya está anulada");

      for (const item of sale.items) {
        await tx
          .update(products)
          .set({ stock: sql`${products.stock} + ${item.quantity}` })
          .where(
            and(eq(products.id, item.productId), eq(products.trackStock, true)),
          );
      }

      await tx
        .update(sales)
        .set({
          paymentStatus: "CANCELLED",
          totalAmount: 0,
          paidAmount: 0,
        })
        .where(eq(sales.id, id));
    });

    return res.json({ message: "Venta anulada y stock restaurado" });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});

salesRouter.patch("/:id/paid-sale", async (req, res) => {
  const { id } = req.params;
  const { paymentMethodId, shiftId } = req.body;

  if (!id || !paymentMethodId || !shiftId) {
    return res
      .status(400)
      .json({ error: "Faltan datos para procesar el pago" });
  }

  try {
    const paymentMethod = await db.query.paymentMethods.findFirst({
      where: eq(paymentMethods.id, paymentMethodId),
    });

    const [us] = await db
      .update(sales)
      .set({
        paymentStatus: paymentMethod?.name === "BOLETA" ? "BOLETA" : "PAID",
        paymentMethodId: paymentMethodId,
        shiftId: shiftId,
      })
      .where(eq(sales.id, id.toString()))
      .returning();

    if (!us) {
      return res.status(404).json({ error: "Venta no encontrada" });
    }

    const salesUpdate = await db.query.sales.findFirst({
      where: eq(sales.id, id.toString()),
      with: {
        items: { with: { product: true } },
        client: true,
        paymentMethods: true,
      },
    });

    return res.json(salesUpdate);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error al actualizar la venta" });
  }
});

salesRouter.get("/get-payments-methods", async (req, res) => {
  try {
    const paymentMethod = await db.select().from(paymentMethods);
    return res.json(paymentMethod);
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Error al obtener los métodos de pagos" });
  }
});

export default salesRouter;
