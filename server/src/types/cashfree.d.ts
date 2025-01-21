declare module '@cashfreepayments/cashfree-sdk' {
  export class Cashfree {
    constructor(config: {
      env: 'TEST' | 'PROD';
      appId: string;
      secretKey: string;
    });

    orders: {
      create(params: {
        orderId: string;
        orderAmount: number;
        orderCurrency: string;
        customerDetails: {
          customerId: string;
          customerEmail: string;
          customerPhone: string;
        };
        orderMeta?: {
          returnUrl?: string;
          notifyUrl?: string;
        };
      }): Promise<{
        cfOrderId: string;
        orderStatus: string;
        paymentLink: string;
      }>;

      getStatus(params: {
        orderId: string;
      }): Promise<{
        orderStatus: string;
        referenceId: string;
      }>;
    };

    refunds: {
      create(params: {
        orderId: string;
        refundAmount: number;
        refundNote?: string;
      }): Promise<{
        status: string;
        refundId: string;
      }>;
    };

    verifyWebhookSignature(data: any, signature: string): boolean;
  }
} 