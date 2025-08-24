import React from "react";

// 2FA is not part of the current migration. This keeps the build green.
export default function TwoFactorForm() {
  return (
    <div className="text-sm text-muted-foreground">
      Two-factor authentication is currently disabled.
    </div>
  );
}
