"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Role } from "@/lib/constants";
import {
  getDefaultHrefForRole,
  isSectionAllowedForRole,
} from "@/lib/constants";

interface RoleContextValue {
  role: Role;
  setRole: (role: Role) => void;
}

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>("admin");
  const router = useRouter();
  const pathname = usePathname();

  const setRole = useCallback(
    (nextRole: Role) => {
      setRoleState(nextRole);
      if (!isSectionAllowedForRole(pathname, nextRole)) {
        router.push(getDefaultHrefForRole(nextRole));
      }
    },
    [pathname, router]
  );

  const value = useMemo(() => ({ role, setRole }), [role, setRole]);

  return (
    <RoleContext.Provider value={value}>{children}</RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useRole debe usarse dentro de RoleProvider");
  }
  return context;
}
