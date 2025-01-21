import { Resolver, Query } from 'type-graphql';

@Resolver()
export class UserResolver {
  @Query(() => String)
  async hello(): Promise<string> {
    return 'Hello World!';
  }
} 