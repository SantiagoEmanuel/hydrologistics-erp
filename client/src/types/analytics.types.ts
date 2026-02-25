export interface KPI {
  value: number;
  trend: number;
  isPositive: boolean;
}

export interface AnalyticsResponse {
  kpi: {
    totalSales: KPI;
    totalRoutes: KPI;
    avgTicket: KPI;
  };
  chartData: { name: string; actual: number; anterior: number }[];
  topDrivers: {
    id: string;
    name: string;
    sales: number;
    routesCount: number;
    efficiency: number;
  }[];
}
