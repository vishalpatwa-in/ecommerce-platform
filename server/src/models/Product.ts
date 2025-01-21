import { Field, ObjectType, ID, Float } from 'type-graphql';
import { prop as Property, getModelForClass, Ref } from '@typegoose/typegoose';
import { TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';
import { User } from './User';

@ObjectType()
class ProductImage {
  @Field()
  @Property({ required: true })
  url!: string;

  @Field()
  @Property({ default: false })
  isMain!: boolean;
}

@ObjectType()
class ProductVariant {
  @Field()
  @Property({ required: true })
  name!: string;

  @Field(() => [String])
  @Property({ type: [String], default: [] })
  options!: string[];
}

@ObjectType()
export class Product extends TimeStamps {
  @Field(() => ID)
  id!: string;

  @Field()
  @Property({ required: true })
  name!: string;

  @Field()
  @Property({ required: true })
  description!: string;

  @Field(() => Float)
  @Property({ required: true })
  price!: number;

  @Field(() => Float)
  @Property({ default: 0 })
  discountedPrice!: number;

  @Field()
  @Property({ required: true })
  sku!: string;

  @Field()
  @Property({ default: 0 })
  stock!: number;

  @Field(() => [String])
  @Property({ type: [String], default: [] })
  categories!: string[];

  @Field(() => [ProductImage])
  @Property({ type: () => [ProductImage], default: [] })
  images!: ProductImage[];

  @Field(() => [ProductVariant])
  @Property({ type: () => [ProductVariant], default: [] })
  variants!: ProductVariant[];

  @Field()
  @Property({ default: true })
  isActive!: boolean;

  @Field(() => User)
  @Property({ ref: () => User, required: true })
  createdBy!: Ref<User>;

  @Field()
  @Property({ default: 0 })
  rating!: number;

  @Field()
  @Property({ default: 0 })
  reviewCount!: number;

  @Field(() => [String])
  @Property({ type: [String], default: [] })
  tags!: string[];
}

export const ProductModel = getModelForClass(Product); 