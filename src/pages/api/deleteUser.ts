import { auth } from "@/auth/auth";

export async function POST({ request }: { request: Request }) {
  let body;
  try {
    body = await request.json();
  } catch (error) {
    return new Response(JSON.stringify({ error: "Ungültiger JSON-Body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { userId } = body;

  if (typeof userId !== "string" || !/^[\w-]{36}$/.test(userId)) {
    // UUID-Format
    return new Response(JSON.stringify({ error: "Ungültige oder fehlende User ID" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Better Auth doesn't have a direct admin delete user API
    // For now, we'll return an error indicating this feature is not available
    return new Response(
      JSON.stringify({ error: "User deletion is not implemented with Better Auth" }),
      {
        status: 501,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    // Unerwartete Fehler abfangen
    console.error("Systemfehler beim Löschen des Nutzers:", error);
    return new Response(JSON.stringify({ error: "Interner Serverfehler" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
