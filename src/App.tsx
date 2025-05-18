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
  
  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(prefersDark ? 'dark' : 'light');
    
    const fetchUser = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        if (session?.user) {
          // Get user profile data with retries
          let profileData = null;
          let retries = 3;
          
          while (retries > 0 && !profileData) {
            const { data, error: profileError } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();
              
            if (!profileError && data) {
              profileData = data;
              break;
            }
            
            retries--;
            if (retries > 0) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
            
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            firstName: profileData?.first_name || session.user.user_metadata?.first_name || '',
            lastName: profileData?.last_name || session.user.user_metadata?.last_name || '',
            avatarUrl: profileData?.avatar_url,
            role: profileData?.role || 'employee',
            departmentId: profileData?.department_id,
            createdAt: profileData?.created_at || session.user.created_at,
            updatedAt: profileData?.updated_at || session.user.updated_at
          });
        }
      } catch (error) {
        console.error('Error fetching user session:', error);
      } finally {
        setLoading(false);
        setAppReady(true);
      }
    };

    fetchUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Get user profile data with retries
        let profileData = null;
        let retries = 3;
        
        while (retries > 0 && !profileData) {
          const { data, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();
            
          if (!profileError && data) {
            profileData = data;
            break;
          }
          
          retries--;
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
          
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          firstName: profileData?.first_name || session.user.user_metadata?.first_name || '',
          lastName: profileData?.last_name || session.user.user_metadata?.last_name || '',
          avatarUrl: profileData?.avatar_url,
          role: profileData?.role || 'employee',
          departmentId: profileData?.department_id,
          createdAt: profileData?.created_at || session.user.created_at,
          updatedAt: profileData?.updated_at || session.user.updated_at
        });
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (!appReady || isLoading) {
    return <LoadingScreen />;
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