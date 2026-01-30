import { createBrowserRouter, RouterProvider } from "react-router";
import MainLayout from "./layout/MainLayout";
import AccountsReceivable from "./pages/accounts/AccountsReceivable";
import Dashboard from "./pages/dashboard/Dashboard";
import Inventory from "./pages/Inventory/Inventory";
import POS from "./pages/POS/POS";
import RoutesPage from "./pages/routes/Router";
import Settlements from "./pages/routes/Settlements";
import SalesHistory from "./pages/sales/SalesHistory";

export default function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      Component: MainLayout,
      children: [
        {
          index: true,
          Component: Dashboard,
        },
        {
          path: "pos",
          Component: POS,
        },
        {
          path: "inventory",
          Component: Inventory,
        },
        {
          path: "routes",
          Component: RoutesPage,
        },
        {
          path: "settlement",
          Component: Settlements,
        },
        {
          path: "accounts-receivable",
          Component: AccountsReceivable,
        },
        {
          path: "sales-history",
          Component: SalesHistory,
        },
      ],
    },
  ]);

  return <RouterProvider router={router}></RouterProvider>;
}
