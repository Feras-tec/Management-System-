import { createFileRoute, Outlet } from "@tanstack/react-router";

import MainLayout from "../components/templates/MainLayout";
import { requireAuthentication } from "../auth/auth";

export const Route = createFileRoute("/admin")({
  beforeLoad: ({ context, location }) => {
    requireAuthentication(context.auth, location.href);
  },
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
}
