-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create allowed emails table
CREATE TABLE allowed_emails (
  email TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  added_at TIMESTAMP DEFAULT NOW()
);

-- Insert the two allowed emails
INSERT INTO allowed_emails (email, name) VALUES
  ('sinharonitraj@gmail.com', 'Ronit'),
  ('radhikadidwania567@gmail.com', 'Radhika');

-- Function to check if current user is allowed
CREATE OR REPLACE FUNCTION is_allowed_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM allowed_emails 
    WHERE email = auth.email()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user email
CREATE OR REPLACE FUNCTION current_user_email()
RETURNS TEXT AS $$
BEGIN
  RETURN auth.email();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_allowed_user() TO authenticated;
GRANT EXECUTE ON FUNCTION current_user_email() TO authenticated;

-- Enable RLS on allowed_emails
ALTER TABLE allowed_emails ENABLE ROW LEVEL SECURITY;

-- Policy for allowed_emails (read-only for authenticated users)
CREATE POLICY "allow_read_whitelist" ON allowed_emails
  FOR SELECT
  USING (is_allowed_user());