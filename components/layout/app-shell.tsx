import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 font-sans">
      <Sidebar />
      <main
        className="flex-1 overflow-y-auto"
        style={{ backgroundColor: "#F5F5F5" }}
      >
        <div className="px-6 py-6">{children}</div>
      </main>
    </div>
  );
}
