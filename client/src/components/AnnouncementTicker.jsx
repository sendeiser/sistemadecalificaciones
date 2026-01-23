import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { getApiEndpoint } from '../utils/api';
import { AlertCircle, Megaphone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AnnouncementTicker = () => {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (profile) fetchTickerAnnouncements();
    }, [profile]);

    const fetchTickerAnnouncements = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const endpoint = getApiEndpoint('/announcements');
            const res = await fetch(`${endpoint}?limit=5`, {
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`
                }
            });

            if (res.ok) {
                const data = await res.json();
                // Filter critical or fresh announcements
                setAnnouncements(data.filter(a => !a.leido || a.prioridad === 'alta' || a.prioridad === 'urgente'));
            }
        } catch (error) {
            console.error('Error loading ticker:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || announcements.length === 0) return null;

    return (
        <div className="w-full bg-tech-secondary border-y border-tech-surface overflow-hidden relative h-10 flex items-center mb-6 shadow-md">
            <div className="absolute left-0 top-0 bottom-0 z-10 bg-tech-secondary px-3 flex items-center gap-2 border-r border-tech-surface shadow-sm">
                <div className="p-1 bg-tech-accent/20 rounded-full text-tech-accent animate-pulse">
                    <Megaphone size={16} />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-tech-accent hidden sm:inline">Novedades</span>
            </div>

            <div className="whitespace-nowrap flex items-center animate-marquee w-full pl-4">
                {announcements.map((announcement, index) => (
                    <div
                        key={announcement.id}
                        onClick={() => navigate('/announcements')}
                        className="inline-flex items-center gap-2 mx-8 cursor-pointer group"
                    >
                        <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${announcement.prioridad === 'urgente' ? 'bg-tech-danger text-white' :
                                announcement.prioridad === 'alta' ? 'bg-tech-accent text-white' : 'bg-tech-cyan/20 text-tech-cyan'
                            }`}>
                            {announcement.prioridad}
                        </span>
                        <span className="text-sm text-tech-text font-medium group-hover:text-tech-cyan transition-colors">
                            {announcement.titulo}
                        </span>
                        {index < announcements.length - 1 && (
                            <span className="text-tech-surface mx-4">•</span>
                        )}
                    </div>
                ))}
            </div>

            <div className="absolute right-0 top-0 bottom-0 z-10 bg-gradient-to-l from-tech-secondary to-transparent w-16 pointer-events-none"></div>
        </div>
    );
};

export default AnnouncementTicker;
