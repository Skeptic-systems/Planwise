import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/elements/button";
import { Input } from "@/components/ui/elements/input";
import { Label } from "@/components/ui/elements/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function LoginForm({
  className,
  redirectTo = "/dashboard",
  ...props
}: React.ComponentPropsWithoutRef<"div"> & {
  redirectTo?: string;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const { toast } = useToast();

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) throw new Error(await response.text());

      toast({
        title: "Check your email",
        description: "We sent you a password reset link",
      });
      setIsResetMode(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send reset email",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("grid gap-6 text-white", className)} {...props}>
      {!isResetMode ? (
        <form action="/api/auth/signin" method="POST" className="space-y-5">
          <input type="hidden" name="redirectTo" value={redirectTo} />

          <div className="text-center space-y-1">
            <h1 className="text-3xl font-bold">Login to Planwise</h1>
            <p className="text-sm text-muted-foreground">
              Enter your email and password to continue
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              className="text-black"
              id="email"
              type="email"
              name="email"
              placeholder="you@planwise-studio.com"
              disabled={isLoading}
              required
            />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <button
                type="button"
                className="text-sm text-muted-foreground hover:underline"
                onClick={() => setIsResetMode(true)}
              >
                Forgot?
              </button>
            </div>
            <Input
              className="text-black"
              id="password"
              type="password"
              name="password"
              disabled={isLoading}
              required
            />
          </div>

          <Button type="submit" className="w-full hover:bg-white hover:text-black ease-in duration-100 " disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign In
          </Button>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-5">
          <div className="text-center space-y-1">
            <h1 className="text-3xl font-bold">Reset your password</h1>
            <p className="text-sm text-muted-foreground">
              We’ll send a reset link to your email.
            </p>
          </div>

          <div className="grid gap-2 text-black">
            <Label htmlFor="email">Email</Label>
            <Input
              className="text-black"
              id="email"
              type="email"
              name="email"
              placeholder="you@planwise-studio.com"
              disabled={isLoading}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Reset Link
          </Button>

          <button
            type="button"
            className="w-full text-sm text-muted-foreground hover:underline text-center"
            onClick={() => setIsResetMode(false)}
          >
            ← Back to login
          </button>
        </form>
      )}

      <div className="text-center text-sm text-muted-foreground">
        No account?{" "}
        <a
          href="/register"
          className="font-medium text-white hover:underline"
        >
          Sign up
        </a>
      </div>
    </div>
  );
}
