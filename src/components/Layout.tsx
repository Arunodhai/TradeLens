import { useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Activity, BookOpen, Settings, Sparkles, LineChart, LogOut, BarChart2 } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { tagService } from '../db';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/app', icon: Activity },
  { name: 'Journal', path: '/app/journal', icon: BookOpen },
  { name: 'Analytics', path: '/app/analytics', icon: BarChart2 },
  { name: 'AI Review', path: '/app/ai-review', icon: Sparkles },
  { name: 'Settings', path: '/app/settings', icon: Settings },
];

export function Layout() {
  const location = useLocation();
  const { user, signOut } = useAuth();

  // Seed default tags on first load (idempotent)
  useEffect(() => {
    tagService.ensureDefaultTags().catch(console.error);
  }, []);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        <div className="flex h-16 items-center px-6 border-b border-border">
          <LineChart className="h-5 w-5 text-primary mr-2" />
          <span className="text-lg font-bold tracking-tight">TradeLens</span>
        </div>

        <nav className="p-4 space-y-1 flex-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.path === '/app'
                ? location.pathname === '/app' || location.pathname === '/app/'
                : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <item.icon className="h-4 w-4 mr-3" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 overflow-hidden">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="Avatar"
                  className="h-8 w-8 rounded-full"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                  {user?.email?.[0].toUpperCase() ?? '?'}
                </div>
              )}
              <div className="truncate">
                <p className="text-sm font-medium truncate">{user?.displayName || 'Trader'}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            <button onClick={signOut} className="text-muted-foreground hover:text-foreground p-2 transition-colors">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
