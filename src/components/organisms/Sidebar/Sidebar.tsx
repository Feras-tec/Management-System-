import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";

import type { SidebarItem } from "./Sidebar.types";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  const items = useMemo<SidebarItem[]>(
    () => [
      { label: "Dashboard", to: "/" },
      { label: "Employees", to: "/employees" },
      { label: "Products", to: "/products" },
      { label: "Customers", to: "/customers" },
      { label: "Sales", to: "/sales" },
      { label: "Reports", to: "/reports" },
      { label: "Settings", to: "/settings" },
    ],
    [],
  );

  return (
    <>
      <button
        className="btn btn-primary m-4 lg:hidden"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        ☰
      </button>

      <aside
        className={`
          bg-base-100 border-r border-base-300 shadow-md
          fixed lg:static
          top-0 left-0
          h-screen
          w-64
          transition-transform duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="p-6">
          <h2 className="text-xl font-bold text-primary mb-6">Business MS</h2>

          <nav className="menu gap-2">
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
        </div>
      </aside>
    </>
  );
}
