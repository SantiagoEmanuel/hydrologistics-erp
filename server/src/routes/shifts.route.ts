import { and, eq, isNull, sql } from "drizzle-orm";
import { Router } from "express";
import { db } from "../db";
import { cashMovements, cashShifts, sales } from "../db/schema";

const shiftsRouter = Router();

shiftsRouter.get("/current", async (req, res) => {
  try {
    const activeShift = await db.query.cashShifts.findFirst({
      where: isNull(cashShifts.closedAt),
      with: {
        movements: true,
        sales: {
          orderBy: (sales, { desc }) => [desc(sales.createdAt)],
          with: {
            client: true,
            items: {
              with: {
                product: true,
              },
            },
            paymentMethods: true,
          },
        },
      },
    });

    if (!activeShift) {
      return res
        .status(404)
        .json({ status: "CLOSED", message: "No hay caja abierta" });
    }

    const salesPending = await db.query.sales.findMany({
      where: and(eq(sales.paymentStatus, "UNPAID"), isNull(sales.routeId)),
      orderBy: (sales, { desc }) => [desc(sales.createdAt)],
      with: {
        items: {
          with: {
            product: true,
          },
        },
        client: true,
      },
    });

    const totalSales = activeShift.sales
      .filter((sale) => sale.paymentStatus !== "UNPAID")
      .filter((sale) => sale.paymentMethodId === 1)
      .reduce((acc, sale) => acc + sale.totalAmount, 0);

    const totalIn = activeShift.movements
      .filter((m) => m.type === "IN")
      .reduce((acc, m) => acc + m.amount, 0);

    const totalOut = activeShift.movements
      .filter((m) => m.type === "OUT")
      .reduce((acc, m) => acc + m.amount, 0);

    const theoreticalCash =
      activeShift.initialAmount + totalSales + totalIn - totalOut;

    return res.json({
      status: "OPEN",
      shift: { ...activeShift, sales: [...activeShift.sales, ...salesPending] },
      stats: {
        totalSales,
        totalIn,
        totalOut,
        theoreticalCash,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al consultar estado de caja" });
  }
});

shiftsRouter.post("/open", async (req, res) => {
  const { initialAmount, operatorName } = req.body;

  try {
    const activeShift = await db.query.cashShifts.findFirst({
      where: isNull(cashShifts.closedAt),
    });

    if (activeShift) {
      return res.status(400).json({ error: "Ya existe una caja abierta" });
    }

    const [newShift] = await db
      .insert(cashShifts)
      .values({
        initialAmount: initialAmount || 0,
        operatorName: operatorName || "Cajero Principal",
        openedAt: new Date(),
      })
      .returning();

    res.status(201).json(newShift);
  } catch (error) {
    res.status(500).json({ error: "Error al abrir caja" });
  }
});

shiftsRouter.post("/close", async (req, res) => {
  const { shiftId, finalAmount, observations } = req.body;

  try {
    const salesResult = await db
      .select({ total: sql<number>`sum(${sales.totalAmount})` })
      .from(sales)
      .where(eq(sales.shiftId, shiftId));

    const totalSales = salesResult[0].total || 0;
    const movements = await db
      .select()
      .from(cashMovements)
      .where(eq(cashMovements.shiftId, shiftId));

    let totalIn = 0;
    let totalOut = 0;

    movements.forEach((m) => {
      if (m.type === "IN") totalIn += m.amount;
      if (m.type === "OUT") totalOut += m.amount;
    });

    const shift = await db.query.cashShifts.findFirst({
      where: eq(cashShifts.id, shiftId),
    });

    if (!shift) return res.status(404).json({ error: "Turno no encontrado" });

    const expectedAmount =
      (shift.initialAmount || 0) + totalSales + totalIn - totalOut;
    const difference = finalAmount - expectedAmount;

    await db
      .update(cashShifts)
      .set({
        closedAt: new Date(),
        finalAmount,
        systemAmount: expectedAmount,
        difference,
        observations,
        status: "CLOSED",
      })
      .where(eq(cashShifts.id, shiftId));

    const fullReportData = await db.query.cashShifts.findFirst({
      where: eq(cashShifts.id, shiftId),
      with: {
        movements: true,

        sales: {
          orderBy: (sales, { desc }) => [desc(sales.createdAt)],
          with: {
            client: true,
            paymentMethods: true,
            items: {
              with: { product: true },
            },
          },
        },
      },
    });

    res.json(fullReportData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al cerrar caja" });
  }
});

shiftsRouter.post("/movement", async (req, res) => {
  const { type, amount, description } = req.body;

  try {
    const activeShift = await db.query.cashShifts.findFirst({
      where: isNull(cashShifts.closedAt),
    });

    if (!activeShift) {
      return res
        .status(409)
        .json({ error: "No hay caja abierta para registrar movimientos" });
    }

    const [movement] = await db
      .insert(cashMovements)
      .values({
        shiftId: activeShift.id,
        type,
        amount,
        description,
      })
      .returning();

    res.status(201).json(movement);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al registrar movimiento" });
  }
});

export default shiftsRouter;
