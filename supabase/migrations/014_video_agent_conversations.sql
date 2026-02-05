-- Video Agent Conversations
-- Stores chat conversations from the video agent assistant

CREATE TABLE video_agent_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  idea_id UUID REFERENCES broadcast_ideas(id) ON DELETE SET NULL,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE video_agent_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES video_agent_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  suggestions JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_vac_user ON video_agent_conversations(user_id);
CREATE INDEX idx_vac_idea ON video_agent_conversations(idea_id);
CREATE INDEX idx_vac_updated ON video_agent_conversations(updated_at DESC);
CREATE INDEX idx_vam_conversation ON video_agent_messages(conversation_id);
CREATE INDEX idx_vam_created ON video_agent_messages(created_at);

-- Auto-update updated_at on conversations when messages are added
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE video_agent_conversations SET updated_at = NOW() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_timestamp
  AFTER INSERT ON video_agent_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- RLS
ALTER TABLE video_agent_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_agent_messages ENABLE ROW LEVEL SECURITY;

-- Conversations: users can only access their own
CREATE POLICY "Users can view own conversations"
  ON video_agent_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations"
  ON video_agent_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
  ON video_agent_conversations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations"
  ON video_agent_conversations FOR DELETE
  USING (auth.uid() = user_id);

-- Messages: users can access messages in their own conversations
CREATE POLICY "Users can view own conversation messages"
  ON video_agent_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM video_agent_conversations
      WHERE id = video_agent_messages.conversation_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own conversation messages"
  ON video_agent_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM video_agent_conversations
      WHERE id = video_agent_messages.conversation_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own conversation messages"
  ON video_agent_messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM video_agent_conversations
      WHERE id = video_agent_messages.conversation_id
      AND user_id = auth.uid()
    )
  );
