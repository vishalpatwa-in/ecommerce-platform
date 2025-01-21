import 'reflect-metadata';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import { Kafka } from 'kafkajs';
import cors from 'cors';
import dotenv from 'dotenv';
import { buildSchema } from 'type-graphql';
import { AuthResolver } from './resolvers/AuthResolver';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect('mongodb://admin:password@localhost:27017/ecommerce?authSource=admin')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err: Error) => console.error('MongoDB connection error:', err));

// Redis client
const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redis.connect().then(() => console.log('Connected to Redis'))
  .catch((err: Error) => console.error('Redis connection error:', err));

// Kafka client
const kafka = new Kafka({
  clientId: 'ecommerce-server',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const producer = kafka.producer();
producer.connect().then(() => console.log('Connected to Kafka'))
  .catch((err: Error) => console.error('Kafka connection error:', err));

async function startApolloServer() {
  const schema = await buildSchema({
    resolvers: [AuthResolver],
    validate: true,
  });

  const server = new ApolloServer({
    schema,
    context: ({ req }) => ({
      req,
      redis,
      producer
    })
  });

  await server.start();
  server.applyMiddleware({ app: app as any });

  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`GraphQL endpoint: http://localhost:${PORT}${server.graphqlPath}`);
  });
}

startApolloServer().catch((err: Error) => console.error('Server startup error:', err)); 