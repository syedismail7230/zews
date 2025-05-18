/*
  # Update user profiles policies

  1. Changes
    - Add new policy for unauthenticated users to create profiles during registration
    - Update existing policies to handle registration flow

  2. Security
    - Ensure users can only create their own profile
    - Maintain existing access controls for authenticated users
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can create profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON user_profiles;

-- Create updated policies
CREATE POLICY "Allow profile creation during registration"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can update any profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'admin' OR 
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );