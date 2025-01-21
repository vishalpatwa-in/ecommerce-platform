import { Cashfree } from '@cashfreepayments/cashfree-sdk';
import { OrderModel, PaymentStatus } from '../../models/Order';

const cashfree = new Cashfree({
  env: 'TEST',
  appId: process.env.CASHFREE_APP_ID || '',
  secretKey: process.env.CASHFREE_SECRET_KEY || ''
});

export class CashfreeService {
  async createOrder(orderId: string): Promise<any> {
    const order = await OrderModel.findById(orderId);
    if (!order) throw new Error('Order not found');

    const cashfreeOrder = await cashfree.orders.create({
      orderId: order.orderNumber,
      orderAmount: order.total,
      orderCurrency: 'INR',
      customerDetails: {
        customerId: order.user.toString(),
        customerEmail: 'customer@example.com', // TODO: Add email to order
        customerPhone: order.shippingAddress.phone
      },
      orderMeta: {
        returnUrl: `${process.env.FRONTEND_URL}/payment/callback?orderId=${order.id}`,
        notifyUrl: `${process.env.API_URL}/webhooks/cashfree`
      }
    });

    await OrderModel.findByIdAndUpdate(orderId, {
      'paymentInfo.provider': 'cashfree',
      'paymentInfo.transactionId': cashfreeOrder.cfOrderId
    });

    return cashfreeOrder;
  }

  async verifyPayment(orderId: string, orderToken: string): Promise<boolean> {
    const order = await OrderModel.findById(orderId);
    if (!order) throw new Error('Order not found');

    const paymentStatus = await cashfree.orders.getStatus({
      orderId: order.orderNumber
    });

    if (paymentStatus.orderStatus === 'PAID') {
      await OrderModel.findByIdAndUpdate(orderId, {
        'paymentInfo.status': PaymentStatus.COMPLETED,
        'paymentInfo.transactionId': paymentStatus.referenceId
      });
      return true;
    }

    return false;
  }

  async refundPayment(
    orderId: string,
    amount?: number,
    refundNote?: string
  ): Promise<any> {
    const order = await OrderModel.findById(orderId);
    if (!order) throw new Error('Order not found');

    const refund = await cashfree.refunds.create({
      orderId: order.orderNumber,
      refundAmount: amount || order.total,
      refundNote: refundNote || 'Customer requested refund'
    });

    if (refund.status === 'SUCCESS') {
      await OrderModel.findByIdAndUpdate(orderId, {
        'paymentInfo.status': PaymentStatus.REFUNDED
      });
    }

    return refund;
  }

  async getPaymentDetails(orderId: string): Promise<any> {
    const order = await OrderModel.findById(orderId);
    if (!order) throw new Error('Order not found');

    return cashfree.orders.getStatus({
      orderId: order.orderNumber
    });
  }

  verifyWebhookSignature(data: any, signature: string): boolean {
    return cashfree.verifyWebhookSignature(data, signature);
  }
} 