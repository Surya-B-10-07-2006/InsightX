import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Cpu, Home, Bell, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NotificationDrawer } from './NotificationDrawer';

export const Navbar: React.FC = () => {
  const { logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const handleLogoClick = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          
          {/* Logo & Title — click to clear session and go Home */}
          <button onClick={handleLogoClick} className="flex items-center gap-3 group cursor-pointer bg-transparent border-0 p-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 p-0.5 shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all">
              <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950">
                <Cpu className="h-5 w-5 text-cyan-400 group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-sky-200 to-purple-400 bg-clip-text text-transparent">
                InsightX
              </span>
              <span className="text-[10px] font-mono tracking-widest text-cyan-500 uppercase font-semibold">
                Predictive ML Platform
              </span>
            </div>
          </button>

          {/* Navigation Controls: Home, Notifications, Theme Toggle, Logout */}
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-cyan-400 hover:bg-slate-900 transition-all"
            >
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Link>

            {/* Notifications Button */}
            <button
              onClick={() => setIsNotifOpen(true)}
              className="relative rounded-lg p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-900 transition-all"
              title="Notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
            </button>

            {/* Logout Button */}
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-400 hover:bg-red-500/20 hover:border-red-500/40 transition-all ml-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            )}
          </div>

        </div>
      </header>

      {/* Notification Drawer */}
      <NotificationDrawer isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
    </>
  );
};
