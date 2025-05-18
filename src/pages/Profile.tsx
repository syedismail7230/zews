import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';
import { 
  User as UserIcon, 
  Mail, 
  Building2,
  Calendar,
  Shield,
  Edit3,
  Save,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function Profile() {
  const { user, setUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (!user) throw new Error('User not authenticated');

      // Update user profile in database
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Update local user state
      setUser({
        ...user,
        firstName: formData.firstName,
        lastName: formData.lastName,
      });

      setSuccess('Profile updated successfully');
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    // Reset form data to current user data
    if (user) {
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      });
    }
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Profile</h1>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>
            <Edit3 className="mr-2 h-4 w-4" /> Edit Profile
          </Button>
        ) : (
          <div className="flex space-x-2">
            <Button variant="ghost" onClick={cancelEditing}>
              <X className="mr-2 h-4 w-4" /> Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={loading}>
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Save Changes
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-md bg-destructive/10 border border-destructive/30 text-destructive"
        >
          {error}
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-md bg-success/10 border border-success/30 text-success"
        >
          {success}
        </motion.div>
      )}

      <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
        <div className="md:flex">
          {/* Profile Sidebar */}
          <div className="p-6 md:w-1/3 bg-card md:border-r border-border flex flex-col items-center justify-start">
            <div className="mb-4">
              <Avatar className="h-24 w-24 border-4 border-background">
                {user?.avatarUrl ? (
                  <AvatarImage src={user.avatarUrl} alt={user.firstName} />
                ) : (
                  <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
                    {getInitials(user?.firstName, user?.lastName)}
                  </AvatarFallback>
                )}
              </Avatar>
            </div>
            <h2 className="text-xl font-semibold text-center mb-1">
              {user?.firstName} {user?.lastName}
            </h2>
            <p className="text-muted-foreground text-center mb-4 capitalize">{user?.role}</p>
            
            <div className="w-full space-y-3 mt-4">
              <div className="flex items-center p-2 rounded-md hover:bg-muted/50">
                <Mail className="h-5 w-5 mr-3 text-muted-foreground" />
                <span className="text-sm truncate">{user?.email}</span>
              </div>
              
              <div className="flex items-center p-2 rounded-md hover:bg-muted/50">
                <Building2 className="h-5 w-5 mr-3 text-muted-foreground" />
                <span className="text-sm">
                  Department ID: {user?.departmentId || 'Unassigned'}
                </span>
              </div>
              
              <div className="flex items-center p-2 rounded-md hover:bg-muted/50">
                <Shield className="h-5 w-5 mr-3 text-muted-foreground" />
                <span className="text-sm capitalize">{user?.role} Access</span>
              </div>
              
              <div className="flex items-center p-2 rounded-md hover:bg-muted/50">
                <Calendar className="h-5 w-5 mr-3 text-muted-foreground" />
                <span className="text-sm">
                  Joined: {user?.createdAt ? formatDate(user.createdAt, 'MMM d, yyyy') : 'Unknown'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Profile Details/Form */}
          <div className="p-6 md:w-2/3">
            <h3 className="text-lg font-semibold mb-4">{isEditing ? 'Edit Profile' : 'Profile Details'}</h3>
            
            {isEditing ? (
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium mb-1">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background"
                  />
                </div>
                
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium mb-1">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-1">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    value={formData.email}
                    disabled
                    className="w-full px-3 py-2 border border-input rounded-md bg-muted text-muted-foreground"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Email cannot be changed
                  </p>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">First Name</p>
                    <p className="font-medium">{user?.firstName}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Last Name</p>
                    <p className="font-medium">{user?.lastName}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Email Address</p>
                  <p className="font-medium">{user?.email}</p>
                </div>
                
                <div className="pt-4 border-t border-border space-y-4">
                  <h3 className="text-lg font-semibold">Role & Permissions</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Role</p>
                      <p className="font-medium capitalize">{user?.role}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Department</p>
                      <p className="font-medium">{user?.departmentId || 'Unassigned'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-border space-y-4">
                  <h3 className="text-lg font-semibold">Account Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Account Created</p>
                      <p className="font-medium">{user?.createdAt ? formatDate(user.createdAt, 'PPP') : 'Unknown'}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Last Updated</p>
                      <p className="font-medium">{user?.updatedAt ? formatDate(user.updatedAt, 'PPP') : 'Never'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}