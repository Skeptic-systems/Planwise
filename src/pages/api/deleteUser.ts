import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
    import.meta.env.SUPABASE_URL!,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
);

export async function POST({ request }: { request: Request }) {

    if (!import.meta.env.SUPABASE_URL || !import.meta.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error("Supabase-Umgebungsvariablen sind nicht definiert");
        return new Response(JSON.stringify({ error: "Server-Konfigurationsfehler" }), { status: 500 });
    }

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

    if (typeof userId !== "string" || !/^[\w-]{36}$/.test(userId)) { // UUID-Format
        return new Response(JSON.stringify({ error: "Ungültige oder fehlende User ID" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    try {
        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (error) {
            console.error("Fehler beim Löschen des Nutzers:", error);
            return new Response(JSON.stringify({ error: "Das Löschen des Nutzers ist fehlgeschlagen." }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Erfolgreiche Antwort senden
        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-store",
                "Access-Control-Allow-Origin": "*",
                "X-Content-Type-Options": "nosniff",
            },
        });
    } catch (error) {
        // Unerwartete Fehler abfangen
        console.error("Systemfehler beim Löschen des Nutzers:", error);
        return new Response(JSON.stringify({ error: "Interner Serverfehler" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}