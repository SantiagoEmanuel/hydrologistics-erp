import { endOfWeek, getDay, startOfWeek, subDays, subWeeks } from "date-fns";
import { and, desc, eq, gte, isNotNull, lte, sql } from "drizzle-orm";
import { Router } from "express";
import { db } from "../db";
import { routeItems, routes } from "../db/schema";

const analyticsRouter = Router();

analyticsRouter.get("/", async (req, res) => {
  try {
    const now = new Date();

    const currentStart = startOfWeek(now, { weekStartsOn: 1 });
    const currentEnd = endOfWeek(now, { weekStartsOn: 1 });

    const previousStart = subWeeks(currentStart, 1);
    const previousEnd = subWeeks(currentEnd, 1);

    const getPeriodData = async (start: Date, end: Date) => {
      return await db
        .select({
          routeId: routes.id,
          date: routes.date,

          revenue: sql<number>`
            COALESCE(${routeItems.soldCount} * ${routeItems.streetPriceSnapshot}, 0)
          `.mapWith(Number),
        })
        .from(routes)
        .innerJoin(routeItems, eq(routes.id, routeItems.routeId))
        .where(and(gte(routes.date, start), lte(routes.date, end)));
    };

    const [currentData, previousData] = await Promise.all([
      getPeriodData(currentStart, currentEnd),
      getPeriodData(previousStart, previousEnd),
    ]);

    const calculateTotal = (data: any[]) =>
      data.reduce((acc, curr) => acc + curr.revenue, 0);

    const countRoutes = (data: any[]) =>
      new Set(data.map((d) => d.routeId)).size;

    const currentSales = calculateTotal(currentData);
    const previousSales = calculateTotal(previousData);

    const currentRoutesCount = countRoutes(currentData);
    const previousRoutesCount = countRoutes(previousData);

    const currentAvgTicket =
      currentRoutesCount > 0 ? currentSales / currentRoutesCount : 0;
    const previousAvgTicket =
      previousRoutesCount > 0 ? previousSales / previousRoutesCount : 0;

    const calculateTrend = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return ((curr - prev) / prev) * 100;
    };

    const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
    const chartMap = new Map(
      days.map((day) => [day, { name: day, actual: 0, anterior: 0 }]),
    );

    currentData.forEach((item) => {
      if (!item.date) return;

      let dayIndex = getDay(item.date) - 1;
      if (dayIndex === -1) dayIndex = 6;

      const dayName = days[dayIndex];
      const entry = chartMap.get(dayName)!;
      entry.actual += item.revenue;
    });

    previousData.forEach((item) => {
      if (!item.date) return;
      let dayIndex = getDay(item.date) - 1;
      if (dayIndex === -1) dayIndex = 6;

      const dayName = days[dayIndex];
      const entry = chartMap.get(dayName)!;
      entry.anterior += item.revenue;
    });

    const driversPerformance = await db
      .select({
        id: routes.driverName,
        name: routes.driverName,
        sales:
          sql<number>`SUM(${routeItems.soldCount} * ${routeItems.streetPriceSnapshot})`.mapWith(
            Number,
          ),
        routesCount: sql<number>`count(distinct ${routes.id})`.mapWith(Number),
      })
      .from(routes)
      .innerJoin(routeItems, eq(routes.id, routeItems.routeId))
      .where(
        and(isNotNull(routes.driverName), gte(routes.date, subDays(now, 30))),
      )
      .groupBy(routes.driverName)
      .orderBy(
        desc(
          sql`SUM(${routeItems.soldCount} * ${routeItems.streetPriceSnapshot})`,
        ),
      );

    res.json({
      kpi: {
        totalSales: {
          value: currentSales,
          trend: calculateTrend(currentSales, previousSales),
          isPositive: currentSales >= previousSales,
        },
        totalRoutes: {
          value: currentRoutesCount,
          trend: calculateTrend(currentRoutesCount, previousRoutesCount),
          isPositive: currentRoutesCount >= previousRoutesCount,
        },
        avgTicket: {
          value: currentAvgTicket,
          trend: calculateTrend(currentAvgTicket, previousAvgTicket),
          isPositive: currentAvgTicket >= previousAvgTicket,
        },
      },
      chartData: Array.from(chartMap.values()),
      topDrivers: driversPerformance.map((d) => ({
        ...d,
        efficiency: Math.round(d.sales / (d.routesCount || 1)),
      })),
    });
  } catch (error) {
    console.error("Error analytics:", error);
    res.status(500).json({ error: "Error interno en analíticas" });
  }
});

export default analyticsRouter;
