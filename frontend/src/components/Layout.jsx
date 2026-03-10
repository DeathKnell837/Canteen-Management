import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/80 via-amber-50/30 to-sky-50/50 relative overflow-hidden grain-overlay">
      {/* Animated ambient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="ambient-orb w-[500px] h-[500px] bg-orange-300 -top-[12%] -right-[8%] animate-breathe" />
        <div className="ambient-orb w-[400px] h-[400px] bg-amber-200 -bottom-[10%] -left-[6%] animate-breathe" style={{ animationDelay: '-3s' }} />
        <div className="ambient-orb w-[300px] h-[300px] bg-sky-200 top-[35%] left-[55%] animate-breathe" style={{ animationDelay: '-6s' }} />
        <div className="ambient-orb w-[200px] h-[200px] bg-rose-200 top-[60%] left-[15%] animate-breathe" style={{ animationDelay: '-4s', opacity: 0.08 }} />
      </div>
      {/* Dot pattern overlay */}
      <div className="fixed inset-0 dot-pattern pointer-events-none" aria-hidden="true" />

      <Sidebar />
      <main className="lg:ml-64 min-h-screen transition-all duration-300 relative z-[1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pt-16 lg:pt-8">
          <div key={location.pathname} className="page-enter">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
