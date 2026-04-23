import { getAuthSession } from "../../lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SignOutButton } from "../../components/SignOutButton";
import { LayoutDashboard, History, Mail } from "lucide-react";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getAuthSession();
  if (!session) redirect("/auth/signin");

  const initial = session.email[0]?.toUpperCase() ?? "U";
  const emailName = session.email.split("@")[0];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-white flex flex-col shrink-0 border-r border-border">
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Mail className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-sm text-foreground">Inbox Declutter</span>
          </div>
          <button className="text-muted-foreground hover:text-foreground">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="p-3 space-y-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium bg-primary/10 text-primary transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>
          <Link
            href="/dashboard/history"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <History className="w-4 h-4" />
            History
          </Link>
        </nav>

        {/* Illustration */}
        <div className="flex-1 flex items-center justify-center px-4 py-6">
          <div className="relative w-36 h-36">
            {/* Background circle */}
            <div className="absolute inset-0 rounded-full bg-primary/8" />
            {/* Center envelope */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                <rect x="4" y="12" width="48" height="36" rx="4" fill="#EDE9FE" stroke="#7C3AED" strokeWidth="1.5"/>
                <path d="M4 16l24 16 24-16" stroke="#7C3AED" strokeWidth="1.5" fill="none"/>
              </svg>
            </div>
            {/* Floating small envelopes */}
            <div className="absolute top-2 right-4 opacity-60">
              <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
                <rect x="1" y="1" width="20" height="14" rx="2" fill="#C4B5FD" stroke="#8B5CF6" strokeWidth="1"/>
                <path d="M1 4l10 7 10-7" stroke="#8B5CF6" strokeWidth="1" fill="none"/>
              </svg>
            </div>
            <div className="absolute bottom-4 left-2 opacity-50">
              <svg width="18" height="13" viewBox="0 0 18 13" fill="none">
                <rect x="1" y="1" width="16" height="11" rx="2" fill="#DDD6FE" stroke="#A78BFA" strokeWidth="1"/>
                <path d="M1 3.5l8 5.5 8-5.5" stroke="#A78BFA" strokeWidth="1" fill="none"/>
              </svg>
            </div>
            <div className="absolute top-6 left-1 opacity-40">
              <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                <rect x="1" y="1" width="12" height="8" rx="1.5" fill="#EDE9FE" stroke="#C4B5FD" strokeWidth="1"/>
                <path d="M1 3l6 4 6-4" stroke="#C4B5FD" strokeWidth="1" fill="none"/>
              </svg>
            </div>
            {/* Sparkle dots */}
            <div className="absolute top-1 left-6 w-1.5 h-1.5 rounded-full bg-primary/40" />
            <div className="absolute bottom-6 right-2 w-1 h-1 rounded-full bg-violet-400/60" />
            <div className="absolute top-8 right-1 w-1 h-1 rounded-full bg-primary/30" />
          </div>
        </div>

        {/* Pro Tip */}
        <div className="mx-3 mb-3 p-3 rounded-xl bg-primary/8">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <span className="text-xs font-semibold text-primary">Pro Tip</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Regular scans keep your inbox clean and stress-free.
          </p>
        </div>

        {/* User */}
        <div className="px-3 pb-3 border-t border-border pt-3">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-muted transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-semibold shrink-0">
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate capitalize">{emailName}</p>
              <p className="text-[11px] text-muted-foreground truncate">{session.email}</p>
            </div>
            <SignOutButton compact />
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
