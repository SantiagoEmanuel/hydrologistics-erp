import { endOfWeek, getDay, startOfWeek, subDays, subWeeks } from "date-fns";
import { and, desc, eq, gte, isNotNull, isNull, lte, sql } from "drizzle-orm";
import { Router } from "express";
import { db } from "../db";
import { routeItems, routes, sales } from "../db/schema";
import { getArgDate } from "../utils/date";

const analyticsRouter = Router();

analyticsRouter.get("/", async (req, res) => {
  try {
    const now = getArgDate().toJSDate();

    const currentStart = startOfWeek(now, { weekStartsOn: 1 });
    const currentEnd = endOfWeek(now, { weekStartsOn: 1 });
    const previousStart = subWeeks(currentStart, 1);
    const previousEnd = subWeeks(currentEnd, 1);

    const getSalesData = async (start: Date, end: Date) => {
      return await db
        .select({
          id: sales.id,
          date: sales.createdAt,
          total: sales.totalAmount,
        })
        .from(sales)
        .where(
          and(
            gte(sales.createdAt, start),
            lte(sales.createdAt, end),
            isNull(sales.routeId),
          ),
        );
    };

    const [currentLocalSales, previousLocalSales] = await Promise.all([
      getSalesData(currentStart, currentEnd),
      getSalesData(previousStart, previousEnd),
    ]);

    const currentTotalRevenue = currentLocalSales.reduce(
      (acc, curr) => acc + Number(curr.total),
      0,
    );
    const previousTotalRevenue = previousLocalSales.reduce(
      (acc, curr) => acc + Number(curr.total),
      0,
    );

    const currentSalesCount = currentLocalSales.length;
    const previousSalesCount = previousLocalSales.length;

    const currentAvgTicket =
      currentSalesCount > 0 ? currentTotalRevenue / currentSalesCount : 0;
    const previousAvgTicket =
      previousSalesCount > 0 ? previousTotalRevenue / previousSalesCount : 0;

    const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
    const chartMap = new Map(
      days.map((day) => [day, { name: day, actual: 0, anterior: 0 }]),
    );

    const processForChart = (data: any[], key: "actual" | "anterior") => {
      data.forEach((item) => {
        if (!item.date) return;
        let dayIndex = getDay(new Date(item.date)) - 1;
        if (dayIndex === -1) dayIndex = 6;
        const dayName = days[dayIndex];
        const entry = chartMap.get(dayName)!;
        entry[key] += Number(item.total);
      });
    };

    processForChart(currentLocalSales, "actual");
    processForChart(previousLocalSales, "anterior");

    const driversPerformance = await db
      .select({
        id: routes.driverName,
        name: routes.driverName,
        sales:
          sql<number>`SUM(${routeItems.soldCount} * ${routeItems.streetPriceSnapshot})`.mapWith(
            Number,
          ),
        routesCount: sql<number>`COUNT(DISTINCT ${routes.id})`.mapWith(Number),
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

    const calculateTrend = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return ((curr - prev) / prev) * 100;
    };

    res.json({
      kpi: {
        totalSales: {
          value: currentTotalRevenue,
          trend: calculateTrend(currentTotalRevenue, previousTotalRevenue),
          isPositive: currentTotalRevenue >= previousTotalRevenue,
        },
        salesCount: {
          value: currentSalesCount,
          trend: calculateTrend(currentSalesCount, previousSalesCount),
          isPositive: currentSalesCount >= previousSalesCount,
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
