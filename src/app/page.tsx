import { getAuthSession } from "../lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "../components/ui/button";
import { Mail, Zap, Shield, Trash2 } from "lucide-react";

export default async function LandingPage() {
  const session = await getAuthSession();
  if (session) redirect("/dashboard");

  return (
    <main className="flex flex-col flex-1 items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2 text-primary">
            <Mail className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Declutter Your Gmail</h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Smart rule-based inbox cleanup. Scan, classify, unsubscribe, and delete junk —
            safely and locally. No Google Cloud project needed.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          <div className="rounded-lg border bg-card p-4 space-y-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            <h3 className="font-semibold text-sm">Smart Classification</h3>
            <p className="text-xs text-muted-foreground">
              Rule-based engine classifies every email: KEEP, DELETE, UNSUBSCRIBE, or REVIEW —
              no AI API key needed.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4 space-y-2">
            <Shield className="w-5 h-5 text-green-500" />
            <h3 className="font-semibold text-sm">Always Preview First</h3>
            <p className="text-xs text-muted-foreground">
              Nothing is deleted until you review and approve. Trash mode gives you 30 days to recover.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4 space-y-2">
            <Trash2 className="w-5 h-5 text-red-500" />
            <h3 className="font-semibold text-sm">Auto Unsubscribe</h3>
            <p className="text-xs text-muted-foreground">
              Executes List-Unsubscribe headers automatically using RFC 8058 one-click or SMTP.
            </p>
          </div>
        </div>

        <Link href="/auth/signin">
          <Button size="lg" className="gap-2">
            <Mail className="w-4 h-4" />
            Connect Gmail with App Password
          </Button>
        </Link>

        <p className="text-xs text-muted-foreground">
          Uses Gmail IMAP with an App Password — no Google Cloud project required.
          Everything runs locally on your machine.
        </p>
      </div>
    </main>
  );
}
