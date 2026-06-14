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

// Realtime broadcast client (uses service key so it can publish)
// Used to notify clients about new messages without relying on postgres_changes + RLS
const supabaseRealtime = supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
        realtime: { params: { eventsPerSecond: 10 } }
    })
    : null;

// Persistent broadcast channel — subscribed once at startup
let _broadcastChannel = null;

const getBroadcastChannel = () => {
    if (!supabaseRealtime) return null;
    if (!_broadcastChannel) {
        _broadcastChannel = supabaseRealtime
            .channel('messages_broadcast', {
                config: { broadcast: { self: true, ack: false } }
            });
        _broadcastChannel.subscribe((status) => {
            console.log('[Realtime Server] Broadcast channel status:', status);
        });
    }
    return _broadcastChannel;
};

/**
 * Broadcasts a new message to all connected clients via Supabase Realtime.
 * This is more reliable than postgres_changes when using service role inserts.
 * @param {object} message - The inserted message row (with populated profiles if available)
 */
const broadcastNewMessage = async (message) => {
    const channel = getBroadcastChannel();
    if (!channel) return;
    try {
        const result = await channel.send({
            type: 'broadcast',
            event: 'new_message',
            payload: { message }
        });
        console.log('[Realtime Server] Broadcast enviado:', result);
    } catch (err) {
        console.error('[Realtime Server] Error broadcasting message:', err);
    }
};

module.exports = { supabase, supabaseAdmin, supabaseRealtime, broadcastNewMessage };


