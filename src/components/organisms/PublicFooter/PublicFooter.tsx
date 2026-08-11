import { Link } from "@tanstack/react-router";

import { useTranslation } from "../../../i18n";

export default function PublicFooter() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-base-300 bg-base-100">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <h2 className="mb-3 text-xl font-bold">AutoCare</h2>

          <p className="max-w-sm text-sm text-base-content/60">
            {t.public.footer.description}
          </p>
        </div>

        <div>
          <h3 className="mb-3 font-semibold">
            {t.public.footer.links}
          </h3>

          <div className="flex flex-col gap-2 text-sm">
            <Link to="/" className="link-hover link">
              {t.public.nav.home}
            </Link>

            <Link to="/services" className="link-hover link">
              {t.public.nav.services}
            </Link>

            <Link to="/about" className="link-hover link">
              {t.public.nav.about}
            </Link>

            <Link to="/contact" className="link-hover link">
              {t.public.nav.contact}
            </Link>
          </div>
        </div>

        <div>
          <h3 className="mb-3 font-semibold">
            {t.public.footer.contact}
          </h3>

          <div className="space-y-2 text-sm text-base-content/60">
            <p>📍 Berlin, Deutschland</p>
            <p>📞 +49 30 12345678</p>
            <p>✉️ info@autocare.de</p>
          </div>
        </div>
      </div>

      <div className="border-t border-base-300 py-5 text-center text-sm text-base-content/50">
        © {new Date().getFullYear()} AutoCare.{" "}
        {t.public.footer.rights}
      </div>
    </footer>
  );
}
