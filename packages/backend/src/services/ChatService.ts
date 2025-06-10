import { Repository } from 'typeorm';
import { AppDataSource } from '../index';
import { User } from '../entities/User';
import { ChatRoom } from '../entities/ChatRoom';
import { Message, MessageType } from '../entities/Message';
import { v4 as uuidv4 } from 'uuid';
import { OpenAIService } from './OpenAIService';
import { LangchainAIService } from './LangchainAIService';
import { UserService } from './UserService';

export class ChatService {
  private userRepository?: Repository<User>;
  private chatRoomRepository?: Repository<ChatRoom>;
  private messageRepository?: Repository<Message>;
  private openaiService: OpenAIService;
  private langchainAI: LangchainAIService;
  private userService: UserService;

  constructor() {
    this.openaiService = new OpenAIService();
    this.langchainAI = new LangchainAIService();
    this.userService = new UserService();
  }

  private getUserRepository(): Repository<User> {
    if (!this.userRepository) {
      this.userRepository = AppDataSource.getRepository(User);
    }
    return this.userRepository;
  }

  private getChatRoomRepository(): Repository<ChatRoom> {
    if (!this.chatRoomRepository) {
      this.chatRoomRepository = AppDataSource.getRepository(ChatRoom);
    }
    return this.chatRoomRepository;
  }

  private getMessageRepository(): Repository<Message> {
    if (!this.messageRepository) {
      this.messageRepository = AppDataSource.getRepository(Message);
    }
    return this.messageRepository;
  }

  async createUser(username: string, email?: string): Promise<User> {
    // Use the new UserService for user creation, but maintain backward compatibility
    const result = await this.userService.createUser({ username, email });
    
    if (result.success && result.user) {
      // Fetch the full User entity to maintain compatibility
      const userRepo = this.getUserRepository();
      const user = await userRepo.findOne({ where: { id: result.user.id } });
      return user!;
    } else {
      // For backward compatibility, if user already exists, return it
      const userRepo = this.getUserRepository();
      const existingUser = await userRepo.findOne({ where: { username } });
      if (existingUser) {
        return existingUser;
      }
      throw new Error(`Failed to create user: ${result.errors?.map(e => e.message).join(', ')}`);
    }
  }

  /**
   * Ensures the AI assistant user exists in the database
   */
  async ensureAIAssistantUser(): Promise<User> {
    const userRepo = this.getUserRepository();
    
    // Check if AI assistant user already exists
    let aiUser = await userRepo.findOne({ where: { username: 'ai-assistant' } });
    
    if (!aiUser) {
      // Create the AI assistant user
      try {
        console.log('Creating AI Assistant user...');
        const result = await this.userService.createUser({ 
          username: 'ai-assistant',
          email: 'ai@vibe-coding.com'
        });
        
        if (result.success && result.user) {
          aiUser = await userRepo.findOne({ where: { id: result.user.id } });
          console.log('AI Assistant user created successfully:', result.user.id);
          
          // Migrate any existing AI messages that might have the old string userId
          await this.migrateAIMessages(result.user.id);
        } else {
          throw new Error('Failed to create AI assistant user');
        }
      } catch (error) {
        console.error('Error creating AI assistant user:', error);
        // Fallback: create directly with repository if UserService fails
        aiUser = userRepo.create({
          username: 'ai-assistant',
          email: 'ai@vibe-coding.com',
        });
        aiUser = await userRepo.save(aiUser);
        console.log('AI Assistant user created via fallback method:', aiUser.id);
        
        // Migrate any existing AI messages
        await this.migrateAIMessages(aiUser.id);
      }
    }
    
    return aiUser!;
  }

  /**
   * Migrates any existing AI messages that might have the old 'ai-assistant' string as userId
   */
  private async migrateAIMessages(aiUserId: string): Promise<void> {
    try {
      const messageRepo = this.getMessageRepository();
      
      // Find messages with the old 'ai-assistant' string userId
      const oldAIMessages = await messageRepo.find({
        where: { userId: 'ai-assistant', type: MessageType.AI }
      });
      
      if (oldAIMessages.length > 0) {
        console.log(`Migrating ${oldAIMessages.length} AI messages to new user ID...`);
        
        // Update each message to use the proper AI user ID
        for (const message of oldAIMessages) {
          message.userId = aiUserId;
        }
        
        await messageRepo.save(oldAIMessages);
        console.log('AI messages migration completed successfully');
      }
    } catch (error) {
      console.error('Error migrating AI messages:', error);
      // Don't throw error as this is not critical for app functionality
    }
  }

  async createChatRoom(userId: string, name: string, description?: string): Promise<ChatRoom> {
    const chatRoomRepo = this.getChatRoomRepository();
    const chatRoom = chatRoomRepo.create({
      userId,
      name,
      description,
    });

    return await chatRoomRepo.save(chatRoom);
  }

  async getUserChatRooms(userId: string): Promise<ChatRoom[]> {
    const chatRoomRepo = this.getChatRoomRepository();
    return await chatRoomRepo.find({
      where: { userId, isActive: true },
      relations: ['messages'],
      order: { updatedAt: 'DESC' },
    });
  }

  async getChatRoomMessages(chatRoomId: string): Promise<Message[]> {
    const messageRepo = this.getMessageRepository();
    return await messageRepo.find({
      where: { chatRoomId },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  }

  async saveMessage(
    userId: string,
    chatRoomId: string,
    content: string,
    type: MessageType = MessageType.USER
  ): Promise<Message> {
    const messageRepo = this.getMessageRepository();
    const message = messageRepo.create({
      userId,
      chatRoomId,
      content,
      type,
    });

    return await messageRepo.save(message);
  }

  async generateAIResponse(userMessage: string, chatHistory: Message[]): Promise<string> {
    // Try Langchain with Groq first if configured
    console.log('Langchain AI service configured:', this.langchainAI.isConfigured());
    console.log('OpenAI service configured:', this.openaiService.isAvailable());
    if (this.langchainAI.isConfigured()) {
      try {
        console.log('Using Langchain AI service with Groq...');
        return await this.langchainAI.generateMovieRecommendation(userMessage, chatHistory);
      } catch (error) {
        console.error('Langchain AI service failed, falling back to OpenAI:', error);
      }
    }

    // Fallback to OpenAI
    if (this.openaiService.isAvailable()) {
      try {
        console.log('Using OpenAI service...');
        return await this.openaiService.generateMovieRecommendation(userMessage, chatHistory);
      } catch (error) {
        console.error('Error generating AI response with OpenAI:', error);
      }
    }
      
    // Final fallback response
    return `I'm sorry, I'm having trouble connecting to my AI services right now. Here are some popular movie recommendations:

**The Shawshank Redemption (1994)** - A powerful story of hope and friendship
**Inception (2010)** - Mind-bending sci-fi thriller by Christopher Nolan  
**Spirited Away (2001)** - Beautiful animated film from Studio Ghibli
**Parasite (2019)** - Brilliant Korean thriller about class and society

What type of movies do you usually enjoy?`;
  }

  // Get AI service status for debugging
  getAIServiceStatus(): { langchain: boolean; openai: boolean; activeService: string } {
    const langchainConfigured = this.langchainAI.isConfigured();
    const openaiConfigured = this.openaiService.isAvailable();
    
    let activeService = 'none';
    if (langchainConfigured) activeService = 'langchain-groq';
    else if (openaiConfigured) activeService = 'openai';

    return {
      langchain: langchainConfigured,
      openai: openaiConfigured,
      activeService,
    };
  }
}