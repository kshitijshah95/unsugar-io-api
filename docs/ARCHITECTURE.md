# 🏗️ Architecture Overview

> High-level system architecture for Unsugar.io blogging platform

---

## Table of Contents
- [System Architecture](#system-architecture)
- [Component Diagram](#component-diagram)
- [Technology Stack](#technology-stack)
- [Deployment Topology](#deployment-topology)
- [Data Flow](#data-flow)
- [Security Architecture](#security-architecture)

---

## System Architecture

### Three-Tier Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
│                                                             │
│  React Frontend (TypeScript)                                │
│  - UI Components                                            │
│  - State Management                                         │
│  - API Proxy Layer                                          │
│  - Routing                                                  │
│                                                             │
│  Deployed: Netlify CDN                                      │
│  URL: https://unsugar.io                                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTPS/REST API
                     │ JSON Payload
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   Application Layer                         │
│                                                             │
│  Express.js Backend (Node.js)                               │
│  - RESTful API (v1)                                         │
│  - Authentication (JWT + OAuth)                             │
│  - Business Logic                                           │
│  - Input Validation                                         │
│  - Rate Limiting                                            │
│  - Error Handling                                           │
│                                                             │
│  Deployed: Render.com                                       │
│  URL: https://unsugar-io-api.onrender.com                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ MongoDB Protocol
                     │ Wire Protocol
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                     Data Layer                              │
│                                                             │
│  MongoDB Atlas (Cloud)                                      │
│  - User Collection                                          │
│  - Blog Collection                                          │
│  - Compound Indexes                                         │
│  - Replica Sets                                             │
│  - Automated Backups                                        │
│                                                             │
│  Hosted: MongoDB Atlas                                      │
│  Region: Auto (closest to backend)                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Diagram

### Frontend Components

```
src/
├── components/
│   ├── common/              # Reusable UI components
│   └── NavBar.tsx          # Navigation component
├── pages/
│   ├── Home.tsx            # Landing page
│   ├── BlogList.tsx        # Blog listing
│   └── BlogPage.tsx        # Single blog view
├── services/
│   ├── authService.ts      # Authentication logic
│   └── blogService.ts      # Blog API calls
├── lib/
│   └── apiClient.ts        # Axios instance + interceptors
├── utils/
│   ├── tokenManager.ts     # JWT token management
│   └── logger.ts           # Environment-aware logging
└── config/
    └── api.ts              # API endpoints config
```

**Key Design:** Service layer pattern separates API logic from components.

### Backend Components

```
src/
├── models/
│   ├── User.js             # User schema (Mongoose)
│   └── Blog.js             # Blog schema (Mongoose)
├── routes/
│   ├── auth.js             # Auth endpoints
│   └── blogs.js            # Blog endpoints
├── middleware/
│   ├── auth.js             # JWT verification
│   ├── rateLimiter.js      # Rate limiting
│   └── errorHandler.js     # Global error handler
├── config/
│   ├── passport.js         # OAuth strategies
│   ├── database.js         # MongoDB connection
│   └── config.js           # Environment config
├── utils/
│   ├── jwt.js              # JWT utilities
│   └── sanitize.js         # Input sanitization
└── app.js                  # Express app setup
```

**Key Design:** Layered architecture with separation of concerns.

---

## Technology Stack

### Frontend Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Framework** | React | 18.3.x | UI library |
| **Language** | TypeScript | 5.5.x | Type safety |
| **Build Tool** | Vite | 5.4.x | Fast dev server & bundling |
| **HTTP Client** | Axios | 1.7.x | API requests + interceptors |
| **Routing** | React Router | 6.x | Client-side routing |
| **Styling** | CSS3 | - | Custom styles |
| **Linting** | ESLint | 9.x | Code quality |

**Why React?** Component-based, large ecosystem, industry standard.  
**Why TypeScript?** Type safety prevents runtime errors, better IDE support.  
**Why Vite?** Fast HMR, modern build tool, better DX than CRA.  
**Why Axios?** Interceptors for auth, better than fetch for this use case.

### Backend Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Runtime** | Node.js | 20.x | JavaScript runtime |
| **Framework** | Express.js | 4.19.x | Web framework |
| **Database** | MongoDB | 7.x | NoSQL database |
| **ODM** | Mongoose | 8.x | MongoDB object modeling |
| **Authentication** | Passport.js | 0.7.x | OAuth strategies |
| **Tokens** | jsonwebtoken | 9.0.x | JWT generation/verification |
| **Password** | bcryptjs | 2.4.x | Password hashing |
| **Validation** | express-validator | 7.x | Input validation |
| **Security** | helmet | 7.x | Security headers |
| **CORS** | cors | 2.8.x | Cross-origin requests |
| **Logging** | morgan | 1.10.x | HTTP request logging |

**Why Express?** Lightweight, flexible, huge ecosystem.  
**Why MongoDB?** Schema flexibility for blog content, horizontal scaling.  
**Why Passport?** De-facto standard for OAuth, supports all providers.  
**Why JWT?** Stateless auth, scalable, works well with SPAs.

---

## Deployment Topology

```
┌─────────────────────────────────────────────────────────────┐
│                         Internet                            │
└────────────┬────────────────────────────┬───────────────────┘
             │                            │
             ▼                            ▼
    ┌────────────────┐          ┌────────────────┐
    │   DNS (Route)  │          │  DNS (Route)   │
    │  unsugar.io    │          │  API subdomain │
    └────────┬───────┘          └────────┬───────┘
             │                            │
             ▼                            ▼
    ┌────────────────┐          ┌────────────────┐
    │    Netlify     │          │  Render.com    │
    │      CDN       │          │   (Backend)    │
    │                │          │                │
    │  - Edge nodes  │          │ - Auto-scaling │
    │  - HTTPS       │          │ - HTTPS        │
    │  - Caching     │          │ - Health check │
    │  - Rollback    │          │ - Logs         │
    └────────────────┘          └────────┬───────┘
                                         │
                                         ▼
                                ┌────────────────┐
                                │ MongoDB Atlas  │
                                │  (Database)    │
                                │                │
                                │ - Replica set  │
                                │ - Auto-backup  │
                                │ - Monitoring   │
                                └────────────────┘
```

### Netlify (Frontend)
- **Auto-deploy:** Push to `main` → build → deploy
- **Features:** CDN, HTTPS, rollback, preview deployments
- **Build command:** `npm run build`
- **Publish directory:** `dist/`

### Render (Backend)
- **Auto-deploy:** Push to `main` → build → deploy
- **Features:** Auto-scaling, health checks, logs, metrics
- **Start command:** `npm start`
- **Health endpoint:** `/health`

### MongoDB Atlas (Database)
- **Cluster:** M0 (Free tier)
- **Region:** Auto-select closest to backend
- **Features:** Replica sets, auto-backup, monitoring
- **Connection:** Via MongoDB driver (Mongoose)

---

## Data Flow

### 1. User Authentication Flow (OAuth)

```
┌────────┐                                      ┌─────────────┐
│ User   │                                      │   Frontend  │
└───┬────┘                                      └──────┬──────┘
    │                                                  │
    │ 1. Click "Sign in with Google"                  │
    │ ─────────────────────────────────────────────>  │
    │                                                  │
    │ 2. Redirect to backend OAuth endpoint           │
    │ <─────────────────────────────────────────────  │
    │                                                  │
    │                                    ┌─────────────▼─────┐
    │                                    │   Backend (API)   │
    │                                    └─────────┬─────────┘
    │ 3. Redirect to Google               │
    │ <────────────────────────────────   │
    │                                     │
┌───▼────────┐                            │
│   Google   │                            │
│   OAuth    │                            │
└───┬────────┘                            │
    │                                     │
    │ 4. User authorizes                  │
    │                                     │
    │ 5. Callback with auth code          │
    │ ─────────────────────────────────>  │
    │                                     │
    │                         ┌───────────▼────────┐
    │                         │  MongoDB (Database)│
    │                         │  - Create/find user│
    │                         │  - Store tokens    │
    │                         └───────────┬────────┘
    │                                     │
    │ 6. Redirect to frontend with JWT    │
    │ <────────────────────────────────   │
    │                                     │
┌───▼──────┐                              │
│ Frontend │                              │
│ - Store  │                              │
│   tokens │                              │
│ - Redirect                              │
│   to app │                              │
└──────────┘                              │
```

### 2. Authenticated API Request Flow

```
┌──────────┐         ┌─────────────┐         ┌─────────────┐
│ Frontend │         │   Backend   │         │  MongoDB    │
└────┬─────┘         └──────┬──────┘         └──────┬──────┘
     │                      │                       │
     │ 1. API Request       │                       │
     │    + JWT token       │                       │
     │ ──────────────────>  │                       │
     │                      │                       │
     │                      │ 2. Verify JWT         │
     │                      │    Check expiry       │
     │                      │    Extract user ID    │
     │                      │                       │
     │                      │ 3. Query database     │
     │                      │ ───────────────────>  │
     │                      │                       │
     │                      │ 4. Return data        │
     │                      │ <─────────────────── │
     │                      │                       │
     │ 5. JSON response     │                       │
     │ <──────────────────  │                       │
     │                      │                       │
```

### 3. Token Refresh Flow

```
┌──────────┐         ┌─────────────┐         ┌─────────────┐
│ Frontend │         │   Backend   │         │  MongoDB    │
└────┬─────┘         └──────┬──────┘         └──────┬──────┘
     │                      │                       │
     │ Access token expired │                       │
     │                      │                       │
     │ 1. POST /auth/refresh│                       │
     │    + refresh token   │                       │
     │ ──────────────────>  │                       │
     │                      │                       │
     │                      │ 2. Verify refresh token
     │                      │    Check in database  │
     │                      │ ───────────────────>  │
     │                      │                       │
     │                      │ 3. Token valid?       │
     │                      │ <─────────────────── │
     │                      │                       │
     │ 4. New access token  │                       │
     │ <──────────────────  │                       │
     │                      │                       │
     │ 5. Retry original    │                       │
     │    request           │                       │
     │ ──────────────────>  │                       │
```

---

## Security Architecture

### 1. Authentication Layers

```
┌─────────────────────────────────────────────────────────┐
│               Frontend Security                         │
│                                                         │
│  ✓ Token storage (localStorage - migrate to cookies)   │
│  ✓ Token expiry tracking                               │
│  ✓ Automatic token refresh                             │
│  ✓ Redirect on 401                                     │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│               Network Security                          │
│                                                         │
│  ✓ HTTPS only (TLS 1.2+)                               │
│  ✓ CORS configuration                                  │
│  ✓ Rate limiting (100 req/15min)                       │
│  ✓ Security headers (Helmet.js)                        │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│              Application Security                       │
│                                                         │
│  ✓ JWT verification (access + refresh)                 │
│  ✓ Input validation (express-validator)                │
│  ✓ Password hashing (bcrypt, 12 rounds)                │
│  ✓ SQL injection prevention (MongoDB ODM)              │
│  ✓ XSS prevention (input sanitization)                 │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│               Database Security                         │
│                                                         │
│  ✓ Encrypted connections (TLS)                         │
│  ✓ IP whitelist (MongoDB Atlas)                        │
│  ✓ Database authentication                             │
│  ✓ Field-level encryption (passwords)                  │
│  ✓ Automated backups                                   │
└─────────────────────────────────────────────────────────┘
```

### 2. Trust Boundaries

```
┌────────────────────────────────────────────────────────┐
│  Untrusted Zone                                        │
│  - User browsers                                       │
│  - Public internet                                     │
└────────────────────┬───────────────────────────────────┘
                     │
                     │ Trust Boundary 1: HTTPS + CORS
                     │
                     ▼
┌────────────────────────────────────────────────────────┐
│  Semi-Trusted Zone                                     │
│  - Frontend application (Netlify CDN)                  │
│  - Client-side code                                    │
└────────────────────┬───────────────────────────────────┘
                     │
                     │ Trust Boundary 2: JWT + Rate Limit
                     │
                     ▼
┌────────────────────────────────────────────────────────┐
│  Trusted Zone                                          │
│  - Backend API (Render)                                │
│  - Business logic                                      │
└────────────────────┬───────────────────────────────────┘
                     │
                     │ Trust Boundary 3: DB Auth + Encryption
                     │
                     ▼
┌────────────────────────────────────────────────────────┐
│  Highly Trusted Zone                                   │
│  - Database (MongoDB Atlas)                            │
│  - Persistent data                                     │
└────────────────────────────────────────────────────────┘
```

---

## Scalability Considerations

### Current Architecture
- **Frontend:** CDN-based, auto-scales with Netlify
- **Backend:** Single instance on Render (free tier)
- **Database:** Shared cluster (M0, free tier)

### Future Scaling Path

**Phase 1: Vertical Scaling** (0-10K users)
- ✓ Current setup sufficient
- Upgrade Render to paid tier if needed
- Monitor response times

**Phase 2: Horizontal Scaling** (10K-100K users)
- Multiple backend instances (load balanced)
- Dedicated MongoDB cluster (M10+)
- Redis for session/cache
- CDN optimization

**Phase 3: Distributed Systems** (100K+ users)
- Microservices architecture
- Separate auth service
- Message queue (RabbitMQ/Kafka)
- Read replicas for MongoDB
- Elasticsearch for blog search

---

## Monitoring & Observability

### Current Setup
```
Netlify Dashboard
  └─> Build logs
  └─> Deploy history
  └─> Analytics

Render Dashboard
  └─> Application logs
  └─> Metrics (CPU, Memory)
  └─> Health checks

MongoDB Atlas
  └─> Query performance
  └─> Storage metrics
  └─> Alert configuration
```

### Planned Improvements
- [ ] Error tracking (Sentry)
- [ ] APM (Application Performance Monitoring)
- [ ] Custom metrics (Prometheus + Grafana)
- [ ] Uptime monitoring (Pingdom)
- [ ] Log aggregation (ELK stack)

---

## Next: [Frontend Documentation →](./02-FRONTEND_DOCUMENTATION.md)
