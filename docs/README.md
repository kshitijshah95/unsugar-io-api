# 📚 Backend Documentation

> Complete documentation for the Unsugar.io backend API

---

## 📖 Documentation Index

### System-Wide Documentation
- **[Architecture Overview](./ARCHITECTURE.md)** - System architecture and component interactions
- **[Developer Guide](./DEVELOPER_GUIDE.md)** - Setup, workflow, and deployment

### Backend-Specific Documentation
- **[Backend Guide](./BACKEND.md)** - Express.js, Authentication, API endpoints
- **[Database Guide](./DATABASE.md)** - MongoDB schemas, indexing, queries
- **[Design Decisions (Backend)](./DESIGN_DECISIONS_BACKEND.md)** - Backend technology choices
- **[Design Decisions (Database)](./DESIGN_DECISIONS_DATABASE.md)** - Database design choices

### Implementation Guides
- **[SSO Implementation](../SSO_IMPLEMENTATION_COMPLETE.md)** - OAuth setup guide
- **[MongoDB Setup](../MONGODB_SETUP.md)** - Database setup guide

### Related Documentation
- **Frontend docs:** `unsugar-io/docs/`
- **Deployment:** `DEPLOYMENT.md` (root)

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Setup environment
node setup-env.js

# Start dev server
npm run dev

# Seed database
npm run seed
```

---

## 📁 Project Structure

```
unsugar-api/
├── docs/                       # 📚 Documentation
│   ├── ARCHITECTURE.md        # System architecture
│   ├── DEVELOPER_GUIDE.md     # Developer guide
│   ├── BACKEND.md             # Backend details
│   ├── DATABASE.md            # Database guide
│   ├── DESIGN_DECISIONS_BACKEND.md
│   └── DESIGN_DECISIONS_DATABASE.md
├── src/
│   ├── models/                # Mongoose models
│   │   ├── User.js
│   │   └── Blog.js
│   ├── routes/                # API routes
│   │   ├── auth.js
│   │   └── blogs.js
│   ├── middleware/            # Custom middleware
│   ├── config/                # Configuration
│   ├── utils/                 # Utilities
│   └── scripts/               # Setup/seed scripts
└── .env                       # Environment variables
```

---

## 🔗 Links

- **Production API:** https://unsugar-io-api.onrender.com
- **Frontend:** https://unsugar.io
- **Repository:** https://github.com/kshitijshah95/unsugar-io-api
- **Frontend Repo:** https://github.com/kshitijshah95/unsugar-io
