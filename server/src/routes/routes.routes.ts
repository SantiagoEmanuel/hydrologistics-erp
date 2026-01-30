import { and, asc, desc, eq, gte, isNull, lte, sql } from "drizzle-orm";
import { Router } from "express";
import { db } from "../db";
import {
  cashMovements,
  cashShifts,
  products,
  routeItems,
  routePricingTiers,
  routes,
  saleItems,
  sales,
} from "../db/schema";
import { generateTicketCode } from "../utils/codeGenerator";

const routerRouter = Router();

routerRouter.get("/", async (req, res) => {
  try {
    const allRoutes = await db.query.routes.findMany({
      limit: 50,
      orderBy: [desc(routes.date)],
      with: {
        items: {
          with: {
            product: true,
          },
        },
      },
    });

    res.json(allRoutes);
  } catch (error) {
    console.error("Error al obtener rutas:", error);
    res.status(500).json({ error: "Error al obtener el historial de rutas" });
  }
});

routerRouter.post("/:id/close-stock", async (req, res) => {
  const { id } = req.params;
  const { itemsReturn, vouchers } = req.body;

  if (!itemsReturn || !Array.isArray(itemsReturn)) {
    return res.status(400).json({ error: "Faltan datos de retorno" });
  }

  try {
    await db.transaction(async (tx) => {
      const route = await tx.query.routes.findFirst({
        where: eq(routes.id, id),
      });
      if (!route) throw new Error("Ruta no encontrada");
      if (route.stockStatus === "CLOSED") throw new Error("Ruta ya cerrada");

      for (const returnData of itemsReturn) {
        const routeItem = await tx.query.routeItems.findFirst({
          where: and(
            eq(routeItems.routeId, id),
            eq(routeItems.productId, returnData.productId),
          ),
        });
        if (!routeItem) continue;

        const sold = routeItem.initialLoad - (returnData.returnedQuantity || 0);
        const credits = returnData.creditQuantity || 0;

        const vouchersForThisProduct = vouchers
          ? vouchers.filter((v: any) => v.productId === returnData.productId)
          : [];

        const totalVoucherQty = vouchersForThisProduct.reduce(
          (acc: number, v: any) => acc + v.quantity,
          0,
        );

        if (totalVoucherQty !== credits) {
          throw new Error(
            `Discrepancia en ${routeItem.productId}: Declaraste ${credits} fiados, pero detallaste clientes por ${totalVoucherQty}.`,
          );
        }

        await tx
          .update(routeItems)
          .set({
            returnedLoad: returnData.returnedQuantity,
            soldCount: sold,
            creditCount: credits,
          })
          .where(eq(routeItems.id, routeItem.id));

        const product = await tx.query.products.findFirst({
          where: eq(products.id, returnData.productId),
        });
        if (product?.trackStock) {
          await tx
            .update(products)
            .set({
              stock: sql`${products.stock} + ${returnData.returnedQuantity}`,
            })
            .where(eq(products.id, returnData.productId));
        }

        if (vouchers && vouchers.length > 0) {
          const clientVouchers: Record<string, typeof vouchers> = {};

          vouchers.forEach((v: any) => {
            if (!clientVouchers[v.clientId]) clientVouchers[v.clientId] = [];
            clientVouchers[v.clientId].push(v);
          });

          for (const [clientId, clientItems] of Object.entries(
            clientVouchers,
          )) {
            let saleTotal = 0;

            for (const item of clientItems) {
              const routeItem = await tx.query.routeItems.findFirst({
                where: and(
                  eq(routeItems.routeId, id),
                  eq(routeItems.productId, item.productId),
                ),
              });
              const price = routeItem?.streetPriceSnapshot || 0;
              saleTotal += price * item.quantity;
            }

            const [newSale] = await tx
              .insert(sales)
              .values({
                shiftId: null,
                routeId: id,
                clientId: clientId,
                paymentStatus: "UNPAID",
                totalAmount: saleTotal,
                paidAmount: 0,
                ticketCode: generateTicketCode(),
              })
              .returning();

            for (const item of clientItems) {
              const routeItem = await tx.query.routeItems.findFirst({
                where: and(
                  eq(routeItems.routeId, id),
                  eq(routeItems.productId, item.productId),
                ),
              });

              await tx.insert(saleItems).values({
                saleId: newSale.id,
                productId: item.productId,
                quantity: item.quantity,
                price: routeItem?.streetPriceSnapshot || 0,
              });
            }
          }
        }

        await tx
          .update(routes)
          .set({ stockStatus: "CLOSED", closedAt: new Date() })
          .where(eq(routes.id, id));
      }
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});

routerRouter.post("/", async (req, res) => {
  const { driverName, items, pricingSchemeId = 1 } = req.body;

  if (!driverName || !items || items.length === 0) {
    return res.status(400).json({ error: "Faltan datos (chofer o carga)" });
  }

  const today = new Date();
  const localDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    today.getUTCHours() - 3,
    today.getUTCMinutes(),
  );

  try {
    const result = await db.transaction(async (tx) => {
      const [newRoute] = await tx
        .insert(routes)
        .values({
          driverName,
          pricingSchemeId: pricingSchemeId,
          status: "OPEN",
          stockStatus: "OPEN",
          paymentStatus: "PENDING",
          date: localDate,
        })
        .returning();

      for (const item of items) {
        const product = await tx.query.products.findFirst({
          where: eq(products.id, item.productId),
        });

        if (!product) {
          throw new Error(`Producto ID ${item.productId} no existe`);
        }

        if (product.trackStock && product.stock < item.quantity) {
          throw new Error(
            `Stock insuficiente de ${product.name}. Tienes ${product.stock}, intentas cargar ${item.quantity}.`,
          );
        }

        await tx.insert(routeItems).values({
          routeId: newRoute.id,
          productId: item.productId,
          initialLoad: item.quantity,
          soldCount: 0,
          returnedLoad: 0,
          creditCount: 0,
          streetPriceSnapshot: product.price,
        });

        if (product.trackStock) {
          await tx
            .update(products)
            .set({
              stock: sql`${products.stock} - ${item.quantity}`,
            })
            .where(eq(products.id, item.productId));
        }
      }

      return newRoute;
    });

    res.status(201).json(result);
  } catch (error: any) {
    console.error("Error creando ruta:", error);
    const statusCode = error.message.includes("Stock") ? 400 : 500;
    res
      .status(statusCode)
      .json({ error: error.message || "Error al crear la ruta" });
  }
});

routerRouter.post("/settle/confirm", async (req, res) => {
  const { driverName, date, totalPayment } = req.body;

  try {
    await db.transaction(async (tx) => {
      const activeShift = await tx.query.cashShifts.findFirst({
        where: isNull(cashShifts.closedAt),
      });

      if (!activeShift)
        throw new Error(
          "No hay caja abierta para recibir el dinero de la rendición.",
        );

      const startDate = new Date(`${date}T00:00:00.000Z`);
      const endDate = new Date(`${date}T23:59:59.999Z`);

      const pendingRoutes = await tx.query.routes.findMany({
        where: and(
          eq(routes.driverName, driverName),
          eq(routes.stockStatus, "CLOSED"),
          eq(routes.paymentStatus, "PENDING"),
          gte(routes.date, startDate),
          lte(routes.date, endDate),
        ),
      });

      if (pendingRoutes.length === 0)
        throw new Error("No hay rutas pendientes para cobrar.");

      for (const route of pendingRoutes) {
        await tx
          .update(routes)
          .set({
            paymentStatus: "PAID",
            observations: `Rendido el ${new Date().toLocaleDateString()}`,
          })
          .where(eq(routes.id, route.id));
      }

      await tx.insert(cashMovements).values({
        shiftId: activeShift.id,
        type: "IN",
        amount: totalPayment,
        description: `Rendición Rutas: ${driverName} (${date}) - ${pendingRoutes.length} viajes`,
      });
    });

    res.json({
      success: true,
      message: "Rendición procesada y dinero ingresado a caja.",
    });
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});

routerRouter.post("/settle/preview", async (req, res) => {
  const { driverName, date } = req.body;

  if (!driverName || !date) {
    return res.status(400).json({ error: "Faltan datos (driverName, date)" });
  }

  try {
    const startDate = new Date(`${date}T00:00:00.000Z`);
    const endDate = new Date(`${date}T23:59:59.999Z`);

    // 1. OBTENER RUTAS
    const pendingRoutes = await db.query.routes.findMany({
      where: and(
        eq(routes.driverName, driverName),
        eq(routes.stockStatus, "CLOSED"),
        eq(routes.paymentStatus, "PENDING"),
        gte(routes.date, startDate),
        lte(routes.date, endDate),
      ),
      with: {
        items: { with: { product: true } },
      },
      orderBy: [asc(routes.closedAt)],
    });

    if (pendingRoutes.length === 0) {
      return res.status(404).json({
        message: "No se encontraron viajes pendientes de rendición.",
      });
    }

    const firstRoute = pendingRoutes[0];

    // 2. AGRUPAR Y CAPTURAR PRECIO CALLE
    const summaryByProduct: Record<
      number,
      {
        name: string;
        totalSold: number;
        totalCredit: number;
        streetPrice: number; // <--- NUEVO: Necesitamos saber a cuánto se vende en la calle
      }
    > = {};

    for (const route of pendingRoutes) {
      for (const item of route.items) {
        const pId = item.productId;
        if (!summaryByProduct[pId]) {
          summaryByProduct[pId] = {
            name: item.product.name,
            totalSold: 0,
            totalCredit: 0,
            streetPrice: item.streetPriceSnapshot || 0, // Capturamos el precio calle guardado
          };
        }
        summaryByProduct[pId].totalSold += item.soldCount || 0;
        summaryByProduct[pId].totalCredit += item.creditCount || 0;
      }
    }

    const pricingSchemeId = firstRoute.pricingSchemeId || 1;
    let grandTotalCashRequired = 0;
    const itemsBreakdown = [];

    // 3. CÁLCULO PRODUCTO POR PRODUCTO
    for (const [productIdStr, data] of Object.entries(summaryByProduct)) {
      const productId = Number(productIdStr);
      // Unidades Efectivas: 112 - 13 = 99
      const cashUnits = Math.max(0, data.totalSold - data.totalCredit);

      const tiers = await db.query.routePricingTiers.findMany({
        where: and(
          eq(routePricingTiers.schemeId, pricingSchemeId),
          eq(routePricingTiers.productId, productId),
        ),
        orderBy: [asc(routePricingTiers.minVolume)],
      });

      let productTotalDebt = 0;
      let bonusesApplied = 0;
      let voucherCompensation = 0; // <--- ACÁ GUARDAREMOS LA RESTA NUEVA (510, 410, etc)

      if (tiers.length === 0) {
        // SIN TRAMOS (Lógica simple)
        const prod = await db.query.products.findFirst({
          where: eq(products.id, productId),
        });
        const priceToUse = prod?.wholesalePrice || prod?.price || 0;

        // Si hay boletas en productos sin tramos, ¿se paga ganancia?
        // Asumiremos que NO hay lógica compleja aquí, solo deuda por lo efectivo.
        productTotalDebt = cashUnits * priceToUse;
      } else {
        // CON TRAMOS (La lógica compleja)

        const basePrice = tiers[0].renderPrice; // $1290 (Base)

        // A. DEUDA BASE (Sobre unidades Efectivas)
        // 99 * 1290
        const baseDebt = cashUnits * basePrice;

        // B. BONUS POR VOLUMEN (Sobre Total Vendido)
        // Calcula cuánto descuento se ganó por llegar a 112
        let totalDiscount = 0;
        for (const tier of tiers) {
          const discountPerUnit = basePrice - tier.renderPrice; // Ej: 1290 - 1190 = 100
          if (discountPerUnit > 0) {
            const salesAboveMin = Math.max(
              0,
              data.totalSold - (tier.minVolume - 1),
            );
            const tierCapacity = tier.maxVolume
              ? tier.maxVolume - tier.minVolume + 1
              : Infinity;
            const countInThisTier = Math.min(salesAboveMin, tierCapacity);

            if (countInThisTier > 0) {
              totalDiscount += countInThisTier * discountPerUnit;
            }
          }
        }

        // C. COMPENSACIÓN POR BOLETAS (LIFO - Last In First Out) 🧠
        // Las boletas ocupan los lugares "más altos" de la venta.
        // Ej: Boletas = 13. Total = 112.
        // Ocupan del lugar 100 al 112.

        if (data.totalCredit > 0) {
          let remainingCredits = data.totalCredit;

          // Iteramos los tramos DE ATRÁS PARA ADELANTE (Del más alto al más bajo)
          // Para asignar las boletas a los mejores precios primero
          const reversedTiers = [...tiers].sort(
            (a, b) => b.minVolume - a.minVolume,
          );

          for (const tier of reversedTiers) {
            if (remainingCredits <= 0) break;

            // Rango de este tramo: [min, max]
            const tierStart = tier.minVolume; // 101
            const tierEnd = tier.maxVolume || Infinity; // 120

            // Rango que ocupan las boletas "imaginariamente": [totalSold - remaining + 1, totalSold]
            // Pero es más fácil pensar: ¿Cuántas unidades de mi venta TOTAL caen en este tramo?
            // Y de esas, ¿cuántas son créditos (contando desde arriba)?

            // Lógica de intersección:
            // Mis ventas totales llegan hasta 'data.totalSold' (112).
            // Las boletas son las ultimas 'remainingCredits'.

            // Definimos el rango de números de venta que son boletas en este momento:
            // Desde: (112 - 13 + 1) = 100. Hasta: 112.
            // Intersección con el tramo [101, 120].
            // Intersección = [101, 112]. Son 12 unidades.

            const creditRangeStart = data.totalSold - remainingCredits + 1;
            const creditRangeEnd = data.totalSold; // Esto va bajando en cada iteración no... mejor lógica estática:

            // Simplificación:
            // Ventas que caen en este tramo:
            const salesInTierStart = Math.max(
              tierStart,
              data.totalSold - data.totalCredit + 1,
            ); // Max(101, 100) = 101
            const salesInTierEnd = Math.min(tierEnd, data.totalSold); // Min(120, 112) = 112

            if (salesInTierEnd >= salesInTierStart) {
              // Cantidad de boletas que caen en este tramo
              const creditsInTier = salesInTierEnd - salesInTierStart + 1; // 112 - 101 + 1 = 12

              // Ganancia del chofer en este tramo:
              // Precio Calle (1700) - Precio Rendición Tramo (1190) = 510
              const driverProfit = data.streetPrice - tier.renderPrice;

              voucherCompensation += creditsInTier * driverProfit;

              // Reducimos para la lógica (aunque con el cálculo de rangos absoluto no haría falta iterar restando,
              // pero por seguridad en la lógica de rangos complejos):
              // En realidad, con la intersección de rangos ya cubrimos todo.
              // Simplemente necesitamos sumar todas las intersecciones de "Zona de Boletas" con "Zona de Tramos".
            }
          }

          // RE-CALCULO MANUAL CON TU EJEMPLO PARA VALIDAR LÓGICA DE INTERSECCIÓN:
          // Rango Boletas: [100, 112] (13 items)
          // Tramo 3 (121+): Intersección [100, 112] n [121, Inf] = Nada.
          // Tramo 2 (101-120): Intersección [100, 112] n [101, 120] = [101, 112] (12 items). Profit 510. -> 12 * 510. OK.
          // Tramo 1 (0-100): Intersección [100, 112] n [0, 100] = [100, 100] (1 item). Profit 410. -> 1 * 410. OK.
        }

        bonusesApplied = totalDiscount;

        // FÓRMULA FINAL:
        // (Deuda sobre efectivo) - (Bonos por volumen) - (Ganancia de boletas)
        // Nota: 'baseDebt' es (Cash * 1290).
        // 'totalDiscount' es (12 * 100).
        // Si seguimos tu fórmula estricta: 99*1290 - 12*100 - (12*510 + 1*410)

        productTotalDebt = baseDebt - totalDiscount - voucherCompensation;
      }

      grandTotalCashRequired += productTotalDebt;

      itemsBreakdown.push({
        productName: data.name,
        totalSold: data.totalSold,
        credits: data.totalCredit,
        cashUnits: cashUnits,
        bonuses: bonusesApplied,
        voucherCompensation: voucherCompensation, // Para mostrar en frontend
        finalDebt: productTotalDebt,
      });
    }

    // 4. DETALLE DE VIAJES
    const routeDetails = pendingRoutes.map((route) => ({
      id: route.id,
      closedAt: route.closedAt,
      items: route.items.map((item) => ({
        productName: item.product.name,
        initialLoad: item.initialLoad,
        returnedLoad: item.returnedLoad,
        soldCount: item.soldCount,
        creditCount: item.creditCount,
      })),
    }));

    return res.json({
      driverName,
      date,
      routesIncluded: pendingRoutes.length,
      summary: itemsBreakdown,
      totalToPay: grandTotalCashRequired,
      sales: pendingRoutes,
      routeDetails,
    });
  } catch (error) {
    console.error("Error calculando rendición:", error);
    res.status(500).json({ error: "Error interno al calcular la rendición." });
  }
});

export default routerRouter;
