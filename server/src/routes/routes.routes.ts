import {
  and,
  asc,
  count,
  eq,
  gte,
  inArray,
  isNull,
  lte,
  notInArray,
  sql,
} from "drizzle-orm";
import { Router } from "express";
import { db } from "../db";
import {
  cashMovements,
  cashShifts,
  products,
  routeItems,
  routePricingSchemes,
  routePricingTiers,
  routes,
  saleItems,
  sales,
} from "../db/schema";
import { generateTicketCode } from "../utils/codeGenerator";
import { getArgDate } from "../utils/date";
import { normalizeString } from "../utils/normalizeString";

const routesRouter = Router();

routesRouter.get("/", async (req, res) => {
  try {
    const allRoutes = await db.query.routes.findMany({
      orderBy: (routes, { desc }) => [desc(routes.date)],
      limit: 20,
      with: {
        items: {
          with: { product: true },
        },
      },
    });
    res.json(allRoutes);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener rutas" });
  }
});

routesRouter.get("/schemas", async (req, res) => {
  try {
    const routesSchemas = await db.query.routePricingSchemes.findMany({
      where: eq(routePricingSchemes.isActive, true),
      with: {
        tiers: {
          with: {
            product: true,
          },
        },
      },
    });
    res.json(routesSchemas);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el esquema de rutas" });
  }
});

routesRouter.post("/schema", async (req, res) => {
  const { name, isActive, haveDiscount, discount, tiers } = req.body;

  if (!name || tiers.length === 0) {
    return res.status(400).json({
      error: "Verifica que los datos del esquema sean válidos",
    });
  }

  try {
    const result = await db.transaction(async (tx) => {
      const [newScheme] = await tx
        .insert(routePricingSchemes)
        .values({
          name,
          isActive,
          haveDiscount,
          discount,
        })
        .returning();

      if (!newScheme) {
        throw new Error("No se ha encontrado un esquema con esa ID");
      }

      const tiersToInsert = tiers.map((tier: any) => ({
        schemeId: newScheme.id,
        productId: tier.productId,
        minVolume: tier.minVolume,
        maxVolume: tier.maxVolume || null,
        renderPrice: tier.renderPrice,
      }));

      const newTiers = await tx
        .insert(routePricingTiers)
        .values(tiersToInsert)
        .returning();

      return {
        ...newScheme,
        tiers: newTiers,
      };
    });

    if (!result) {
      return res
        .status(500)
        .json({ error: "Error al guardar el nuevo Esquema" });
    }

    return res.status(201).json(result);
  } catch {
    return res.status(500).json({
      error:
        "Ha ocurrido un problema al guardar el Esquema, inténtalo más tarde",
    });
  }
});

routesRouter.put("/schemas/:id", async (req, res) => {
  const schemeId = Number(req.params.id);
  const { name, isActive, haveDiscount, discount, tiers } = req.body;

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(routePricingSchemes)
        .set({ name, isActive, haveDiscount, discount })
        .where(eq(routePricingSchemes.id, schemeId));

      const incomingTierIds = tiers
        .map((t: any) => t.id)
        .filter((id: any) => typeof id === "number");

      if (incomingTierIds.length > 0) {
        await tx
          .delete(routePricingTiers)
          .where(
            and(
              eq(routePricingTiers.schemeId, schemeId),
              notInArray(routePricingTiers.id, incomingTierIds),
            ),
          );
      } else {
        await tx
          .delete(routePricingTiers)
          .where(eq(routePricingTiers.schemeId, schemeId));
      }

      for (const tier of tiers) {
        if (typeof tier.id === "number") {
          await tx
            .update(routePricingTiers)
            .set({
              productId: tier.productId,
              minVolume: tier.minVolume,
              maxVolume: tier.maxVolume,
              renderPrice: tier.renderPrice,
            })
            .where(eq(routePricingTiers.id, tier.id));
        } else {
          await tx.insert(routePricingTiers).values({
            schemeId: schemeId,
            productId: tier.productId,
            minVolume: tier.minVolume,
            maxVolume: tier.maxVolume,
            renderPrice: tier.renderPrice,
          });
        }
      }
    });

    res.json({ success: true, message: "Esquema actualizado correctamente" });
  } catch (error: any) {
    console.error("Error actualizando esquema:", error);
    res.status(500).json({ error: "Error interno al actualizar el esquema" });
  }
});

routesRouter.get("/driver/:driverName", async (req, res) => {
  let { driverName } = req.params;
  driverName = normalizeString(driverName);
  try {
    const driverRoutes = await db.query.routes.findMany({
      where: eq(routes.driverName, driverName),
      orderBy: (routes, { desc }) => [desc(routes.date)],
      limit: 12,
      with: {
        items: {
          with: { product: true },
        },
      },
    });
    res.json(driverRoutes);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener rutas del chofer" });
  }
});

routesRouter.post("/", async (req, res) => {
  let { driverName, observations, pricingSchemeId, items } = req.body;
  if (driverName) {
    driverName = normalizeString(driverName);
  } else {
    return res
      .status(400)
      .json({ error: "El nombre del chofer es obligatorio" });
  }

  try {
    const result = await db.transaction(async (tx) => {
      const [newRoute] = await tx
        .insert(routes)
        .values({
          driverName,
          observations,
          pricingSchemeId: pricingSchemeId || 1,
          status: "OPEN",
          stockStatus: "OPEN",
          date: getArgDate().toJSDate(),
        })
        .returning();

      if (items && Array.isArray(items) && items.length > 0) {
        for (const item of items) {
          const product = await tx.query.products.findFirst({
            where: eq(products.id, item.productId),
          });

          if (!product) continue;

          if (product.trackStock && product.stock < item.quantity) {
            throw new Error(`Stock insuficiente para: ${product.name}`);
          }

          if (product.trackStock) {
            await tx
              .update(products)
              .set({ stock: sql`${products.stock} - ${item.quantity}` })
              .where(eq(products.id, product.id));
          }

          await tx.insert(routeItems).values({
            routeId: newRoute.id,
            productId: item.productId,
            initialLoad: item.quantity,
            streetPriceSnapshot: product.price,
            returnedLoad: 0,
            soldCount: 0,
          });
        }
      }
      return newRoute;
    });

    res.status(201).json(result);
  } catch (error: any) {
    console.error("Error creating route:", error);
    res.status(400).json({ error: error.message || "Error al crear ruta" });
  }
});

routesRouter.put("/:id", async (req, res) => {
  const { id } = req.params;
  let { driverName, observations, date, status } = req.body;

  if (driverName) {
    driverName = normalizeString(driverName);
  }

  try {
    await db
      .update(routes)
      .set({
        driverName,
        observations,
        status,
        date: date ? getArgDate(date).toJSDate() : undefined,
      })
      .where(eq(routes.id, id));

    res.json({ success: true, message: "Ruta actualizada" });
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar la ruta" });
  }
});

routesRouter.put("/:id/items", async (req, res) => {
  const { id } = req.params;
  const { items } = req.body;

  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ error: "Formato inválido" });
  }

  try {
    await db.transaction(async (tx) => {
      const currentRouteItems = await tx.query.routeItems.findMany({
        where: eq(routeItems.routeId, id),
      });
      const currentItemsMap = new Map(
        currentRouteItems.map((i) => [i.productId, i]),
      );
      const incomingIds = new Set(items.map((i: any) => i.productId));

      for (const newItem of items) {
        const currentItem = currentItemsMap.get(newItem.productId);
        const product = await tx.query.products.findFirst({
          where: eq(products.id, newItem.productId),
        });

        if (!product) continue;

        if (currentItem) {
          const diff = newItem.quantity - currentItem.initialLoad;
          if (diff !== 0 && product.trackStock) {
            await tx
              .update(products)
              .set({ stock: sql`${products.stock} - ${diff}` })
              .where(eq(products.id, product.id));

            await tx
              .update(routeItems)
              .set({ initialLoad: newItem.quantity })
              .where(eq(routeItems.id, currentItem.id));
          }
        } else {
          if (product.trackStock && product.stock < newItem.quantity) {
            throw new Error(`Stock insuficiente: ${product.name}`);
          }
          if (product.trackStock) {
            await tx
              .update(products)
              .set({ stock: sql`${products.stock} - ${newItem.quantity}` })
              .where(eq(products.id, product.id));
          }
          await tx.insert(routeItems).values({
            routeId: id,
            productId: newItem.productId,
            initialLoad: newItem.quantity,
            streetPriceSnapshot: product.price,
            returnedLoad: 0,
          });
        }
      }

      for (const oldItem of currentRouteItems) {
        if (!incomingIds.has(oldItem.productId)) {
          if (oldItem.soldCount && oldItem.soldCount > 0) {
            throw new Error(
              `No se puede borrar ${oldItem.productId}, ya tiene ventas.`,
            );
          }
          const product = await tx.query.products.findFirst({
            where: eq(products.id, oldItem.productId),
          });
          if (product && product.trackStock) {
            await tx
              .update(products)
              .set({ stock: sql`${products.stock} + ${oldItem.initialLoad}` })
              .where(eq(products.id, product.id));
          }
          await tx.delete(routeItems).where(eq(routeItems.id, oldItem.id));
        }
      }
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

routesRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.transaction(async (tx) => {
      const salesCount = await tx
        .select({ count: count() })
        .from(sales)
        .where(eq(sales.routeId, id));
      if (salesCount[0].count > 0) throw new Error("Tiene ventas asociadas.");

      const items = await tx
        .select()
        .from(routeItems)
        .where(eq(routeItems.routeId, id));
      for (const item of items) {
        const product = await tx.query.products.findFirst({
          where: eq(products.id, item.productId),
        });
        if (product && product.trackStock) {
          await tx
            .update(products)
            .set({ stock: sql`${products.stock} + ${item.initialLoad}` })
            .where(eq(products.id, item.productId));
        }
      }
      await tx.delete(routeItems).where(eq(routeItems.routeId, id));
      await tx.delete(routes).where(eq(routes.id, id));
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

routesRouter.post("/:id/close-stock", async (req, res) => {
  const { id } = req.params;
  const { itemsReturn } = req.body;

  if (!itemsReturn)
    return res.status(400).json({ error: "Faltan datos de retorno" });

  try {
    await db.transaction(async (tx) => {
      for (const itemRet of itemsReturn) {
        await tx
          .update(routeItems)
          .set({ returnedLoad: itemRet.returnedQuantity })
          .where(
            and(
              eq(routeItems.routeId, id),
              eq(routeItems.productId, itemRet.productId),
            ),
          );

        const product = await tx.query.products.findFirst({
          where: eq(products.id, itemRet.productId),
        });
        if (product && product.trackStock) {
          await tx
            .update(products)
            .set({
              stock: sql`${products.stock} + ${itemRet.returnedQuantity}`,
            })
            .where(eq(products.id, itemRet.productId));
        }
      }

      await tx
        .update(routes)
        .set({
          stockStatus: "CLOSED",
          closedAt: getArgDate().toJSDate(),
        })
        .where(eq(routes.id, id));
    });

    res.json({ success: true, message: "Stock cerrado" });
  } catch (error: any) {
    res.status(500).json({ error: "Error al cerrar stock" });
  }
});

routesRouter.post("/settle/preview", async (req, res) => {
  let { driverName, date, breakdown } = req.body;

  if (!driverName || !date) {
    return res
      .status(400)
      .json({ error: "Faltan datos obligatorios (Conductor, Fecha)" });
  }

  driverName = normalizeString(driverName);

  try {
    const startDate = getArgDate(date).startOf("day").toJSDate();
    const endDate = getArgDate(date).endOf("day").toJSDate();

    const pendingRoutes = await db.query.routes.findMany({
      where: and(
        eq(routes.driverName, driverName),
        gte(routes.date, startDate),
        lte(routes.date, endDate),
      ),
      with: { items: { with: { product: true } } },
      orderBy: [asc(routes.closedAt)],
    });

    if (pendingRoutes.length === 0) {
      return res.status(404).json({
        error: `No hay registros de ${driverName} para la fecha ${date}`,
      });
    }

    const paymentStatus = pendingRoutes.every((r) => r.paymentStatus === "PAID")
      ? "PAID"
      : "PENDING";
    const stockStatus = pendingRoutes.every((r) => r.stockStatus === "CLOSED")
      ? "CLOSED"
      : "OPEN";

    const routesByScheme: Record<number, typeof pendingRoutes> = {};
    const schemeIds = new Set<number>();

    for (const route of pendingRoutes) {
      const sId = route.pricingSchemeId || 0;
      if (!routesByScheme[sId]) routesByScheme[sId] = [];
      routesByScheme[sId].push(route);
      if (sId !== 0) schemeIds.add(sId);
    }

    const schemesData = await db.query.routePricingSchemes.findMany({
      where: inArray(
        routePricingSchemes.id,
        Array.from(schemeIds).length > 0 ? Array.from(schemeIds) : [0],
      ),
      with: { tiers: { orderBy: [asc(routePricingTiers.minVolume)] } },
    });
    const schemesMap = new Map(schemesData.map((s) => [s.id, s]));

    const deductionPool: Record<
      number,
      Record<number, { BOLETA: number; TRANSFER: number; EXCHANGE: number }>
    > = {};

    if (breakdown && Array.isArray(breakdown)) {
      for (const item of breakdown) {
        const pId = Number(item.productId);
        const sId = Number(item.schemeId);

        if (!deductionPool[sId]) deductionPool[sId] = {};
        if (!deductionPool[sId][pId])
          deductionPool[sId][pId] = { BOLETA: 0, TRANSFER: 0, EXCHANGE: 0 };

        const type = item.type as "BOLETA" | "TRANSFER" | "EXCHANGE";
        deductionPool[sId][pId][type] += Number(item.quantity);
      }
    }

    let grandTotalCashRequired = 0;
    const schemesSummary = [];

    for (const [schemeIdStr, routesInScheme] of Object.entries(
      routesByScheme,
    )) {
      const schemeId = Number(schemeIdStr);
      const schemeDef = schemesMap.get(schemeId);

      const tiers = schemeDef?.tiers || [];
      const haveDiscount = schemeDef?.haveDiscount || false;
      const discountValue = schemeDef?.discount || 0;

      const summaryByProduct: Record<
        number,
        { name: string; totalSold: number; streetPrice: number }
      > = {};
      for (const route of routesInScheme) {
        for (const item of route.items) {
          const pId = item.productId;
          if (!summaryByProduct[pId]) {
            summaryByProduct[pId] = {
              name: item.product.name,
              totalSold: 0,
              streetPrice: item.streetPriceSnapshot || 0,
            };
          }
          summaryByProduct[pId].totalSold += Math.max(
            0,
            item.initialLoad - (item.returnedLoad || 0),
          );
        }
      }

      let schemeTotalDebt = 0;
      const itemsBreakdown = [];

      for (const [productIdStr, data] of Object.entries(summaryByProduct)) {
        const productId = Number(productIdStr);

        const pool = deductionPool[schemeId]?.[productId] || {
          BOLETA: 0,
          TRANSFER: 0,
          EXCHANGE: 0,
        };

        const qtyBoleta = Math.min(pool.BOLETA, data.totalSold);
        const qtyTransfer = Math.min(pool.TRANSFER, data.totalSold - qtyBoleta);
        const qtyExchange = Math.min(
          pool.EXCHANGE,
          data.totalSold - qtyBoleta - qtyTransfer,
        );

        const qtyCompensated = qtyBoleta + qtyTransfer;
        const cashUnits = Math.max(
          0,
          data.totalSold - qtyExchange - qtyCompensated,
        );
        const totalValidSales = Math.max(0, data.totalSold - qtyExchange);

        const productTiers = tiers.filter((t) => t.productId === productId);

        let productTotalDebt = 0;
        let bonusesApplied = 0;
        let voucherCompensation = 0;
        let basePrice = 0;

        if (productTiers.length === 0) {
          const prod = await db.query.products.findFirst({
            where: eq(products.id, productId),
          });
          basePrice = prod?.wholesalePrice || prod?.price || 0;
          productTotalDebt = cashUnits * basePrice;
        } else {
          basePrice = productTiers[0].renderPrice;
          let unitsToPrice = cashUnits;

          for (let i = 0; i < productTiers.length; i++) {
            const currentTier = productTiers[i];
            const nextTier = productTiers[i + 1];
            const tierCapacity = nextTier
              ? nextTier.minVolume - currentTier.minVolume
              : Infinity;

            const unitsInThisTier = Math.min(unitsToPrice, tierCapacity);

            if (unitsInThisTier > 0) {
              productTotalDebt += unitsInThisTier * currentTier.renderPrice;
              unitsToPrice -= unitsInThisTier;
            }
            if (unitsToPrice <= 0) break;
          }

          if (qtyCompensated > 0) {
            let remainingItems = qtyCompensated;
            let currentVolumeLevel = totalValidSales;
            const reversedTiers = [...productTiers].sort(
              (a, b) => b.minVolume - a.minVolume,
            );

            for (const tier of reversedTiers) {
              if (remainingItems <= 0) break;
              if (currentVolumeLevel < tier.minVolume) continue;

              const unitsInThisTierSpace =
                currentVolumeLevel - tier.minVolume + 1;
              const unitsToApply = Math.min(
                remainingItems,
                unitsInThisTierSpace,
              );
              const spread = basePrice - tier.renderPrice;

              if (unitsToApply > 0 && spread > 0) {
                const adjustment = unitsToApply * spread;
                productTotalDebt -= adjustment;
                bonusesApplied += adjustment;
              }

              remainingItems -= unitsToApply;
              currentVolumeLevel -= unitsToApply;
            }
          }
          bonusesApplied += basePrice * cashUnits - productTotalDebt;
        }

        if (qtyCompensated > 0 && haveDiscount) {
          voucherCompensation = qtyCompensated * discountValue;
          productTotalDebt -= voucherCompensation;
        }

        productTotalDebt = Math.round(productTotalDebt);
        schemeTotalDebt += Math.max(0, productTotalDebt);

        itemsBreakdown.push({
          productId,
          productName: data.name,
          totalSold: data.totalSold,
          deductions: {
            boleta: qtyBoleta,
            transfer: qtyTransfer,
            exchange: qtyExchange,
          },
          cashUnits,
          basePrice,
          bonuses: Math.round(bonusesApplied),
          voucherCompensation: Math.round(voucherCompensation),
          finalDebt: productTotalDebt,
        });
      }

      schemesSummary.push({
        schemeId,
        schemeName: schemeDef?.name || "Sin Esquema (Precio Base)",
        haveDiscount,
        discountValue,
        totalToPayForScheme: schemeTotalDebt,
        items: itemsBreakdown,
        routesIncluded: routesInScheme.map((r) => r.id),
      });

      grandTotalCashRequired += schemeTotalDebt;
    }

    const routeDetails = pendingRoutes.map((route) => ({
      id: route.id,
      closedAt: route.closedAt || route.date,
      items: route.items.map((item) => ({
        productName: item.product.name,
        initialLoad: item.initialLoad,
        returnedLoad: item.returnedLoad,
        soldCount: Math.max(0, item.initialLoad - (item.returnedLoad || 0)),
      })),
    }));

    return res.json({
      driverName,
      date,
      globalStatus: { paymentStatus, stockStatus },
      totalRoutes: pendingRoutes.length,
      totalToPay: grandTotalCashRequired,
      schemesBreakdown: schemesSummary,
      breakdownApplied: !!breakdown,
      routeDetails,
    });
  } catch (error: any) {
    console.error("Error preview:", error);
    res.status(500).json({
      error: error.message || "Error interno al calcular la rendición.",
    });
  }
});

routesRouter.post("/settle/confirm", async (req, res) => {
  let { driverName, date, breakdown, totalCashHanded } = req.body;

  driverName = normalizeString(driverName);

  try {
    await db.transaction(async (tx) => {
      const activeShift = await tx.query.cashShifts.findFirst({
        where: isNull(cashShifts.closedAt),
      });
      if (!activeShift) throw new Error("No hay caja abierta.");

      const startDate = getArgDate(date).startOf("day").toJSDate();
      const endDate = getArgDate(date).endOf("day").toJSDate();

      const pendingRoutes = await tx.query.routes.findMany({
        where: and(
          eq(routes.driverName, driverName),
          eq(routes.stockStatus, "CLOSED"),
          eq(routes.paymentStatus, "PENDING"),
          gte(routes.date, startDate),
          lte(routes.date, endDate),
        ),
        with: { items: { with: { product: true } } },
      });

      if (pendingRoutes.length === 0) throw new Error("No hay rutas.");

      if (breakdown && breakdown.length > 0) {
        for (const item of breakdown) {
          if (item.type === "EXCHANGE") continue;

          const sampleItem = pendingRoutes[0].items.find(
            (i) => i.productId === item.productId,
          );
          const unitPrice = sampleItem?.streetPriceSnapshot || 0;
          const totalValue = unitPrice * item.quantity;

          const paymentMethodId = item.type === "TRANSFER" ? 2 : 5;
          const paymentStatus = item.type === "TRANSFER" ? "PAID" : "UNPAID";
          const paidAmount = item.type === "TRANSFER" ? totalValue : 0;

          const [sale] = await tx
            .insert(sales)
            .values({
              ticketCode: generateTicketCode(),
              routeId: pendingRoutes[0].id,
              clientId: item.clientId,
              totalAmount: totalValue,
              paidAmount: paidAmount,
              paymentStatus: paymentStatus,
              paymentMethodId: paymentMethodId,
              shiftId: activeShift.id,
            })
            .returning();

          await tx.insert(saleItems).values({
            saleId: sale.id,
            productId: item.productId,
            quantity: item.quantity,
            price: unitPrice,
          });
        }
      }

      for (const route of pendingRoutes) {
        await tx
          .update(routes)
          .set({
            paymentStatus: "PAID",
            observations: `Rendido ${getArgDate().toFormat("HH:mm:ss")}`,
          })
          .where(eq(routes.id, route.id));
      }

      if (totalCashHanded > 0) {
        await tx.insert(cashMovements).values({
          shiftId: activeShift.id,
          type: "IN",
          amount: totalCashHanded,
          description: `Rendición: ${driverName}`,
        });
      }
    });
    res.json({ success: true });
  } catch (e: any) {
    console.error(e);
    res.status(400).json({ error: e.message });
  }
});

export default routesRouter;
