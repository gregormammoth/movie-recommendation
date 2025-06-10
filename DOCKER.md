# Docker Setup Guide

This guide explains how to run the Vibe Coding Movie Recommendation application using Docker.

## Prerequisites

- Docker (version 20.10 or higher)
- Docker Compose (version 2.0 or higher)
- Git

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd movie-recommendation
```

### 2. Set Up Environment Variables

Copy the environment template and fill in your API keys:

```bash
cp docker.env.example .env
```

Edit the `.env` file and add your API keys:

```env
GROQ_API_KEY=your_groq_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
TMDB_API_KEY=your_tmdb_api_key_here
```

### 3. Run the Application

For production deployment:

```bash
docker-compose up -d
```

For development with hot reload:

```bash
docker-compose -f docker-compose.dev.yml up -d
```

## Services

The application consists of three main services:

### Frontend (React + Vite)
- **Production**: `http://localhost:3000`
- **Development**: `http://localhost:3000`
- Built with nginx for production serving
- Includes API proxying to backend

### Backend (Node.js + TypeScript)
- **Port**: `http://localhost:3001`
- RESTful API and Socket.IO server
- Health check endpoint: `/api/openai-status`

### Database (PostgreSQL)
- **Port**: `5432`
- Automatic schema initialization
- Persistent data storage

## Docker Commands

### Production Deployment

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```

### Development Mode

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop development environment
docker-compose -f docker-compose.dev.yml down
```

### Useful Commands

```bash
# View running containers
docker ps

# Access backend container shell
docker exec -it vibe-coding-backend sh

# Access frontend container shell
docker exec -it vibe-coding-frontend sh

# Access database
docker exec -it vibe-coding-postgres psql -U postgres -d vibe_coding

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

## Environment Variables

### Required API Keys

| Variable | Description | Required |
|----------|-------------|----------|
| `GROQ_API_KEY` | Groq API key for Langchain AI service | Yes |
| `OPENAI_API_KEY` | OpenAI API key for fallback AI service | Optional |
| `TMDB_API_KEY` | The Movie Database API key | Yes |

### Database Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_DB` | `vibe_coding` | Database name |
| `POSTGRES_USER` | `postgres` | Database user |
| `POSTGRES_PASSWORD` | `postgres` | Database password |

## Port Mapping

| Service | Container Port | Host Port | Description |
|---------|----------------|-----------|-------------|
| Frontend | 80 | 3000 | Web application |
| Backend | 3001 | 3001 | API server |
| Database | 5432 | 5432 | PostgreSQL |

## Health Checks

The application includes health checks for monitoring:

- **Backend**: `http://localhost:3001/api/openai-status`
- **Database**: PostgreSQL ready check
- **Frontend**: nginx status (automatic)

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3000, 3001, and 5432 are available
2. **API keys missing**: Check your `.env` file has valid API keys
3. **Database connection issues**: 
   - Wait for PostgreSQL to fully start (health check)
   - Backend uses `DB_HOST=postgres` to connect to the database container
   - If you see "ECONNREFUSED 127.0.0.1:5432", the backend is trying to connect to localhost instead of the postgres container
4. **Build failures**: If you encounter npm errors, ensure you have the latest Docker images by running `docker-compose build --no-cache`

### Logs

Check service-specific logs:

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Reset Database

To reset the database:

```bash
docker-compose down
docker volume rm movie-recommendation_postgres_data
docker-compose up -d
```

## Development vs Production

### Production Features
- Optimized builds
- nginx for frontend serving
- Minimal container images
- Health checks enabled
- Automatic restarts

### Development Features
- Hot reload for both frontend and backend
- Volume mounts for live code changes
- Development server ports
- Source maps enabled

## Security Considerations

- Change default database passwords in production
- Use secrets management for API keys
- Enable HTTPS in production deployment
- Configure proper firewall rules
- Regular security updates for base images

## Scaling

For production scaling, consider:

- Load balancer for frontend
- Multiple backend instances
- Database clustering
- Redis for session storage
- CDN for static assets 