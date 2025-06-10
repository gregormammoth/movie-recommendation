# Movie Recommendation Chat

AI-powered movie recommendation system with real-time chat functionality.

## Features

- **Real-time Chat**: Multi-room chat with Socket.IO
- **AI Movie Recommendations**: Get personalized movie suggestions using OpenAI/Groq
- **User Management**: Account creation with real-time validation
- **Movie Search**: Powered by TMDB API
- **Responsive UI**: Modern React interface with Material-UI

## Tech Stack

- **Frontend**: React + TypeScript + Material-UI
- **Backend**: Node.js + Express + TypeORM
- **Database**: PostgreSQL
- **Real-time**: Socket.IO
- **AI**: OpenAI API + Groq API
- **Movie Data**: TMDB API
- **Deployment**: Docker + nginx

## Quick Start

### Prerequisites
- Docker (v20.10+)
- Docker Compose (v2.0+)

### Setup

1. **Clone the repository**
```bash
git clone [repository-url]
cd movie-recommendation
```

2. **Configure environment variables**
```bash
cp docker.env.example .env
```
Edit `.env` and add your API keys:
```env
GROQ_API_KEY=your_groq_api_key_here
OPENAI_API_KEY=your_openai_api_key_here  # Optional
TMDB_API_KEY=your_tmdb_api_key_here      # Optional
```

3. **Start the application**
```bash
docker-compose up -d
```

### Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Database**: localhost:5432

### Stopping the Application
```bash
docker-compose down
```

## Development

### Development Mode (with hot reload)
```bash
docker-compose -f docker-compose.dev.yml up -d
```

### View Logs
```bash
docker-compose logs -f backend    # Backend logs
docker-compose logs -f frontend   # Frontend logs
```

### Rebuild Containers
```bash
docker-compose build --no-cache
docker-compose up -d
```

## Project Structure

```
movie-recommendation/
├── packages/
│   ├── frontend/              # React app
│   │   ├── src/
│   │   │   ├── components/    # React components
│   │   │   ├── services/      # API & Socket services
│   │   │   └── hooks/         # Custom React hooks
│   │   └── nginx.conf         # nginx configuration
│   └── backend/               # Node.js API
│       ├── src/
│       │   ├── entities/      # Database entities
│       │   ├── services/      # Business logic
│       │   ├── routes/        # API routes
│       │   └── socket/        # Socket.IO handlers
│       └── Dockerfile
├── docker-compose.yml         # Production setup
├── docker-compose.dev.yml     # Development setup
└── DOCKER.md                  # Detailed Docker instructions
```

## API Endpoints

### User Management
- `POST /api/users` - Create user
- `GET /api/users/check/username/:username` - Check availability

### Chat
- `GET /api/users/:userId/rooms` - Get user's rooms
- `POST /api/rooms` - Create room

### Health
- `GET /health` - Service health check
- `GET /api/ai-status` - AI service status

## Socket.IO Events

### Client → Server
- `join_room` - Join chat room
- `send_message` - Send message
- `create_room` - Create new room

### Server → Client
- `room_joined` - Room join confirmation
- `new_message` - User message
- `ai_message` - AI response
- `room_created` - Room creation confirmation

## Getting API Keys

1. **Groq API** (Primary AI provider)
   - Sign up at [console.groq.com](https://console.groq.com)
   - Create API key

2. **OpenAI API** (Fallback)
   - Sign up at [platform.openai.com](https://platform.openai.com)
   - Create API key

3. **TMDB API** (Movie data)
   - Sign up at [themoviedb.org](https://www.themoviedb.org/settings/api)
   - Get API key

## Troubleshooting

### Common Issues

1. **Frontend can't connect to backend**
   - Check if all containers are running: `docker-compose ps`
   - Verify nginx proxy configuration in `packages/frontend/nginx.conf`

2. **Database connection failed**
   - Ensure PostgreSQL container is healthy: `docker-compose logs postgres`
   - Check database environment variables

3. **AI responses not working**
   - Verify API keys in `.env` file
   - Check AI service status: http://localhost:3000/api/ai-status

### Logs
```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres
```

For detailed Docker instructions and troubleshooting, see [DOCKER.md](DOCKER.md).

## License

MIT License 