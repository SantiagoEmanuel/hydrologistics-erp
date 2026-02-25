import {
  HandCoins,
  History,
  LayoutDashboard,
  LogIn,
  NotebookText,
  ShieldCheck,
  ShoppingCart,
  Truck,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  name: string;
  url: string;
  "aria-label"?: string;
  title?: string;
  type: "private" | "public";
  permissions?: string[];
  icon: LucideIcon;
}

export const navigationLinks: NavItem[] = [
  {
    name: "Panel General",
    url: "/dashboard",
    "aria-label": "Ir al Dashboard",
    title: "Dashboard",
    type: "private",
    permissions: ["ADMIN", "MANAGER", "EMPLOYEE"],
    icon: LayoutDashboard,
  },
  {
    name: "Ventas",
    url: "/dashboard/pos",
    "aria-label": "Ir al Punto de Venta",
    title: "Punto de Venta",
    permissions: ["ADMIN", "MANAGER", "EMPLOYEE"],
    type: "private",
    icon: ShoppingCart,
  },
  {
    name: "Cadetes",
    url: "/dashboard/routes",
    "aria-label": "Gestión de Rutas",
    title: "Gestión de Rutas",
    type: "private",
    permissions: ["ADMIN", "DRIVER", "MANAGER"],
    icon: Truck,
  },
  {
    name: "Rendiciones",
    url: "/dashboard/settlement",
    "aria-label": "Ir a Rendiciones",
    title: "Rendiciones de Choferes",
    type: "private",
    permissions: ["ADMIN", "DRIVER", "MANAGER"],
    icon: HandCoins,
  },
  {
    name: "Cuentas Corrientes",
    url: "/dashboard/accounts-receivable",
    "aria-label": "Ir a Deudores",
    title: "Gestión de Cuentas por Cobrar",
    type: "private",
    permissions: ["ADMIN", "MANAGER"],
    icon: NotebookText,
  },
  {
    name: "Historial",
    url: "/dashboard/sales-history",
    "aria-label": "Ver historial de ventas",
    title: "Historial de ventas",
    type: "private",
    permissions: ["ADMIN", "MANAGER"],
    icon: History,
  },
  {
    name: "Administración",
    url: "/dashboard/admin/dashboard",
    title: "Panel administrativo",
    "aria-label": "Panel de administrador",
    type: "private",
    permissions: ["ADMIN"],
    icon: ShieldCheck,
  },
  {
    name: "Inicia sesión",
    url: "/auth/login",
    type: "public",
    icon: LogIn,
  },
];
