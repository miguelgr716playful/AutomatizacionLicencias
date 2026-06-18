"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import {
  NAV_ITEMS,
  ROLE_LABELS,
  ROLE_INITIALS,
  ROLE_SECTIONS,
  type Role,
} from "@/lib/constants";
import { useRole } from "@/components/layout/role-provider";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { role, setRole } = useRole();

  const handleLogout = () => {
    router.push("/login");
  };

  return (
    <aside
      className="w-56 shrink-0 flex flex-col h-full text-white"
      style={{ backgroundColor: "#0B4D3C" }}
    >
      <div className="px-5 py-5 border-b border-white/10">
        <Image
          src="/tecmilenio.png"
          alt="Tecmilenio"
          width={160}
          height={32}
          className="h-8 w-auto object-contain"
          priority
        />
      </div>

      <div className="px-3 pt-4 pb-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40 px-2 mb-2">
          Rol Activo
        </p>
        <div className="space-y-0.5">
          {(["admin", "ejecutor", "auditor"] as Role[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition-colors"
              style={role === r ? { backgroundColor: "#00B364" } : {}}
              onMouseEnter={(e) => {
                if (role !== r)
                  (e.currentTarget as HTMLElement).style.backgroundColor =
                    "#167156";
              }}
              onMouseLeave={(e) => {
                if (role !== r)
                  (e.currentTarget as HTMLElement).style.backgroundColor = "";
              }}
            >
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${role === r ? "bg-white" : "bg-white/30"}`}
              />
              <span
                className={
                  role === r ? "text-white font-medium" : "text-white/60"
                }
              >
                {ROLE_LABELS[r]}
              </span>
            </button>
          ))}
        </div>
      </div>

      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto border-t border-white/10 mt-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40 px-2 mb-2">
          Navegación
        </p>
        {NAV_ITEMS.filter((item) =>
          ROLE_SECTIONS[role].includes(item.id)
        ).map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.id}
              href={item.href}
              style={active ? { backgroundColor: "#00B364" } : {}}
              onMouseEnter={(e) => {
                if (!active)
                  (e.currentTarget as HTMLElement).style.backgroundColor =
                    "#167156";
              }}
              onMouseLeave={(e) => {
                if (!active)
                  (e.currentTarget as HTMLElement).style.backgroundColor = "";
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active ? "text-white font-medium" : "text-white/60 hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {active && <span className="text-white/60 text-xs">›</span>}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-white/10 space-y-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ backgroundColor: "#167156" }}
          >
            {ROLE_INITIALS[role]}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-white leading-tight">
              {ROLE_LABELS[role]}
            </p>
            <p className="text-xs text-white/40 truncate">uni.edu.mx</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors border border-white/15"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
