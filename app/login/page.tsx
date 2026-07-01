import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Iniciar sesión | Automatización de Licencias",
};

export default function LoginPage() {
  return (
    <div className="relative min-h-[100dvh] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/tecMilenioFondo.jpeg')" }}
        aria-hidden
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(11, 77, 60, 0.55), rgba(11, 77, 60, 0.75))",
        }}
        aria-hidden
      />
      <LoginForm />
    </div>
  );
}
