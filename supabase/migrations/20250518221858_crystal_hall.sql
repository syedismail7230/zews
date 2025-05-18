/*
  # Add admin features and initial admin users

  1. New Tables
    - `salaries`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `amount` (decimal)
      - `effective_date` (timestamp)
      - `end_date` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      
    - `leaves`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `type` (leave_type)
      - `start_date` (timestamp)
      - `end_date` (timestamp)
      - `status` (leave_status)
      - `reason` (text)
      - `approved_by` (uuid, foreign key)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      
    - `performance_reviews`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `reviewer_id` (uuid, foreign key)
      - `review_date` (timestamp)
      - `rating` (integer)
      - `comments` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all new tables
    - Add admin-specific policies
    - Create initial admin users
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

-- Function to create admin user
CREATE OR REPLACE FUNCTION create_admin_user(
  email TEXT,
  password TEXT,
  first_name TEXT,
  last_name TEXT
) RETURNS void AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Create auth user
  new_user_id := (SELECT id FROM auth.users WHERE auth.users.email = create_admin_user.email);
  
  IF new_user_id IS NULL THEN
    new_user_id := (
      SELECT id FROM auth.users
      WHERE id = (
        INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
        VALUES (
          email,
          crypt(password, gen_salt('bf')),
          NOW(),
          '{"provider":"email","providers":["email"]}',
          jsonb_build_object('first_name', first_name, 'last_name', last_name)
        )
        RETURNING id
      )
    );
  END IF;

  -- Create user profile
  INSERT INTO user_profiles (id, email, first_name, last_name, role)
  VALUES (new_user_id, email, first_name, last_name, 'admin')
  ON CONFLICT (id) DO UPDATE
  SET role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create initial admin users
SELECT create_admin_user('syed', 'Riwa$$0909', 'Syed', 'Admin');
SELECT create_admin_user('ahmed', 'Riwa$$2209', 'Ahmed', 'Admin');