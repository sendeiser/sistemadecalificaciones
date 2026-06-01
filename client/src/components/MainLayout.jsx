import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import FeedbackFAB from './FeedbackFAB';
import useNotifications from '../hooks/useNotifications';

const MainLayout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
    const { profile, loading } = useAuth();
    const { unreadMessages, unreadAnnouncements } = useNotifications();

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) setIsSidebarOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (loading) return null;
    if (!profile) return <>{children}</>;

    return (
        <div className="min-h-screen bg-tech-primary flex flex-col">
            <TopBar
                onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                unreadMessages={unreadMessages}
                unreadAnnouncements={unreadAnnouncements}
            />

            <div className="flex flex-1 overflow-hidden">
                <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

                <main className={`flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
                    <div className="max-w-[1600px] mx-auto">
                        {children}
                    </div>
                </main>
            </div>

            <FeedbackFAB />
        </div>
    );
};

export default MainLayout;
