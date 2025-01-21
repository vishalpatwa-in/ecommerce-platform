import { MiddlewareFn } from 'type-graphql';
import { Context } from '../types/Context';

export const isAdmin: MiddlewareFn<Context> = async ({ context }, next) => {
  if (!context.user?.isAdmin) {
    throw new Error('Not authorized. Admin access required.');
  }

  return next();
}; 