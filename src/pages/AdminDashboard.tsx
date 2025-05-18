import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import {
  Users,
  Building2,
  DollarSign,
  Calendar,
  Star,
  BarChart,
  Plus,
  Search,
  Edit,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { formatDate } from '@/lib/utils';

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('employees');
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [performanceReviews, setPerformanceReviews] = useState([]);

  useEffect(() => {
    if (user?.role !== 'admin') {
      window.location.href = '/dashboard';
      return;
    }

    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch employees
      const { data: employeesData } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch departments
      const { data: departmentsData } = await supabase
        .from('departments')
        .select('*')
        .order('name');

      // Fetch salaries
      const { data: salariesData } = await supabase
        .from('salaries')
        .select('*, user_profiles(first_name, last_name)')
        .order('created_at', { ascending: false });

      // Fetch leaves
      const { data: leavesData } = await supabase
        .from('leaves')
        .select('*, user_profiles(first_name, last_name)')
        .order('created_at', { ascending: false });

      // Fetch performance reviews
      const { data: reviewsData } = await supabase
        .from('performance_reviews')
        .select('*, user_profiles!performance_reviews_user_id_fkey(first_name, last_name), user_profiles!performance_reviews_reviewer_id_fkey(first_name, last_name)')
        .order('review_date', { ascending: false });

      setEmployees(employeesData || []);
      setDepartments(departmentsData || []);
      setSalaries(salariesData || []);
      setLeaves(leavesData || []);
      setPerformanceReviews(reviewsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    switch (activeTab) {
      case 'employees':
        return (
          <div className="bg-card rounded-lg border border-border">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <h3 className="font-semibold">Employees</h3>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" /> Add Employee
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4">Name</th>
                    <th className="text-left p-4">Email</th>
                    <th className="text-left p-4">Role</th>
                    <th className="text-left p-4">Department</th>
                    <th className="text-left p-4">Joined</th>
                    <th className="text-right p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp: any) => (
                    <tr key={emp.id} className="border-b border-border hover:bg-muted/50">
                      <td className="p-4">{emp.first_name} {emp.last_name}</td>
                      <td className="p-4">{emp.email}</td>
                      <td className="p-4 capitalize">{emp.role}</td>
                      <td className="p-4">{emp.department_id || 'Unassigned'}</td>
                      <td className="p-4">{formatDate(emp.created_at, 'PP')}</td>
                      <td className="p-4 text-right">
                        <Button variant="ghost" size="sm" className="mr-2">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'departments':
        return (
          <div className="bg-card rounded-lg border border-border">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <h3 className="font-semibold">Departments</h3>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" /> Add Department
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4">Name</th>
                    <th className="text-left p-4">Description</th>
                    <th className="text-left p-4">Manager</th>
                    <th className="text-left p-4">Parent Department</th>
                    <th className="text-right p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((dept: any) => (
                    <tr key={dept.id} className="border-b border-border hover:bg-muted/50">
                      <td className="p-4">{dept.name}</td>
                      <td className="p-4">{dept.description || 'No description'}</td>
                      <td className="p-4">{dept.manager_id || 'Unassigned'}</td>
                      <td className="p-4">{dept.parent_department_id || 'None'}</td>
                      <td className="p-4 text-right">
                        <Button variant="ghost" size="sm" className="mr-2">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'salaries':
        return (
          <div className="bg-card rounded-lg border border-border">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <h3 className="font-semibold">Salaries</h3>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" /> Add Salary Record
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4">Employee</th>
                    <th className="text-left p-4">Amount</th>
                    <th className="text-left p-4">Effective Date</th>
                    <th className="text-left p-4">End Date</th>
                    <th className="text-right p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {salaries.map((salary: any) => (
                    <tr key={salary.id} className="border-b border-border hover:bg-muted/50">
                      <td className="p-4">
                        {salary.user_profiles.first_name} {salary.user_profiles.last_name}
                      </td>
                      <td className="p-4">${salary.amount}</td>
                      <td className="p-4">{formatDate(salary.effective_date, 'PP')}</td>
                      <td className="p-4">{salary.end_date ? formatDate(salary.end_date, 'PP') : 'Current'}</td>
                      <td className="p-4 text-right">
                        <Button variant="ghost" size="sm" className="mr-2">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'leaves':
        return (
          <div className="bg-card rounded-lg border border-border">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold">Leave Requests</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4">Employee</th>
                    <th className="text-left p-4">Type</th>
                    <th className="text-left p-4">Duration</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Reason</th>
                    <th className="text-right p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.map((leave: any) => (
                    <tr key={leave.id} className="border-b border-border hover:bg-muted/50">
                      <td className="p-4">
                        {leave.user_profiles.first_name} {leave.user_profiles.last_name}
                      </td>
                      <td className="p-4 capitalize">{leave.type}</td>
                      <td className="p-4">
                        {formatDate(leave.start_date, 'PP')} - {formatDate(leave.end_date, 'PP')}
                      </td>
                      <td className="p-4 capitalize">{leave.status}</td>
                      <td className="p-4">{leave.reason}</td>
                      <td className="p-4 text-right">
                        <Button variant="ghost" size="sm" className="mr-2">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'performance':
        return (
          <div className="bg-card rounded-lg border border-border">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <h3 className="font-semibold">Performance Reviews</h3>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" /> Add Review
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4">Employee</th>
                    <th className="text-left p-4">Reviewer</th>
                    <th className="text-left p-4">Date</th>
                    <th className="text-left p-4">Rating</th>
                    <th className="text-left p-4">Comments</th>
                    <th className="text-right p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {performanceReviews.map((review: any) => (
                    <tr key={review.id} className="border-b border-border hover:bg-muted/50">
                      <td className="p-4">
                        {review.user_profiles.first_name} {review.user_profiles.last_name}
                      </td>
                      <td className="p-4">
                        {review.reviewer.first_name} {review.reviewer.last_name}
                      </td>
                      <td className="p-4">{formatDate(review.review_date, 'PP')}</td>
                      <td className="p-4">{review.rating}/5</td>
                      <td className="p-4">{review.comments}</td>
                      <td className="p-4 text-right">
                        <Button variant="ghost" size="sm" className="mr-2">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your organization</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveTab('employees')}
          className={`p-4 rounded-lg border ${
            activeTab === 'employees'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card border-border hover:bg-muted/50'
          }`}
        >
          <Users className="h-5 w-5 mb-2" />
          <h3 className="font-medium">Employees</h3>
          <p className="text-sm opacity-80">{employees.length} total</p>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveTab('departments')}
          className={`p-4 rounded-lg border ${
            activeTab === 'departments'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card border-border hover:bg-muted/50'
          }`}
        >
          <Building2 className="h-5 w-5 mb-2" />
          <h3 className="font-medium">Departments</h3>
          <p className="text-sm opacity-80">{departments.length} total</p>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveTab('salaries')}
          className={`p-4 rounded-lg border ${
            activeTab === 'salaries'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card border-border hover:bg-muted/50'
          }`}
        >
          <DollarSign className="h-5 w-5 mb-2" />
          <h3 className="font-medium">Salaries</h3>
          <p className="text-sm opacity-80">Manage payroll</p>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveTab('leaves')}
          className={`p-4 rounded-lg border ${
            activeTab === 'leaves'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card border-border hover:bg-muted/50'
          }`}
        >
          <Calendar className="h-5 w-5 mb-2" />
          <h3 className="font-medium">Leaves</h3>
          <p className="text-sm opacity-80">{leaves.length} requests</p>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveTab('performance')}
          className={`p-4 rounded-lg border ${
            activeTab === 'performance'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card border-border hover:bg-muted/50'
          }`}
        >
          <Star className="h-5 w-5 mb-2" />
          <h3 className="font-medium">Performance</h3>
          <p className="text-sm opacity-80">Review reports</p>
        </motion.button>
      </div>

      {renderContent()}
    </div>
  );
}