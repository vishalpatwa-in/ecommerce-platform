import { Resolver, Query, Mutation, Arg, Ctx, ID, UseMiddleware } from 'type-graphql';
import { Order, OrderModel, OrderStatus, PaymentStatus } from '../models/Order';
import { ProductModel } from '../models/Product';
import { isAuth } from '../middleware/isAuth';
import { isAdmin } from '../middleware/isAdmin';
import { Context } from '../types/Context';

@Resolver()
export class OrderResolver {
  @Query(() => [Order])
  @UseMiddleware(isAuth)
  async myOrders(@Ctx() { user }: Context): Promise<Order[]> {
    return OrderModel.find({ user: user.id })
      .populate('user')
      .populate('items.product');
  }

  @Query(() => [Order])
  @UseMiddleware(isAuth, isAdmin)
  async orders(): Promise<Order[]> {
    return OrderModel.find()
      .populate('user')
      .populate('items.product');
  }

  @Query(() => Order, { nullable: true })
  @UseMiddleware(isAuth)
  async order(
    @Arg('id', () => ID) id: string,
    @Ctx() { user }: Context
  ): Promise<Order | null> {
    const order = await OrderModel.findById(id)
      .populate('user')
      .populate('items.product');

    if (!order) return null;

    // Only admin or order owner can view the order
    if (!user.isAdmin && order.user.toString() !== user.id) {
      throw new Error('Not authorized to view this order');
    }

    return order;
  }

  @Mutation(() => Order)
  @UseMiddleware(isAuth)
  async createOrder(
    @Arg('items', () => [[String, Number]]) items: [string, number][],
    @Arg('shippingAddress') shippingAddress: any,
    @Ctx() { user }: Context
  ): Promise<Order> {
    // Validate and process order items
    const orderItems = await Promise.all(
      items.map(async ([productId, quantity]) => {
        const product = await ProductModel.findById(productId);
        if (!product) throw new Error(`Product ${productId} not found`);
        if (product.stock < quantity) throw new Error(`Insufficient stock for ${product.name}`);
        
        return {
          product: productId,
          quantity,
          price: product.price,
          selectedOptions: []
        };
      })
    );

    // Calculate totals
    const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;

    // Create order
    const order = await OrderModel.create({
      orderNumber: `ORD${Date.now()}`,
      user: user.id,
      items: orderItems,
      subtotal,
      tax,
      total,
      status: OrderStatus.PENDING,
      shippingAddress,
      paymentInfo: {
        provider: 'PENDING',
        transactionId: 'PENDING',
        status: PaymentStatus.PENDING,
        amount: total
      }
    });

    // Update product stock
    await Promise.all(
      items.map(async ([productId, quantity]) => {
        await ProductModel.findByIdAndUpdate(productId, {
          $inc: { stock: -quantity }
        });
      })
    );

    return order.populate('user').populate('items.product');
  }

  @Mutation(() => Order)
  @UseMiddleware(isAuth, isAdmin)
  async updateOrderStatus(
    @Arg('id', () => ID) id: string,
    @Arg('status', () => OrderStatus) status: OrderStatus
  ): Promise<Order | null> {
    const order = await OrderModel.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    )
      .populate('user')
      .populate('items.product');

    if (!order) throw new Error('Order not found');

    // Emit event for order status change
    const { producer } = this.context;
    await producer.send({
      topic: 'order-status-changed',
      messages: [{
        key: order.id,
        value: JSON.stringify({
          orderId: order.id,
          status,
          timestamp: new Date().toISOString()
        })
      }]
    });

    return order;
  }

  @Mutation(() => Order)
  @UseMiddleware(isAuth, isAdmin)
  async updateShippingInfo(
    @Arg('id', () => ID) id: string,
    @Arg('carrier') carrier: string,
    @Arg('trackingNumber') trackingNumber: string,
    @Arg('trackingUrl', { nullable: true }) trackingUrl?: string
  ): Promise<Order | null> {
    const order = await OrderModel.findByIdAndUpdate(
      id,
      {
        shippingInfo: { carrier, trackingNumber, trackingUrl },
        status: OrderStatus.SHIPPED
      },
      { new: true }
    )
      .populate('user')
      .populate('items.product');

    if (!order) throw new Error('Order not found');

    return order;
  }

  @Query(() => [Order])
  @UseMiddleware(isAuth, isAdmin)
  async ordersByStatus(
    @Arg('status', () => OrderStatus) status: OrderStatus
  ): Promise<Order[]> {
    return OrderModel.find({ status })
      .populate('user')
      .populate('items.product');
  }
} 