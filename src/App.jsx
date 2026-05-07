import { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard   from './pages/Dashboard';
import ManagerView from './pages/ManagerView';

const navCls = ({ isActive }) =>
  `flex items-center gap-2 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${
    isActive
      ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/40 border border-white/10'
      : 'text-slate-500 hover:text-slate-200 hover:bg-white/5 border border-transparent'
  }`;

export default function App() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col selection:bg-brand-500/30">
        {/* Nav */}
        <nav className="sticky top-0 z-50 bg-slate-950/40 backdrop-blur-2xl border-b border-white/5 px-8 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-xl shadow-lg shadow-brand-500/20 group-hover:scale-110 transition-transform">
                📊
              </div>
              <span className="font-black text-white text-xl tracking-tighter uppercase sm:block hidden">
                Daily<span className="text-brand-400">Track</span>
              </span>
            </div>

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-4">
              <NavLink to="/"        className={navCls} end>🏠 Dashboard</NavLink>
              <NavLink to="/manager" className={navCls}>👔 Team Intel</NavLink>
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-all"
              onClick={() => setMobileOpen(o => !o)}
            >
              {mobileOpen ? '✕' : '☰'}
            </button>
          </div>

          {/* Mobile menu */}
          {mobileOpen && (
            <div className="md:hidden mt-4 flex flex-col gap-2 p-4 glass-card border-brand-500/20 shadow-2xl animate-in slide-in-from-top-4 duration-300" onClick={() => setMobileOpen(false)}>
              <NavLink to="/"        className={navCls} end>🏠 Dashboard</NavLink>
              <NavLink to="/manager" className={navCls}>👔 Team Intel</NavLink>
            </div>
          )}
        </nav>

        {/* Page content */}
        <main className="flex-1">
          <Routes>
            <Route path="/"        element={<Dashboard />} />
            <Route path="/manager" element={<ManagerView />} />
          </Routes>
        </main>
        
        {/* Footer */}
        <footer className="py-10 px-6 border-t border-white/5 text-center">
          <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.3em]">
            © 2026 DailyTrack Operations Center • All Rights Reserved
          </p>
        </footer>
      </div>
    </BrowserRouter>
  );
}
