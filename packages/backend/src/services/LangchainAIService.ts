import { ChatGroq } from '@langchain/groq';
import { ChatPromptTemplate, HumanMessagePromptTemplate, SystemMessagePromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { Message, MessageType } from '../entities/Message';

export class LangchainAIService {
  private model: ChatGroq;
  private outputParser: StringOutputParser;

  constructor() {
    this.model = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      temperature: 0.7,
      maxTokens: 1000,
    });
    
    this.outputParser = new StringOutputParser();
  }

  async generateMovieRecommendation(userMessage: string, chatHistory: Message[]): Promise<string> {
    try {
      // Create the system prompt for movie recommendations
      const systemPrompt = SystemMessagePromptTemplate.fromTemplate(`
        You are an expert movie recommendation assistant with deep knowledge of cinema across all genres, eras, and cultures. 
        Your role is to provide personalized, insightful movie recommendations based on user preferences.

        Guidelines for your responses:
        - Always provide specific movie titles with release years
        - Include brief, compelling descriptions that highlight what makes each movie special
        - Consider the user's mood, preferences, and previous conversation context
        - Suggest 2-4 movies per response unless asked for more
        - Include diverse options when possible (different genres, eras, countries)
        - Mention where users might watch the movies if you know
        - Be conversational and enthusiastic about movies
        - Ask follow-up questions to better understand preferences
        - Provide context about why you're recommending specific movies

        Format your recommendations clearly with:
        - **Movie Title (Year)** - Brief description
        - Include director for notable films
        - Mention key actors if relevant
        - Explain why it fits their request

        Remember: You're not just listing movies, you're curating experiences and helping users discover films they'll love.
      `);

      const humanPrompt = HumanMessagePromptTemplate.fromTemplate(`
        Here's the conversation history for context:
        {chatHistory}

        Current user message: {userMessage}

        Please provide movie recommendations based on this request and conversation context.
      `);

      const chatPrompt = ChatPromptTemplate.fromMessages([
        systemPrompt,
        humanPrompt,
      ]);

      // Format chat history for context
      const formattedHistory = chatHistory
        .slice(-6) // Take last 6 messages for context
        .map(msg => `${msg.type === MessageType.USER ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n');

      // Create the chain
      const chain = chatPrompt.pipe(this.model).pipe(this.outputParser);

      // Generate response
      const response = await chain.invoke({
        chatHistory: formattedHistory,
        userMessage: userMessage,
      });

      return response.trim();

    } catch (error) {
      console.error('Error generating movie recommendation with Langchain:', error);
      
      // Fallback response
      return `I'm sorry, I encountered an error while generating your movie recommendation. Please try asking again! 

In the meantime, here are some universally acclaimed films you might enjoy:

**The Shawshank Redemption (1994)** - A powerful story of hope and friendship in the most unlikely place
**Spirited Away (2001)** - Studio Ghibli's magical masterpiece about a girl's journey in a spirit world
**Parasite (2019)** - Bong Joon-ho's brilliant dark comedy-thriller about class and society

What type of mood are you in for a movie today?`;
    }
  }

  async generateResponse(userMessage: string, chatHistory: Message[], context?: string): Promise<string> {
    try {
      const systemPrompt = SystemMessagePromptTemplate.fromTemplate(`
        You are a helpful AI assistant specialized in movie recommendations and cinema knowledge.
        You're part of the "Vibe Coding" movie recommendation system.
        
        Your personality:
        - Friendly and enthusiastic about movies
        - Knowledgeable about cinema from all eras and cultures
        - Great at understanding user preferences and moods
        - Conversational and engaging
        
        Additional context: {context}
      `);

      const humanPrompt = HumanMessagePromptTemplate.fromTemplate(`
        Conversation history:
        {chatHistory}

        User message: {userMessage}
      `);

      const chatPrompt = ChatPromptTemplate.fromMessages([
        systemPrompt,
        humanPrompt,
      ]);

      const formattedHistory = chatHistory
        .slice(-8)
        .map(msg => `${msg.type === MessageType.USER ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n');

      const chain = chatPrompt.pipe(this.model).pipe(this.outputParser);

      const response = await chain.invoke({
        chatHistory: formattedHistory,
        userMessage: userMessage,
        context: context || 'General movie discussion and recommendations',
      });

      return response.trim();

    } catch (error) {
      console.error('Error generating AI response with Langchain:', error);
      return 'Sorry, I encountered an error. Please try again!';
    }
  }

  // Method to check if the service is properly configured
  isConfigured(): boolean {
    return !!process.env.GROQ_API_KEY;
  }

  // Get available models info
  getModelInfo(): { model: string; provider: string; configured: boolean } {
    return {
      model: 'mixtral-8x7b-32768',
      provider: 'Groq',
      configured: this.isConfigured(),
    };
  }
} 