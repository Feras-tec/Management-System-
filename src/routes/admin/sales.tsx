import { createFileRoute } from "@tanstack/react-router";

import { SalesPage } from "../../features/sales";

export const Route = createFileRoute("/admin/sales")({
  component: SalesPage,
});
