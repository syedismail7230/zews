import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { Task, Project, TaskStatus, TaskPriority } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { 
  LayoutDashboard, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  BarChart3,
  Users,
  CalendarRange,
  ArrowUpRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function Dashboard() {
  const { user } = useAuthStore();
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [activeProjects, setActiveProjects] = useState<Project[]>([]);
  const [taskStatusData, setTaskStatusData] = useState<any[]>([]);
  const [taskPriorityData, setTaskPriorityData] = useState<any[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  
  // Dashboard stats
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    activeProjects: 0
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      setStatsLoading(true);
      try {
        // Fetch recent tasks
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);
          
        if (tasksError) throw tasksError;
        
        // Fetch active projects
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('*')
          .eq('status', 'active')
          .limit(5);
          
        if (projectsError) throw projectsError;
        
        // Fetch task status counts for charts
        const { data: statusData, error: statusError } = await supabase
          .rpc('get_task_status_counts');
          
        if (statusError) throw statusError;
        
        // Fetch task priority counts for charts
        const { data: priorityData, error: priorityError } = await supabase
          .rpc('get_task_priority_counts');
          
        if (priorityError) throw priorityError;
        
        // Fetch stats
        const today = new Date().toISOString();
        
        const { data: taskStats, error: statsError } = await supabase
          .rpc('get_dashboard_stats');
          
        if (statsError) throw statsError;
        
        // Set all the data
        if (tasksData) {
          setRecentTasks(tasksData as Task[]);
        }
        
        if (projectsData) {
          setActiveProjects(projectsData as Project[]);
        }
        
        if (statusData) {
          const formattedStatusData = [
            { name: 'To Do', value: statusData.find((s: any) => s.status === 'todo')?.count || 0 },
            { name: 'In Progress', value: statusData.find((s: any) => s.status === 'in_progress')?.count || 0 },
            { name: 'Review', value: statusData.find((s: any) => s.status === 'review')?.count || 0 },
            { name: 'Done', value: statusData.find((s: any) => s.status === 'done')?.count || 0 },
            { name: 'Blocked', value: statusData.find((s: any) => s.status === 'blocked')?.count || 0 },
          ];
          setTaskStatusData(formattedStatusData);
        }
        
        if (priorityData) {
          const formattedPriorityData = [
            { name: 'Low', value: priorityData.find((p: any) => p.priority === 'low')?.count || 0 },
            { name: 'Medium', value: priorityData.find((p: any) => p.priority === 'medium')?.count || 0 },
            { name: 'High', value: priorityData.find((p: any) => p.priority === 'high')?.count || 0 },
            { name: 'Critical', value: priorityData.find((p: any) => p.priority === 'critical')?.count || 0 },
          ];
          setTaskPriorityData(formattedPriorityData);
        }
        
        if (taskStats) {
          setStats({
            totalTasks: taskStats.total_tasks || 0,
            completedTasks: taskStats.completed_tasks || 0,
            overdueTasks: taskStats.overdue_tasks || 0,
            activeProjects: taskStats.active_projects || 0
          });
        }
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setStatsLoading(false);
      }
    };
    
    fetchDashboardData();
    
    // Set up realtime subscriptions for tasks and projects
    const tasksSubscription = supabase
      .channel('tasks_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
        // Handle tasks changes in real-time
        fetchDashboardData();
      })
      .subscribe();
      
    const projectsSubscription = supabase
      .channel('projects_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, (payload) => {
        // Handle projects changes in real-time
        fetchDashboardData();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(tasksSubscription);
      supabase.removeChannel(projectsSubscription);
    };
  }, [user]);
  
  // For the pie chart
  const COLORS = ['#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE', '#EFF6FF'];
  const PRIORITY_COLORS = {
    low: '#22C55E',    // green
    medium: '#F59E0B',  // amber
    high: '#F97316',    // orange
    critical: '#EF4444' // red
  };
  
  const priorityColorMap = {
    [TaskPriority.LOW]: 'bg-success text-success-foreground',
    [TaskPriority.MEDIUM]: 'bg-warning text-warning-foreground',
    [TaskPriority.HIGH]: 'bg-accent text-accent-foreground',
    [TaskPriority.CRITICAL]: 'bg-destructive text-destructive-foreground',
  };
  
  const statusColorMap = {
    [TaskStatus.TODO]: 'bg-muted text-muted-foreground',
    [TaskStatus.IN_PROGRESS]: 'bg-primary text-primary-foreground',
    [TaskStatus.REVIEW]: 'bg-secondary text-secondary-foreground',
    [TaskStatus.DONE]: 'bg-success text-success-foreground',
    [TaskStatus.BLOCKED]: 'bg-destructive text-destructive-foreground',
  };
  
  // For demo data
  const mockData = {
    recentTasks: [
      { 
        id: '1', 
        title: 'Update user onboarding flow', 
        status: TaskStatus.IN_PROGRESS, 
        priority: TaskPriority.HIGH,
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdById: '1'
      },
      { 
        id: '2', 
        title: 'Fix login page responsiveness', 
        status: TaskStatus.TODO, 
        priority: TaskPriority.MEDIUM,
        dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdById: '1'
      },
      { 
        id: '3', 
        title: 'Implement dashboard analytics', 
        status: TaskStatus.REVIEW, 
        priority: TaskPriority.CRITICAL,
        dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdById: '1'
      },
    ],
    activeProjects: [
      {
        id: '1',
        name: 'Platform Redesign',
        status: 'active',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        managerId: '1',
        departmentId: '1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Mobile App Development',
        status: 'active',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        managerId: '1',
        departmentId: '1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    taskStatusData: [
      { name: 'To Do', value: 8 },
      { name: 'In Progress', value: 5 },
      { name: 'Review', value: 3 },
      { name: 'Done', value: 12 },
      { name: 'Blocked', value: 2 },
    ],
    taskPriorityData: [
      { name: 'Low', value: 7, color: PRIORITY_COLORS.low },
      { name: 'Medium', value: 10, color: PRIORITY_COLORS.medium },
      { name: 'High', value: 8, color: PRIORITY_COLORS.high },
      { name: 'Critical', value: 5, color: PRIORITY_COLORS.critical },
    ],
    stats: {
      totalTasks: 30,
      completedTasks: 12,
      overdueTasks: 3,
      activeProjects: 5
    }
  };

  // Use real data if available, otherwise use mock data
  const displayTasks = recentTasks.length > 0 ? recentTasks : mockData.recentTasks;
  const displayProjects = activeProjects.length > 0 ? activeProjects : mockData.activeProjects;
  const displayTaskStatusData = taskStatusData.length > 0 ? taskStatusData : mockData.taskStatusData;
  const displayTaskPriorityData = taskPriorityData.length > 0 ? taskPriorityData : mockData.taskPriorityData;
  const displayStats = statsLoading ? mockData.stats : stats;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.firstName || 'User'}</p>
        </div>
        <Button variant="outline" className="gap-2">
          <CalendarRange className="h-4 w-4" />
          <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </Button>
      </div>

      {/* Stats cards */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
      >
        <div className="bg-card rounded-lg p-5 border border-border shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Total Tasks</p>
              <h3 className="text-2xl font-semibold mt-1">{displayStats.totalTasks}</h3>
            </div>
            <div className="p-2 bg-primary/10 rounded-full">
              <LayoutDashboard className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center text-success">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              3.2% from last week
            </span>
          </div>
        </div>

        <div className="bg-card rounded-lg p-5 border border-border shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Completed Tasks</p>
              <h3 className="text-2xl font-semibold mt-1">{displayStats.completedTasks}</h3>
            </div>
            <div className="p-2 bg-success/10 rounded-full">
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center text-success">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              5.3% from last week
            </span>
          </div>
        </div>

        <div className="bg-card rounded-lg p-5 border border-border shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Overdue Tasks</p>
              <h3 className="text-2xl font-semibold mt-1">{displayStats.overdueTasks}</h3>
            </div>
            <div className="p-2 bg-destructive/10 rounded-full">
              <AlertCircle className="h-5 w-5 text-destructive" />
            </div>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center text-destructive">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              1.5% from last week
            </span>
          </div>
        </div>

        <div className="bg-card rounded-lg p-5 border border-border shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Active Projects</p>
              <h3 className="text-2xl font-semibold mt-1">{displayStats.activeProjects}</h3>
            </div>
            <div className="p-2 bg-secondary/10 rounded-full">
              <Users className="h-5 w-5 text-secondary" />
            </div>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center text-success">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              2.1% from last month
            </span>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Task status chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-card rounded-lg p-5 border border-border shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Task Status</h3>
            <Button variant="ghost" size="sm" className="text-xs">
              <BarChart3 className="h-4 w-4 mr-1" /> View Details
            </Button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={displayTaskStatusData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Task priority chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-card rounded-lg p-5 border border-border shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Task Priority</h3>
            <Button variant="ghost" size="sm" className="text-xs">
              <BarChart3 className="h-4 w-4 mr-1" /> View Details
            </Button>
          </div>
          <div className="h-64 flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={displayTaskPriorityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {displayTaskPriorityData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color || COLORS[index % COLORS.length]} 
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent tasks */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-card rounded-lg border border-border shadow-sm"
        >
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h3 className="font-semibold">Recent Tasks</h3>
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </div>
          <div className="divide-y divide-border">
            {displayTasks.map((task) => (
              <div key={task.id} className="p-4 hover:bg-muted/40 transition-colors">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{task.title}</h4>
                  <div className={`px-2 py-1 rounded-full text-xs ${priorityColorMap[task.priority]}`}>
                    {task.priority}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>Due {formatDate(task.dueDate || '', 'MMM d')}</span>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs ${statusColorMap[task.status]}`}>
                    {task.status}
                  </div>
                </div>
              </div>
            ))}
            {displayTasks.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                No tasks found. Create your first task to get started.
              </div>
            )}
          </div>
        </motion.div>

        {/* Active projects */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-card rounded-lg border border-border shadow-sm"
        >
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h3 className="font-semibold">Active Projects</h3>
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </div>
          <div className="divide-y divide-border">
            {displayProjects.map((project) => (
              <div key={project.id} className="p-4 hover:bg-muted/40 transition-colors">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{project.name}</h4>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <CalendarRange className="h-3 w-3 mr-1" />
                    <span>{formatDate(project.startDate, 'MMM d')} - {project.endDate ? formatDate(project.endDate, 'MMM d') : 'Ongoing'}</span>
                  </div>
                  <div className="px-2 py-1 bg-secondary/10 text-secondary text-xs rounded-full">
                    Active
                  </div>
                </div>
              </div>
            ))}
            {displayProjects.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                No active projects. Start a new project to see it here.
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}