import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/elements/button";
import { Input } from "@/components/ui/elements/input";
import { Label } from "@/components/ui/elements/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function RegisterForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      <form action="/api/auth/register" method="POST">
        <div className="flex flex-col gap-4">
          {/* heading (white) */}
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-2xl font-bold text-white">Create an account</h1>
            <p className="text-balance text-sm text-white">
              Enter your details below to create your account
            </p>
          </div>

          {/* Display Name */}
          <div className="grid gap-2">
            <Label htmlFor="displayName" className="text-white">
              Display Name
            </Label>
            <Input
              id="displayName"
              name="displayName"
              placeholder="John Doe"
              className="text-black placeholder:text-gray-400"
              autoComplete="name"
              disabled={isLoading}
              required
            />
          </div>

          {/* Email */}
          <div className="grid gap-2">
            <Label htmlFor="email" className="text-white">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              name="email"
              placeholder="one@planwise-studio.de"
              className="text-black placeholder:text-gray-400"
              autoComplete="email"
              disabled={isLoading}
              required
            />
          </div>

          {/* Password */}
          <div className="grid gap-2">
            <Label htmlFor="password" className="text-white">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              name="password"
              className="text-black placeholder:text-gray-400"
              autoComplete="new-password"
              disabled={isLoading}
              required
            />
          </div>

          {/* Submit (ensure white text on button) */}
          <Button type="submit" className="w-full text-white" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign Up
          </Button>
        </div>
      </form>

      {/* footer below the box (force white) */}
      <div className="text-center text-sm text-white">
        Already have an account?{" "}
        <Button
          variant="link"
          className="p-0 text-white hover:text-white/80"
          onClick={() => (window.location.href = "/login")}
        >
          Sign in
        </Button>
      </div>

      {/* make autofilled text light gray (Chrome/WebKit) */}
      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-text-fill-color: #9CA3AF; /* tailwind gray-400 */
          transition: background-color 9999s ease-in-out 0s;
        }
      `}</style>
    </div>
  );
}
