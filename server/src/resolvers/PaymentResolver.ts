import { Resolver, Mutation, Arg, UseMiddleware } from 'type-graphql';
import { RazorpayService } from '../services/payment/razorpay';
import { isAuth } from '../middleware/isAuth';

@Resolver()
export class PaymentResolver {
  private razorpayService: RazorpayService;

  constructor() {
    this.razorpayService = new RazorpayService();
  }

  @Mutation(() => String)
  @UseMiddleware(isAuth)
  async createPaymentOrder(
    @Arg('orderId') orderId: string
  ): Promise<string> {
    const razorpayOrder = await this.razorpayService.createOrder(orderId);
    return razorpayOrder.id;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async verifyPayment(
    @Arg('orderId') orderId: string,
    @Arg('paymentId') paymentId: string,
    @Arg('signature') signature: string
  ): Promise<boolean> {
    return this.razorpayService.verifyPayment(orderId, paymentId, signature);
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async refundPayment(
    @Arg('orderId') orderId: string,
    @Arg('amount', { nullable: true }) amount?: number
  ): Promise<boolean> {
    const refund = await this.razorpayService.refundPayment(orderId, amount);
    return !!refund;
  }
} 