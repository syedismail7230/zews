import { Outlet, Link } from 'react-router-dom';
import { Briefcase, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-muted flex flex-col md:flex-row">
      <div className="bg-primary text-primary-foreground md:w-1/2 flex flex-col justify-center p-8 md:p-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md mx-auto"
        >
          <div className="flex items-center space-x-3 mb-8">
            <div className="p-2 bg-white/10 rounded-lg">
              <Briefcase className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-bold">ZEWS</h1>
          </div>
          
          <h2 className="text-2xl md:text-4xl font-bold mb-4">Zawr Enterprise WorkSuite</h2>
          <p className="text-primary-foreground/80 mb-8">
            Comprehensive enterprise management solution with everything you need to run your organization efficiently.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="bg-white/10 p-2 rounded-full mt-1">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium">User & Role Management</h3>
                <p className="text-sm text-primary-foreground/70">
                  Granular RBAC with multi-department user roles
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="bg-white/10 p-2 rounded-full mt-1">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium">Project & Task Management</h3>
                <p className="text-sm text-primary-foreground/70">
                  Complete lifecycle management with dependencies and visualizations
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="bg-white/10 p-2 rounded-full mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bar-chart">
                  <line x1="12" x2="12" y1="20" y2="10"></line>
                  <line x1="18" x2="18" y1="20" y2="4"></line>
                  <line x1="6" x2="6" y1="20" y2="16"></line>
                </svg>
              </div>
              <div>
                <h3 className="font-medium">Analytics & Reporting</h3>
                <p className="text-sm text-primary-foreground/70">
                  Custom reports, dashboards, and real-time analytics
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <Outlet />
        </motion.div>
      </div>
    </div>
  );
}