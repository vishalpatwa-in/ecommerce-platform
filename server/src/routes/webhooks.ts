import express from 'express';
import { CashfreeService } from '../services/payment/cashfree';
import { OrderModel, PaymentStatus, OrderStatus } from '../models/Order';

const router = express.Router();
const cashfreeService = new CashfreeService();

router.post('/cashfree', async (req, res) => {
  try {
    const signature = req.headers['x-webhook-signature'] as string;
    if (!signature) {
      return res.status(400).json({ error: 'Missing signature' });
    }

    // Verify webhook signature
    const isValid = cashfreeService.verifyWebhookSignature(req.body, signature);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const { orderId, orderStatus, referenceId } = req.body;

    // Update order status based on payment status
    if (orderStatus === 'PAID') {
      await OrderModel.findOneAndUpdate(
        { orderNumber: orderId },
        {
          'paymentInfo.status': PaymentStatus.COMPLETED,
          'paymentInfo.transactionId': referenceId,
          status: OrderStatus.CONFIRMED
        }
      );
    } else if (orderStatus === 'FAILED') {
      await OrderModel.findOneAndUpdate(
        { orderNumber: orderId },
        {
          'paymentInfo.status': PaymentStatus.FAILED,
          status: OrderStatus.CANCELLED
        }
      );
    }

    res.json({ status: 'success' });
  } catch (error) {
    console.error('Cashfree webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 