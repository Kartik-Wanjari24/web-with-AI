import React, { useState } from 'react';
import { Shield, Home, BookOpen, Crosshair, Cpu, Menu, X, User, LogOut, CheckCircle, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ExtensionStatusBadge from './ExtensionStatusBadge';

const NAV_LINKS = [
  { id: 'home',        label: 'Home',                  icon: Home },
  { id: 'firewall',    label: 'Firewall Protection',   icon: Shield },
  { id: 'knowledge',   label: 'Attack Encyclopedia',   icon: BookOpen },
  { id: 'simulations', label: 'Attack Simulations',    icon: Crosshair },
  { id: 'techstack',   label: 'About & Tech Stack',    icon: Cpu },
];

export default function Navbar({ activePage, onNavigate, onOpenAuth, extConnected = false, extEventCount = 0, extScannedCount = 0 }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  const handleNav = (id) => {
    onNavigate(id);
    setMobileOpen(false);
  };

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-700/80 bg-[#050811]/90 backdrop-blur-xl shadow-2xl">
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-12 py-3 flex items-center justify-between gap-4">

        {/* Brand */}
        <button
          onClick={() => handleNav('home')}
          className="flex items-center gap-3 group cursor-pointer shrink-0"
        >
          <div className="relative flex items-center justify-center w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 via-sky-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 ring-1 ring-blue-400/40">
            <Shield className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-blue-400 ring-2 ring-[#050811] animate-ping" />
          </div>
          <div className="hidden sm:block text-left">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-sky-200 to-blue-400 bg-clip-text text-transparent font-display">
                AdaptiveShield
              </span>
              <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded-full bg-blue-950/90 border border-blue-500/40 text-blue-300 font-semibold tracking-wider">
                IPS 5.2
              </span>
            </div>
            <p className="text-[10px] text-slate-300 font-medium">C++ WASM Autonomous Firewall</p>
          </div>
        </button>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 bg-[#0b0f19] border border-slate-700/80 p-1 rounded-2xl shadow-inner">
          {NAV_LINKS.map(({ id, label, icon: Icon }) => {
            const active = activePage === id;
            return (
              <button
                key={id}
                onClick={() => handleNav(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap font-display ${
                  active
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            );
          })}
        </nav>

        {/* Extension status badge */}
        <ExtensionStatusBadge isConnected={extConnected} eventCount={extEventCount} scannedCount={extScannedCount} />

        {/* Right side: Auth Status & Mobile Menu */}
        <div className="flex items-center gap-3">
          {/* User Authentication Pill / Sign In Button */}
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0b0f19] border border-slate-700 hover:border-slate-500 text-white cursor-pointer transition-all shadow-sm"
              >
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500 to-sky-600 flex items-center justify-center text-white text-xs font-bold">
                  {user.email.charAt(0).toUpperCase()}
                </div>
                <div className="hidden lg:block text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-white max-w-[130px] truncate">
                      {user.email}
                    </span>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <span className="text-[10px] text-slate-400 block -mt-0.5">
                    {user.role || 'SecOps Analyst'}
                  </span>
                </div>
              </button>

              {/* User Dropdown Menu */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#0b0f19] border border-slate-700 shadow-2xl p-2 text-slate-200 z-50 animate-packet-slide">
                  <div className="px-3 py-2 border-b border-slate-800">
                    <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                      Authenticated Session
                    </p>
                    <p className="text-xs font-bold text-white truncate mt-0.5">
                      {user.email}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 mt-1 rounded-xl text-xs font-medium text-rose-300 hover:bg-rose-950/40 hover:text-rose-200 transition-colors cursor-pointer text-left"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold font-display shadow-md shadow-blue-600/30 transition-all cursor-pointer ring-1 ring-blue-400/40"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-xl bg-[#0b0f19] border border-slate-700 text-slate-300 hover:text-white cursor-pointer"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-800 bg-[#050811]/95 px-4 py-3 space-y-1">
          {NAV_LINKS.map(({ id, label, icon: Icon }) => {
            const active = activePage === id;
            return (
              <button
                key={id}
                onClick={() => handleNav(id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer text-left font-display ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-200 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
