import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Department } from '@/lib/types';
import { Building2, Users, Plus, Search, User, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function Departments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name');
        
      if (error) throw error;
      if (data) {
        setDepartments(data as Department[]);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Filter departments based on search term
  const filteredDepartments = departments.filter((dept) =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Mock data if no real data is available
  const mockDepartments: Department[] = [
    {
      id: '1',
      name: 'Engineering',
      description: 'Software development and technical operations',
      managerId: '1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Marketing',
      description: 'Brand management and promotional activities',
      managerId: '2',
      parentDepartmentId: '1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '3',
      name: 'Human Resources',
      description: 'Employee management and recruitment',
      managerId: '3',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '4',
      name: 'Finance',
      description: 'Budgeting, accounting and financial planning',
      managerId: '4',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '5',
      name: 'Product Management',
      description: 'Product strategy and roadmap planning',
      managerId: '5',
      parentDepartmentId: '1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
  
  const displayDepartments = filteredDepartments.length > 0 ? filteredDepartments : mockDepartments.filter((dept) =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Departments</h1>
          <p className="text-muted-foreground">Manage organizational structure</p>
        </div>
        <Button className="shrink-0">
          <Plus className="mr-2 h-4 w-4" /> New Department
        </Button>
      </div>
      
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search departments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 py-2 px-3 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full flex justify-center py-12">
            <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : (
          <>
            {displayDepartments.map((department) => (
              <motion.div
                key={department.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-card rounded-lg border border-border shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-5 border-b border-border">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="bg-primary/10 p-2 rounded">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="font-semibold truncate">{department.name}</h3>
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {department.description || 'No description provided.'}
                  </p>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-muted-foreground">
                        <User className="h-4 w-4 mr-2" />
                        <span>Manager ID: {department.managerId || 'Unassigned'}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-muted-foreground">
                        <Users className="h-4 w-4 mr-2" />
                        <span>Employees: 12</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-muted-foreground">
                        <Building2 className="h-4 w-4 mr-2" />
                        <span>Parent: {department.parentDepartmentId ? 'Yes' : 'None'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between pt-4 mt-2 border-t border-border">
                    <Button variant="outline" size="sm">
                      <Users className="mr-2 h-4 w-4" />
                      View Members
                    </Button>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </>
        )}
        
        {!loading && displayDepartments.length === 0 && (
          <div className="col-span-full bg-card rounded-lg border border-border shadow-sm p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-muted rounded-full">
                <Building2 className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
            <h3 className="text-lg font-medium mb-2">No departments found</h3>
            <p className="text-muted-foreground mb-4">
              Get started by creating your first department
            </p>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Create Department
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}