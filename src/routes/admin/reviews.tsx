import { createFileRoute } from "@tanstack/react-router";

import ReviewsRoutePage from "../../features/reviews";

export const Route = createFileRoute("/admin/reviews")({
  component: ReviewsRoutePage,
});
