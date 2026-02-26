# Resilient Flash Sale Engine

A high-performance flash sale system that handles thousands of concurrent orders while guaranteeing data integrity. Built with Node.js, Express, and MongoDB.

## Why This Architecture?

### The Concurrency Challenge
Flash sales generate massive write volumes—imagine 500+ simultaneous order requests for 10 items in stock. We needed a pattern that:
- Guarantees exactly 10 orders succeed (no overselling)
- Handles concurrent requests without application-level queues
- Performs at scale without distributed locks

### The Solution: MongoDB Atomic Operations + Transactions

I chose a **hybrid approach** combining:

1. **Atomic `findOneAndUpdate`** with conditional stock check
2. **MongoDB Transactions** for ACID guarantees

```javascript
// Order decrements stock only if available—this is atomic at the DB level
const product = await Product.findOneAndUpdate(
  {
    _id: productId,
    stock: { $gte: quantity },  // Conditional: only update if enough stock
    isActive: true,
  },
  {
    $inc: { stock: -quantity },  // Atomic decrement 
  },
  { new: true, session }  // Transaction session
);
```

**Why this beats alternatives:**
- **No application locks** → MongoDB handles concurrency
- **No retry loops** → Optimistic concurrency works first-time
- **Exactly 10 succeed** when stock is 10, even with 500 concurrent requests
- **Lock-free** → Faster for flash sales than pessimistic (row-level) locking

### Other Approaches (and why they don't work here)
- Pessimistic locking: Too slow—creates bottlenecks during peak traffic
- Application queues: Adds latency; doesn't feel "instant" for users
- Version-based retries: Wastes bandwidth on retries; complex logic


---

## Key Features

**Atomic Order Processing** — Every order request checks stock and decrements it in a single atomic operation. No overselling possible.

**Idempotency Protection** — Send the same request twice (network retry), the system returns the existing order without creating duplicates or double-charging.

**Real-Time Analytics** — Single aggregation pipeline calculates revenue, top categories, and stock health in under 200ms.

**Error Handling** — Validates requests, distinguishes client errors (400), conflicts (409), and server errors (500). No stack traces leak in production.

---

## Quick Start

### Prerequisites
- Node.js v18+
- MongoDB v6+

### Setup
```bash
# Install dependencies
npm install
```

Ensure `.env` is configured with your MongoDB connection:
```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/flash-sale-db
LOG_LEVEL=info
```

### Run
```bash
# Development mode
npm run dev

# Production mode
npm start
```

Server runs at `http://localhost:3000`
