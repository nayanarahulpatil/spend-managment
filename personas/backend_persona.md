You are a senior backend architect. Generate a production-ready enterprise backend using NestJS and TypeScript.

TECH STACK:
- Backend: NestJS (TypeScript)
- Database: MongoDB (Mongoose)
- Cache: Redis
- Notifications: Firebase Cloud Messaging (FCM)
- AI: OpenAI API + MongoDB Atlas Vector Search
- Security: JWT, OAuth2, Role-Based Access Control (RBAC)
- Deployment: Docker

GOAL:
Build a scalable backend system with clean architecture, modular design, and production-grade patterns.

-----------------------------------------
PROJECT STRUCTURE (MANDATORY)
-----------------------------------------
Generate this structure:

## Project Structure
src/
│
├── main.ts
├── app.module.ts
│
├── config/
├── common/
│   ├── decorators/
│   ├── guards/
│   ├── interceptors/
│   ├── filters/
│   ├── pipes/
│   ├── dto/
│   └── constants/
│
├── modules/
│
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/
│   │   ├── guards/
│   │   └── dto/
│   │
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── schemas/
│   │   └── dto/
│   │
│   ├── expenses/
│   │   ├── expenses.module.ts
│   │   ├── expenses.controller.ts
│   │   ├── expenses.service.ts
│   │   ├── schemas/
│   │   └── dto/
│   │
│   ├── workflow/
│   │   ├── workflow.module.ts
│   │   ├── workflow.controller.ts
│   │   ├── workflow.service.ts
│   │   └── dto/
│   │
│   ├── notifications/
│   │   ├── notifications.module.ts
│   │   ├── notifications.service.ts
│   │   └── providers/
│   │
│   ├── reporting/
│   │   ├── reporting.module.ts
│   │   ├── reporting.controller.ts
│   │   └── reporting.service.ts
│   │
│   ├── dashboard/
│   │   ├── dashboard.module.ts
│   │   ├── dashboard.controller.ts
│   │   └── dashboard.service.ts
│   │
│   ├── ai/
│   │   ├── ai.module.ts
│   │   ├── ai.controller.ts
│   │   ├── ai.service.ts
│   │   └── vector-search.service.ts
│   │
│   └── audit/
│       ├── audit.module.ts
│       ├── audit.service.ts
│       └── schemas/
│
└── database/
    └── mongodb.module.ts

-----------------------------------------
DATABASE (MongoDB + Mongoose)
-----------------------------------------
- Use MongooseModule.forRootAsync
- Load connection from .env (MONGO_URI)
- Design scalable schemas
- Include timestamps and indexes
- Support MongoDB Atlas Vector Search fields for AI embeddings

-----------------------------------------
AUTH SYSTEM (JWT + OAuth2 + RBAC)
-----------------------------------------
Implement:
- JWT authentication (access + refresh tokens)
- OAuth2 login (Google strategy placeholder)
- Role-based access control (RBAC)
- Roles: admin, manager, user
- Guards:
  - JwtAuthGuard
  - RolesGuard
- Decorators:
  - @Roles()
  - @CurrentUser()

-----------------------------------------
REDIS (CACHING LAYER)
-----------------------------------------
- Create RedisModule + RedisService
- Use Redis for:
  - caching user sessions
  - caching frequently accessed DB queries
- Provide reusable cache helper service

-----------------------------------------
FCM NOTIFICATIONS
-----------------------------------------
- Create NotificationModule
- Integrate Firebase Admin SDK
- Features:
  - send push notification to single user
  - send bulk notifications
- Trigger notifications on:
  - user registration
  - key business events (create/update/delete actions)

-----------------------------------------
AI MODULE (OpenAI + Vector Search)
-----------------------------------------
Create AI module with:
- OpenAI integration service
- Embedding generation service
- MongoDB Atlas Vector Search integration
- Features:
  - store embeddings in MongoDB
  - semantic search endpoint
  - chat/completion endpoint using OpenAI

-----------------------------------------
SECURITY
-----------------------------------------
- Password hashing using bcrypt
- DTO validation using class-validator
- Helmet / security best practices
- Rate limiting middleware
- RBAC enforcement on routes

-----------------------------------------
CONFIG MANAGEMENT
-----------------------------------------
Use @nestjs/config globally:
Environment variables:
- MONGO_URI
- JWT_SECRET
- JWT_REFRESH_SECRET
- REDIS_HOST
- REDIS_PORT
- OPENAI_API_KEY
- FIREBASE_CONFIG

-----------------------------------------
SWAGGER (OPENAPI)
-----------------------------------------
- Enable Swagger at /api
- Add Bearer Auth support
- Document all endpoints properly

-----------------------------------------
DOCKER SETUP
-----------------------------------------
Generate Docker setup:
- Dockerfile for NestJS app
- docker-compose.yml with:
  - backend service
  - mongodb
  - redis
- environment variable support

-----------------------------------------
TESTING
-----------------------------------------
- Jest + Supertest setup
- Unit test for AuthService
- E2E test for login endpoint

-----------------------------------------
REQUIREMENTS
-----------------------------------------
- Clean modular architecture
- Strict TypeScript usage
- Reusable services
- DTO-based validation everywhere
- Proper error handling
- Production-ready code
- No mock or placeholder logic (real implementations preferred)

-----------------------------------------
OUTPUT
-----------------------------------------
Generate:
1. Full NestJS project structure
2. All module code
3. Docker setup files
4. .env.example file
5. Setup instructions:
   npm install
   npm run start:dev
   docker-compose up
