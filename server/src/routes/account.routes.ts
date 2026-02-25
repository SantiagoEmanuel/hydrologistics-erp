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
          with: {
            items: {
              with: {
                product: true,
              },
            },
          },
        },
      },
    });

    const debtors = allClients
      .map((client) => {
        const debt = client.sales.reduce((acc, sale) => {
          return acc + (sale.totalAmount - (sale.paidAmount || 0));
        }, 0);

        const productSummary: Record<string, number> = {};

        client.sales.forEach((sale) => {
          sale.items.forEach((item) => {
            const prodName = item.product.name;

            productSummary[prodName] =
              (productSummary[prodName] || 0) + item.quantity;
          });
        });

        const productsOwed = Object.entries(productSummary).map(
          ([name, qty]) => ({
            name,
            quantity: qty,
          }),
        );

        return {
          id: client.id,
          name: client.name,
          type: client.type,
          debt,
          productsOwed,
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

accountRouter.get("/:id/history", async (req, res) => {
  const { id } = req.params;
  try {
    const clientTransactions = await db.query.sales.findMany({
      where: eq(sales.clientId, id),
      orderBy: [desc(sales.createdAt)],
      with: {
        items: { with: { product: true } },
        route: true,
      },
    });

    const history = clientTransactions.map((tx) => {
      const hasItems = tx.items.length > 0;
      const isPayment =
        !hasItems || (tx.paymentStatus === "PAID" && tx.totalAmount < 0);

      let type: "SALE" | "PAYMENT" = "SALE";

      if (tx.paymentMethodId === 5) {
        type = "SALE";
      } else if (hasItems) {
        type = "SALE";
      } else {
        type = "PAYMENT";
      }

      return {
        id: tx.id,
        type: type,
        date: tx.createdAt,
        amount: tx.totalAmount,
        status: tx.paymentStatus,
        ticketCode: tx.ticketCode,
        driverName: tx.route?.driverName || null,
        routeId: tx.routeId,
        items: tx.items.map((i) => ({
          productName: i.product.name,
          quantity: i.quantity,
        })),
      };
    });

    res.json(history);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener historial" });
  }
});

accountRouter.post("/:clientId/pay", async (req, res) => {
  const { clientId } = req.params;
  const { amount, method = "EFECTIVO", notes } = req.body;

  if (!amount || amount <= 0)
    return res.status(400).json({ error: "Monto inválido" });

  try {
    await db.transaction(async (tx) => {
      const activeShift = await tx.query.cashShifts.findFirst({
        where: isNull(cashShifts.closedAt),
      });

      const client = await tx.query.clients.findFirst({
        where: eq(clients.id, clientId),
      });

      if (!client) {
        throw new Error("Cliente no encontrado");
      }

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
        description: `Cobro Cta. Cte. Cliente #${clientId.slice(0, 4)} - (${client.name})`,
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
