import { Resolver, Mutation, Arg, UseMiddleware } from 'type-graphql';
import { CashfreeService } from '../services/payment/cashfree';
import { isAuth } from '../middleware/isAuth';

@Resolver()
export class CashfreeResolver {
  private cashfreeService: CashfreeService;

  constructor() {
    this.cashfreeService = new CashfreeService();
  }

  @Mutation(() => String)
  @UseMiddleware(isAuth)
  async createCashfreeOrder(
    @Arg('orderId') orderId: string
  ): Promise<string> {
    const cashfreeOrder = await this.cashfreeService.createOrder(orderId);
    return cashfreeOrder.paymentLink;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async verifyCashfreePayment(
    @Arg('orderId') orderId: string,
    @Arg('orderToken') orderToken: string
  ): Promise<boolean> {
    return this.cashfreeService.verifyPayment(orderId, orderToken);
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async refundCashfreePayment(
    @Arg('orderId') orderId: string,
    @Arg('amount', { nullable: true }) amount?: number,
    @Arg('refundNote', { nullable: true }) refundNote?: string
  ): Promise<boolean> {
    const refund = await this.cashfreeService.refundPayment(orderId, amount, refundNote);
    return refund.status === 'SUCCESS';
  }
} 