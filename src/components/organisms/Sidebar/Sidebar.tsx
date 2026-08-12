import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { House } from "lucide-react";

import { useTranslation } from "../../../i18n";

import type { SidebarItem } from "./Sidebar.types";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  const { t } = useTranslation();

  const items = useMemo<SidebarItem[]>(
    () => [
      { label: t.common.dashboard, to: "/admin" },
      { label: t.common.bookings, to: "/admin/bookings" },
      { label: t.common.employees, to: "/admin/employees" },
      { label: t.common.products, to: "/admin/products" },
      { label: t.common.customers, to: "/admin/customers" },
      { label: t.common.sales, to: "/admin/sales" },
      { label: t.common.reports, to: "/admin/reports" },
      { label: t.common.settings, to: "/admin/settings" },
    ],
    [t.common],
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        aria-label="Open admin navigation"
        className="btn btn-primary btn-sm fixed right-3 top-[4.5rem] z-50 lg:hidden"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        ☰
      </button>

      {/* Background Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`
          fixed left-0 top-16 z-40
          h-[calc(100vh-4rem)] w-56 sm:w-60 lg:w-64
          bg-base-100 border-r border-base-300 shadow-xl
          transition-transform duration-300
          lg:static lg:h-auto lg:min-h-[calc(100vh-4rem)]
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="flex h-full flex-col p-4 sm:p-5 lg:p-6">
          <h2 className="mb-5 text-xl font-bold text-primary sm:mb-8 sm:text-2xl">
            Business MS
          </h2>

          <nav className="menu flex-1 gap-1 sm:gap-2">
            {items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="btn btn-ghost justify-start"
                activeProps={{
                  className: "btn btn-primary justify-start",
                }}
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="divider" />

          <Link
            to="/"
            className="btn btn-outline w-full justify-start"
            onClick={() => setIsOpen(false)}
          >
            <House className="size-4" aria-hidden="true" />
            {t.common.goToWebsite}
          </Link>
        </div>
      </aside>
    </>
  );
}
