import { createBrowserRouter, type RouteObject } from "react-router";
import { AppLayout } from "./AppLayout";
import { NotFoundPage } from "./NotFoundPage";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { CheckinPage } from "../features/checkin/CheckinPage";
import { HistoryPage } from "../features/history/HistoryPage";

/** DEC-011: `/` Dashboard, `/check-in` Daily Check-in, `/history` History */
export const routes: RouteObject[] = [
  {
    path: "/",
    element: <AppLayout />,
    children: [
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
