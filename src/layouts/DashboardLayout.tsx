import { useState, useEffect } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { useAuthStore, useThemeStore, useNotificationStore } from '@/lib/store';
import { 
  LayoutDashboard, Users, Briefcase, FileText, Building2,
  Menu, X, Moon, Sun, Bell, LogOut, User as UserIcon
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import NotificationPanel from '@/components/NotificationPanel';
import { motion, AnimatePresence } from 'framer-motion';

export default function DashboardLayout() {
  const { user } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const { unreadCount } = useNotificationStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Tasks', href: '/tasks', icon: FileText },
    { name: 'Projects', href: '/projects', icon: Briefcase },
    { name: 'Departments', href: '/departments', icon: Building2 },
    { name: 'Users', href: '/users', icon: Users },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile menu toggle button */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="rounded-full bg-primary/10"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </div>
      
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside 
            initial={{ x: isMobile ? -240 : 0 }}
            animate={{ x: 0 }}
            exit={{ x: isMobile ? -240 : 0 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className={`fixed inset-y-0 left-0 z-40 w-60 bg-card/90 backdrop-blur shadow-lg md:relative flex-shrink-0 flex flex-col ${isMobile ? 'p-4 pt-16' : 'p-4'}`}
          >
            <div className="flex items-center justify-center h-16 mb-4">
              <Link to="/dashboard" className="flex items-center space-x-2">
                <div className="p-1 bg-primary rounded-md">
                  <LayoutDashboard className="h-6 w-6 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold">ZEWS</span>
              </Link>
            </div>
            
            <nav className="flex-1 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center px-4 py-3 text-sm rounded-md transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            
            <div className="border-t border-border pt-4 mt-4">
              <div className="flex px-4 items-center justify-between">
                <Button variant="ghost" size="icon" onClick={toggleTheme}>
                  {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setIsNotificationOpen(!isNotificationOpen)}>
                  <div className="relative">
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs w-4 h-4 rounded-full flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                </Button>
                <div className="relative">
                  <Link to="/profile">
                    <Avatar className="h-8 w-8 cursor-pointer">
                      {user?.avatarUrl ? (
                        <AvatarImage src={user.avatarUrl} alt={user.firstName} />
                      ) : (
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getInitials(user?.firstName, user?.lastName)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </Link>
                </div>
              </div>
              <div className="mt-4">
                <Button
                  variant="ghost"
                  className="w-full flex justify-start items-center text-muted-foreground"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </Button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="bg-card/80 backdrop-blur-sm border-b border-border h-16 flex items-center justify-end px-4 md:px-6">
          <div className="flex items-center space-x-4">
            {!isMobile && (
              <>
                <Button variant="ghost" size="icon" onClick={toggleTheme}>
                  {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setIsNotificationOpen(!isNotificationOpen)}>
                  <div className="relative">
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs w-4 h-4 rounded-full flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                </Button>
              </>
            )}
            
            {!isMobile && (
              <div className="flex items-center space-x-2">
                <Link to="/profile" className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    {user?.avatarUrl ? (
                      <AvatarImage src={user.avatarUrl} alt={user.firstName} />
                    ) : (
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(user?.firstName, user?.lastName)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{user?.firstName} {user?.lastName}</span>
                    <span className="text-xs text-muted-foreground capitalize">{user?.role}</span>
                  </div>
                </Link>
                <Button variant="ghost" size="icon" onClick={handleLogout}>
                  <LogOut size={18} />
                </Button>
              </div>
            )}
          </div>
        </header>
        
        {/* Main content area */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
      
      {/* Notification Panel */}
      <AnimatePresence>
        {isNotificationOpen && (
          <NotificationPanel onClose={() => setIsNotificationOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}