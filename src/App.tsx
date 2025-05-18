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
  const [initError, setInitError] = useState<string | null>(null);
  
  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(prefersDark ? 'dark' : 'light');
    
    const initializeApp = async () => {
      try {
        setLoading(true);
        setInitError(null);
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw new Error(`Session error: ${sessionError.message}`);
        }
        
        if (session?.user) {
          try {
            const { data, error } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
              
            if (error) {
              throw new Error(`Profile error: ${error.message}`);
            }
            
            if (!data) {
              throw new Error('User profile not found');
            }
            
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
          } catch (profileError: any) {
            console.error('Profile fetch error:', profileError);
            await supabase.auth.signOut();
            throw new Error('Failed to load user profile. Please sign in again.');
          }
        } else {
          setUser(null);
        }
      } catch (error: any) {
        console.error('App initialization error:', error);
        setInitError(error.message);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeApp();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event);
      
      if (event === 'SIGNED_IN' && session) {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (error) {
            throw new Error(`Profile error: ${error.message}`);
          }
          
          if (!data) {
            throw new Error('User profile not found');
          }
          
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
        } catch (error: any) {
          console.error('Auth state change error:', error);
          setInitError(error.message);
          setUser(null);
          await supabase.auth.signOut();
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

  if (isLoading) {
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