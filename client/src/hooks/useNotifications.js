import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { getApiEndpoint } from '../utils/api';

const useNotifications = () => {
    const [unreadMessages, setUnreadMessages] = useState(0);
    const [unreadAnnouncements, setUnreadAnnouncements] = useState(0);
    const [loading, setLoading] = useState(true);
    const intervalRef = useRef(null);

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
        intervalRef.current = setInterval(fetchCounts, 60000);

        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                fetchCounts();
                intervalRef.current = setInterval(fetchCounts, 60000);
            } else {
                clearInterval(intervalRef.current);
            }
        };

        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            clearInterval(intervalRef.current);
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, [fetchCounts]);

    return { unreadMessages, unreadAnnouncements, loading, refresh: fetchCounts };
};

export default useNotifications;
