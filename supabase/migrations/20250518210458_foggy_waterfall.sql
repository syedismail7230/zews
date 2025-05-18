/*
  # Initial schema for Zawr Enterprise WorkSuite

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key)
      - `first_name` (text)
      - `last_name` (text)
      - `email` (text, unique)
      - `role` (text)
      - `department_id` (uuid, foreign key)
      - `avatar_url` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      
    - `departments`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `manager_id` (uuid, foreign key)
      - `parent_department_id` (uuid, foreign key, self-reference)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      
    - `projects`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `status` (text)
      - `start_date` (timestamp)
      - `end_date` (timestamp)
      - `manager_id` (uuid, foreign key)
      - `department_id` (uuid, foreign key)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      
    - `tasks`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `status` (text)
      - `priority` (text)
      - `due_date` (timestamp)
      - `assignee_id` (uuid, foreign key)
      - `project_id` (uuid, foreign key)
      - `parent_task_id` (uuid, foreign key, self-reference)
      - `created_by_id` (uuid, foreign key)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      
    - `notifications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `title` (text)
      - `message` (text)
      - `type` (text)
      - `is_read` (boolean)
      - `related_entity_id` (uuid)
      - `related_entity_type` (text)
      - `created_at` (timestamp)
      
  2. Security
    - Enable RLS on all tables
    - Add policies for each table to control access
    
  3. Functions
    - Create functions for dashboard statistics
    - Create functions for task status and priority counts
*/

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin', 'manager', 'employee', 'hr', 'department_head');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_status') THEN
    CREATE TYPE project_status AS ENUM ('planning', 'active', 'on_hold', 'completed', 'cancelled');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
    CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'review', 'done', 'blocked');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_priority') THEN
    CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'critical');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
    CREATE TYPE notification_type AS ENUM ('task', 'project', 'announcement', 'document', 'system');
  END IF;
END$$;

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'employee',
  department_id UUID,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  manager_id UUID,
  parent_department_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_parent_department FOREIGN KEY (parent_department_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  status project_status NOT NULL DEFAULT 'planning',
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  manager_id UUID,
  department_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_manager FOREIGN KEY (manager_id) REFERENCES user_profiles(id) ON DELETE SET NULL,
  CONSTRAINT fk_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  status task_status NOT NULL DEFAULT 'todo',
  priority task_priority NOT NULL DEFAULT 'medium',
  due_date TIMESTAMPTZ,
  assignee_id UUID,
  project_id UUID,
  parent_task_id UUID,
  created_by_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_assignee FOREIGN KEY (assignee_id) REFERENCES user_profiles(id) ON DELETE SET NULL,
  CONSTRAINT fk_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_parent_task FOREIGN KEY (parent_task_id) REFERENCES tasks(id) ON DELETE SET NULL,
  CONSTRAINT fk_created_by FOREIGN KEY (created_by_id) REFERENCES user_profiles(id) ON DELETE CASCADE
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type notification_type NOT NULL DEFAULT 'system',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  related_entity_id UUID,
  related_entity_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE
);

-- Add foreign key constraint to user_profiles
ALTER TABLE user_profiles 
ADD CONSTRAINT fk_department 
FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;

-- Add foreign key constraint to departments
ALTER TABLE departments 
ADD CONSTRAINT fk_manager 
FOREIGN KEY (manager_id) REFERENCES user_profiles(id) ON DELETE SET NULL;

-- Enable Row Level Security on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles
CREATE POLICY "Users can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can create profiles"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.jwt() ->> 'role' = 'admin' OR 
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can update any profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'admin' OR 
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );

-- Create RLS policies for departments
CREATE POLICY "Users can view departments"
  ON departments FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Admins and department heads can manage departments"
  ON departments FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'admin' OR
    (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'department_head')
  );

-- Create RLS policies for projects
CREATE POLICY "Users can view projects in their department"
  ON projects FOR SELECT
  TO authenticated
  USING (
    department_id IN (
      SELECT department_id FROM user_profiles WHERE id = auth.uid()
    ) OR
    auth.jwt() ->> 'role' = 'admin' OR
    (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'hr')
  );

CREATE POLICY "Managers can create and update projects"
  ON projects FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'admin' OR
    (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'manager', 'department_head') OR
    manager_id = auth.uid()
  );

-- Create RLS policies for tasks
CREATE POLICY "Users can view tasks assigned to them or created by them"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    assignee_id = auth.uid() OR
    created_by_id = auth.uid() OR
    auth.jwt() ->> 'role' = 'admin' OR
    (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'manager', 'department_head') OR
    project_id IN (
      SELECT id FROM projects WHERE manager_id = auth.uid()
    ) OR
    project_id IN (
      SELECT id FROM projects WHERE department_id IN (
        SELECT department_id FROM user_profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);

CREATE POLICY "Users can update their assigned tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (
    assignee_id = auth.uid() OR
    created_by_id = auth.uid() OR
    auth.jwt() ->> 'role' = 'admin' OR
    (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'manager', 'department_head') OR
    project_id IN (
      SELECT id FROM projects WHERE manager_id = auth.uid()
    )
  );

-- Create RLS policies for notifications
CREATE POLICY "Users can only view their own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Create functions for dashboard statistics
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS TABLE (
  total_tasks BIGINT,
  completed_tasks BIGINT,
  overdue_tasks BIGINT,
  active_projects BIGINT
) LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM tasks) AS total_tasks,
    (SELECT COUNT(*) FROM tasks WHERE status = 'done') AS completed_tasks,
    (SELECT COUNT(*) FROM tasks WHERE due_date < NOW() AND status != 'done') AS overdue_tasks,
    (SELECT COUNT(*) FROM projects WHERE status = 'active') AS active_projects;
END;
$$;

-- Create function for task status counts
CREATE OR REPLACE FUNCTION get_task_status_counts()
RETURNS TABLE (
  status TEXT,
  count BIGINT
) LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT t.status::TEXT, COUNT(*)
  FROM tasks t
  GROUP BY t.status
  ORDER BY t.status;
END;
$$;

-- Create function for task priority counts
CREATE OR REPLACE FUNCTION get_task_priority_counts()
RETURNS TABLE (
  priority TEXT,
  count BIGINT
) LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT t.priority::TEXT, COUNT(*)
  FROM tasks t
  GROUP BY t.priority
  ORDER BY t.priority;
END;
$$;

-- Create trigger for updating the 'updated_at' column
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables
CREATE TRIGGER set_timestamp_user_profiles
BEFORE UPDATE ON user_profiles
FOR EACH ROW
EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER set_timestamp_departments
BEFORE UPDATE ON departments
FOR EACH ROW
EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER set_timestamp_projects
BEFORE UPDATE ON projects
FOR EACH ROW
EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER set_timestamp_tasks
BEFORE UPDATE ON tasks
FOR EACH ROW
EXECUTE PROCEDURE update_timestamp();

-- Create trigger for task notifications
CREATE OR REPLACE FUNCTION create_task_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- When a task is assigned
  IF (NEW.assignee_id IS NOT NULL AND OLD.assignee_id IS NULL) OR 
     (NEW.assignee_id IS NOT NULL AND OLD.assignee_id != NEW.assignee_id) THEN
    INSERT INTO notifications (
      user_id, 
      title, 
      message, 
      type, 
      related_entity_id, 
      related_entity_type
    )
    VALUES (
      NEW.assignee_id,
      'New Task Assigned',
      'You have been assigned a new task: ' || NEW.title,
      'task',
      NEW.id,
      'tasks'
    );
  END IF;
  
  -- When a task status changes
  IF NEW.status != OLD.status THEN
    -- Notify the assignee
    IF NEW.assignee_id IS NOT NULL THEN
      INSERT INTO notifications (
        user_id, 
        title, 
        message, 
        type, 
        related_entity_id, 
        related_entity_type
      )
      VALUES (
        NEW.assignee_id,
        'Task Status Updated',
        'Task "' || NEW.title || '" status changed to ' || NEW.status,
        'task',
        NEW.id,
        'tasks'
      );
    END IF;
    
    -- Notify the creator if different from assignee
    IF NEW.created_by_id != NEW.assignee_id THEN
      INSERT INTO notifications (
        user_id, 
        title, 
        message, 
        type, 
        related_entity_id, 
        related_entity_type
      )
      VALUES (
        NEW.created_by_id,
        'Task Status Updated',
        'Task "' || NEW.title || '" status changed to ' || NEW.status,
        'task',
        NEW.id,
        'tasks'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER task_notification_trigger
AFTER INSERT OR UPDATE ON tasks
FOR EACH ROW
EXECUTE PROCEDURE create_task_notification();