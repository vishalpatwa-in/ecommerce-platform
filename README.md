# E-commerce Platform

A modern, full-stack e-commerce platform built with Next.js, Express, MongoDB, Redis, and Kafka.

## Features

- Admin Dashboard for managing products, orders, and customers
- Customer-facing storefront with modern UI
- Real-time inventory management
- Multiple payment gateway integrations
- Multi-carrier shipping integration
- Analytics and reporting
- Google OAuth authentication

## Tech Stack

### Backend
- Node.js/Express
- GraphQL with Apollo Server
- MongoDB for data persistence
- Redis for caching
- Kafka for event streaming
- TypeScript

### Frontend
- Next.js 13+ with App Router
- Tailwind CSS for styling
- shadcn/ui components
- TypeScript
- Apollo Client for GraphQL

### Infrastructure
- Docker for containerization
- MongoDB for database
- Redis for caching
- Apache Kafka for event streaming

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   # Install server dependencies
   cd server && npm install

   # Install admin dashboard dependencies
   cd ../admin-dashboard && npm install

   # Install storefront dependencies
   cd ../storefront && npm install
   ```

3. Start the Docker containers:
   ```bash
   cd ../docker
   docker-compose up -d
   ```

4. Start the development servers:
   ```bash
   # Start backend server
   cd ../server
   npm run dev

   # Start admin dashboard
   cd ../admin-dashboard
   npm run dev

   # Start storefront
   cd ../storefront
   npm run dev
   ```

## Project Structure

```
.
├── docker/                 # Docker configuration
├── server/                 # Backend server
├── admin-dashboard/        # Admin panel
└── storefront/            # Customer-facing frontend
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License. 