"use client";

import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { LogOut } from "lucide-react";

export function SignOutButton({ compact }: { compact?: boolean }) {
  const router = useRouter();

  async function handleSignOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/");
  }

  if (compact) {
    return (
      <button
        onClick={handleSignOut}
        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        title="Sign out"
      >
        <LogOut className="w-4 h-4" />
      </button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
      onClick={handleSignOut}
    >
      <LogOut className="w-4 h-4" />
      Sign out
    </Button>
  );
}
