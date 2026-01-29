import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { getApiEndpoint } from '../utils/api';
import { Megaphone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AnnouncementTicker = () => {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);

    // Refs for animation and interaction
    const containerRef = useRef(null);
    const contentRef = useRef(null);
    const animationRef = useRef(null);
    const isPaused = useRef(false);
    const scrollPos = useRef(0);

    // Drag state
    const isDragging = useRef(false);
    const startX = useRef(0);
    const scrollLeftStart = useRef(0);

    useEffect(() => {
        if (profile) fetchTickerAnnouncements();
        return () => cancelAnimationFrame(animationRef.current);
    }, [profile]);

    const fetchTickerAnnouncements = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const endpoint = getApiEndpoint('/announcements');
            const res = await fetch(`${endpoint}?limit=20`, {
                headers: { 'Authorization': `Bearer ${session?.access_token}` }
            });

            if (res.ok) {
                const data = await res.json();
                const filtered = data.filter(a => !a.leido || a.prioridad === 'alta' || a.prioridad === 'urgente');
                setAnnouncements(filtered);
            }
        } catch (error) {
            console.error('Error loading ticker:', error);
        } finally {
            setLoading(false);
        }
    };

    // Animation Loop
    useEffect(() => {
        if (loading || announcements.length === 0) return;

        const animate = () => {
            if (!isPaused.current && !isDragging.current && containerRef.current && contentRef.current) {
                scrollPos.current += 0.8; // Speed

                // Infinite loop logic: reset when first set of items is fully scrolled out
                const singleSetWidth = contentRef.current.scrollWidth / 8; // Must match REPLICATION_FACTOR

                if (scrollPos.current >= singleSetWidth) {
                    scrollPos.current = 0;
                }

                containerRef.current.scrollLeft = scrollPos.current;
            }
            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(animationRef.current);
    }, [loading, announcements]);

    // Interaction Handlers
    const handleMouseDown = (e) => {
        isDragging.current = true;
        isPaused.current = true;
        startX.current = e.pageX - containerRef.current.offsetLeft;
        scrollLeftStart.current = containerRef.current.scrollLeft;
        scrollPos.current = containerRef.current.scrollLeft; // Sync pos
    };

    const handleMouseLeave = () => {
        isDragging.current = false;
        isPaused.current = false;
    };

    const handleMouseUp = () => {
        isDragging.current = false;
        isPaused.current = false;
    };

    const handleMouseMove = (e) => {
        if (!isDragging.current) return;
        e.preventDefault();
        const x = e.pageX - containerRef.current.offsetLeft;
        const walk = (x - startX.current) * 2; // Scroll-fast
        const newScroll = scrollLeftStart.current - walk;
        containerRef.current.scrollLeft = newScroll;
        scrollPos.current = newScroll; // Update internal pos to prevent jump on release
    };

    // Touch Support
    const handleTouchStart = (e) => {
        isDragging.current = true;
        isPaused.current = true;
        startX.current = e.touches[0].pageX - containerRef.current.offsetLeft;
        scrollLeftStart.current = containerRef.current.scrollLeft;
        scrollPos.current = containerRef.current.scrollLeft;
    };

    const handleTouchEnd = () => {
        isDragging.current = false;
        isPaused.current = false;
    };

    const handleTouchMove = (e) => {
        if (!isDragging.current) return;
        const x = e.touches[0].pageX - containerRef.current.offsetLeft;
        const walk = (x - startX.current) * 2;
        const newScroll = scrollLeftStart.current - walk;
        containerRef.current.scrollLeft = newScroll;
        scrollPos.current = newScroll;
    };

    if (loading || announcements.length === 0) return null;

    // Duplicate items for infinite marquee effect
    // Replicate more times to ensure it overflows even on wide screens (desktop)
    const REPLICATION_FACTOR = 8;
    const displayItems = Array(REPLICATION_FACTOR).fill(announcements).flat();

    return (
        <div className="w-full bg-tech-secondary border-y border-tech-surface overflow-hidden relative h-10 flex items-center mb-6 shadow-md select-none group">
            {/* Label */}
            <div className="absolute left-0 top-0 bottom-0 z-20 bg-tech-secondary px-3 flex items-center gap-2 border-r border-tech-surface shadow-sm pointer-events-none">
                <div className="p-1 bg-tech-accent/20 rounded-full text-tech-accent animate-pulse">
                    <Megaphone size={16} />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-tech-accent hidden sm:inline">Novedades</span>
            </div>

            {/* Scroller */}
            <div
                ref={containerRef}
                className="overflow-x-hidden flex items-center w-full h-full pl-4 cursor-grab active:cursor-grabbing scrollbar-none"
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onTouchMove={handleTouchMove}
                onMouseEnter={() => isPaused.current = true}
            >
                <div ref={contentRef} className="flex items-center whitespace-nowrap pl-24 pr-4">
                    {displayItems.map((announcement, index) => (
                        <div
                            key={`${announcement.id}-${index}`}
                            onClick={(e) => {
                                // Prevent click if dragging
                                if (Math.abs(scrollPos.current - (containerRef.current.scrollLeft)) < 5) {
                                    navigate('/announcements');
                                }
                            }}
                            className="inline-flex items-center gap-2 mx-6 md:mx-10 cursor-pointer hover:opacity-80 transition-opacity"
                        >
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${announcement.prioridad === 'urgente' ? 'bg-tech-danger text-white' :
                                announcement.prioridad === 'alta' ? 'bg-tech-accent text-white' : 'bg-tech-cyan/20 text-tech-cyan'
                                }`}>
                                {announcement.prioridad}
                            </span>
                            <span className="text-sm text-tech-text font-medium group-hover:text-tech-cyan transition-colors">
                                {announcement.titulo}
                            </span>
                            {/* Separator */}
                            <span className="text-tech-surface/50">•</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Gradient Fade */}
            <div className="absolute right-0 top-0 bottom-0 z-20 bg-gradient-to-l from-tech-secondary to-transparent w-16 pointer-events-none"></div>
        </div>
    );
};

export default AnnouncementTicker;
