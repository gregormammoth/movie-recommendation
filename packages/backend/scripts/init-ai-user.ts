import { AppDataSource } from '../src/index';
import { ChatService } from '../src/services/ChatService';

async function initAIUser() {
  try {
    console.log('Initializing database connection...');
    await AppDataSource.initialize();
    console.log('Database connection established');

    console.log('Creating/ensuring AI Assistant user...');
    const chatService = new ChatService();
    const aiUser = await chatService.ensureAIAssistantUser();
    
    console.log('AI Assistant user initialized successfully:');
    console.log('- ID:', aiUser.id);
    console.log('- Username:', aiUser.username);
    console.log('- Email:', aiUser.email);
    console.log('- Created At:', aiUser.createdAt);
    console.log('- Is Active:', aiUser.isActive);

  } catch (error) {
    console.error('Error initializing AI user:', error);
    process.exit(1);
  } finally {
    console.log('Closing database connection...');
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    console.log('Script completed');
    process.exit(0);
  }
}

// Run the script
initAIUser(); 