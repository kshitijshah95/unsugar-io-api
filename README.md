# Unsugar API

Backend API for the Unsugar blogging platform built with Express.js.

## Features

- ✅ RESTful API for blog posts with versioning (v1)
- ✅ CORS enabled with configurable origins
- ✅ Security best practices with Helmet
- ✅ Rate limiting (100 requests per 15 minutes)
- ✅ Pagination and sorting support
- ✅ Error handling middleware
- ✅ Request logging with Morgan
- ✅ Health check endpoint
- ✅ Environment-based configuration
- ✅ Graceful shutdown handling

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
  
**Response:**
```json
{
  "success": true,
  "message": "API is running",
  "timestamp": "2024-11-21T10:52:00.000Z"
}
```

### Blogs (v1)

All blog endpoints are versioned under `/api/v1/`

#### Get All Blogs
`GET /api/v1/blogs`

Get all blogs with optional filtering, pagination, and sorting.

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 10, max: 50) - Items per page
- `tag` (string) - Filter by tag (e.g., "JavaScript")
- `author` (string) - Filter by author name
- `search` (string) - Search in title and excerpt
- `sort` (string, default: "publishedDate") - Sort field (publishedDate | title)
- `order` (string, default: "desc") - Sort order (asc | desc)

**Example Request:**
```bash
GET /api/v1/blogs?page=1&limit=10&tag=JavaScript&sort=publishedDate&order=desc
```

**Success Response (200):**
```json
{
  "success": true,
  "count": 10,
  "total": 45,
  "page": 1,
  "totalPages": 5,
  "data": [
    {
      "id": "1",
      "slug": "understanding-closures",
      "title": "Understanding JavaScript Closures",
      "excerpt": "Learn how closures work in JavaScript...",
      "author": "Jane Doe",
      "publishedDate": "2024-01-15",
      "readTime": "5 min read",
      "tags": ["JavaScript", "Programming"],
      "thumbnail": "/images/closures.jpg"
    }
  ]
}
```

#### Get Blog by ID
`GET /api/v1/blogs/:id`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "slug": "understanding-closures",
    "title": "Understanding JavaScript Closures",
    "excerpt": "Learn how closures work...",
    "content": "Full blog content here...",
    "author": "Jane Doe",
    "publishedDate": "2024-01-15",
    "readTime": "5 min read",
    "tags": ["JavaScript", "Programming"],
    "thumbnail": "/images/closures.jpg"
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": "Blog not found"
}
```

#### Get Blog by Slug
`GET /api/v1/blogs/slug/:slug`

Same response format as Get Blog by ID.

#### Get All Tags
`GET /api/v1/blogs/tags/all`

**Success Response (200):**
```json
{
  "success": true,
  "data": ["JavaScript", "React", "Node.js", "CSS", "Programming"]
}
```

## Security

### Rate Limiting
- **100 requests per 15 minutes** per IP address
- Rate limit headers included in responses:
  - `RateLimit-Limit`: Maximum requests allowed
  - `RateLimit-Remaining`: Remaining requests in current window
  - `RateLimit-Reset`: Time when the rate limit resets

**Rate Limit Error (429):**
```json
{
  "success": false,
  "error": "Too many requests from this IP, please try again later."
}
```

### CORS
- Configurable via `CORS_ORIGIN` environment variable
- Production: Set to your frontend domain (e.g., `https://yourdomain.com`)
- Development: Defaults to `http://localhost:5173`

### HTTPS
- In production, always use HTTPS
- Consider using a reverse proxy (nginx) or hosting platform with SSL/TLS

### Security Headers
- Helmet.js middleware provides security headers:
  - Content Security Policy
  - X-Frame-Options
  - X-Content-Type-Options
  - Strict-Transport-Security (in production)

## Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration
# Development: http://localhost:5173
# Production: https://yourdomain.com
CORS_ORIGIN=http://localhost:5173
```

**Important:** Never commit `.env` to version control!

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
  "count": 10,        // for list endpoints
  "total": 45,        // total items (pagination)
  "page": 1,          // current page
  "totalPages": 5     // total pages
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message"
}
```

## Error Codes

| Status Code | Description | Example |
|------------|-------------|---------|
| 200 | Success | Request completed successfully |
| 304 | Not Modified | Cached content is still valid |
| 400 | Bad Request | Invalid query parameters |
| 404 | Not Found | Blog post not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error occurred |

## Data Storage

Currently uses in-memory data storage with dummy blog data. For production:
- Consider MongoDB, PostgreSQL, or MySQL
- Implement proper database migrations
- Add data validation and sanitization
- Implement authentication for write operations

## Testing

```bash
# Run tests (to be implemented)
npm test
```

Future: Add Jest or Mocha for unit and integration tests.

## Deployment

### Recommended Platforms
- **Heroku**: Easy deployment with buildpacks
- **Render**: Free tier available
- **Railway**: Modern deployment platform
- **DigitalOcean App Platform**: Full-featured hosting
- **AWS EC2/Elastic Beanstalk**: Enterprise solution

### Pre-deployment Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Update `CORS_ORIGIN` to production domain
- [ ] Enable HTTPS/SSL
- [ ] Set appropriate rate limits
- [ ] Configure database (if using)
- [ ] Set up monitoring and logging
- [ ] Review security headers

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## API Versioning

This API uses URL-based versioning. Current version: **v1**

- Breaking changes will result in a new version (v2, v3, etc.)
- Old versions will be maintained for backward compatibility
- Deprecation notices will be provided 6 months in advance

## License

ISC - See [LICENSE](LICENSE) file for details.
