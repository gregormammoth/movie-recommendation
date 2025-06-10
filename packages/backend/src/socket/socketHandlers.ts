import { Server, Socket } from 'socket.io';
import { ChatService } from '../services/ChatService';
import { MessageType } from '../entities/Message';

interface ClientToServerEvents {
  join_room: (data: { roomId: string; userId: string }) => void;
  leave_room: (data: { roomId: string }) => void;
  send_message: (data: { roomId: string; userId: string; content: string }) => void;
  create_room: (data: { userId: string; name: string; description?: string }) => void;
  get_rooms: (data: { userId: string }) => void;
  get_messages: (data: { roomId: string }) => void;
}

interface ServerToClientEvents {
  room_joined: (data: { roomId: string }) => void;
  room_left: (data: { roomId: string }) => void;
  new_message: (data: { 
    id: string; 
    content: string; 
    type: MessageType; 
    userId: string; 
    username: string;
    createdAt: string; 
  }) => void;
  ai_message: (data: { 
    id: string; 
    content: string; 
    type: MessageType; 
    userId: string; 
    username: string;
    createdAt: string; 
  }) => void;
  room_created: (data: { id: string; name: string; description?: string }) => void;
  rooms_list: (data: any[]) => void;
  messages_list: (data: any[]) => void;
  error: (data: { message: string }) => void;
}

interface InterServerEvents {}

interface SocketData {
  userId?: string;
  username?: string;
}

export function setupSocketHandlers(io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>) {
  io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>) => {
    console.log('User connected:', socket.id);
    
    // Create ChatService instance for this connection
    const chatService = new ChatService();

    // Join a chat room
    socket.on('join_room', async (data) => {
      try {
        const { roomId, userId } = data;
        socket.join(roomId);
        socket.data.userId = userId;
        
        // Get user info and store username
        const user = await chatService.createUser(`user_${userId}`);
        socket.data.username = user.username;
        
        socket.emit('room_joined', { roomId });
        console.log(`User ${userId} joined room ${roomId}`);
      } catch (error) {
        console.error('Error joining room:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Leave a chat room
    socket.on('leave_room', (data) => {
      const { roomId } = data;
      socket.leave(roomId);
      socket.emit('room_left', { roomId });
      console.log(`User left room ${roomId}`);
    });

    // Send a message
    socket.on('send_message', async (data) => {
      try {
        const { roomId, userId, content } = data;
        
        // Save user message
        const userMessage = await chatService.saveMessage(userId, roomId, content, MessageType.USER);
        const user = await chatService.createUser(`user_${userId}`);
        
        // Emit user message to room
        io.to(roomId).emit('new_message', {
          id: userMessage.id,
          content: userMessage.content,
          type: userMessage.type,
          userId: userMessage.userId,
          username: user.username,
          createdAt: userMessage.createdAt.toISOString(),
        });

        // Get chat history and generate AI response
        const chatHistory = await chatService.getChatRoomMessages(roomId);
        const aiResponse = await chatService.generateAIResponse(content, chatHistory);
        
        // Ensure AI assistant user exists before saving message
        const aiUser = await chatService.ensureAIAssistantUser();
        
        // Save AI message
        const aiMessage = await chatService.saveMessage(aiUser.id, roomId, aiResponse, MessageType.AI);
        
        // Emit AI response to room
        setTimeout(() => {
          io.to(roomId).emit('ai_message', {
            id: aiMessage.id,
            content: aiMessage.content,
            type: aiMessage.type,
            userId: aiUser.id,
            username: aiUser.username,
            createdAt: aiMessage.createdAt.toISOString(),
          });
        }, 1000); // Add slight delay for more natural feel

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Create a new chat room
    socket.on('create_room', async (data) => {
      try {
        const { userId, name, description } = data;
        const chatRoom = await chatService.createChatRoom(userId, name, description);
        
        socket.emit('room_created', {
          id: chatRoom.id,
          name: chatRoom.name,
          description: chatRoom.description,
        });
      } catch (error) {
        console.error('Error creating room:', error);
        socket.emit('error', { message: 'Failed to create room' });
      }
    });

    // Get user's chat rooms
    socket.on('get_rooms', async (data) => {
      try {
        const { userId } = data;
        const rooms = await chatService.getUserChatRooms(userId);
        
        socket.emit('rooms_list', rooms.map(room => ({
          id: room.id,
          name: room.name,
          description: room.description,
          createdAt: room.createdAt,
          updatedAt: room.updatedAt,
          messageCount: room.messages?.length || 0,
        })));
      } catch (error) {
        console.error('Error getting rooms:', error);
        socket.emit('error', { message: 'Failed to get rooms' });
      }
    });

    // Get messages for a chat room
    socket.on('get_messages', async (data) => {
      try {
        const { roomId } = data;
        const messages = await chatService.getChatRoomMessages(roomId);
        
        socket.emit('messages_list', messages.map(message => ({
          id: message.id,
          content: message.content,
          type: message.type,
          userId: message.userId,
          username: message.user?.username || (message.type === MessageType.AI ? 'AI Assistant' : 'Unknown User'),
          createdAt: message.createdAt.toISOString(),
        })));
      } catch (error) {
        console.error('Error getting messages:', error);
        socket.emit('error', { message: 'Failed to get messages' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
} 