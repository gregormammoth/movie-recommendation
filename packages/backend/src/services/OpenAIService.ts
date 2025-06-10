import OpenAI from 'openai';
import { Message, MessageType } from '../entities/Message';

export class OpenAIService {
  private openai: OpenAI | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initializeOpenAI();
  }

  private initializeOpenAI(): void {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.warn('OpenAI API key not found in environment variables. OpenAI service will be disabled.');
      this.isConfigured = false;
      return;
    }

    if (apiKey.trim() === '') {
      console.warn('OpenAI API key is empty. OpenAI service will be disabled.');
      this.isConfigured = false;
      return;
    }

    try {
      this.openai = new OpenAI({
        apiKey: apiKey,
      });
      this.isConfigured = true;
      console.log('OpenAI service initialized successfully.');
    } catch (error) {
      console.error('Failed to initialize OpenAI service:', error);
      this.isConfigured = false;
    }
  }

  public isAvailable(): boolean {
    return this.isConfigured && this.openai !== null;
  }

  public async generateMovieRecommendation(userMessage: string, chatHistory: Message[]): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('OpenAI service is not available. Please check your API key configuration.');
    }

    try {
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

      const response = await this.openai!.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages,
        max_tokens: 500,
        temperature: 0.7,
      });

      return response.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
    } catch (error) {
      console.error('Error generating AI response with OpenAI:', error);
      
      if (error instanceof Error) {
        // Check for specific OpenAI errors
        if (error.message.includes('Invalid API key')) {
          throw new Error('Invalid OpenAI API key. Please check your configuration.');
        }
        if (error.message.includes('quota')) {
          throw new Error('OpenAI API quota exceeded. Please check your billing.');
        }
      }
      
      throw new Error('Failed to generate response with OpenAI.');
    }
  }

  public getServiceInfo(): { provider: string; model: string; configured: boolean } {
    return {
      provider: 'OpenAI',
      model: 'gpt-3.5-turbo',
      configured: this.isAvailable(),
    };
  }

  public validateApiKey(): { valid: boolean; message: string } {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return {
        valid: false,
        message: 'OPENAI_API_KEY environment variable is not set'
      };
    }
    
    if (apiKey.trim() === '') {
      return {
        valid: false,
        message: 'OPENAI_API_KEY environment variable is empty'
      };
    }
    
    if (!apiKey.startsWith('sk-')) {
      return {
        valid: false,
        message: 'OPENAI_API_KEY appears to be invalid (should start with sk-)'
      };
    }
    
    return {
      valid: true,
      message: 'OpenAI API key format is valid'
    };
  }
} 