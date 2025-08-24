import React, { useState } from "react";
import { Input } from "@/components/ui/elements/input";
import { Button } from "@/components/ui/elements/button";
import { Loader2 } from "lucide-react";

// Uses Better Auth API route we added: POST /api/auth/reset-password
export default function ResetPasswordForm() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        // In dev, Better Auth logs the reset URL in the server console
        setMessage("If the email exists, a reset link has been sent.");
      } else {
        const text = await res.text();
        setError(text || "Request failed");
      }
    } catch (e: any) {
      setError(e?.message || "Network error");
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Email</label>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <Button type="submit" disabled={pending} className="inline-flex items-center">
        {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Send reset link
      </Button>
      {message && <p className="text-sm text-emerald-400">{message}</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}
    </form>
  );
}
