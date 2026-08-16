import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { Building2 } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-slate-950 p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(14,165,233,0.25),transparent_60%)]" />
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
            <Building2 className="h-8 w-8" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-white">RESPAK ERP</h1>
            <p className="mt-1 text-sm text-slate-400">
              Construction Management System — Sign in to continue
            </p>
          </div>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
        <p className="mt-6 text-center text-xs text-slate-500">
          Secure access controlled by role-based permissions.
        </p>
      </div>
    </div>
  );
}
