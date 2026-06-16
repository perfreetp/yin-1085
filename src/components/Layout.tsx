import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { Calendar, Moon, Users, Wind, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { path: '/today', label: '今日安排', icon: Calendar },
  { path: '/sleep-log', label: '睡眠记录', icon: Moon },
  { path: '/family', label: '家属协助', icon: Users },
  { path: '/relax', label: '放松练习', icon: Wind },
  { path: '/review', label: '阶段回顾', icon: BarChart3 },
] as const;

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-cream">
      <main className="pb-24">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-warm-200 min-h-[80px] safe-bottom">
        <div className="flex items-stretch justify-around max-w-2xl mx-auto">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            const Icon = tab.icon;

            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={cn(
                  'flex flex-col items-center justify-center flex-1 min-h-[60px] py-2 px-1 transition-colors',
                  isActive
                    ? 'text-warm-400 bg-warm-100'
                    : 'text-warm-600 hover:bg-warm-50'
                )}
              >
                <Icon size={28} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-elder-xs mt-0.5">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
