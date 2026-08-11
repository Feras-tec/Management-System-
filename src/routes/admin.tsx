import { createFileRoute, Outlet } from "@tanstack/react-router";

import MainLayout from "../components/templates/MainLayout";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
}
