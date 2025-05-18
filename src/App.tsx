import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuthStore, useThemeStore } from './lib/store';
import { supabase } from './lib/supabase';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Tasks from './pages/Tasks';
import Projects from './pages/Projects';
import Departments from './pages/Departments';
import UserManagement from './pages/UserManagement';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

// Components
import LoadingScreen from './components/LoadingScreen';

function App() {
  const { user, setUser, isLoading, setLoading } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const [appReady, setAppReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  
  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(prefersDark ? 'dark' : 'light');
    
    const initializeApp = async () => {
      try {
        setLoading(true);
        setInitError(null);
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        
        if (session?.user) {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();
            
          if (error) throw error;
          
          if (data) {
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              firstName: data.first_name || '',
              lastName: data.last_name || '',
              avatarUrl: data.avatar_url,
              role: data.role || 'employee',
              departmentId: data.department_id,
              createdAt: data.created_at,
              updatedAt: data.updated_at
            });
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (error: any) {
        console.error('Error initializing app:', error);
        setInitError(error.message);
        setUser(null);
      } finally {
        setLoading(false);
        setTimeout(() => setAppReady(true), 300);
      }
    };

    initializeApp();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();
            
          if (error) throw error;
          
          if (data) {
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              firstName: data.first_name || '',
              lastName: data.last_name || '',
              avatarUrl: data.avatar_url,
              role: data.role || 'employee',
              departmentId: data.department_id,
              createdAt: data.created_at,
              updatedAt: data.updated_at
            });
          } else {
            setUser(null);
          }
        } catch (error: any) {
          console.error('Error during auth state change:', error);
          setInitError(error.message);
          setUser(null);
        } finally {
          setLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (!appReady || isLoading) {
    return <LoadingScreen error={initError} />;
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          user ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      
      {/* Auth Routes */}
      <Route path="/" element={<AuthLayout />}>
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
      </Route>
      
      {/* App Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="projects" element={<Projects />} />
        <Route path="departments" element={<Departments />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="profile" element={<Profile />} />
      </Route>
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

interface ProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default App;