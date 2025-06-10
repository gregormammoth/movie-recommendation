import { Repository } from 'typeorm';
import { AppDataSource } from '../index';
import { User } from '../entities/User';
import { ChatRoom } from '../entities/ChatRoom';
import { Message, MessageType } from '../entities/Message';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';
import { LangchainAIService } from './LangchainAIService';

export class ChatService {
  private userRepository?: Repository<User>;
  private chatRoomRepository?: Repository<ChatRoom>;
  private messageRepository?: Repository<Message>;
  private openai: OpenAI;
  private langchainAI: LangchainAIService;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    this.langchainAI = new LangchainAIService();
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
    const userRepo = this.getUserRepository();
    const existingUser = await userRepo.findOne({ where: { username } });
    if (existingUser) {
      return existingUser;
    }

    const user = userRepo.create({
      username,
      email,
    });

    return await userRepo.save(user);
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
    if (this.langchainAI.isConfigured()) {
      try {
        console.log('Using Langchain AI service with Groq...');
        return await this.langchainAI.generateMovieRecommendation(userMessage, chatHistory);
      } catch (error) {
        console.error('Langchain AI service failed, falling back to OpenAI:', error);
      }
    }

    // Fallback to OpenAI
    try {
      console.log('Using OpenAI service...');
      const messages = [
        {
          role: 'system' as const,
          content: `You are a helpful movie recommendation assistant with deep knowledge of cinema across all genres, eras, and cultures. 
          Your role is to provide personalized, insightful movie recommendations based on user preferences.

          Guidelines for your responses:
          - Always provide specific movie titles with release years
          - Include brief, compelling descriptions that highlight what makes each movie special
          - Consider the user's mood, preferences, and previous conversation context
          - Suggest 2-4 movies per response unless asked for more
          - Include diverse options when possible (different genres, eras, countries)
          - Be conversational and enthusiastic about movies
          - Ask follow-up questions to better understand preferences

          Format your recommendations clearly with:
          - **Movie Title (Year)** - Brief description
          - Include director for notable films
          - Mention key actors if relevant
          - Explain why it fits their request`
        },
        ...chatHistory.slice(-10).map(msg => ({
          role: msg.type === MessageType.USER ? 'user' as const : 'assistant' as const,
          content: msg.content
        })),
        {
          role: 'user' as const,
          content: userMessage
        }
      ];

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages,
        max_tokens: 500,
        temperature: 0.7,
      });

      return response.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
    } catch (error) {
      console.error('Error generating AI response with OpenAI:', error);
      
      // Final fallback response
      return `I'm sorry, I'm having trouble connecting to my AI services right now. Here are some popular movie recommendations:

**The Shawshank Redemption (1994)** - A powerful story of hope and friendship
**Inception (2010)** - Mind-bending sci-fi thriller by Christopher Nolan  
**Spirited Away (2001)** - Beautiful animated film from Studio Ghibli
**Parasite (2019)** - Brilliant Korean thriller about class and society

What type of movies do you usually enjoy?`;
    }
  }

  // Get AI service status for debugging
  getAIServiceStatus(): { langchain: boolean; openai: boolean; activeService: string } {
    const langchainConfigured = this.langchainAI.isConfigured();
    const openaiConfigured = !!process.env.OPENAI_API_KEY;
    
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