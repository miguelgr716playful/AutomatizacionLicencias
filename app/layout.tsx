import type { Metadata, Viewport } from "next";
import "./globals.css";
import { RoleProvider } from "@/components/layout/role-provider";

export const metadata: Metadata = {
  title: "Automatización de Licencias",
  description:
    "Plataforma para aprovisionar, desaprovisionar y auditar licencias de software educativo.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <RoleProvider>{children}</RoleProvider>
      </body>
    </html>
  );
}
