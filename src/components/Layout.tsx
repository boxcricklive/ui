import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Trophy, Plus, BarChart2, User } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  onPlusClick?: () => void;
}

export default function Layout({ children, onPlusClick }: LayoutProps) {
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Home', path: '/dashboard' },
    { icon: Trophy, label: 'Matches', path: '/matches' },
    { icon: BarChart2, label: 'Stats', path: '/stats' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <main className="max-w-md mx-auto min-h-screen bg-white relative overflow-x-hidden">
        <div className="pb-32">
          {children}
        </div>
        
        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100 px-6 py-3 flex justify-between items-center z-50">
          {navItems.slice(0, 2).map((item) => (
            <Link 
              key={item.path} 
              to={item.path}
              className={`flex flex-col items-center gap-1 ${location.pathname === item.path ? 'text-brand-dark' : 'text-gray-400'}`}
            >
              <item.icon size={20} />
              <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
            </Link>
          ))}

          <button 
            onClick={onPlusClick}
            className="bg-brand-dark text-brand-primary p-4 rounded-full -mt-12 shadow-lg hover:scale-110 transition-transform"
          >
            <Plus size={28} strokeWidth={3} />
          </button>

          {navItems.slice(2).map((item) => (
            <Link 
              key={item.path} 
              to={item.path}
              className={`flex flex-col items-center gap-1 ${location.pathname === item.path ? 'text-brand-dark' : 'text-gray-400'}`}
            >
              <item.icon size={20} />
              <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
            </Link>
          ))}
        </nav>
      </main>
    </div>
  );
}
