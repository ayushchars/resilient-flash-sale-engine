# Resilient Flash Sale Engine

A high-performance, production-ready flash sale system built with Node.js, Express, and MongoDB. Features atomic operations, idempotency protection, and real-time analytics using MongoDB aggregation pipelines.

## 🎯 Challenge Overview

This system handles massive write volumes for flash sales while maintaining data integrity and providing complex real-time business intelligence. It solves three critical problems:

1. **Atomic Order Engine** - Prevents overselling with concurrent request handling
2. **Performance-First Analytics** - Single aggregation pipeline for comprehensive dashboard
3. **Production-Grade Middleware** - Validation, error handling, and request logging

---

## 🚀 Features

### 1. Atomic Order Processing
- **Concurrency Control**: Uses MongoDB transactions and atomic operations (`findOneAndUpdate` with `$inc`)
- **Idempotency Protection**: Prevents duplicate orders from network retries
- **Stock Integrity**: Guarantees no overselling even with 500+ concurrent requests
- **Graceful Failures**: Returns proper 409 Conflict when stock is insufficient

### 2. Real-Time Analytics Dashboard
Single aggregation pipeline providing:
- Total revenue and items sold
- Stock health categorization (Critical < 10, Healthy ≥ 10)
- Top 3 categories by revenue
- Average conversion speed (time from product add to first order)

### 3. Production-Ready Middleware
- **Schema Validation**: Joi-based request validation
- **Error Handling**: Distinguishes 4xx (client), 409 (conflict), and 5xx (server) errors
- **Request Logging**: Winston logger with request ID tracking and duration
- **No Stack Trace Leaks**: Sanitized error responses in production

---

## 🏗️ Architecture

### Project Structure
```
src/
├── config/
│   ├── config.js          # Environment configuration
│   └── database.js        # MongoDB connection
├── models/
│   ├── Product.js         # Product schema with indexes
│   └── Order.js           # Order schema with idempotency
├── services/
│   ├── order.service.js   # Atomic order logic
│   ├── product.service.js # Product operations
│   └── analytics.service.js # Aggregation pipeline
├── controllers/
│   ├── order.controller.js
│   ├── product.controller.js
│   └── analytics.controller.js
├── routes/
│   ├── order.routes.js
│   ├── product.routes.js
│   ├── analytics.routes.js
│   └── index.js
├── middleware/
│   ├── validate.js        # Joi validation middleware
│   ├── errorHandler.js    # Global error handler
│   └── requestLogger.js   # Winston request logger
├── validators/
│   └── schemas.js         # Validation schemas
├── utils/
│   └── logger.js          # Winston configuration
├── app.js                 # Express app setup
└── server.js              # Server initialization

```

### Design Patterns
- **Service/Repository Pattern**: Clean separation of concerns
- **Factory Functions**: Error creation without classes
- **Middleware Chain**: Modular request processing
- **Transaction Pattern**: ACID compliance for orders

---

## 🔧 Technical Implementation

### Concurrency Strategy

**Why MongoDB Transactions + Atomic Updates?**

I chose a hybrid approach combining:

1. **MongoDB Transactions** for ACID guarantees across collections
2. **Atomic `findOneAndUpdate`** with conditional updates for lock-free concurrency

```javascript
// Key implementation from order.service.js
const product = await Product.findOneAndUpdate(
  {
    _id: productId,
    stock: { $gte: quantity },  // Only update if stock is sufficient
    isActive: true,
  },
  {
    $inc: { stock: -quantity },   // Atomic decrement
  },
  {
    new: true,
    session,  // Transaction session
  }
);
```

**Benefits:**
- ✅ No application-level locking needed
- ✅ MongoDB handles versioning and conflicts
- ✅ Optimistic concurrency without retries
- ✅ Exactly 5 succeed when stock is 5, even with 500 requests

**Alternative Approaches Considered:**
- ❌ Pessimistic locking (too slow for flash sales)
- ❌ Application-level queues (adds complexity)
- ❌ Version-based optimistic locking (requires retry logic)

### Idempotency Implementation

Every order requires a unique `idempotencyKey`:
```javascript
POST /api/orders
{
  "productId": "...",
  "quantity": 1,
  "idempotencyKey": "client-generated-uuid"
}
```

On duplicate key:
- **First request**: Creates order, decrements stock, returns 201
- **Retry with same key**: Returns existing order with 200, no stock change

This prevents the classic "double charge on network retry" problem.

---

## 📊 Database Indexing Strategy

### Orders Collection (5M+ documents)

**Required Indexes:**
```javascript
// 1. Compound index for analytics aggregation
{ productId: 1, createdAt: 1 }

// 2. Time-range queries
{ createdAt: 1 }

// 3. Status filtering
{ status: 1 }

// 4. Idempotency lookups (unique)
{ idempotencyKey: 1 }, unique: true

// 5. Order retrieval
{ orderId: 1 }, unique: true
```

**Performance Analysis:**

To keep dashboard query under **200ms** with 5M orders:

1. **Use Covered Queries**: The compound index `{ productId: 1, createdAt: 1 }` allows MongoDB to serve aggregation entirely from index without fetching documents

2. **Pipeline Optimization**:
   - Early `$match` stage filters before `$lookup`
   - `$facet` runs parallel aggregations
   - Indexes on joined fields (`Product._id`)

3. **Expected Performance**:
   - Index scan: ~50ms for 5M docs
   - $lookup: ~30ms (indexed join)
   - Aggregation compute: ~70ms
   - **Total: ~150ms** (with indexes)

4. **Additional Optimizations**:
   - Consider read replicas for analytics
   - Cache dashboard results (5-10 second TTL)
   - Archive old orders to separate collection

---

## 🛠️ Installation & Setup

### Prerequisites
- Node.js v18+
- MongoDB v6+
- npm or yarn

### 1. Clone & Install
```bash
cd Ayush-test
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env
```

Edit `.env`:
```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/flash-sale-db
LOG_LEVEL=info
```

### 3. Start MongoDB
```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or local MongoDB
mongod --dbpath /path/to/data
```

### 4. Run Application
```bash
# Development with auto-reload
npm run dev

# Production
npm start
```

Server runs at `http://localhost:3000`

---

## 🧪 Testing

### Run Integration Tests
```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Test Coverage
- ✅ Concurrency tests (10 parallel orders on 5 stock)
- ✅ Idempotency validation
- ✅ Stock integrity verification
- ✅ Analytics aggregation accuracy
- ✅ Error handling scenarios

### Concurrency Test Results
```
✓ Should prevent overselling with concurrent requests
  - 10 requests, 5 stock → exactly 5 succeed, 5 fail
  - Final stock: 0
  - Orders created: 5
```

---

## 📡 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Endpoints

#### **Health Check**
```http
GET /api/health
```

#### **Create Order (Atomic)**
```http
POST /api/orders
Content-Type: application/json

{
  "productId": "65f8a1b2c3d4e5f6a7b8c9d0",
  "quantity": 1,
  "idempotencyKey": "unique-client-generated-uuid"
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "_id": "...",
    "orderId": "uuid",
    "productId": "...",
    "quantity": 1,
    "totalPrice": 199.99,
    "status": "confirmed"
  }
}
```

**Response 409 (Insufficient Stock):**
```json
{
  "success": false,
  "error": "Insufficient stock. Requested: 10, Available: 5"
}
```

#### **Get Dashboard Analytics**
```http
GET /api/analytics/dashboard
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "revenue": 15789.45,
    "totalItemsSold": 127,
    "avgConversionSpeedSeconds": 245,
    "stockHealth": {
      "critical": [
        {
          "productId": "...",
          "name": "Limited Watch",
          "stock": 3,
          "category": "Accessories"
        }
      ],
      "healthy": [...]
    },
    "topCategories": [
      {
        "_id": "Electronics",
        "totalRevenue": 9999.99,
        "totalItemsSold": 45
      }
    ],
    "productMetrics": [...]
  }
}
```

See **[Flash-Sale-API.postman_collection.json](./Flash-Sale-API.postman_collection.json)** for complete API collection.

---

## 📮 Postman Collection

### Import Collection
1. Open Postman
2. Click **Import**
3. Select `Flash-Sale-API.postman_collection.json`
4. Import environment: `Flash-Sale-Development.postman_environment.json`

### Included Test Scenarios
- ✅ Successful order creation
- ✅ Insufficient stock handling
- ✅ Idempotency testing
- ✅ Concurrency simulation (use Collection Runner)
- ✅ Analytics validation
- ✅ Bulk product creation

### Running Concurrency Tests
1. Select "Concurrency Test - Multiple Orders"
2. Click **Run Collection**
3. Set **Iterations: 20**
4. Set **Delay: 0ms**
5. Run → Observe exactly (stock quantity) succeed

---

## 🔒 Error Handling

### Error Response Format
```json
{
  "success": false,
  "error": "Error message",
  "requestId": "uuid"
}
```

### HTTP Status Codes
- **200**: Success (includes idempotent retries)
- **201**: Resource created
- **400**: Validation error
- **404**: Resource not found
- **409**: Conflict (insufficient stock, duplicate)
- **500**: Server error

### Error Types
- `ValidationError` → 400
- `NotFoundError` → 404
- `ConflictError` → 409
- Generic errors → 500

**Production Mode**: Stack traces are hidden

---

## 📈 Performance Considerations

### Optimizations Implemented
1. **Indexed Queries**: All frequent queries use indexes
2. **Connection Pooling**: MongoDB native driver pooling
3. **Lean Documents**: Service layer uses `.lean()` where appropriate
4. **Aggregation Optimization**: Single pipeline with `$facet`

### Scaling Recommendations
- **Horizontal Scaling**: Use MongoDB replica sets
- **Caching**: Redis for dashboard (5-10s TTL)
- **Load Balancing**: Nginx/HAProxy for API instances
- **Rate Limiting**: Prevent abuse (not implemented)
- **CDN**: For static assets (if any)

---

## 🧩 Future Enhancements

- [ ] Rate limiting per IP/user
- [ ] Admin authentication (JWT)
- [ ] Order cancellation workflow
- [ ] Webhook notifications
- [ ] GraphQL API
- [ ] Metrics dashboard (Prometheus/Grafana)
- [ ] Distributed tracing (Jaeger)

---

## 📝 Development Notes

### Logging
Logs are written to:
- `logs/error.log` - Error level only
- `logs/combined.log` - All logs
- Console (development only)

### Request IDs
Every request gets a unique ID:
- Auto-generated UUID
- Or from `X-Request-Id` header
- Included in all logs and error responses

---

## 🤝 Contributing

This is a technical assessment project, but feedback is welcome!

---

## 📄 License

MIT License - See LICENSE file for details

---

## 👨‍💻 Author

Built as a technical challenge demonstrating:
- Concurrency handling
- Database transactions
- Aggregation pipelines
- Production-ready error handling
- Comprehensive testing

**Time to complete**: ~6-8 hours
**Tech Stack**: Node.js, Express, MongoDB, Mongoose, Jest
**Key Learning**: Atomic operations, idempotency, aggregation optimization

---

## 📞 Support

For questions or issues, please check:
1. Test files for usage examples
2. Postman collection for API reference
3. Service layer comments for implementation details

---

**Happy Flash Sale! 🚀**
