import { Field, ObjectType, ID } from 'type-graphql';
import { prop as Property, getModelForClass } from '@typegoose/typegoose';
import { TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';

@ObjectType()
export class User extends TimeStamps {
  @Field(() => ID)
  id!: string;

  @Field()
  @Property({ required: true })
  name!: string;

  @Field()
  @Property({ required: true, unique: true })
  email!: string;

  @Property({ required: true })
  password!: string;

  @Field()
  @Property({ default: false })
  isAdmin!: boolean;

  @Field()
  @Property({ default: '' })
  avatar!: string;

  @Field(() => [String])
  @Property({ type: [String], default: [] })
  roles!: string[];

  @Field()
  @Property({ default: false })
  emailVerified!: boolean;

  @Field({ nullable: true })
  @Property()
  googleId?: string;
}

export const UserModel = getModelForClass(User); 