import { Resolver, Mutation, Arg, ObjectType, Field } from 'type-graphql';
import { User, UserModel } from '../models/User';
import { hash, compare } from 'bcryptjs';
import { sign } from 'jsonwebtoken';

@ObjectType()
class LoginResponse {
  @Field()
  token!: string;

  @Field(() => User)
  user!: User;

  constructor(token: string, user: User) {
    this.token = token;
    this.user = user;
  }
}

@Resolver()
export class AuthResolver {
  @Mutation(() => LoginResponse)
  async register(
    @Arg('name') name: string,
    @Arg('email') email: string,
    @Arg('password') password: string
  ): Promise<LoginResponse> {
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = await hash(password, 12);
    const user = await UserModel.create({
      name,
      email,
      password: hashedPassword,
    });

    const token = sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1d' }
    );

    return new LoginResponse(token, user);
  }

  @Mutation(() => LoginResponse)
  async login(
    @Arg('email') email: string,
    @Arg('password') password: string
  ): Promise<LoginResponse> {
    const user = await UserModel.findOne({ email });
    if (!user) {
      throw new Error('User not found');
    }

    const valid = await compare(password, user.password);
    if (!valid) {
      throw new Error('Invalid password');
    }

    const token = sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1d' }
    );

    return new LoginResponse(token, user);
  }
} 