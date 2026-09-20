# Mini SaaS Application

A full-stack SaaS application inspired by **Notion**, **Trello**, and **Slack**, built as a Senior Full Stack Developer assessment project.

## Features

### Core Functionality

- **Authentication & Authorization**
  - JWT-based authentication with refresh tokens
  - Role-based access control (Admin, Member, Viewer)
  - Secure password reset flow
  - Session management with token rotation

- **Workspaces**
  - Multi-tenant workspace support
  - Member management with role assignments
  - Workspace statistics and analytics

- **Kanban Boards (Trello-like)**
  - Drag & drop cards and lists
  - Card labels, due dates, and checklists
  - Card comments and attachments
  - Real-time collaboration

- **Documents/Pages (Notion-like)**
  - Rich text editor with formatting
  - Hierarchical page structure
  - Page icons and cover images
  - Full-text search

- **Messaging (Slack-like)**
  - Public and private channels
  - Direct messages
  - Message threads and reactions
  - Typing indicators
  - Real-time message delivery

- **Search & Notifications**
  - Global search across all content
  - Command palette (Cmd+K)
  - Real-time notifications
  - Email notifications (configurable)

### Technical Features

- **Real-time Updates**: Socket.io for live collaboration
- **Offline Support**: IndexedDB for offline data persistence
- **Optimistic UI**: Instant feedback with rollback on errors
- **Infinite Scroll**: Efficient pagination for large datasets
- **PWA Support**: Installable progressive web app
- **Dark Mode**: System-aware theme switching

## Tech Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Caching**: Redis
- **Queue**: BullMQ for background jobs
- **Real-time**: Socket.io
- **Authentication**: JWT with refresh token rotation
- **Validation**: Zod
- **Documentation**: Swagger/OpenAPI

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod
- **Drag & Drop**: @dnd-kit
- **Icons**: Heroicons, Lucide React
- **UI Components**: Headless UI

## Project Structure

```
saas-app/
├── server/                 # Backend application
│   ├── src/
│   │   ├── config/        # Configuration files
│   │   ├── controllers/   # Request handlers
│   │   ├── middlewares/   # Express middlewares
│   │   ├── models/        # Mongoose models
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   ├── utils/         # Utility functions
│   │   ├── validators/    # Zod schemas
│   │   ├── app.ts         # Express app setup
│   │   └── index.ts       # Entry point
│   ├── tests/             # Jest tests
│   └── package.json
│
├── client/                 # Frontend application
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── board/     # Kanban components
│   │   │   ├── common/    # Shared components
│   │   │   ├── editor/    # Rich text editor
│   │   │   └── layout/    # Layout components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utilities & configs
│   │   ├── pages/         # Page components
│   │   ├── routes/        # Router config
│   │   ├── services/      # API services
│   │   ├── store/         # Zustand stores
│   │   └── types/         # TypeScript types
│   ├── tests/             # Vitest tests
│   └── package.json
│
├── docs/                   # Documentation
│   ├── architecture.md    # System architecture
│   └── er-diagram.md      # Database schema
│
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB 6+
- Redis 7+
- npm or yarn

### Environment Variables

#### Backend (.env)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/saas_app
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
CORS_ORIGIN=http://localhost:5173
API_VERSION=v1
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000
```

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd saas-app
```

2. **Install backend dependencies**
```bash
cd server
npm install
```

3. **Install frontend dependencies**
```bash
cd ../client
npm install
```

4. **Start MongoDB and Redis**
```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:6
docker run -d -p 6379:6379 --name redis redis:7
```

5. **Start the backend**
```bash
cd server
npm run dev
```

6. **Start the frontend**
```bash
cd client
npm run dev
```

7. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- API Documentation: http://localhost:5000/api-docs

## API Documentation

Interactive API documentation is available at `/api-docs` when the server is running.

### Main Endpoints

| Resource | Endpoint | Description |
|----------|----------|-------------|
| Auth | `/api/v1/auth/*` | Authentication & user management |
| Workspaces | `/api/v1/workspaces/*` | Workspace CRUD & members |
| Boards | `/api/v1/boards/*` | Kanban boards & lists |
| Cards | `/api/v1/cards/*` | Cards, comments, checklists |
| Channels | `/api/v1/channels/*` | Messaging channels |
| Pages | `/api/v1/pages/*` | Document pages |
| Search | `/api/v1/search/*` | Global search |
| Notifications | `/api/v1/notifications/*` | User notifications |

## Testing

### Backend Tests
```bash
cd server
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm test -- --coverage   # With coverage report
```

### Frontend Tests
```bash
cd client
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm test -- --coverage   # With coverage report
```

### Coverage Requirements
- Minimum 60% coverage for branches, functions, lines, and statements

## Architecture

See [docs/architecture.md](docs/architecture.md) for detailed system architecture.

### High-Level Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  React Client   │────▶│  Express API    │────▶│    MongoDB      │
│  (Vite + TS)    │     │  (Node.js)      │     │                 │
│                 │     │                 │     └─────────────────┘
└────────┬────────┘     └────────┬────────┘
         │                       │
         │    WebSocket          │
         └───────────────────────┘
                                 │
                        ┌────────▼────────┐
                        │                 │
                        │     Redis       │
                        │  (Cache/Queue)  │
                        │                 │
                        └─────────────────┘
```

## Database Schema

See [docs/er-diagram.md](docs/er-diagram.md) for the complete ER diagram.

### Core Entities

- **User**: Authentication and profile data
- **Workspace**: Multi-tenant container
- **Board**: Kanban board with lists
- **List**: Column in a board
- **Card**: Task/item in a list
- **Channel**: Messaging channel
- **Message**: Chat message
- **Page**: Document/note
- **Notification**: User notifications

## Security Features

- **Authentication**: JWT with secure HTTP-only refresh tokens
- **Password Security**: bcrypt hashing with salt rounds
- **Rate Limiting**: Request throttling per IP
- **Input Validation**: Zod schema validation
- **XSS Prevention**: Helmet security headers
- **CORS**: Configurable origin restrictions
- **SQL Injection**: MongoDB sanitization
- **CSRF Protection**: Token-based protection

## Performance Optimizations

- **Database**: Indexed queries, lean documents
- **Caching**: Redis for sessions and frequent queries
- **Compression**: Gzip response compression
- **Lazy Loading**: Code splitting and dynamic imports
- **Optimistic Updates**: Instant UI feedback
- **Connection Pooling**: MongoDB connection reuse

## Deployment

### Production Build

```bash
# Backend
cd server
npm run build
npm start

# Frontend
cd client
npm run build
# Serve dist/ folder with static file server
```

### Docker Deployment

```bash
docker-compose up -d
```

### Environment Considerations

- Set `NODE_ENV=production`
- Use secure JWT secrets
- Configure proper CORS origins
- Enable HTTPS
- Set up proper database authentication

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Author

Built as a Senior Full Stack Developer Assessment Project.
