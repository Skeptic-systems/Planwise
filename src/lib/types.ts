// src/lib/types.ts
export interface Session {
  user: {
    id: string;
    email: string;
  };
}

export interface User {
  id: string;
  email: string;
}
