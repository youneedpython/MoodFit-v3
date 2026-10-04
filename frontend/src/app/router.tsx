import { createBrowserRouter, type RouteObject } from "react-router";
import { AppLayout } from "./AppLayout";
import { NotFoundPage } from "./NotFoundPage";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { CheckinPage } from "../features/checkin/CheckinPage";
import { HistoryPage } from "../features/history/HistoryPage";
import { AuthProvider } from "../features/auth/AuthProvider";
import { LoginPage } from "../features/auth/LoginPage";

/** DEC-011: `/` Dashboard, `/check-in` Daily Check-in, `/history` History */
export const routes: RouteObject[] = [
  {
    path: "/",
    element: <AuthProvider><AppLayout /></AuthProvider>,
    children: [
      { path: "login", element: <LoginPage /> },
      { index: true, element: <DashboardPage /> },
      { path: "check-in", element: <CheckinPage /> },
      { path: "history", element: <HistoryPage /> },
      { path: "*", element: <NotFoundPage /> }
    ]
  }
];

export function createAppRouter() {
  return createBrowserRouter(routes);
}
