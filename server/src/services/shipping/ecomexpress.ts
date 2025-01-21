import axios from 'axios';
import crypto from 'crypto';
import { OrderModel, OrderStatus } from '../../models/Order';
import {
  EcomExpressShipment,
  EcomExpressShipmentResponse,
  EcomExpressTrackingResponse,
  EcomExpressCancelResponse,
  EcomExpressPickupResponse
} from '../../types/ecomexpress';

export class EcomExpressService {
  private baseUrl = process.env.ECOM_EXPRESS_API_URL || 'https://api.ecomexpress.in';
  private username = process.env.ECOM_EXPRESS_USERNAME || '';
  private password = process.env.ECOM_EXPRESS_PASSWORD || '';
  private apiKey = process.env.ECOM_EXPRESS_API_KEY || '';

  private getHeaders() {
    const timestamp = new Date().toISOString();
    const signature = crypto
      .createHmac('sha256', this.apiKey)
      .update(`${this.username}${timestamp}`)
      .digest('hex');

    return {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey,
      'X-Username': this.username,
      'X-Timestamp': timestamp,
      'X-Signature': signature
    };
  }

  private calculatePackageDetails(items: any[]) {
    const totalWeight = items.reduce((sum, item) => sum + (item.product.weight || 0.5) * item.quantity, 0);
    const totalValue = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return {
      actual_weight: totalWeight || 0.5,
      length: 20,
      breadth: 15,
      height: 10,
      declared_value: totalValue,
      quantity: items.reduce((sum, item) => sum + item.quantity, 0)
    };
  }

  async createShipment(orderId: string): Promise<EcomExpressShipmentResponse> {
    try {
      const order = await OrderModel.findById(orderId).populate('user items.product');
      if (!order) throw new Error('Order not found');

      const packageDetails = this.calculatePackageDetails(order.items);
      const shipment: EcomExpressShipment = {
        order_number: order.orderNumber,
        product_name: order.items.map(item => item.product.name).join(', '),
        consignee: {
          name: order.shippingAddress.name,
          address1: order.shippingAddress.street,
          city: order.shippingAddress.city,
          state: order.shippingAddress.state,
          country: order.shippingAddress.country,
          pin_code: order.shippingAddress.zipCode,
          phone: order.shippingAddress.phone,
          email: 'customer@example.com' // TODO: Add email to order
        },
        pickup_location: {
          name: process.env.ECOM_EXPRESS_PICKUP_NAME || '',
          address1: process.env.ECOM_EXPRESS_PICKUP_ADDRESS || '',
          city: process.env.ECOM_EXPRESS_PICKUP_CITY || '',
          state: process.env.ECOM_EXPRESS_PICKUP_STATE || '',
          country: process.env.ECOM_EXPRESS_PICKUP_COUNTRY || 'India',
          pin_code: process.env.ECOM_EXPRESS_PICKUP_PINCODE || '',
          phone: process.env.ECOM_EXPRESS_PICKUP_PHONE || ''
        },
        payment_mode: 'PPD',
        ...packageDetails,
        item_description: `Order containing ${order.items.length} items`
      };

      const response = await axios.post<EcomExpressShipmentResponse>(
        `${this.baseUrl}/api/v1/shipments`,
        shipment,
        { headers: this.getHeaders() }
      );

      if (response.data.success && response.data.awb_number) {
        await OrderModel.findByIdAndUpdate(orderId, {
          'shippingInfo.carrier': 'Ecom Express',
          'shippingInfo.trackingNumber': response.data.awb_number,
          status: OrderStatus.PROCESSING
        });
      }

      return response.data;
    } catch (error) {
      console.error('Ecom Express create shipment error:', error);
      throw new Error('Failed to create shipment with Ecom Express');
    }
  }

  async trackShipment(awbNumber: string): Promise<EcomExpressTrackingResponse> {
    try {
      const response = await axios.get<EcomExpressTrackingResponse>(
        `${this.baseUrl}/api/v1/tracking/${awbNumber}`,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Ecom Express tracking error:', error);
      throw new Error('Failed to track shipment');
    }
  }

  async cancelShipment(orderId: string): Promise<EcomExpressCancelResponse> {
    try {
      const order = await OrderModel.findById(orderId);
      if (!order) throw new Error('Order not found');
      if (!order.shippingInfo?.trackingNumber) {
        throw new Error('No tracking number found for order');
      }

      const response = await axios.post<EcomExpressCancelResponse>(
        `${this.baseUrl}/api/v1/cancel`,
        {
          awb_number: order.shippingInfo.trackingNumber,
          order_number: order.orderNumber
        },
        { headers: this.getHeaders() }
      );

      if (response.data.success) {
        await OrderModel.findByIdAndUpdate(orderId, {
          status: OrderStatus.CANCELLED
        });
      }

      return response.data;
    } catch (error) {
      console.error('Ecom Express cancel shipment error:', error);
      throw new Error('Failed to cancel shipment');
    }
  }

  async schedulePickup(orderId: string): Promise<EcomExpressPickupResponse> {
    try {
      const order = await OrderModel.findById(orderId);
      if (!order) throw new Error('Order not found');
      if (!order.shippingInfo?.trackingNumber) {
        throw new Error('No tracking number found for order');
      }

      const response = await axios.post<EcomExpressPickupResponse>(
        `${this.baseUrl}/api/v1/pickup/schedule`,
        {
          awb_numbers: [order.shippingInfo.trackingNumber],
          pickup_date: new Date().toISOString().split('T')[0], // Today's date
          pickup_time_slot: '09:00-18:00'
        },
        { headers: this.getHeaders() }
      );

      return response.data;
    } catch (error) {
      console.error('Ecom Express schedule pickup error:', error);
      throw new Error('Failed to schedule pickup');
    }
  }
} 