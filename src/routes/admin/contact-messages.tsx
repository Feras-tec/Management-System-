import { createFileRoute } from "@tanstack/react-router";
import ContactMessagesRoutePage from "../../features/contact/ContactMessagesPage";

export const Route = createFileRoute("/admin/contact-messages")({
  component: ContactMessagesRoutePage,
});
