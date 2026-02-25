# Quick Start Guide

## 🚀 Get Running in 5 Minutes

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Setup Environment
```bash
# Create .env file
cp .env.example .env
```

### Step 3: Start MongoDB
```bash
# Option A: Using Docker (recommended)
docker run -d -p 27017:27017 --name flash-sale-mongo mongo:latest

# Option B: Local MongoDB
mongod
```

### Step 4: Run the Server
```bash
npm run dev
```

Server will be running at `http://localhost:3000`

### Step 5: Test with Postman

1. Import `Flash-Sale-API.postman_collection.json` into Postman
2. Import `Flash-Sale-Development.postman_environment.json`
3. Run "Create Product" request
4. Copy the productId from response
5. Run "Create Order" request (it will use the productId variable automatically)

---

## 🧪 Run Tests
```bash
npm test
```

---

## 📋 Quick API Test (using curl)

### 1. Health Check
```bash
curl http://localhost:3000/api/health
```

### 2. Create a Product
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Gaming Laptop",
    "description": "High-performance laptop",
    "price": 1299.99,
    "category": "Electronics",
    "stock": 10,
    "isActive": true
  }'
```

Copy the `_id` from the response (you'll need it for the order).

### 3. Create an Order
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "PASTE_PRODUCT_ID_HERE",
    "quantity": 1,
    "idempotencyKey": "test-key-123"
  }'
```

### 4. View Dashboard Analytics
```bash
curl http://localhost:3000/api/analytics/dashboard
```

---

## 🎯 Testing Concurrency

Use the Postman Collection Runner:
1. Select "Concurrency Test - Multiple Orders"
2. Click **Runner**
3. Set iterations: **20**
4. Set delay: **0ms**
5. Click **Run**
6. Observe: Only (stock quantity) orders will succeed!

---

## 📚 Next Steps

- Read the full [README.md](./README.md) for detailed documentation
- Check [__tests__](./__tests__) folder for test examples
- Explore the service layer for implementation details

---

**Need Help?** Check the main README.md for comprehensive documentation.
