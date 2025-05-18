import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuthStore, useThemeStore } from './lib/store';
import { supabase } from './lib/supabase';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
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

const PROFILE_FETCH_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function fetchUserProfile(userId: string, retries = PROFILE_FETCH_RETRIES): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;

    return data || {
      id: userId,
      first_name: '',
      last_name: '',
      avatar_url: null,
      role: 'employee',
      department_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return fetchUserProfile(userId, retries - 1);
    }
    throw error;
  }
}

function App() {
  const { user, setUser, is

Loading, setLoading } = useAuthStore();
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
            const profile = await fetchUserProfile(session.user.id);
            
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              firstName: profile.first_name || '',
              lastName: profile.last_name || '',
              avatarUrl: profile.avatar_url,
              role: profile.role || 'employee',
              departmentId: profile.department_id,
              createdAt: profile.created_at,
              updatedAt: profile.updated_at
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
          const profile = await fetchUserProfile(session.user.id);
          
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            firstName: profile.first_name || '',
            lastName: profile.last_name || '',
            avatarUrl: profile.avatar_url,
            role: profile.role || 'employee',
            departmentId: profile.department_id,
            createdAt: profile.created_at,
            updatedAt: profile.updated_at
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
            user.role === 'admin' ? (
              <Navigate to="/admin" replace />
            ) : (
              <Navigate to="/dashboard" replace />
            )
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
      
      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <DashboardLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
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

function AdminRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export default App;