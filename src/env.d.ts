interface ImportMetaEnv {
  // MariaDB for Better Auth
  readonly DB_HOST: string;
  readonly DB_PORT?: string;
  readonly DB_USER: string;
  readonly DB_PASSWORD: string;
  readonly DB_NAME: string;
  readonly AUTH_COOKIE_SECURE?: string;

  // Keep if you still use Supabase for data
  readonly PUBLIC_SUPABASE_URL?: string;
  readonly PUBLIC_SUPABASE_ANON_KEY?: string;
  readonly SUPABASE_SERVICE_ROLE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
