import { ChatGroq } from '@langchain/groq';
import { ChatPromptTemplate, HumanMessagePromptTemplate, SystemMessagePromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { Message, MessageType } from '../entities/Message';
import axios from 'axios';

interface SearchMoviesParams {
  query: string;
  language?: string;
  primary_release_year?: number;
  page?: number;
  region?: string;
  year?: number;
}

export class LangchainAIService {
  private model: ChatGroq;
  private outputParser: StringOutputParser;
  private tmdbAccessToken: string;
  private tmdbBaseUrl = 'https://api.themoviedb.org/3';

  constructor() {
    this.model = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      temperature: 0.7,
      maxTokens: 1000,
    });
    
    this.outputParser = new StringOutputParser();
    this.tmdbAccessToken = process.env.TMDB_ACESS_TOKEN || '';
  }

  private async extractSearchParams(userMessage: string): Promise<SearchMoviesParams> {
    const systemPrompt = SystemMessagePromptTemplate.fromTemplate(`
      You are an AI assistant that extracts movie search parameters from user messages.
      Extract the following parameters if present:
      - query: The main search term or movie title
      - year: Any specific year mentioned
      - language: Any language preference
      - region: Any specific region/country mentioned
      
      IMPORTANT: Return ONLY valid JSON, no additional text or explanation.
      Example response: {{"query": "action movies", "year": 2023}}
    `);

    const humanPrompt = HumanMessagePromptTemplate.fromTemplate(`
      Extract search parameters from this message and return only JSON:
      {userMessage}
    `);

    const chatPrompt = ChatPromptTemplate.fromMessages([
      systemPrompt,
      humanPrompt,
    ]);

    const chain = chatPrompt.pipe(this.model).pipe(this.outputParser);

    const response = await chain.invoke({
      userMessage: userMessage,
    });
    console.log('response', response);
    try {
      // Extract JSON from the response - find the first complete JSON object
      let jsonString = '';
      const startIndex = response.indexOf('{');
      
      if (startIndex === -1) {
        console.log('No JSON found in response, using fallback');
        return { query: userMessage };
      }
      
      // Find the matching closing brace
      let braceCount = 0;
      let endIndex = startIndex;
      
      for (let i = startIndex; i < response.length; i++) {
        if (response[i] === '{') braceCount++;
        if (response[i] === '}') braceCount--;
        
        if (braceCount === 0) {
          endIndex = i;
          break;
        }
      }
      
      jsonString = response.substring(startIndex, endIndex + 1);
      console.log('Extracted JSON:', jsonString);
      const params = JSON.parse(jsonString);
      
      return {
        query: params.query || userMessage,
        ...(params.year && { year: parseInt(params.year) }),
        ...(params.language && { language: params.language }),
        ...(params.region && { region: params.region }),
      };
    } catch (error) {
      console.error('Error parsing search params:', error);
      console.error('Raw response:', response);
      return { query: userMessage };
    }
  }

  private async searchMovies(params: SearchMoviesParams): Promise<any[]> {
    try {
      const response = await axios.get(`${this.tmdbBaseUrl}/search/movie`, {
        headers: {
          'Authorization': `Bearer ${this.tmdbAccessToken}`,
          'accept': 'application/json'
        },
        params: {
          query: params.query,
          include_adult: false,
          language: params.language || 'en-US',
          page: params.page || 1,
          ...(params.primary_release_year && { primary_release_year: params.primary_release_year }),
          ...(params.region && { region: params.region }),
          ...(params.year && { year: params.year })
        }
      });
      return response.data.results;
    } catch (error) {
      console.error('Error searching movies:', error);
      return [];
    }
  }

  private async getMovieDetails(movieId: number): Promise<any> {
    try {
      // Get movie details
      const movieResponse = await axios.get(`${this.tmdbBaseUrl}/movie/${movieId}`, {
        headers: {
          'Authorization': `Bearer ${this.tmdbAccessToken}`,
          'accept': 'application/json'
        },
        params: {
          language: 'en-US',
          append_to_response: 'credits'
        }
      });

      // Get director from credits
      const director = movieResponse.data.credits?.crew?.find((person: any) => person.job === 'Director')?.name;

      return {
        ...movieResponse.data,
        director
      };
    } catch (error) {
      console.error(`Error getting movie details for ID ${movieId}:`, error);
      return null;
    }
  }

  async generateMovieRecommendation(userMessage: string, chatHistory: Message[]): Promise<string> {
    try {
      // Extract search parameters from user message
      const searchParams = await this.extractSearchParams(userMessage);
      
      // Search for movies based on extracted parameters
      const searchResults = await this.searchMovies(searchParams);
      const movieDetails = await Promise.all(
        searchResults.slice(0, 4).map(movie => this.getMovieDetails(movie.id))
      );

      // Rest of the code remains the same...
      // Create the system prompt for movie recommendations
      const systemPrompt = SystemMessagePromptTemplate.fromTemplate(`
        You are an expert movie recommendation assistant with deep knowledge of cinema across all genres, eras, and cultures. 
        Your role is to provide personalized, insightful movie recommendations based on user preferences and the movie data provided.

        Here are the movies found from TMDB:
        {movieData}

        Guidelines for your responses:
        - Use the provided movie data to give accurate information
        - Include brief, compelling descriptions that highlight what makes each movie special
        - Consider the user's mood, preferences, and previous conversation context
        - Suggest 2-4 movies per response unless asked for more
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
        .slice(-6)
        .map(msg => `${msg.type === MessageType.USER ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n');

      // Format movie data for the prompt
      const movieData = movieDetails
        .filter((movie: any) => movie !== null)
        .map((movie: any) => `
          Title: ${movie.title}
          Year: ${movie.release_date?.split('-')[0]}
          Overview: ${movie.overview}
          Director: ${movie.director || 'Unknown'}
          Rating: ${movie.vote_average}/10
          Genres: ${movie.genres?.map((g: any) => g.name).join(', ')}
        `)
        .join('\n');

      console.log('movieData', movieData);

      // Create the chain
      const chain = chatPrompt.pipe(this.model).pipe(this.outputParser);

      // Generate response
      const response = await chain.invoke({
        chatHistory: formattedHistory,
        userMessage: userMessage,
        movieData: movieData || 'No specific movies found. Say that you are not able to find any movies for the user\'s request.'
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
    return !!process.env.GROQ_API_KEY && !!process.env.TMDB_API_KEY;
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