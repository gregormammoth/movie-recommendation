# Vibe Coding

Поиск и рекомендация фильмов с помощью AI
TMDB API - поиск кино
PostgreSQL - сохранение переписки и данных пользователей
Docker Compose - оркестрация
Al - OpenAl API / Any Framework (e.g. langchain)
Бэк/фронт - любой

A modern movie recommendation system with AI-powered search capabilities.

## Overview

This project is a monorepo containing a React frontend and Node.js + Express backend for a movie recommendation system. It uses TMDB API for movie data, PostgreSQL for data storage, and AI integration for enhanced recommendations.

## Tech Stack

- **Frontend**: React
- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **Movie API**: TMDB API
- **AI Integration**: OpenAI API
- **Containerization**: Docker Compose
- **Package Management**: Lerna (Monorepo)

## Project Structure

```
vibe-coding/
├── packages/
│   ├── frontend/          # React application
│   └── backend/           # Node.js + Express server
├── lerna.json            # Lerna configuration
└── package.json          # Root package.json
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Docker and Docker Compose
- PostgreSQL
- TMDB API key
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd vibe-coding
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
- Create `.env` files in both frontend and backend packages
- Add required API keys and configuration

4. Start the development environment:
```bash
npm run dev
```

## Development

### Available Scripts

- `npm run dev` - Start all packages in development mode
- `npm run build` - Build all packages
- `npm run test` - Run tests across all packages
- `npm run clean` - Clean build artifacts

### Package-specific Scripts

#### Frontend
- `npm run start:frontend` - Start frontend development server
- `npm run build:frontend` - Build frontend package

#### Backend
- `npm run start:backend` - Start backend development server
- `npm run build:backend` - Build backend package

### Docker Commands

- `npm run docker:up` - Start PostgreSQL and Redis containers
- `npm run docker:down` - Stop and remove containers
- `npm run docker:logs` - View container logs

## Features

### Chat System
- **Real-time messaging** with Socket.IO
- **AI-powered movie recommendations** using OpenAI GPT-3.5
- **Multi-room chat support**
- **Message persistence** with PostgreSQL
- **RESTful API** for chat operations

### API Endpoints

#### Chat API (`/api/chat`)
- `GET /rooms/:userId` - Get user's chat rooms
- `POST /rooms` - Create new chat room
- `GET /rooms/:roomId/messages` - Get room messages
- `POST /users` - Create new user

### WebSocket Events

#### Client to Server
- `join_room` - Join a chat room
- `leave_room` - Leave a chat room
- `send_message` - Send a message
- `create_room` - Create new room
- `get_rooms` - Get user rooms
- `get_messages` - Get room messages

#### Server to Client
- `room_joined` - Room join confirmation
- `new_message` - New user message
- `ai_message` - AI response
- `room_created` - Room creation confirmation
- `error` - Error notifications

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

[Add contact information here]

## Acknowledgments

- TMDB API for movie data
- OpenAI for AI capabilities 