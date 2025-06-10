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
    this.tmdbAccessToken = process.env.TMDB_ACCESS_TOKEN || '';
  }

  private async guessMovieTitles(userMessage: string): Promise<string[]> {
    const systemPrompt = SystemMessagePromptTemplate.fromTemplate(`
      You are an AI assistant that guesses potential movie titles based on user messages.
      If the user's message clearly refers to a specific movie, return only that movie title.
      For ambiguous requests, generate up to 10 potential movie titles.
      Return ONLY a JSON array of strings, no additional text.
      Example for specific movie: ["The Green Mile"]
      Example for ambiguous request: ["The Matrix", "Inception", "Interstellar"]
    `);

    const humanPrompt = HumanMessagePromptTemplate.fromTemplate(`
      Based on this message, guess up to 10 potential movie titles:
      {userMessage}
    `);

    const chatPrompt = ChatPromptTemplate.fromMessages([
      systemPrompt,
      humanPrompt,
    ]);

    const chain = chatPrompt.pipe(this.model).pipe(this.outputParser);

    try {
      const response = await chain.invoke({
        userMessage: userMessage,
      });

      const startIndex = response.indexOf('[');
      const endIndex = response.lastIndexOf(']') + 1;
      const jsonString = response.substring(startIndex, endIndex);
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Error guessing movie titles:', error);
      return [];
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
      // Guess potential movie titles
      const guessedTitles = await this.guessMovieTitles(userMessage);
      console.log('Guessed titles:', guessedTitles);

      // Search for each guessed title
      const allSearchResults = await Promise.all(
        guessedTitles.map(title => this.searchMovies({ query: title }))
      );
      // console.log('All search results:', allSearchResults);

      // Flatten and deduplicate results
      const uniqueMovies = Array.from(new Set(
        allSearchResults.flat().map(movie => movie.id)
      )).slice(0, 10);

      // Get details for each unique movie
      const movieDetails = await Promise.all(
        uniqueMovies.map(movieId => this.getMovieDetails(movieId))
      );
      console.log('Movie details:', movieDetails);

      const systemPrompt = SystemMessagePromptTemplate.fromTemplate(`
        You are an expert movie recommendation assistant. Based on the following movie data, provide personalized recommendations:

        {movieData}

        Guidelines:
        - Use only the provided movie data for information
        - Include brief descriptions from the movie data
        - Consider user's preferences and conversation context
        - Suggest 2-4 movies per response
        - Be conversational and enthusiastic
        - Ask follow-up questions to better understand preferences

        Format:
        - **Movie Title (Year)** - Overview from movie data
        - Include director from movie data
        - Include rating and genres from movie data
      `);

      const humanPrompt = HumanMessagePromptTemplate.fromTemplate(`
        Conversation history:
        {chatHistory}

        User message: {userMessage}

        Please provide movie recommendations based on this request and conversation context.
      `);

      const chatPrompt = ChatPromptTemplate.fromMessages([
        systemPrompt,
        humanPrompt,
      ]);

      const formattedHistory = chatHistory
        .slice(-6)
        .map(msg => `${msg.type === MessageType.USER ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n');

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

      if (!movieData) {
        return 'Sorry, no specific movies found in the database.';
      }

      const chain = chatPrompt.pipe(this.model).pipe(this.outputParser);

      const response = await chain.invoke({
        chatHistory: formattedHistory,
        userMessage: userMessage,
        movieData: movieData,
      });

      return response.trim();

    } catch (error) {
      console.error('Error generating movie recommendation:', error);
      return 'Sorry, I encountered an error while generating your movie recommendation. Please try asking again!';
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

  isConfigured(): boolean {
    return !!process.env.GROQ_API_KEY && !!process.env.TMDB_API_KEY;
  }

  getModelInfo(): { model: string; provider: string; configured: boolean } {
    return {
      model: 'mixtral-8x7b-32768',
      provider: 'Groq',
      configured: this.isConfigured(),
    };
  }
}