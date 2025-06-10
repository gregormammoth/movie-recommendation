import { Router } from 'express';
import { ChatService } from '../services/ChatService';

const router = Router();

// Helper function to get ChatService instance
const getChatService = () => new ChatService();

// Get all chat rooms for a user
router.get('/rooms/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const chatService = getChatService();
    const rooms = await chatService.getUserChatRooms(userId);
    res.json(rooms);
  } catch (error) {
    console.error('Error fetching chat rooms:', error);
    res.status(500).json({ error: 'Failed to fetch chat rooms' });
  }
});

// Create a new chat room
router.post('/rooms', async (req, res) => {
  try {
    const { userId, name, description } = req.body;
    
    if (!userId || !name) {
      return res.status(400).json({ error: 'userId and name are required' });
    }

    const chatService = getChatService();
    const chatRoom = await chatService.createChatRoom(userId, name, description);
    res.status(201).json(chatRoom);
  } catch (error) {
    console.error('Error creating chat room:', error);
    res.status(500).json({ error: 'Failed to create chat room' });
  }
});

// Get messages for a chat room
router.get('/rooms/:roomId/messages', async (req, res) => {
  try {
    const { roomId } = req.params;
    const chatService = getChatService();
    const messages = await chatService.getChatRoomMessages(roomId);
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Create a user
router.post('/users', async (req, res) => {
  try {
    const { username, email } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: 'username is required' });
    }

    const chatService = getChatService();
    const user = await chatService.createUser(username, email);
    res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

export default router; 