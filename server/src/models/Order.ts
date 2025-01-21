import { Field, ObjectType, ID, Float, registerEnumType } from 'type-graphql';
import { prop as Property, getModelForClass, Ref } from '@typegoose/typegoose';
import { TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';
import { User } from './User';
import { Product } from './Product';

export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  CONFIRMED = 'CONFIRMED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

registerEnumType(OrderStatus, {
  name: 'OrderStatus',
  description: 'Status of the order',
});

registerEnumType(PaymentStatus, {
  name: 'PaymentStatus',
  description: 'Status of the payment',
});

@ObjectType()
class OrderItem {
  @Field(() => Product)
  @Property({ ref: () => Product, required: true })
  product!: Ref<Product>;

  @Field()
  @Property({ required: true })
  quantity!: number;

  @Field(() => Float)
  @Property({ required: true })
  price!: number;

  @Field(() => [String])
  @Property({ type: [String], default: [] })
  selectedOptions!: string[];
}

@ObjectType()
class ShippingAddress {
  @Field()
  @Property({ required: true })
  street!: string;

  @Field()
  @Property({ required: true })
  city!: string;

  @Field()
  @Property({ required: true })
  state!: string;

  @Field()
  @Property({ required: true })
  country!: string;

  @Field()
  @Property({ required: true })
  zipCode!: string;

  @Field()
  @Property({ required: true })
  phone!: string;
}

@ObjectType()
class PaymentInfo {
  @Field()
  @Property({ required: true })
  provider!: string;

  @Field()
  @Property({ required: true })
  transactionId!: string;

  @Field(() => PaymentStatus)
  @Property({ required: true, enum: PaymentStatus, default: PaymentStatus.PENDING })
  status!: PaymentStatus;

  @Field(() => Float)
  @Property({ required: true })
  amount!: number;

  @Field({ nullable: true })
  @Property()
  currency?: string;
}

@ObjectType()
class ShippingInfo {
  @Field({ nullable: true })
  @Property()
  carrier?: string;

  @Field({ nullable: true })
  @Property()
  trackingNumber?: string;

  @Field({ nullable: true })
  @Property()
  trackingUrl?: string;

  @Field(() => Float, { nullable: true })
  @Property()
  cost?: number;
}

@ObjectType()
export class Order extends TimeStamps {
  @Field(() => ID)
  id!: string;

  @Field()
  @Property({ required: true })
  orderNumber!: string;

  @Field(() => User)
  @Property({ ref: () => User, required: true })
  user!: Ref<User>;

  @Field(() => [OrderItem])
  @Property({ type: () => [OrderItem], required: true })
  items!: OrderItem[];

  @Field(() => Float)
  @Property({ required: true })
  subtotal!: number;

  @Field(() => Float)
  @Property({ required: true })
  tax!: number;

  @Field(() => Float)
  @Property({ required: true })
  total!: number;

  @Field(() => OrderStatus)
  @Property({ required: true, enum: OrderStatus, default: OrderStatus.PENDING })
  status!: OrderStatus;

  @Field(() => ShippingAddress)
  @Property({ type: () => ShippingAddress, required: true })
  shippingAddress!: ShippingAddress;

  @Field(() => PaymentInfo)
  @Property({ type: () => PaymentInfo, required: true })
  paymentInfo!: PaymentInfo;

  @Field(() => ShippingInfo, { nullable: true })
  @Property({ type: () => ShippingInfo })
  shippingInfo?: ShippingInfo;

  @Field({ nullable: true })
  @Property()
  notes?: string;
}

export const OrderModel = getModelForClass(Order); 