# Store Transaction Management API

A RESTful API built with Node.js, Express, TypeScript, and MongoDB for managing banking operations including deposits, withdrawals, transfers, and currency conversions.

## Tech Stack

- Node.js
- Express.js
- TypeScript
- MongoDB
- Mongoose ORM
- JWT Authentication
- Jest & Supertest for testing
- Docker
- Swagger/OpenAPI

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
```
Edit the `.env` file with your configurations.

3. Run the application:

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm run build
npm start
```

Using Docker:
```bash
docker-compose up
```

## API Endpoints

### Authentication

All endpoints require JWT token authentication via Bearer token.

| Method | Endpoint                   | Description                    | Required Role    |
|--------|----------------------------|--------------------------------|------------------|
| POST   | /api/v1/auth/register      | Register a new user            | None             |
| POST   | /api/v1/auth/login         | Login user                     | None             |
| GET    | /api/v1/auth/profile       | Get user profile               | User             |

### Banking Operations

| Method | Endpoint                              | Description                    | Required Role    |
|--------|---------------------------------------|--------------------------------|------------------|
| GET    | /api/v1/banking/balance              | Retrieve user's balance        | User, Admin      |
| POST   | /api/v1/banking/withdraw             | Withdraw funds                 | User, Admin      |
| POST   | /api/v1/banking/deposit              | Deposit funds                  | Open             |
| POST   | /api/v1/banking/transfer             | Transfer funds                 | User, Admin      |
| GET    | /api/v1/banking/transaction-history  | Get transaction history        | User, Admin      |
| GET    | /api/v1/banking/currency-rates       | Get current currency rates     | User, Admin      |
| POST   | /api/v1/banking/convert-currency     | Convert between currencies     | User, Admin      |

### Health Check

| Method | Endpoint | Description       |
|--------|----------|-------------------|
| GET    | /health  | API health status |

## API Documentation

The API documentation is available at `/api-docs` when the server is running.

## Testing

### Prerequisites

The test suite uses MongoDB Memory Server with a replica set to support transactions. No external database is required.

### Running Tests

Run the test suite:
```bash
npm test
```

Run individual test files:
```bash
npm test -- banking.service.test.ts
```

Generate coverage report:
```bash
npm run test:coverage
```

## Security Features

- JWT Authentication and Authorization
- Role-based Access Control (User, Admin)
- Transaction PIN for sensitive operations
- Rate Limiting
- Helmet Security Headers
- CORS Configuration
- Input Validation with Class-validator
- Comprehensive Error Handling
- Audit Logging for all banking operations

## Database Design

### User Schema
- email (String, unique, indexed)
- password (String, hashed)
- firstName (String)
- lastName (String)
- role (Enum: User, Admin)
- timestamps (createdAt, updatedAt)

### User Account Schema
- user (ObjectId, ref: 'User')
- accountNumber (String, unique, indexed)
- accountName (String)
- pin (String, hashed)
- isActive (Boolean)
- timestamps (createdAt, updatedAt)

### Wallet Schema
- user (ObjectId, ref: 'User')
- balance (Number)
- currency (String, default: 'USD')
- isActive (Boolean)
- timestamps (createdAt, updatedAt)

### Transaction Schema
- sender (ObjectId, ref: 'User')
- receiver (ObjectId, ref: 'User')
- amount (Number)
- currency (String)
- type (Enum: Deposit, Withdrawal, Transfer)
- status (Enum: Pending, Completed, Failed)
- reference (String, unique)
- description (String)
- timestamps (createdAt, updatedAt)

### Rates Schema
- baseCurrency (String)
- targetCurrency (String)
- rate (Number)
- timestamps (createdAt, updatedAt)

### Audit Log Schema
- action (String, indexed)
- resource (String, indexed)
- resourceId (ObjectId, indexed)
- userId (ObjectId, indexed)
- changes (Object)
- timestamp (Date, indexed)

## Environment Variables

| Variable                  | Description                    | Default                        |
|---------------------------|--------------------------------|--------------------------------|
| PORT                      | Server port                    | 3000                           |
| NODE_ENV                  | Environment                    | development                    |
| MONGODB_URI               | MongoDB connection string      | mongodb://localhost:27017/store|
| JWT_SECRET                | JWT signing key                | -                              |
| JWT_EXPIRATION_MINUTES    | JWT token expiration           | 60                             |
| RATE_LIMIT_WINDOW_MS      | Rate limit window              | 900000                         |
| RATE_LIMIT_MAX            | Max requests per window        | 100                            |
| COMPANY_USER_ID           | ID of the company account      | -                              |

## Error Handling

The API uses standard HTTP status codes and returns error responses in the following format:
```json
{
  "success": false,
  "status": 400,
  "message": "Error message"
}
```

## Success Responses

Success responses follow this format:
```json
{
  "success": true,
  "data": {
    // Response data
  }
}
```