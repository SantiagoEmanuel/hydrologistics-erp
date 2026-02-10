import { api } from "@/lib/api-client";
import {
  ArrowRight,
  Calendar,
  DollarSign,
  Package,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
};

export default function AdminDashboard() {
  const [period, setPeriod] = useState<"week" | "month">("week");
  const [loading, setLoading] = useState(true);

  const [data, setData] = useState<any>({
    kpi: {
      totalSales: { value: 0, trend: 0, isPositive: true },
      totalRoutes: { value: 0, trend: 0, isPositive: true },
      avgTicket: { value: 0, trend: 0, isPositive: true },
    },
    chartData: [],
    topDrivers: [],
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const response = await api("/analytics");
        setData(response);
      } catch (error) {
        console.error("Error cargando dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [period]);

  return (
    <div className="flex min-h-screen flex-col gap-6 bg-gray-50 p-6">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Panel Administrativo
          </h1>
          <p className="text-sm text-gray-500">
            Rendimiento en tiempo real (Base: Stock entregado)
          </p>
        </div>

        <div className="flex rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
          <button
            onClick={() => setPeriod("week")}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
              period === "week"
                ? "bg-blue-50 text-blue-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Esta Semana
          </button>
          <button
            onClick={() => setPeriod("month")}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
              period === "month"
                ? "bg-blue-50 text-blue-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Este Mes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <QuickActionCard
          to="/dashboard/admin/dashboard/users"
          icon={<Users className="h-5 w-5 text-purple-600" />}
          title="Gestión de Usuarios"
          desc="Crear y editar empleados"
          color="bg-purple-50 hover:bg-purple-100"
        />
        <QuickActionCard
          to="/dashboard/admin/dashboard/inventory"
          icon={<Package className="h-5 w-5 text-blue-600" />}
          title="Catálogo de Productos"
          desc="Precios y stock"
          color="bg-blue-50 hover:bg-blue-100"
        />
        <QuickActionCard
          to="/dashboard/admin/clients"
          icon={<ShoppingCart className="h-5 w-5 text-green-600" />}
          title="Base de Clientes"
          desc="Administrar cartera"
          color="bg-green-50 hover:bg-green-100"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Ventas de la Semana"
          value={formatCurrency(data.kpi.totalSales.value)}
          trend={`${data.kpi.totalSales.trend.toFixed(1)}%`}
          isPositive={data.kpi.totalSales.isPositive}
          icon={<DollarSign />}
        />
        <StatCard
          title="Rutas Realizadas"
          value={data.kpi.totalRoutes.value}
          trend={`${data.kpi.totalRoutes.trend.toFixed(1)}%`}
          isPositive={data.kpi.totalRoutes.isPositive}
          icon={<Truck />}
        />
        <StatCard
          title="Ticket Promedio / Ruta"
          value={formatCurrency(data.kpi.avgTicket.value)}
          trend={`${data.kpi.avgTicket.trend.toFixed(1)}%`}
          isPositive={data.kpi.avgTicket.isPositive}
          icon={<TrendingUp />}
        />
        <StatCard
          title="Deuda Clientes"
          value="$ --"
          trend="N/A"
          isPositive={true}
          icon={<Calendar />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-800">
              Comparativa de Ventas Diaria
            </h3>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-blue-600"></span>
                <span className="text-gray-600">Semana Actual</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-gray-200"></span>
                <span className="text-gray-400">Semana Anterior</span>
              </div>
            </div>
          </div>

          <div className="h-80 w-full">
            {loading ? (
              <div className="flex h-full w-full items-center justify-center text-gray-400">
                Cargando gráfico...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f3f4f6"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#6B7280", fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#6B7280", fontSize: 12 }}
                    tickFormatter={(val) => `$${val / 1000}k`}
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      formatCurrency(value),
                      "Venta",
                    ]}
                    cursor={{ fill: "#F9FAFB" }}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Bar
                    dataKey="actual"
                    name="Actual"
                    fill="#2563EB"
                    radius={[4, 4, 0, 0]}
                    barSize={32}
                  />
                  <Bar
                    dataKey="anterior"
                    name="Anterior"
                    fill="#E5E7EB"
                    radius={[4, 4, 0, 0]}
                    barSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="flex flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-gray-800">
            Top Choferes (30 días)
          </h3>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-semibold tracking-wider text-gray-500 uppercase">
                  <th className="pb-3 pl-2">Cadete</th>
                  <th className="pb-3 text-right">Total</th>
                  <th className="pr-2 pb-3 text-right">Efic.</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {data.topDrivers.map((driver: any) => (
                  <tr
                    key={driver.id || Math.random()}
                    className="group transition-colors hover:bg-gray-50"
                  >
                    <td className="border-b border-gray-50 py-3 pl-2">
                      <div className="font-medium text-gray-900">
                        {driver.name || "Sin Asignar"}
                      </div>
                      <div className="text-xs text-gray-400">
                        {driver.routesCount} rutas
                      </div>
                    </td>
                    <td className="border-b border-gray-50 py-3 text-right font-medium text-gray-700">
                      {formatCurrency(driver.sales)}
                    </td>
                    <td className="border-b border-gray-50 py-3 pr-2 text-right">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-bold ${
                          driver.efficiency > 5000
                            ? "bg-green-100 text-green-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {formatCurrency(driver.efficiency)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="mt-4 w-full rounded-lg bg-gray-50 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100">
            Ver detalle completo
          </button>
        </div>
      </div>
    </div>
  );
}

function QuickActionCard({ to, icon, title, desc, color }: any) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-4 rounded-xl border border-transparent p-4 transition-all hover:shadow-md ${color} bg-opacity-50 bg-white`}
    >
      <div className={`rounded-lg bg-white p-3 shadow-sm`}>{icon}</div>
      <div>
        <h3 className="font-bold text-gray-800">{title}</h3>
        <p className="text-xs text-gray-500">{desc}</p>
      </div>
      <ArrowRight className="ml-auto h-4 w-4 text-gray-400" />
    </Link>
  );
}

function StatCard({ title, value, trend, isPositive, icon }: any) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-2 flex items-start justify-between">
        <div className="rounded-lg bg-gray-50 p-2 text-gray-600">{icon}</div>
        {trend !== "N/A" && (
          <div
            className={`flex items-center rounded-full px-2 py-1 text-xs font-bold ${
              isPositive
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {isPositive ? (
              <TrendingUp className="mr-1 h-3 w-3" />
            ) : (
              <TrendingDown className="mr-1 h-3 w-3" />
            )}
            {trend}
          </div>
        )}
      </div>
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className="mt-1 text-2xl font-black text-gray-800">{value}</p>
    </div>
  );
}
