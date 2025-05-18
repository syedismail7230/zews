/*
  # Add HR management tables and initial admin users

  1. New Tables
    - `salaries`
      - Track employee salaries with history
    - `leaves`
      - Manage employee leave requests
    - `performance_reviews`
      - Store employee performance reviews
      
  2. Security
    - Enable RLS on all new tables
    - Add appropriate policies for admins and users
    
  3. Initial Data
    - Create admin users with proper credentials
*/

-- Create enum types
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'leave_type') THEN
    CREATE TYPE leave_type AS ENUM ('annual', 'sick', 'personal', 'unpaid');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'leave_status') THEN
    CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected');
  END IF;
END$$;

-- Create salaries table
CREATE TABLE IF NOT EXISTS salaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  effective_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create leaves table
CREATE TABLE IF NOT EXISTS leaves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  type leave_type NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status leave_status NOT NULL DEFAULT 'pending',
  reason TEXT,
  approved_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create performance_reviews table
CREATE TABLE IF NOT EXISTS performance_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  review_date TIMESTAMPTZ NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE salaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_reviews ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for salaries
CREATE POLICY "Admins can manage salaries"
  ON salaries FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can view their own salary"
  ON salaries FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Create RLS policies for leaves
CREATE POLICY "Admins can manage leaves"
  ON leaves FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can view and create their own leaves"
  ON leaves FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own leaves"
  ON leaves FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create RLS policies for performance_reviews
CREATE POLICY "Admins can manage performance reviews"
  ON performance_reviews FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can view their own reviews"
  ON performance_reviews FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Create triggers for timestamp updates
CREATE TRIGGER set_timestamp_salaries
  BEFORE UPDATE ON salaries
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER set_timestamp_leaves
  BEFORE UPDATE ON leaves
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER set_timestamp_performance_reviews
  BEFORE UPDATE ON performance_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

-- Create initial admin users
DO $$
DECLARE
  syed_id UUID;
  ahmed_id UUID;
BEGIN
  -- Create first admin user
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'syed@example.com',
    crypt('Riwa$$0909', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"first_name":"Syed","last_name":"Admin"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  )
  RETURNING id INTO syed_id;

  -- Create second admin user
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'ahmed@example.com',
    crypt('Riwa$$2209', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"first_name":"Ahmed","last_name":"Admin"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  )
  RETURNING id INTO ahmed_id;

  -- Create admin profiles
  INSERT INTO user_profiles (id, email, first_name, last_name, role)
  VALUES 
    (syed_id, 'syed@example.com', 'Syed', 'Admin', 'admin'),
    (ahmed_id, 'ahmed@example.com', 'Ahmed', 'Admin', 'admin')
  ON CONFLICT (id) DO UPDATE
  SET role = 'admin';
END
$$;