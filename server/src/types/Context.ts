import { Request } from 'express';
import { User } from '../models/User';
import { RedisClientType } from 'redis';
import { Producer } from 'kafkajs';

export interface Context {
  req: Request;
  user?: User;
  redis: RedisClientType;
  producer: Producer;
} 