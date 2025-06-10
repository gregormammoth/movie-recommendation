import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { DataSource } from 'typeorm';
import { User } from './entities/User';
import { ChatRoom } from './entities/ChatRoom';
import { Message } from './entities/Message';
import { setupSocketHandlers } from './socket/socketHandlers';
import chatRoutes from './routes/chatRoutes';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database configuration
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'vibe_coding',
  synchronize: true,
  logging: true,
  entities: [User, ChatRoom, Message],
  migrations: ['src/migrations/**/*.ts'],
});

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Vibe Coding API' });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: AppDataSource.isInitialized ? 'connected' : 'disconnected'
  });
});

// AI service status endpoint
app.get('/api/ai-status', (req, res) => {
  const { ChatService } = require('./services/ChatService');
  const chatService = new ChatService();
  const status = chatService.getAIServiceStatus();
  
  res.json({
    ...status,
    availableModels: {
      groq: 'mixtral-8x7b-32768',
      openai: 'gpt-3.5-turbo'
    }
  });
});

// API routes
app.use('/api/chat', chatRoutes);

// Socket.IO handlers
setupSocketHandlers(io);

// Initialize database and start server
AppDataSource.initialize()
  .then(() => {
    console.log('Database connection established');
    httpServer.listen(port, () => {
      console.log(`Server is running on port ${port}`);
      console.log(`Socket.IO server is running`);
    });
  })
  .catch((error) => {
    console.error('Error during Data Source initialization:', error);
  }); 