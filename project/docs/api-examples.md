# API Usage Examples

This document provides common API usage examples using cURL.

## Authentication

### Register a New User
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "name": "John Doe"
  }'
```

Response:
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "65f1234567890abcdef12345",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "member"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresAt": "2024-03-15T12:00:00.000Z"
  }
}
```

### Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

### Refresh Token
```bash
curl -X POST http://localhost:5000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  --cookie "refreshToken=your-refresh-token"
```

### Get Profile
```bash
curl -X GET http://localhost:5000/api/v1/auth/profile \
  -H "Authorization: Bearer your-access-token"
```

## Workspaces

### Create Workspace
```bash
curl -X POST http://localhost:5000/api/v1/workspaces \
  -H "Authorization: Bearer your-access-token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Workspace",
    "description": "A workspace for my team"
  }'
```

### Get All Workspaces
```bash
curl -X GET http://localhost:5000/api/v1/workspaces \
  -H "Authorization: Bearer your-access-token"
```

### Add Member to Workspace
```bash
curl -X POST http://localhost:5000/api/v1/workspaces/{workspaceId}/members \
  -H "Authorization: Bearer your-access-token" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-id",
    "role": "member"
  }'
```

## Boards

### Create Board
```bash
curl -X POST http://localhost:5000/api/v1/boards \
  -H "Authorization: Bearer your-access-token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Project Board",
    "workspaceId": "workspace-id",
    "background": {
      "type": "color",
      "value": "#3B82F6"
    }
  }'
```

### Get Board with Lists and Cards
```bash
curl -X GET http://localhost:5000/api/v1/boards/{boardId} \
  -H "Authorization: Bearer your-access-token"
```

### Create List
```bash
curl -X POST http://localhost:5000/api/v1/boards/lists \
  -H "Authorization: Bearer your-access-token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "To Do",
    "boardId": "board-id"
  }'
```

## Cards

### Create Card
```bash
curl -X POST http://localhost:5000/api/v1/cards \
  -H "Authorization: Bearer your-access-token" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Implement feature",
    "description": "Add new functionality",
    "listId": "list-id",
    "boardId": "board-id",
    "labels": [{"name": "Feature", "color": "#10B981"}],
    "dueDate": "2024-03-20T00:00:00.000Z"
  }'
```

### Move Card
```bash
curl -X PATCH http://localhost:5000/api/v1/cards/{cardId}/move \
  -H "Authorization: Bearer your-access-token" \
  -H "Content-Type: application/json" \
  -d '{
    "listId": "new-list-id",
    "position": 0
  }'
```

### Add Comment
```bash
curl -X POST http://localhost:5000/api/v1/cards/{cardId}/comments \
  -H "Authorization: Bearer your-access-token" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "This looks good!"
  }'
```

### Add Checklist
```bash
curl -X POST http://localhost:5000/api/v1/cards/{cardId}/checklists \
  -H "Authorization: Bearer your-access-token" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Implementation Steps",
    "items": [
      {"text": "Design UI", "isCompleted": false},
      {"text": "Write tests", "isCompleted": false}
    ]
  }'
```

## Channels

### Create Channel
```bash
curl -X POST http://localhost:5000/api/v1/channels \
  -H "Authorization: Bearer your-access-token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "general",
    "workspaceId": "workspace-id",
    "type": "public",
    "description": "General discussion"
  }'
```

### Send Message
```bash
curl -X POST http://localhost:5000/api/v1/channels/{channelId}/messages \
  -H "Authorization: Bearer your-access-token" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello, team!"
  }'
```

### Get Messages (with pagination)
```bash
curl -X GET "http://localhost:5000/api/v1/channels/{channelId}/messages?limit=20" \
  -H "Authorization: Bearer your-access-token"
```

### Add Reaction
```bash
curl -X POST http://localhost:5000/api/v1/channels/messages/{messageId}/reactions \
  -H "Authorization: Bearer your-access-token" \
  -H "Content-Type: application/json" \
  -d '{
    "emoji": "👍"
  }'
```

## Pages

### Create Page
```bash
curl -X POST http://localhost:5000/api/v1/pages \
  -H "Authorization: Bearer your-access-token" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Meeting Notes",
    "workspaceId": "workspace-id",
    "icon": "📝",
    "content": {
      "type": "doc",
      "content": [
        {
          "type": "heading",
          "attrs": {"level": 1},
          "content": [{"type": "text", "text": "Meeting Notes"}]
        }
      ]
    }
  }'
```

### Create Child Page
```bash
curl -X POST http://localhost:5000/api/v1/pages \
  -H "Authorization: Bearer your-access-token" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Week 1 Notes",
    "workspaceId": "workspace-id",
    "parentId": "parent-page-id"
  }'
```

### Update Page Content
```bash
curl -X PATCH http://localhost:5000/api/v1/pages/{pageId} \
  -H "Authorization: Bearer your-access-token" \
  -H "Content-Type: application/json" \
  -d '{
    "content": {
      "type": "doc",
      "content": [...]
    }
  }'
```

## Search

### Global Search
```bash
curl -X GET "http://localhost:5000/api/v1/search/{workspaceId}?q=meeting&types=page,card" \
  -H "Authorization: Bearer your-access-token"
```

### Quick Search (Command Palette)
```bash
curl -X GET "http://localhost:5000/api/v1/search/{workspaceId}/quick?q=project" \
  -H "Authorization: Bearer your-access-token"
```

### Recent Items
```bash
curl -X GET "http://localhost:5000/api/v1/search/{workspaceId}/recent?limit=10" \
  -H "Authorization: Bearer your-access-token"
```

## Notifications

### Get Notifications
```bash
curl -X GET "http://localhost:5000/api/v1/notifications?isRead=false" \
  -H "Authorization: Bearer your-access-token"
```

### Mark as Read
```bash
curl -X POST http://localhost:5000/api/v1/notifications/{notificationId}/read \
  -H "Authorization: Bearer your-access-token"
```

### Mark All as Read
```bash
curl -X POST http://localhost:5000/api/v1/notifications/mark-all-read \
  -H "Authorization: Bearer your-access-token"
```

## WebSocket Events

### Connection
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: { token: 'your-access-token' }
});

socket.on('connect', () => {
  console.log('Connected:', socket.id);
});
```

### Join/Leave Rooms
```javascript
// Join a board room
socket.emit('board:join', 'board-id');

// Leave a board room
socket.emit('board:leave', 'board-id');

// Join a channel
socket.emit('channel:join', 'channel-id');
```

### Listen for Events
```javascript
// Card events
socket.on('card:created', (card) => { /* ... */ });
socket.on('card:updated', (card) => { /* ... */ });
socket.on('card:moved', (data) => { /* ... */ });
socket.on('card:deleted', (data) => { /* ... */ });

// Message events
socket.on('message:sent', (message) => { /* ... */ });
socket.on('message:updated', (message) => { /* ... */ });

// Typing indicators
socket.on('typing:started', (data) => { /* ... */ });
socket.on('typing:stopped', (data) => { /* ... */ });

// Notifications
socket.on('notification:received', (notification) => { /* ... */ });
```

### Send Typing Indicator
```javascript
socket.emit('typing:start', { channelId: 'channel-id' });
socket.emit('typing:stop', { channelId: 'channel-id' });
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### HTTP Status Codes
| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (duplicate resource) |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |
