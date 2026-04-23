import { getAuthSession } from "../../lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Mail, LayoutDashboard, History } from "lucide-react";
import { SignOutButton } from "../../components/SignOutButton";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getAuthSession();
  if (!session) redirect("/auth/signin");

  return (
    <div className="flex h-full min-h-screen">
      <aside className="w-56 border-r bg-card flex flex-col shrink-0">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2 font-semibold">
            <Mail className="w-5 h-5" />
            <span className="text-sm">Inbox Declutter</span>
          </div>
        </div>

        <nav className="flex-1 p-2 space-y-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>
          <Link
            href="/dashboard/history"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors"
          >
            <History className="w-4 h-4" />
            History
          </Link>
        </nav>

        <div className="p-2 border-t space-y-1">
          <div className="px-3 py-2 text-xs text-muted-foreground truncate">
            {session.email}
          </div>
          <SignOutButton />
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
