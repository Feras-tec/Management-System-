import { createFileRoute, Outlet } from "@tanstack/react-router";

import PublicLayout from "../components/templates/PublicLayout";

export const Route = createFileRoute("/_public")({
  component: PublicLayoutRoute,
});

function PublicLayoutRoute() {
  return (
    <PublicLayout>
      <Outlet />
    </PublicLayout>
  );
}
