"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Loader2, Eye, EyeOff, ExternalLink } from "lucide-react";
import { Button } from "../../../components/ui/button";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), appPassword: password.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login failed");
      } else {
        router.replace("/dashboard");
      }
    } catch {
      setError("Network error — is the server running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex flex-col flex-1 items-center justify-center px-4">
      <div className="max-w-sm w-full space-y-6">
        <div className="text-center space-y-2">
          <Mail className="w-10 h-10 mx-auto text-primary" />
          <h1 className="text-2xl font-bold">Connect your Gmail</h1>
          <p className="text-sm text-muted-foreground">
            Sign in with your Gmail address and an App Password
          </p>
        </div>

        <div className="rounded-lg border bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 p-4 text-xs space-y-2">
          <p className="font-semibold text-amber-800 dark:text-amber-200">How to get your App Password:</p>
          <ol className="list-decimal pl-4 space-y-1 text-amber-700 dark:text-amber-300">
            <li>Enable 2-Step Verification on your Google Account</li>
            <li>
              Go to{" "}
              <a
                href="https://myaccount.google.com/apppasswords"
                target="_blank"
                rel="noreferrer"
                className="underline inline-flex items-center gap-0.5"
              >
                myaccount.google.com/apppasswords <ExternalLink className="w-3 h-3" />
              </a>
            </li>
            <li>Select <strong>Mail</strong> → <strong>Generate</strong></li>
            <li>Copy the 16-character password and paste it below</li>
          </ol>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="email">
              Gmail address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@gmail.com"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="appPassword">
              App Password
            </label>
            <div className="relative">
              <input
                id="appPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="xxxx xxxx xxxx xxxx"
                className="w-full rounded-md border bg-background px-3 py-2 pr-10 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full gap-2" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            Connect Gmail
          </Button>
        </form>

        <p className="text-xs text-center text-muted-foreground">
          Credentials are stored only in server memory and never sent to any third party.
          App Passwords can be revoked at any time from your Google Account.
        </p>
      </div>
    </main>
  );
}
