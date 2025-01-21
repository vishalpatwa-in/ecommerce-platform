import axios from 'axios';
import { OrderModel, OrderStatus } from '../../models/Order';
import {
  ShiprocketAuthResponse,
  ShiprocketOrder,
  ShiprocketOrderResponse,
  ShiprocketTrackingResponse,
  ShiprocketCancelResponse
} from '../../types/shiprocket';

export class ShiprocketService {
  private baseUrl = 'https://apiv2.shiprocket.in/v1/external';
  private token: string | null = null;
  private tokenExpiry: number = 0;

  private async authenticate(): Promise<void> {
    try {
      const response = await axios.post<ShiprocketAuthResponse>(
        `${this.baseUrl}/auth/login`,
        {
          email: process.env.SHIPROCKET_EMAIL,
          password: process.env.SHIPROCKET_PASSWORD
        }
      );

      this.token = response.data.token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
    } catch (error) {
      console.error('Shiprocket authentication error:', error);
      throw new Error('Failed to authenticate with Shiprocket');
    }
  }

  private async getHeaders(): Promise<{ Authorization: string }> {
    if (!this.token || Date.now() >= this.tokenExpiry) {
      await this.authenticate();
    }
    return { Authorization: `Bearer ${this.token}` };
  }

  async createShipment(orderId: string): Promise<ShiprocketOrderResponse> {
    try {
      const order = await OrderModel.findById(orderId).populate('user items.product');
      if (!order) throw new Error('Order not found');

      const headers = await this.getHeaders();

      // Create order first
      const orderData: ShiprocketOrder = {
        order_id: order.orderNumber,
        order_date: order.createdAt.toISOString().split('T')[0],
        pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION || 'Primary',
        billing_customer_name: order.shippingAddress.name,
        billing_last_name: '',
        billing_address: order.shippingAddress.street,
        billing_city: order.shippingAddress.city,
        billing_state: order.shippingAddress.state,
        billing_country: order.shippingAddress.country,
        billing_pincode: order.shippingAddress.zipCode,
        billing_email: 'customer@example.com', // TODO: Add email to order
        billing_phone: order.shippingAddress.phone,
        shipping_is_billing: true,
        order_items: order.items.map(item => ({
          name: item.product.name,
          sku: item.product.sku || '',
          units: item.quantity,
          selling_price: item.price,
          discount: 0,
          tax: 0,
          hsn: item.product.hsn || ''
        })),
        payment_method: order.paymentInfo.provider === 'COD' ? 'COD' : 'Prepaid',
        sub_total: order.subtotal,
        length: 10,
        breadth: 10,
        height: 10,
        weight: 0.5
      };

      // Create order in Shiprocket
      const orderResponse = await axios.post<ShiprocketOrderResponse>(
        `${this.baseUrl}/orders/create/adhoc`,
        orderData,
        { headers }
      );

      if (orderResponse.data.status_code === 1) {
        // Generate AWB (tracking number)
        const shipmentResponse = await axios.post(
          `${this.baseUrl}/courier/assign/awb`,
          {
            shipment_id: orderResponse.data.shipment_id,
            courier_id: orderResponse.data.courier_company_id
          },
          { headers }
        );

        // Update order with tracking info
        await OrderModel.findByIdAndUpdate(orderId, {
          'shippingInfo.carrier': 'Shiprocket',
          'shippingInfo.trackingNumber': shipmentResponse.data.awb_code,
          'shippingInfo.courier': orderResponse.data.courier_name,
          status: OrderStatus.PROCESSING
        });
      }

      return orderResponse.data;
    } catch (error) {
      console.error('Shiprocket create shipment error:', error);
      throw new Error('Failed to create shipment with Shiprocket');
    }
  }

  async trackShipment(awbCode: string): Promise<ShiprocketTrackingResponse> {
    try {
      const headers = await this.getHeaders();
      const response = await axios.get<ShiprocketTrackingResponse>(
        `${this.baseUrl}/courier/track/awb/${awbCode}`,
        { headers }
      );
      return response.data;
    } catch (error) {
      console.error('Shiprocket tracking error:', error);
      throw new Error('Failed to track shipment');
    }
  }

  async cancelShipment(orderId: string): Promise<ShiprocketCancelResponse> {
    try {
      const order = await OrderModel.findById(orderId);
      if (!order) throw new Error('Order not found');

      const headers = await this.getHeaders();
      const response = await axios.post<ShiprocketCancelResponse>(
        `${this.baseUrl}/orders/cancel`,
        { ids: [order.orderNumber] },
        { headers }
      );

      if (response.data.success) {
        await OrderModel.findByIdAndUpdate(orderId, {
          status: OrderStatus.CANCELLED
        });
      }

      return response.data;
    } catch (error) {
      console.error('Shiprocket cancel shipment error:', error);
      throw new Error('Failed to cancel shipment');
    }
  }

  // Additional methods as per Shiprocket API
  async generateManifest(shipmentId: string): Promise<any> {
    try {
      const headers = await this.getHeaders();
      const response = await axios.post(
        `${this.baseUrl}/manifests/generate`,
        { shipment_id: [shipmentId] },
        { headers }
      );
      return response.data;
    } catch (error) {
      console.error('Shiprocket generate manifest error:', error);
      throw new Error('Failed to generate manifest');
    }
  }

  async generateLabel(shipmentId: string): Promise<any> {
    try {
      const headers = await this.getHeaders();
      const response = await axios.post(
        `${this.baseUrl}/courier/generate/label`,
        { shipment_id: [shipmentId] },
        { headers }
      );
      return response.data;
    } catch (error) {
      console.error('Shiprocket generate label error:', error);
      throw new Error('Failed to generate label');
    }
  }
} 