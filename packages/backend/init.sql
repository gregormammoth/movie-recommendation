-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for message types
CREATE TYPE message_type AS ENUM ('user', 'ai', 'system');

-- Create User table
CREATE TABLE "user" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255),
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create ChatRoom table  
CREATE TABLE "chat_room" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "userId" UUID NOT NULL,
    CONSTRAINT "FK_chat_room_user" FOREIGN KEY ("userId") REFERENCES "user"(id) ON DELETE CASCADE
);

-- Create Message table
CREATE TABLE "message" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    type message_type DEFAULT 'user',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "userId" UUID NOT NULL,
    "chatRoomId" UUID NOT NULL,
    CONSTRAINT "FK_message_user" FOREIGN KEY ("userId") REFERENCES "user"(id) ON DELETE CASCADE,
    CONSTRAINT "FK_message_chat_room" FOREIGN KEY ("chatRoomId") REFERENCES "chat_room"(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX "IDX_user_username" ON "user"("username");
CREATE INDEX "IDX_chat_room_user_id" ON "chat_room"("userId");
CREATE INDEX "IDX_chat_room_is_active" ON "chat_room"("isActive");
CREATE INDEX "IDX_message_user_id" ON "message"("userId");
CREATE INDEX "IDX_message_chat_room_id" ON "message"("chatRoomId");
CREATE INDEX "IDX_message_created_at" ON "message"("createdAt");
CREATE INDEX "IDX_message_type" ON "message"("type");

-- Create function to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updatedAt
CREATE TRIGGER update_user_updated_at 
    BEFORE UPDATE ON "user" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_room_updated_at 
    BEFORE UPDATE ON "chat_room" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing
INSERT INTO "user" (id, username, email) VALUES 
    ('ai-assistant', 'AI Assistant', 'ai@vibe-coding.com'),
    (uuid_generate_v4(), 'demo_user', 'demo@example.com');

-- Insert a sample chat room
INSERT INTO "chat_room" (id, name, description, "userId") VALUES 
    (uuid_generate_v4(), 'Movie Recommendations', 'Get AI-powered movie recommendations', (SELECT id FROM "user" WHERE username = 'demo_user'));

-- Add some sample messages
WITH demo_room AS (
    SELECT id as room_id FROM "chat_room" WHERE name = 'Movie Recommendations' LIMIT 1
),
demo_user AS (
    SELECT id as user_id FROM "user" WHERE username = 'demo_user' LIMIT 1
),
ai_user AS (
    SELECT id as user_id FROM "user" WHERE username = 'AI Assistant' LIMIT 1
)
INSERT INTO "message" (content, type, "userId", "chatRoomId") VALUES 
    ('Hello! Can you recommend some good sci-fi movies?', 'user', (SELECT user_id FROM demo_user), (SELECT room_id FROM demo_room)),
    ('I''d be happy to help you with sci-fi movie recommendations! Here are some excellent options: 1) **Blade Runner 2049** - A visually stunning sequel that explores themes of identity and humanity. 2) **Arrival** - A thought-provoking film about communication with aliens. 3) **Ex Machina** - A psychological thriller about AI and consciousness. 4) **Interstellar** - Epic space exploration with emotional depth. What type of sci-fi are you in the mood for?', 'ai', (SELECT user_id FROM ai_user), (SELECT room_id FROM demo_room));

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_app_user; 