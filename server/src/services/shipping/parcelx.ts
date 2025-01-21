import axios from 'axios';
import { OrderModel, OrderStatus } from '../../models/Order';
import {
  ParcelXShipmentRequest,
  ParcelXShipmentResponse,
  ParcelXTrackingResponse,
  ParcelXCancelResponse,
  ParcelXPackage
} from '../../types/parcelx';

export class ParcelXService {
  private baseUrl = process.env.PARCELX_API_URL || 'https://api.parcelx.in/v1';
  private accessKey = process.env.PARCELX_ACCESS_KEY || '';
  private secretKey = process.env.PARCELX_SECRET_KEY || '';

  private getHeaders(): { 'access-token': string } {
    // Base64 encode access_key:secret_key as per ParcelX documentation
    const authToken = Buffer.from(`${this.accessKey}:${this.secretKey}`).toString('base64');
    return { 'access-token': authToken };
  }

  private calculatePackageDetails(items: any[]): ParcelXPackage[] {
    const totalWeight = items.reduce((sum, item) => sum + (item.product.weight || 0.5) * item.quantity, 0);
    const totalValue = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return [{
      weight: totalWeight || 0.5,
      length: 20,
      width: 15,
      height: 10,
      value: totalValue,
      description: `Package containing ${items.length} items`,
      quantity: 1
    }];
  }

  async createShipment(orderId: string): Promise<ParcelXShipmentResponse> {
    try {
      const order = await OrderModel.findById(orderId).populate('user items.product');
      if (!order) throw new Error('Order not found');

      const headers = this.getHeaders();

      const shipmentRequest: ParcelXShipmentRequest = {
        order_id: order.orderNumber,
        pickup_address: {
          name: process.env.PARCELX_PICKUP_NAME || 'Warehouse',
          phone: process.env.PARCELX_PICKUP_PHONE || '',
          address_line1: process.env.PARCELX_PICKUP_ADDRESS || '',
          city: process.env.PARCELX_PICKUP_CITY || '',
          state: process.env.PARCELX_PICKUP_STATE || '',
          country: process.env.PARCELX_PICKUP_COUNTRY || 'India',
          pincode: process.env.PARCELX_PICKUP_PINCODE || ''
        },
        delivery_address: {
          name: order.shippingAddress.name,
          phone: order.shippingAddress.phone,
          address_line1: order.shippingAddress.street,
          city: order.shippingAddress.city,
          state: order.shippingAddress.state,
          country: order.shippingAddress.country,
          pincode: order.shippingAddress.zipCode,
          email: 'customer@example.com' // TODO: Add email to order
        },
        packages: this.calculatePackageDetails(order.items),
        payment_type: 'PREPAID',
        insurance_required: false
      };

      const response = await axios.post<ParcelXShipmentResponse>(
        `${this.baseUrl}/shipments/create`,
        shipmentRequest,
        { headers }
      );

      await OrderModel.findByIdAndUpdate(orderId, {
        'shippingInfo.carrier': 'ParcelX',
        'shippingInfo.trackingNumber': response.data.tracking_number,
        'shippingInfo.trackingUrl': response.data.label_url,
        'shippingInfo.cost': response.data.shipping_charges.total_charges,
        status: OrderStatus.PROCESSING
      });

      return response.data;
    } catch (error) {
      console.error('ParcelX create shipment error:', error);
      throw new Error('Failed to create shipment with ParcelX');
    }
  }

  async trackShipment(trackingNumber: string): Promise<ParcelXTrackingResponse> {
    try {
      const headers = this.getHeaders();
      const response = await axios.get<ParcelXTrackingResponse>(
        `${this.baseUrl}/tracking/${trackingNumber}`,
        { headers }
      );
      return response.data;
    } catch (error) {
      console.error('ParcelX tracking error:', error);
      throw new Error('Failed to track shipment');
    }
  }

  async cancelShipment(orderId: string): Promise<ParcelXCancelResponse> {
    try {
      const order = await OrderModel.findById(orderId);
      if (!order) throw new Error('Order not found');
      if (!order.shippingInfo?.trackingNumber) {
        throw new Error('No tracking number found for order');
      }

      const headers = this.getHeaders();
      const response = await axios.post<ParcelXCancelResponse>(
        `${this.baseUrl}/shipments/${order.shippingInfo.trackingNumber}/cancel`,
        {},
        { headers }
      );

      if (response.data.success) {
        await OrderModel.findByIdAndUpdate(orderId, {
          status: OrderStatus.CANCELLED
        });
      }

      return response.data;
    } catch (error) {
      console.error('ParcelX cancel shipment error:', error);
      throw new Error('Failed to cancel shipment');
    }
  }
} 