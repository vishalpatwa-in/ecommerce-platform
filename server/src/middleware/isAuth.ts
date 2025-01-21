import { MiddlewareFn } from 'type-graphql';
import { verify } from 'jsonwebtoken';
import { Context } from '../types/Context';
import { UserModel } from '../models/User';

export const isAuth: MiddlewareFn<Context> = async ({ context }, next) => {
  const authorization = context.req.headers['authorization'];

  if (!authorization) {
    throw new Error('Not authenticated');
  }

  try {
    const token = authorization.split(' ')[1];
    const payload = verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    const user = await UserModel.findById(payload.userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    context.user = user;
  } catch (err) {
    throw new Error('Not authenticated');
  }

  return next();
}; 