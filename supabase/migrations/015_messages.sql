-- Conversations table (1-on-1 only for now)
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  participant_1 uuid not null references profiles(id) on delete cascade,
  participant_2 uuid not null references profiles(id) on delete cascade,
  last_message_at timestamptz default now(),
  created_at timestamptz default now(),
  constraint unique_conversation unique (participant_1, participant_2),
  constraint no_self_chat check (participant_1 <> participant_2)
);

-- Always store with participant_1 < participant_2 to enforce uniqueness
-- We'll handle ordering in application code

-- Messages table
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  content text not null check (char_length(content) > 0 and char_length(content) <= 5000),
  read_at timestamptz,
  created_at timestamptz default now()
);

-- Indexes
create index idx_messages_conversation on messages(conversation_id, created_at);
create index idx_conversations_participant_1 on conversations(participant_1);
create index idx_conversations_participant_2 on conversations(participant_2);
create index idx_messages_sender on messages(sender_id);

-- RLS
alter table conversations enable row level security;
alter table messages enable row level security;

-- Conversations: users can see their own conversations
create policy "Users can view own conversations"
  on conversations for select
  using (auth.uid() = participant_1 or auth.uid() = participant_2);

create policy "Users can create conversations"
  on conversations for insert
  with check (auth.uid() = participant_1 or auth.uid() = participant_2);

create policy "Users can update own conversations"
  on conversations for update
  using (auth.uid() = participant_1 or auth.uid() = participant_2);

-- Messages: users can see messages in their conversations
create policy "Users can view messages in own conversations"
  on messages for select
  using (
    exists (
      select 1 from conversations c
      where c.id = messages.conversation_id
      and (c.participant_1 = auth.uid() or c.participant_2 = auth.uid())
    )
  );

create policy "Users can send messages in own conversations"
  on messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from conversations c
      where c.id = messages.conversation_id
      and (c.participant_1 = auth.uid() or c.participant_2 = auth.uid())
    )
  );

create policy "Users can update own messages"
  on messages for update
  using (
    auth.uid() = sender_id
    or exists (
      select 1 from conversations c
      where c.id = messages.conversation_id
      and (c.participant_1 = auth.uid() or c.participant_2 = auth.uid())
    )
  );

-- Enable realtime for messages
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table conversations;
