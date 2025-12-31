-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  location TEXT,
  image_url TEXT,
  event_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read events
CREATE POLICY "Anyone can view events"
  ON events
  FOR SELECT
  USING (true);

-- Policy: Only bertmill19@gmail.com can insert events
CREATE POLICY "Only bertmill19@gmail.com can create events"
  ON events
  FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'email' = 'bertmill19@gmail.com'
  );

-- Policy: Only bertmill19@gmail.com can update events
CREATE POLICY "Only bertmill19@gmail.com can update events"
  ON events
  FOR UPDATE
  USING (
    auth.jwt() ->> 'email' = 'bertmill19@gmail.com'
  );

-- Policy: Only bertmill19@gmail.com can delete events
CREATE POLICY "Only bertmill19@gmail.com can delete events"
  ON events
  FOR DELETE
  USING (
    auth.jwt() ->> 'email' = 'bertmill19@gmail.com'
  );

-- Create index for faster queries
CREATE INDEX events_start_time_idx ON events(start_time);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
