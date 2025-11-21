# Unsugar API

Backend API for the Unsugar blogging platform built with Express.js.

## Features

- RESTful API for blog posts
- CORS enabled
- Security best practices with Helmet
- Error handling middleware
- Request logging with Morgan
- Health check endpoint
- Environment-based configuration

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn

## Installation

```bash
npm install
```

## Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

## API Endpoints

### Health Check
- `GET /health` - Check API status

### Blogs
- `GET /api/blogs` - Get all blogs (with optional filters)
  - Query params: `?tag=JavaScript&author=Jane&search=closure`
- `GET /api/blogs/:id` - Get blog by ID
- `GET /api/blogs/slug/:slug` - Get blog by slug
- `GET /api/blogs/tags/all` - Get all available tags

## Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

## Project Structure

```
src/
├── config/          # Configuration files
├── data/            # Dummy data
├── middleware/      # Express middleware
├── routes/          # API routes
├── app.js           # Express app setup
└── server.js        # Server entry point
```

## Best Practices Implemented

- ✅ Separation of concerns (routes, middleware, config)
- ✅ Error handling middleware
- ✅ Security headers with Helmet
- ✅ CORS configuration
- ✅ Environment variables for configuration
- ✅ Request logging
- ✅ Graceful shutdown
- ✅ Health check endpoint
- ✅ Consistent API response format

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "count": 10 // for list endpoints
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message"
}
```

## License

ISC
# unsugar-io-api
