# Invoice Management System

A full-stack web application for managing invoices between buyers and sellers, with KYC verification.

## Features

- User authentication (Buyer/Seller roles)
- KYC verification process
- Invoice creation and management
- Invoice approval workflow
- PDF export functionality
- Real-time status updates

## Prerequisites

- Node.js (v16 or higher)
- MongoDB
- npm or yarn

## Environment Setup

1. Create a `.env` file in the `server` directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/invoice_system

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=30d
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/vikasmukhiya1999/b2b-invoicing.git
cd b2b-invoicing
```

2. Install dependencies for the client:
```bash
npm install
```

3. Install dependencies for the server:
```bash
cd server
npm install
```

## Running the Application

1. Start the MongoDB server:
```bash
# Make sure MongoDB is running on your system
```

2. Start the backend server:
```bash
cd server
npm run dev
```

3. Start the frontend development server:
```bash
# In the root directory
npm run dev
```

The application will be available at `http://localhost:5173` and the API server will run on `http://localhost:5000`.

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register a new user
- POST `/api/auth/login` - Login user
- GET `/api/auth/profile` - Get user profile

### KYC
- POST `/api/kyc/submit` - Submit KYC information
- GET `/api/kyc/status` - Get KYC status

### Invoices
- POST `/api/invoices` - Create new invoice
- GET `/api/invoices/seller` - Get seller's invoices
- GET `/api/invoices/buyer` - Get buyer's invoices
- GET `/api/invoices/:id` - Get invoice details
- PUT `/api/invoices/:id` - Update invoice
- PUT `/api/invoices/:id/status` - Update invoice status
- GET `/api/invoices/:id/pdf` - Generate invoice PDF

## Technology Stack

- Frontend:
  - React
  - React Router
  - Tailwind CSS
  - Axios
  - Vite

- Backend:
  - Node.js
  - Express
  - MongoDB
  - JWT Authentication
  - PDFKit

## Directory Structure

```
├── src/                # Frontend source code
│   ├── components/     # React components
│   ├── context/        # React context
│   ├── hooks/         # Custom hooks
│   └── utils/         # Utility functions
├── server/            # Backend source code
│   ├── controllers/   # Route controllers
│   ├── models/        # Database models
│   ├── routes/        # API routes
│   └── middleware/    # Custom middleware
└── public/           # Static files
```
