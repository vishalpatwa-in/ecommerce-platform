import Razorpay from 'razorpay';
import { OrderModel, PaymentStatus } from '../../models/Order';
import crypto from 'crypto';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || ''
});

export class RazorpayService {
  async createOrder(orderId: string): Promise<any> {
    const order = await OrderModel.findById(orderId);
    if (!order) throw new Error('Order not found');

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(order.total * 100), // amount in smallest currency unit
      currency: 'INR',
      receipt: order.orderNumber,
      notes: {
        orderId: order.id
      }
    });

    await OrderModel.findByIdAndUpdate(orderId, {
      'paymentInfo.provider': 'razorpay',
      'paymentInfo.transactionId': razorpayOrder.id
    });

    return razorpayOrder;
  }

  async verifyPayment(
    orderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ): Promise<boolean> {
    const order = await OrderModel.findById(orderId);
    if (!order) throw new Error('Order not found');

    const text = `${order.paymentInfo.transactionId}|${razorpayPaymentId}`;
    const signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(text)
      .digest('hex');

    const isAuthentic = signature === razorpaySignature;

    if (isAuthentic) {
      await OrderModel.findByIdAndUpdate(orderId, {
        'paymentInfo.status': PaymentStatus.COMPLETED,
        'paymentInfo.transactionId': razorpayPaymentId
      });
      return true;
    }

    return false;
  }

  async refundPayment(
    orderId: string,
    amount?: number
  ): Promise<any> {
    const order = await OrderModel.findById(orderId);
    if (!order) throw new Error('Order not found');

    const refund = await razorpay.payments.refund(order.paymentInfo.transactionId, {
      amount: amount ? Math.round(amount * 100) : undefined
    });

    if (refund) {
      await OrderModel.findByIdAndUpdate(orderId, {
        'paymentInfo.status': PaymentStatus.REFUNDED
      });
    }

    return refund;
  }

  async getPaymentDetails(paymentId: string): Promise<any> {
    return razorpay.payments.fetch(paymentId);
  }
} 