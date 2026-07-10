import type { MainLayoutProps } from "./MainLayout.types";

import Navbar from "../../organisms/Navbar";
import Sidebar from "../../organisms/Sidebar";

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-6 lg:ml-0">{children}</main>
      </div>
    </div>
  );
}
