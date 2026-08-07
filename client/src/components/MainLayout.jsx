import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import FeedbackFAB from './FeedbackFAB';
import useNotifications from '../hooks/useNotifications';

const MainLayout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
    const { profile, loading } = useAuth();
    const { unreadMessages, unreadAnnouncements } = useNotifications();
    const location = useLocation();

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) setIsSidebarOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (loading) return null;
    if (!profile) return <>{children}</>;

    const isMessagesPage = location.pathname === '/messages';

    return (
        <div className={`bg-tech-primary flex flex-col ${
            isMessagesPage ? 'h-screen h-[100dvh] max-h-[100dvh] overflow-hidden fixed inset-0' : 'min-h-screen'
        }`}>
            <TopBar
                onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                unreadMessages={unreadMessages}
                unreadAnnouncements={unreadAnnouncements}
            />

            <div className="flex flex-1 overflow-hidden h-full">
                <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

                <main className={`flex-1 transition-all duration-300 ${
                    isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
                } ${
                    isMessagesPage 
                        ? 'p-0 overflow-hidden flex flex-col h-full flex-1' 
                        : 'p-6 md:p-10 overflow-y-auto custom-scrollbar'
                }`}>
                    <div className={isMessagesPage ? 'w-full h-full flex flex-col overflow-hidden flex-1' : 'max-w-[1600px] mx-auto'}>
                        {children}
                    </div>
                </main>
            </div>

            {!isMessagesPage && <FeedbackFAB />}
        </div>
    );
};

export default MainLayout;
