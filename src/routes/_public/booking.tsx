import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/booking")({
  component: BookingPage,
});

function BookingPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold">Book an Appointment</h1>
    </section>
  );
}
