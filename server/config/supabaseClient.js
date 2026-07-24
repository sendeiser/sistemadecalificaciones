const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase URL or Key missing from environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Admin client with service role key for auth operations
const supabaseAdmin = supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
    : null;

// Broadcast a new message to all connected clients via Realtime
const broadcastNewMessage = async (message) => {
    const client = supabaseAdmin || supabase;
    try {
        const channel = client.channel('messages_broadcast');
        channel.subscribe((status) => {
            if (status === 'SUBSCRIBED' || status === 'CHANNEL_ERROR') {
                channel.send({
                    type: 'broadcast',
                    event: 'new_message',
                    payload: { message }
                });
                setTimeout(() => client.removeChannel(channel), 3000);
            }
        });
    } catch (error) {
        console.error('Error broadcasting message:', error.message);
    }
};

module.exports = { supabase, supabaseAdmin, broadcastNewMessage };
