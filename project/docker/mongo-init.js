// MongoDB initialization script
// This runs on first startup when the database is empty

db = db.getSiblingDB('saas_app');

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'password', 'name'],
      properties: {
        email: {
          bsonType: 'string',
          description: 'must be a string and is required',
        },
        password: {
          bsonType: 'string',
          description: 'must be a string and is required',
        },
        name: {
          bsonType: 'string',
          description: 'must be a string and is required',
        },
      },
    },
  },
});

db.createCollection('workspaces');
db.createCollection('boards');
db.createCollection('lists');
db.createCollection('cards');
db.createCollection('channels');
db.createCollection('messages');
db.createCollection('pages');
db.createCollection('files');
db.createCollection('auditlogs');

// Create indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ createdAt: 1 });

db.workspaces.createIndex({ owner: 1 });
db.workspaces.createIndex({ 'members.user': 1 });

db.boards.createIndex({ workspace: 1 });
db.boards.createIndex({ createdBy: 1 });

db.lists.createIndex({ board: 1 });
db.lists.createIndex({ position: 1 });

db.cards.createIndex({ list: 1 });
db.cards.createIndex({ board: 1 });
db.cards.createIndex({ position: 1 });
db.cards.createIndex({ assignees: 1 });
db.cards.createIndex({ dueDate: 1 });
db.cards.createIndex({ '$**': 'text' });

db.channels.createIndex({ workspace: 1 });
db.channels.createIndex({ 'members.user': 1 });

db.messages.createIndex({ channel: 1 });
db.messages.createIndex({ sender: 1 });
db.messages.createIndex({ createdAt: -1 });
db.messages.createIndex({ parentMessage: 1 });

db.pages.createIndex({ workspace: 1 });
db.pages.createIndex({ createdBy: 1 });
db.pages.createIndex({ '$**': 'text' });

db.files.createIndex({ uploadedBy: 1 });
db.files.createIndex({ workspace: 1 });

db.auditlogs.createIndex({ user: 1 });
db.auditlogs.createIndex({ workspace: 1 });
db.auditlogs.createIndex({ action: 1 });
db.auditlogs.createIndex({ createdAt: -1 });

print('Database initialized successfully');
