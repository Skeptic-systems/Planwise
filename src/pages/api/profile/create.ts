import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with the service role key
const supabaseAdmin = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST({ request }: { request: Request }) {
    try {
        const { userId, displayName } = await request.json();

        const { data, error } = await supabaseAdmin
            .from('profiles')
            .insert([
                {
                    id: userId,
                    display_name: displayName,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            ])
            .select()
            .single();

        if (error) {
            return new Response(JSON.stringify({ error: error.message }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(
            JSON.stringify({ error: 'Internal server error' }), 
            { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
} 