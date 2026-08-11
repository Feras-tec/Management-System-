import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/")({
  component: PublicHomePage,
});

function PublicHomePage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="max-w-3xl">
        <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-primary">
          AutoCare
        </p>

        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
          Professional Car Service You Can Trust
        </h1>

        <p className="mt-6 text-lg text-base-content/70">
          Reliable vehicle maintenance and professional automotive services
          for your car.
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          <a
            href="/booking"
            className="btn btn-primary rounded-xl"
          >
            Book an Appointment
          </a>

          <a
            href="/services"
            className="btn btn-outline rounded-xl"
          >
            Our Services
          </a>
        </div>
      </div>
    </section>
  );
}
