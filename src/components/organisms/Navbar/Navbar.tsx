import { Link } from "@tanstack/react-router";

import type { NavItem } from "./Navbar.types";

const navItems: NavItem[] = [
  { label: "Dashboard", to: "/" },
  { label: "Employees", to: "/employees" },
  { label: "Products", to: "/products" },
  { label: "Customers", to: "/customers" },
  { label: "Sales", to: "/sales" },
  { label: "Reports", to: "/reports" },
];

export default function Navbar() {
  return (
    <div className="navbar bg-base-100 border-b border-base-300 px-6 shadow-sm">
      <div className="flex-1">
        <Link to="/" className="text-xl font-bold text-primary">
          BMS
        </Link>
      </div>

      <div className="hidden gap-2 lg:flex">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="btn btn-ghost"
            activeProps={{
              className: "btn btn-primary",
            }}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
