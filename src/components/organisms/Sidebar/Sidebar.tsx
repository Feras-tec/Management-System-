import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";

import { useAppPreferences } from "../../../context/AppPreferencesContext";

import type { SidebarItem } from "./Sidebar.types";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  const { theme, toggleTheme } = useAppPreferences();

  const items = useMemo<SidebarItem[]>(
    () => [
      { label: "Dashboard", to: "/admin" },
      { label: "Employees", to: "/admin/employees" },
      { label: "Products", to: "/admin/products" },
      { label: "Customers", to: "/admin/customers" },
      { label: "Sales", to: "/admin/sales" },
      { label: "Reports", to: "/admin/reports" },
      { label: "Settings", to: "/admin/settings" },
    ],
    [],
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="btn btn-primary fixed left-4 top-20 z-50 lg:hidden"
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
          fixed left-0 top-0 z-40
          h-screen w-64
          bg-base-100 border-r border-base-300 shadow-xl
          transition-transform duration-300
          lg:static
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="flex h-full flex-col p-6">
          <h2 className="mb-8 text-2xl font-bold text-primary">Business MS</h2>

          <nav className="menu flex-1 gap-2">
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

          <button className="btn btn-outline w-full" onClick={toggleTheme}>
            {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
          </button>
        </div>
      </aside>
    </>
  );
}
