import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = {
    id: String(session.user.id ?? ""),
    name: session.user.name,
    email: session.user.email,
    roles: (session.user.roles as string[]) ?? [],
  };

  return (
    <div className="min-h-screen">
      <Sidebar user={user} />
      <div className="lg:pl-64">
        <Topbar user={user} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
