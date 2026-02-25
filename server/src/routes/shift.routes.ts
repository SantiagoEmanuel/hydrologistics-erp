import { and, desc, eq, gte, isNull, lte, sql } from "drizzle-orm";
import { Router } from "express";
import { db } from "../db";
import { cashMovements, cashShifts, sales } from "../db/schema";
import { getArgDate } from "../utils/date";

const shiftsRouter = Router();

shiftsRouter.get("/current", async (req, res) => {
  try {
    const activeShift = await db.query.cashShifts.findFirst({
      where: isNull(cashShifts.closedAt),
      with: {
        movements: true,
        sales: {
          where: isNull(sales.routeId),
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

    const currentSalesIds = new Set(activeShift.sales.map((s) => s.id));
    const uniquePending = salesPending.filter(
      (s) => !currentSalesIds.has(s.id),
    );
    const allDisplaySales = [...activeShift.sales, ...uniquePending];

    const totalSales = activeShift.sales
      .filter((sale) => sale.paymentStatus === "PAID")
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
      shift: { ...activeShift, sales: allDisplaySales },
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
        openedAt: getArgDate().toJSDate(),
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
      .where(
        and(
          eq(sales.shiftId, shiftId),
          eq(sales.paymentStatus, "PAID"),
          eq(sales.paymentMethodId, 1),
        ),
      );

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
        closedAt: getArgDate().toJSDate(),
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
            items: { with: { product: true } },
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
      return res.status(409).json({ error: "No hay caja abierta" });
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

shiftsRouter.get("/reports/summary", async (req, res) => {
  let { date } = req.query;

  const argDate =
    typeof date === "string"
      ? getArgDate(date).toJSDate()
      : getArgDate().toJSDate();

  try {
    const searchDate = argDate;

    const start = new Date(searchDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(searchDate);
    end.setHours(23, 59, 59, 999);

    const shifts = await db.query.cashShifts.findMany({
      where: and(
        gte(cashShifts.openedAt, start),
        lte(cashShifts.openedAt, end),
      ),
      orderBy: [desc(cashShifts.openedAt)],
      with: {
        sales: {
          with: {
            client: true,
            items: {
              with: {
                product: true,
              },
            },
          },
        },
      },
    });

    const report = shifts.map((shift) => {
      const groupedItems = new Map<
        string,
        { productName: string; clientType: string; quantity: number }
      >();

      shift.sales.forEach((sale) => {
        const clientType = sale.client?.type || "FINAL";

        sale.items.forEach((item) => {
          const productName = item.product.name;
          const key = `${productName}||${clientType}`;

          if (!groupedItems.has(key)) {
            groupedItems.set(key, {
              productName,
              clientType,
              quantity: 0,
            });
          }

          const entry = groupedItems.get(key)!;
          entry.quantity += item.quantity;
        });
      });

      const detailedItems = Array.from(groupedItems.values()).sort((a, b) => {
        const nameComparison = a.productName.localeCompare(b.productName);
        if (nameComparison !== 0) return nameComparison;

        return a.clientType.localeCompare(b.clientType);
      });

      return {
        id: shift.id,
        status: shift.status,
        openedAt: shift.openedAt,
        closedAt: shift.closedAt,
        userName: shift.operatorName || "Sin operador",
        finalBalance: shift.finalAmount || 0,
        items: detailedItems,
      };
    });

    res.json(report);
  } catch (error) {
    console.error("Error en reporte de cajas:", error);
    res.status(500).json({ error: "Error generando reporte de cajas" });
  }
});

const SHIFT_HOURS = {
  MORNING: { start: 8, end: 14 },
  AFTERNOON: { start: 16, end: 22 },
};

shiftsRouter.post("/register-shift/historical", async (req, res) => {
  const { targetDate, shiftType, operatorName } = req.body;

  if (!targetDate || !shiftType) {
    return res.status(400).json({ error: "Fecha y Turno requeridos" });
  }

  try {
    const hours = SHIFT_HOURS[shiftType as keyof typeof SHIFT_HOURS];

    if (!hours) {
      return res.status(400).json({ error: "Tipo de turno inválido" });
    }

    const start = getArgDate(targetDate)
      .set({ hour: hours.start, minute: 0, second: 0, millisecond: 0 })
      .toJSDate();

    const end = getArgDate(targetDate)
      .set({ hour: hours.end, minute: 59, second: 59, millisecond: 999 })
      .toJSDate();

    const shiftLabel = shiftType === "MORNING" ? "Mañana" : "Tarde";
    const formattedOperatorName = `Histórico (${shiftLabel}) - ${operatorName}`;

    const existingShift = await db.query.cashShifts.findFirst({
      where: and(
        gte(cashShifts.openedAt, start),
        lte(cashShifts.openedAt, end),
      ),
    });

    if (existingShift) {
      return res.status(400).json({
        error: `Ya existe una caja registrada para el turno ${shiftType} en esta fecha.`,
      });
    }

    const [createdShift] = await db
      .insert(cashShifts)
      .values({
        openedAt: start,
        closedAt: end,
        operatorName: formattedOperatorName,
        initialAmount: 0,
        finalAmount: 0,
        status: "EDITING",
      })
      .returning();

    return res.json(createdShift);
  } catch (error) {
    console.error("Error creating historical shift:", error);
    res.status(500).json({ error: "Error al crear turno histórico" });
  }
});

shiftsRouter.post(
  "/register-shift/close-editing/:shiftId",
  async (req, res) => {
    const { shiftId } = req.params;

    try {
      await db.transaction(async (tx) => {
        const shift = await tx.query.cashShifts.findFirst({
          where: eq(cashShifts.id, shiftId),
        });

        if (!shift || shift.status !== "EDITING") {
          throw new Error(
            "Solo se pueden finalizar turnos en estado de EDICIÓN.",
          );
        }

        const salesSummary = await tx
          .select({
            totalCash: sql<number>`sum(${sales.paidAmount})`,
          })
          .from(sales)
          .where(
            and(eq(sales.shiftId, shiftId), eq(sales.paymentStatus, "PAID")),
          );

        const calculatedFinalAmount = Number(salesSummary[0]?.totalCash || 0);

        await tx
          .update(cashShifts)
          .set({
            finalAmount: calculatedFinalAmount,
            status: "CLOSED",
            closedAt: shift.closedAt,
          })
          .where(eq(cashShifts.id, shiftId));
      });

      return res.json({
        success: true,
        message: "Carga histórica finalizada y caja cuadrada.",
      });
    } catch (error: any) {
      console.error("Error al cerrar edición:", error);
      return res.status(400).json({ error: error.message });
    }
  },
);

export default shiftsRouter;
