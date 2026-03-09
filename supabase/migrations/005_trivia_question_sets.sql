-- Trivia Question Sets Table
CREATE TABLE trivia_question_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  questions JSONB NOT NULL,
  created_by TEXT NOT NULL,
  created_for TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_creator CHECK (created_by IN ('sinharonitraj@gmail.com', 'radhikadidwania567@gmail.com')),
  CONSTRAINT valid_recipient CHECK (created_for IN ('sinharonitraj@gmail.com', 'radhikadidwania567@gmail.com'))
);

-- Enable RLS
ALTER TABLE trivia_question_sets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "whitelist_only" ON trivia_question_sets FOR ALL USING (is_allowed_user());

-- Indexes
CREATE INDEX idx_trivia_sets_created_by ON trivia_question_sets(created_by);
CREATE INDEX idx_trivia_sets_created_for ON trivia_question_sets(created_for);
CREATE INDEX idx_trivia_sets_created_at ON trivia_question_sets(created_at DESC);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_trivia_sets_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trivia_sets_update_timestamp
BEFORE UPDATE ON trivia_question_sets
FOR EACH ROW
EXECUTE FUNCTION update_trivia_sets_timestamp();