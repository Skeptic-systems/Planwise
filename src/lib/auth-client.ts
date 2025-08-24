// Better Auth client (browser-side)
import { createAuthClient } from "better-auth/client";

export const authClient = createAuthClient();
// optional type
export type AuthClient = ReturnType<typeof createAuthClient>;
