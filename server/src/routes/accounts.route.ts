import { and, asc, desc, eq, isNull, ne } from "drizzle-orm";
import { Router } from "express";
import { db } from "../db";
import {
  cashMovements,
  cashShifts,
  clientPayments,
  clients,
  sales,
} from "../db/schema";

const accountRouter = Router();

accountRouter.get("/debtors", async (req, res) => {
  try {
    const allClients = await db.query.clients.findMany({
      where: eq(clients.isActive, true),
      with: {
        sales: {
          where: ne(sales.paymentStatus, "PAID"),
        },
      },
    });

    const debtors = allClients
      .map((client) => {
        const debt = client.sales.reduce((acc, sale) => {
          return acc + (sale.totalAmount - (sale.paidAmount || 0));
        }, 0);

        return {
          id: client.id,
          name: client.name,
          type: client.type,
          debt,
          lastSaleDate:
            client.sales.length > 0
              ? client.sales[client.sales.length - 1].createdAt
              : null,
        };
      })
      .filter((c) => c.debt > 0)
      .sort((a, b) => b.debt - a.debt);

    res.json(debtors);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener deudores" });
  }
});

accountRouter.get("/:clientId/history", async (req, res) => {
  const { clientId } = req.params;

  try {
    const clientSales = await db.query.sales.findMany({
      where: eq(sales.clientId, clientId),
      orderBy: [desc(sales.createdAt)],
      limit: 50,
    });

    const payments = await db.query.clientPayments.findMany({
      where: eq(clientPayments.clientId, clientId),
      orderBy: [desc(clientPayments.createdAt)],
      limit: 50,
    });

    const history = [
      ...clientSales.map((s) => ({
        type: "SALE",
        id: s.id,
        date: s.createdAt,
        amount: s.totalAmount,
        balance: s.totalAmount - (s.paidAmount || 0),
        status: s.paymentStatus,
        ticketCode: s.ticketCode,
      })),
      ...payments.map((p) => ({
        type: "PAYMENT",
        id: p.id,
        date: p.createdAt,
        amount: p.amount,
        method: p.method,
      })),
    ].sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime());

    res.json(history);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener historial" });
  }
});

accountRouter.post("/:clientId/pay", async (req, res) => {
  const { clientId } = req.params;
  const { amount, method = "CASH", notes } = req.body;

  if (!amount || amount <= 0)
    return res.status(400).json({ error: "Monto inválido" });

  try {
    await db.transaction(async (tx) => {
      const activeShift = await tx.query.cashShifts.findFirst({
        where: isNull(cashShifts.closedAt),
      });

      if (!activeShift)
        throw new Error("No hay caja abierta para recibir el pago");

      await tx.insert(clientPayments).values({
        clientId,
        shiftId: activeShift.id,
        amount,
        method,
        notes,
      });

      await tx.insert(cashMovements).values({
        shiftId: activeShift.id,
        type: "IN",
        amount: amount,
        description: `Cobro Cta. Cte. Cliente #${clientId.slice(0, 4)}`,
      });

      const unpaidSales = await tx.query.sales.findMany({
        where: and(
          eq(sales.clientId, clientId),
          ne(sales.paymentStatus, "PAID"),
        ),
        orderBy: [asc(sales.createdAt)],
      });

      let remainingPayment = amount;

      for (const sale of unpaidSales) {
        if (remainingPayment <= 0) break;

        const debtOnThisTicket = sale.totalAmount - (sale.paidAmount || 0);

        const amountToCover = Math.min(remainingPayment, debtOnThisTicket);

        const newPaidAmount = (sale.paidAmount || 0) + amountToCover;
        const isFullyPaid = newPaidAmount >= sale.totalAmount - 0.01;

        await tx
          .update(sales)
          .set({
            paidAmount: newPaidAmount,
            paymentStatus: isFullyPaid ? "PAID" : "PARTIAL",
          })
          .where(eq(sales.id, sale.id));

        remainingPayment -= amountToCover;
      }
    });

    res.json({
      success: true,
      message: "Pago registrado e imputado correctamente",
    });
  } catch (error: any) {
    console.error(error);
    res
      .status(500)
      .json({ error: error.message || "Error al procesar el pago" });
  }
});

export default accountRouter;
