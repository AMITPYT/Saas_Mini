# System Architecture

## Overview

This document describes the architecture of the Mini SaaS Application, a full-stack web application combining features from Notion, Trello, and Slack.

## Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                                   CLIENT TIER                                   │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         React Application (Vite)                         │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │   │
│  │  │   Pages     │  │ Components  │  │   Stores    │  │  Services   │    │   │
│  │  │  - Auth     │  │  - Board    │  │  - Auth     │  │  - API      │    │   │
│  │  │  - Dashboard│  │  - Editor   │  │  - Workspace│  │  - Socket   │    │   │
│  │  │  - Board    │  │  - Common   │  │  - UI       │  │  - Offline  │    │   │
│  │  │  - Channel  │  │  - Layout   │  │             │  │             │    │   │
│  │  │  - Page     │  │             │  │             │  │             │    │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │   │
│  │                                                                         │   │
│  │  ┌──────────────────────────────────────────────────────────────────┐  │   │
│  │  │                        State Management                           │  │   │
│  │  │   Zustand (Global State)  +  React Query (Server State)          │  │   │
│  │  └──────────────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│                         HTTP REST API │ WebSocket                               │
│                                      ▼                                          │
└────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       │
┌────────────────────────────────────────────────────────────────────────────────┐
│                                   SERVER TIER                                   │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                      Express.js Application                              │   │
│  │                                                                          │   │
│  │  ┌──────────────────────────────────────────────────────────────────┐   │   │
│  │  │                         Middleware Stack                          │   │   │
│  │  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────────────┐  │   │   │
│  │  │  │ Helmet │ │  CORS  │ │  Rate  │ │ Morgan │ │ Authentication │  │   │   │
│  │  │  │        │ │        │ │ Limit  │ │(Logger)│ │   (JWT Auth)   │  │   │   │
│  │  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────────────┘  │   │   │
│  │  └──────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                          │   │
│  │  ┌──────────────────────────────────────────────────────────────────┐   │   │
│  │  │                           API Routes                              │   │   │
│  │  │  /auth  /workspaces  /boards  /cards  /channels  /pages  /search │   │   │
│  │  └──────────────────────────────────────────────────────────────────┘   │   │
│  │                                      │                                   │   │
│  │                                      ▼                                   │   │
│  │  ┌──────────────────────────────────────────────────────────────────┐   │   │
│  │  │                          Controllers                              │   │   │
│  │  │     Request Handling  →  Validation  →  Service Calls            │   │   │
│  │  └──────────────────────────────────────────────────────────────────┘   │   │
│  │                                      │                                   │   │
│  │                                      ▼                                   │   │
│  │  ┌──────────────────────────────────────────────────────────────────┐   │   │
│  │  │                           Services                                │   │   │
│  │  │         Business Logic  →  Data Access  →  External APIs         │   │   │
│  │  └──────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         Socket.io Server                                 │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │   │
│  │  │   Rooms     │  │   Events    │  │  Presence   │  │   Typing    │    │   │
│  │  │ (workspace, │  │ (card:move, │  │  Tracking   │  │ Indicators  │    │   │
│  │  │  board,     │  │  message,   │  │             │  │             │    │   │
│  │  │  channel)   │  │  notify)    │  │             │  │             │    │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
└────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       │
┌────────────────────────────────────────────────────────────────────────────────┐
│                                   DATA TIER                                     │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────┐     ┌─────────────────────────────┐           │
│  │         MongoDB             │     │          Redis              │           │
│  │                             │     │                             │           │
│  │  ┌───────────────────────┐  │     │  ┌───────────────────────┐  │           │
│  │  │     Collections       │  │     │  │       Cache           │  │           │
│  │  │  - users              │  │     │  │  - Session data       │  │           │
│  │  │  - workspaces         │  │     │  │  - Token blacklist    │  │           │
│  │  │  - boards             │  │     │  │  - Rate limit counters│  │           │
│  │  │  - lists              │  │     │  │  - Frequently accessed│  │           │
│  │  │  - cards              │  │     │  │    queries            │  │           │
│  │  │  - channels           │  │     │  └───────────────────────┘  │           │
│  │  │  - messages           │  │     │                             │           │
│  │  │  - pages              │  │     │  ┌───────────────────────┐  │           │
│  │  │  - notifications      │  │     │  │     Job Queue         │  │           │
│  │  │  - refreshTokens      │  │     │  │  (BullMQ)             │  │           │
│  │  │  - auditLogs          │  │     │  │  - Email jobs         │  │           │
│  │  └───────────────────────┘  │     │  │  - Cleanup jobs       │  │           │
│  │                             │     │  │  - Notification jobs  │  │           │
│  └─────────────────────────────┘     │  └───────────────────────┘  │           │
│                                      └─────────────────────────────┘           │
│                                                                                 │
└────────────────────────────────────────────────────────────────────────────────┘
```

## Component Details

### Client Tier

#### React Application
- **Build Tool**: Vite for fast development and optimized builds
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS for utility-first styling

#### State Management
- **Zustand**: Lightweight global state for auth, workspace, and UI state
- **React Query**: Server state management with caching and synchronization

#### Key Features
- **Offline Support**: IndexedDB for local data persistence
- **Optimistic Updates**: Immediate UI feedback with rollback
- **Real-time**: WebSocket connection for live updates
- **PWA**: Service worker for offline capability

### Server Tier

#### Express Application
- **Architecture**: MVC-like with Controllers, Services, and Models
- **Validation**: Zod schemas for request validation
- **Error Handling**: Centralized error handling middleware

#### Middleware Stack
1. **Helmet**: Security headers
2. **CORS**: Cross-origin resource sharing
3. **Rate Limiter**: Request throttling
4. **Morgan**: HTTP request logging
5. **Authentication**: JWT verification
6. **Validation**: Request body/params validation

#### Socket.io Server
- **Rooms**: Workspace, board, channel, and page rooms
- **Events**: Real-time events for all entity changes
- **Presence**: Online user tracking
- **Typing**: Typing indicators for channels

### Data Tier

#### MongoDB
- **ODM**: Mongoose for schema definition and validation
- **Indexes**: Optimized queries with proper indexing
- **References**: Document references for relationships

#### Redis
- **Caching**: Frequently accessed data
- **Sessions**: Token blacklist and session data
- **Queues**: BullMQ for background job processing

## Data Flow

### Authentication Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │────▶│   API    │────▶│ Service  │────▶│ MongoDB  │
│          │     │ /login   │     │          │     │          │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
     │                                  │
     │◀─────────────────────────────────┘
     │         JWT Tokens
     │
     │           ┌──────────┐
     └──────────▶│  Redis   │  Token stored
                 │          │  for validation
                 └──────────┘
```

### Real-time Update Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│ Client A │────▶│   API    │────▶│ MongoDB  │
│  (Edit)  │     │          │     │  (Save)  │
└──────────┘     └──────────┘     └──────────┘
                      │
                      ▼
               ┌──────────┐
               │Socket.io │
               │  Server  │
               └──────────┘
                    │
         ┌──────────┴──────────┐
         ▼                     ▼
   ┌──────────┐          ┌──────────┐
   │ Client B │          │ Client C │
   │ (Update) │          │ (Update) │
   └──────────┘          └──────────┘
```

### Offline Sync Flow

```
┌──────────────────────────────────────────────────┐
│                    Client                         │
│  ┌────────────┐     ┌────────────┐               │
│  │   Action   │────▶│  IndexedDB │               │
│  │            │     │  (Queue)   │               │
│  └────────────┘     └────────────┘               │
│                           │                       │
│                     Online Event                  │
│                           │                       │
│                           ▼                       │
│                    ┌────────────┐                 │
│                    │ Sync Queue │                 │
│                    │ to Server  │                 │
│                    └────────────┘                 │
└──────────────────────────────────────────────────┘
```

## Security Architecture

### Authentication & Authorization

```
┌─────────────────────────────────────────────────────────────┐
│                    Security Layers                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                    Transport Layer                      │ │
│  │                   HTTPS / TLS 1.3                       │ │
│  └────────────────────────────────────────────────────────┘ │
│                              │                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                   Application Layer                     │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐             │ │
│  │  │  Helmet  │  │   CORS   │  │   Rate   │             │ │
│  │  │ Headers  │  │  Policy  │  │  Limit   │             │ │
│  │  └──────────┘  └──────────┘  └──────────┘             │ │
│  └────────────────────────────────────────────────────────┘ │
│                              │                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                 Authentication Layer                    │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │              JWT Token Validation                 │  │ │
│  │  │   Access Token (15min) + Refresh Token (7d)      │  │ │
│  │  │         Token Rotation on Refresh                 │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
│                              │                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                 Authorization Layer                     │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │            Role-Based Access Control              │  │ │
│  │  │      Admin > Member > Viewer                      │  │ │
│  │  │      Workspace Membership Verification            │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
│                              │                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                   Data Layer                            │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐             │ │
│  │  │ MongoDB  │  │  Input   │  │  Output  │             │ │
│  │  │Sanitize  │  │Validation│  │ Encoding │             │ │
│  │  └──────────┘  └──────────┘  └──────────┘             │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Scalability Considerations

### Horizontal Scaling

```
                    ┌─────────────────┐
                    │  Load Balancer  │
                    │    (nginx)      │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
   ┌───────────┐       ┌───────────┐       ┌───────────┐
   │  Server 1 │       │  Server 2 │       │  Server N │
   │  (Node)   │       │  (Node)   │       │  (Node)   │
   └─────┬─────┘       └─────┬─────┘       └─────┬─────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
               ┌────▼────┐       ┌────▼────┐
               │ MongoDB │       │  Redis  │
               │ Replica │       │ Cluster │
               │   Set   │       │         │
               └─────────┘       └─────────┘
```

### Socket.io Scaling with Redis Adapter

```
┌───────────┐     ┌───────────┐     ┌───────────┐
│  Server 1 │     │  Server 2 │     │  Server 3 │
│ Socket.io │     │ Socket.io │     │ Socket.io │
└─────┬─────┘     └─────┬─────┘     └─────┬─────┘
      │                 │                 │
      └─────────────────┼─────────────────┘
                        │
               ┌────────▼────────┐
               │  Redis Adapter  │
               │   (Pub/Sub)     │
               └─────────────────┘
```

## Deployment Architecture

### Production Setup

```
┌─────────────────────────────────────────────────────────────┐
│                         CDN                                  │
│                   (Static Assets)                            │
└─────────────────────────────────────────────────────────────┘
                             │
┌─────────────────────────────────────────────────────────────┐
│                    Reverse Proxy                             │
│               (nginx / Load Balancer)                        │
└─────────────────────────────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   API Server  │   │   API Server  │   │   API Server  │
│   (Node.js)   │   │   (Node.js)   │   │   (Node.js)   │
│   + Socket.io │   │   + Socket.io │   │   + Socket.io │
└───────┬───────┘   └───────┬───────┘   └───────┬───────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
           ┌────────────────┼────────────────┐
           │                │                │
           ▼                ▼                ▼
   ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
   │   MongoDB     │ │    Redis      │ │   Storage     │
   │   Cluster     │ │   Cluster     │ │   (S3/GCS)    │
   └───────────────┘ └───────────────┘ └───────────────┘
```

## Monitoring & Observability

- **Logging**: Winston for structured logging
- **Metrics**: Request timing, error rates
- **Health Checks**: `/health` endpoint
- **Audit Logs**: User action tracking in database
