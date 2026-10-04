import React, { useState } from 'react';
import { Shield, Home, BookOpen, Crosshair, Cpu, Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { id: 'home',        label: 'Home',                  icon: Home },
  { id: 'firewall',    label: 'Firewall Protection',   icon: Shield },
  { id: 'knowledge',   label: 'Attack Encyclopedia',   icon: BookOpen },
  { id: 'simulations', label: 'Attack Simulations',    icon: Crosshair },
  { id: 'techstack',   label: 'About & Tech Stack',    icon: Cpu },
];

export default function Navbar({ activePage, onNavigate }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (id) => {
    onNavigate(id);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl shadow-2xl">
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
          <div className="hidden sm:block">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-sky-200 to-blue-400 bg-clip-text text-transparent">
                AdaptiveShield
              </span>
              <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded-full bg-blue-950/90 border border-blue-500/40 text-blue-300 font-semibold tracking-wider">
                IPS 5.2
              </span>
            </div>
            <p className="text-[10px] text-slate-400">C++ WASM Autonomous Firewall</p>
          </div>
        </button>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/90 border border-slate-800 p-1 rounded-2xl shadow-inner">
          {NAV_LINKS.map(({ id, label, icon: Icon }) => {
            const active = activePage === id;
            return (
              <button
                key={id}
                onClick={() => handleNav(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            );
          })}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
          onClick={() => setMobileOpen(o => !o)}
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950/95 px-4 py-3 space-y-1">
          {NAV_LINKS.map(({ id, label, icon: Icon }) => {
            const active = activePage === id;
            return (
              <button
                key={id}
                onClick={() => handleNav(id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer text-left ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
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
