# Entity Relationship Diagram

## Database Schema Overview

This document describes the MongoDB collections and their relationships in the Mini SaaS Application.

## ER Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              ENTITY RELATIONSHIP DIAGRAM                         │
└─────────────────────────────────────────────────────────────────────────────────┘

┌───────────────────┐
│       USER        │
├───────────────────┤
│ _id: ObjectId     │──────────────────────────────────────────────────────┐
│ email: String     │                                                       │
│ password: String  │                                                       │
│ name: String      │                                                       │
│ avatar: String    │                                                       │
│ role: String      │                                                       │
│ isEmailVerified   │                                                       │
│ isActive: Boolean │                                                       │
│ lastLoginAt: Date │                                                       │
│ createdAt: Date   │                                                       │
│ updatedAt: Date   │                                                       │
└─────────┬─────────┘                                                       │
          │                                                                  │
          │ 1:N                                                             │
          │                                                                  │
          ▼                                                                  │
┌───────────────────┐       ┌───────────────────┐                          │
│   REFRESH_TOKEN   │       │     AUDIT_LOG     │                          │
├───────────────────┤       ├───────────────────┤                          │
│ _id: ObjectId     │       │ _id: ObjectId     │                          │
│ token: String     │       │ user: ObjectId ◀──┼───────────────────────────┤
│ user: ObjectId ◀──┼───────│ action: String    │                          │
│ expiresAt: Date   │       │ resource: String  │                          │
│ createdByIp       │       │ resourceId        │                          │
│ userAgent: String │       │ details: Object   │                          │
│ isRevoked: Boolean│       │ ipAddress: String │                          │
│ revokedAt: Date   │       │ createdAt: Date   │                          │
│ replacedByToken   │       └───────────────────┘                          │
│ createdAt: Date   │                                                       │
└───────────────────┘                                                       │
                                                                            │
          ┌─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌───────────────────┐
│    WORKSPACE      │
├───────────────────┤
│ _id: ObjectId     │─────────────────────────────────────────┐
│ name: String      │                                          │
│ description       │                                          │
│ owner: ObjectId ◀─┼─────────── (User)                       │
│ members: [{       │                                          │
│   user: ObjectId  │◀──────────(User)                        │
│   role: String    │                                          │
│   joinedAt: Date  │                                          │
│ }]                │                                          │
│ settings: Object  │                                          │
│ isActive: Boolean │                                          │
│ createdAt: Date   │                                          │
│ updatedAt: Date   │                                          │
└─────────┬─────────┘                                          │
          │                                                     │
          │ 1:N                                                │
          │                                                     │
    ┌─────┴─────┬─────────────────┬─────────────────┐          │
    │           │                 │                 │          │
    ▼           ▼                 ▼                 ▼          │
┌─────────┐ ┌─────────┐    ┌───────────┐    ┌────────────┐    │
│  BOARD  │ │ CHANNEL │    │   PAGE    │    │NOTIFICATION│    │
├─────────┤ ├─────────┤    ├───────────┤    ├────────────┤    │
│ _id     │ │ _id     │    │ _id       │    │ _id        │    │
│ name    │ │ name    │    │ title     │    │ user ◀─────┼────┤
│workspace│ │workspace│    │ content   │    │ type       │    │
│   ◀─────┼─┤   ◀─────┼────│workspace ◀│────│ title      │    │
│ desc    │ │ desc    │    │ icon      │    │ body       │    │
│createdBy│ │ type    │    │ cover     │    │ link       │    │
│   ◀─────┼─┤(public/ │    │ parent ◀──│──┐ │ isRead     │    │
│ members │ │ private/│    │   (Page)  │  │ │ metadata   │    │
│ isStarred│ │ direct) │    │ createdBy │  │ │ createdAt  │    │
│background│ │createdBy│    │   ◀───────┼──┼─│            │    │
│createdAt│ │   ◀─────┼────│ isFavorite│  │ └────────────┘    │
│updatedAt│ │ members │    │ position  │  │                   │
└────┬────┘ │ createdAt│    │ createdAt │  │                   │
     │      │ updatedAt│    │ updatedAt │  │                   │
     │      └────┬────┘    └─────┬─────┘  │                   │
     │           │               │         │                   │
     │ 1:N       │ 1:N           │ 1:N     │ (self-ref)        │
     │           │               │         │                   │
     ▼           ▼               └─────────┘                   │
┌─────────┐ ┌─────────┐                                        │
│   LIST  │ │ MESSAGE │                                        │
├─────────┤ ├─────────┤                                        │
│ _id     │ │ _id     │                                        │
│ name    │ │ content │                                        │
│ board ◀─┤ │channel ◀│                                        │
│ position│ │sender ◀─┼────────────────────────────────────────┤
│createdAt│ │ parentId│◀──┐  (self-reference for threads)     │
│updatedAt│ │reactions│   │                                    │
└────┬────┘ │ mentions│   │                                    │
     │      │attachmnts│   │                                    │
     │ 1:N  │ isEdited │   │                                    │
     │      │ isDeleted│   │                                    │
     ▼      │createdAt │   │                                    │
┌─────────┐ │updatedAt │   │                                    │
│   CARD  │ └─────┬───┘   │                                    │
├─────────┤       │        │                                    │
│ _id     │       └────────┘                                    │
│ title   │                                                     │
│ desc    │                                                     │
│ list ◀──┤                                                     │
│ board ◀─┤                                                     │
│ position│                                                     │
│createdBy│◀────────────────────────────────────────────────────┤
│assignees│◀────────────────────────────────────────────────────┤
│ labels  │    [{name, color}]                                  │
│ dueDate │                                                     │
│priority │                                                     │
│checklists│   [{title, items: [{text, isCompleted}]}]         │
│ comments│    [{user, content, createdAt}]                    │
│attachmnts│   [{name, url, type, size}]                       │
│ isArchivd│                                                    │
│createdAt│                                                     │
│updatedAt│                                                     │
└─────────┘                                                     │
                                                                │
┌───────────────────┐                                           │
│       FILE        │                                           │
├───────────────────┤                                           │
│ _id: ObjectId     │                                           │
│ name: String      │                                           │
│ originalName      │                                           │
│ mimeType: String  │                                           │
│ size: Number      │                                           │
│ url: String       │                                           │
│ workspace ◀───────┼───────────────────────────────────────────┘
│ uploadedBy ◀──────┼───────────────────────────────────────────┘
│ createdAt: Date   │
└───────────────────┘
```

## Collection Schemas

### User
```javascript
{
  _id: ObjectId,
  email: String,          // unique, indexed
  password: String,       // hashed, select: false
  name: String,
  avatar: String,
  role: "admin" | "member" | "viewer",
  isEmailVerified: Boolean,
  refreshTokens: [String],  // select: false
  passwordResetToken: String,
  passwordResetExpires: Date,
  lastLoginAt: Date,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Workspace
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  owner: ObjectId,        // ref: User
  members: [{
    user: ObjectId,       // ref: User
    role: "admin" | "member" | "viewer",
    joinedAt: Date
  }],
  settings: {
    allowPublicChannels: Boolean,
    defaultRole: String
  },
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Board
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  workspace: ObjectId,    // ref: Workspace, indexed
  createdBy: ObjectId,    // ref: User
  members: [{
    user: ObjectId,       // ref: User
    role: "admin" | "member" | "viewer"
  }],
  background: {
    type: "color" | "image",
    value: String
  },
  isStarred: Boolean,
  isArchived: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### List
```javascript
{
  _id: ObjectId,
  name: String,
  board: ObjectId,        // ref: Board, indexed
  position: Number,       // for ordering
  createdAt: Date,
  updatedAt: Date
}
```

### Card
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  list: ObjectId,         // ref: List, indexed
  board: ObjectId,        // ref: Board, indexed
  position: Number,
  createdBy: ObjectId,    // ref: User
  assignees: [ObjectId],  // ref: User
  labels: [{
    name: String,
    color: String
  }],
  dueDate: Date,
  priority: "low" | "medium" | "high" | "urgent",
  checklists: [{
    title: String,
    items: [{
      text: String,
      isCompleted: Boolean
    }]
  }],
  comments: [{
    user: ObjectId,       // ref: User
    content: String,
    createdAt: Date
  }],
  attachments: [{
    name: String,
    url: String,
    type: String,
    size: Number
  }],
  isArchived: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Channel
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  workspace: ObjectId,    // ref: Workspace, indexed
  type: "public" | "private" | "direct",
  createdBy: ObjectId,    // ref: User
  members: [ObjectId],    // ref: User
  lastMessage: {
    content: String,
    sender: ObjectId,
    createdAt: Date
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Message
```javascript
{
  _id: ObjectId,
  content: String,
  channel: ObjectId,      // ref: Channel, indexed
  sender: ObjectId,       // ref: User
  parentId: ObjectId,     // ref: Message (for threads)
  reactions: [{
    emoji: String,
    users: [ObjectId]     // ref: User
  }],
  mentions: [ObjectId],   // ref: User
  attachments: [{
    name: String,
    url: String,
    type: String
  }],
  isEdited: Boolean,
  isDeleted: Boolean,
  createdAt: Date,        // indexed for pagination
  updatedAt: Date
}
```

### Page
```javascript
{
  _id: ObjectId,
  title: String,
  content: Object,        // JSON content (blocks)
  workspace: ObjectId,    // ref: Workspace, indexed
  parent: ObjectId,       // ref: Page (for hierarchy)
  createdBy: ObjectId,    // ref: User
  icon: String,           // emoji or icon URL
  coverImage: String,
  isFavorite: Boolean,
  isArchived: Boolean,
  position: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### Notification
```javascript
{
  _id: ObjectId,
  user: ObjectId,         // ref: User, indexed
  type: "mention" | "assignment" | "comment" |
        "invite" | "due_date" | "card_moved" |
        "message" | "system",
  title: String,
  body: String,
  link: String,           // URL to the resource
  metadata: Object,       // additional context
  isRead: Boolean,        // indexed
  createdAt: Date         // indexed
}
```

### RefreshToken
```javascript
{
  _id: ObjectId,
  token: String,          // indexed
  user: ObjectId,         // ref: User, indexed
  expiresAt: Date,
  createdByIp: String,
  userAgent: String,
  isRevoked: Boolean,
  revokedAt: Date,
  replacedByToken: String,
  createdAt: Date
}
```

### AuditLog
```javascript
{
  _id: ObjectId,
  user: ObjectId,         // ref: User
  action: String,         // e.g., "user.login", "card.create"
  resource: String,       // e.g., "User", "Card"
  resourceId: ObjectId,
  details: Object,        // action-specific data
  ipAddress: String,
  userAgent: String,
  createdAt: Date         // indexed
}
```

### File
```javascript
{
  _id: ObjectId,
  name: String,           // stored filename
  originalName: String,   // original filename
  mimeType: String,
  size: Number,           // in bytes
  url: String,            // storage URL
  workspace: ObjectId,    // ref: Workspace
  uploadedBy: ObjectId,   // ref: User
  createdAt: Date
}
```

## Indexes

### Performance Indexes
```javascript
// User
{ email: 1 }                          // unique
{ createdAt: -1 }

// Workspace
{ owner: 1 }
{ "members.user": 1 }

// Board
{ workspace: 1 }
{ workspace: 1, isArchived: 1 }
{ "members.user": 1 }

// List
{ board: 1, position: 1 }

// Card
{ list: 1, position: 1 }
{ board: 1 }
{ assignees: 1 }
{ dueDate: 1 }
{ "$text": { title: 1, description: 1 } }  // text search

// Channel
{ workspace: 1 }
{ members: 1 }
{ workspace: 1, type: 1 }

// Message
{ channel: 1, createdAt: -1 }
{ parentId: 1 }
{ sender: 1 }

// Page
{ workspace: 1 }
{ parent: 1 }
{ workspace: 1, isFavorite: 1 }
{ "$text": { title: 1 } }             // text search

// Notification
{ user: 1, isRead: 1, createdAt: -1 }

// RefreshToken
{ token: 1 }                          // unique
{ user: 1 }
{ expiresAt: 1 }                      // TTL index

// AuditLog
{ user: 1, createdAt: -1 }
{ resource: 1, resourceId: 1 }
```

## Relationships Summary

| Parent | Child | Type | Field |
|--------|-------|------|-------|
| User | Workspace | 1:N | owner |
| User | Workspace | N:M | members.user |
| User | Board | 1:N | createdBy |
| User | Card | 1:N | createdBy |
| User | Card | N:M | assignees |
| User | Channel | 1:N | createdBy |
| User | Channel | N:M | members |
| User | Message | 1:N | sender |
| User | Page | 1:N | createdBy |
| User | Notification | 1:N | user |
| User | RefreshToken | 1:N | user |
| User | AuditLog | 1:N | user |
| Workspace | Board | 1:N | workspace |
| Workspace | Channel | 1:N | workspace |
| Workspace | Page | 1:N | workspace |
| Board | List | 1:N | board |
| Board | Card | 1:N | board |
| List | Card | 1:N | list |
| Channel | Message | 1:N | channel |
| Page | Page | 1:N | parent (self-ref) |
| Message | Message | 1:N | parentId (threads) |

## Data Integrity

### Cascade Deletes
- Deleting a Workspace cascades to: Boards, Channels, Pages
- Deleting a Board cascades to: Lists, Cards
- Deleting a List moves Cards or cascades delete
- Deleting a Channel cascades to: Messages
- Deleting a Page can cascade to child Pages

### Soft Deletes
- Cards: `isArchived` flag
- Pages: `isArchived` flag
- Messages: `isDeleted` flag
- Users: `isActive` flag
