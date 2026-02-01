import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { getApiEndpoint } from '../utils/api';

const useNotifications = () => {
    const [unreadMessages, setUnreadMessages] = useState(0);
    const [unreadAnnouncements, setUnreadAnnouncements] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchCounts = useCallback(async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const headers = { 'Authorization': `Bearer ${session.access_token}` };

            // Fetch unread messages count
            const msgResponse = await fetch(getApiEndpoint('/messages/unread-count'), { headers });
            if (msgResponse.ok) {
                const { count } = await msgResponse.json();
                setUnreadMessages(count);
            }

            // Fetch unread announcements count
            const annResponse = await fetch(getApiEndpoint('/announcements/unread-count'), { headers });
            if (annResponse.ok) {
                const { count } = await annResponse.json();
                setUnreadAnnouncements(count);
            }
        } catch (error) {
            console.error('Error fetching notification counts:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCounts();

        // Refresh counts every 60 seconds
        const interval = setInterval(fetchCounts, 60000);

        // Cleanup
        return () => clearInterval(interval);
    }, [fetchCounts]);

    return { unreadMessages, unreadAnnouncements, loading, refresh: fetchCounts };
};

export default useNotifications;
