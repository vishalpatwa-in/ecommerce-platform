import { Resolver, Mutation, Query, Arg, UseMiddleware } from 'type-graphql';
import { ShiprocketService } from '../services/shipping/shiprocket';
import { isAuth } from '../middleware/isAuth';
import { isAdmin } from '../middleware/isAdmin';

@Resolver()
export class ShiprocketResolver {
  private shiprocketService: ShiprocketService;

  constructor() {
    this.shiprocketService = new ShiprocketService();
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth, isAdmin)
  async createShipment(
    @Arg('orderId') orderId: string
  ): Promise<boolean> {
    try {
      const response = await this.shiprocketService.createShipment(orderId);
      return response.status_code === 1;
    } catch (error) {
      console.error('Create shipment error:', error);
      return false;
    }
  }

  @Query(() => String)
  @UseMiddleware(isAuth)
  async trackShipment(
    @Arg('awbCode') awbCode: string
  ): Promise<string> {
    try {
      const tracking = await this.shiprocketService.trackShipment(awbCode);
      const currentStatus = tracking.tracking_data.shipment_track[0]?.status || 'Status not available';
      return currentStatus;
    } catch (error) {
      console.error('Track shipment error:', error);
      return 'Unable to track shipment';
    }
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth, isAdmin)
  async cancelShipment(
    @Arg('orderId') orderId: string
  ): Promise<boolean> {
    try {
      const response = await this.shiprocketService.cancelShipment(orderId);
      return response.success;
    } catch (error) {
      console.error('Cancel shipment error:', error);
      return false;
    }
  }

  @Mutation(() => String)
  @UseMiddleware(isAuth, isAdmin)
  async generateManifest(
    @Arg('shipmentId') shipmentId: string
  ): Promise<string> {
    try {
      const response = await this.shiprocketService.generateManifest(shipmentId);
      return response.manifest_url || '';
    } catch (error) {
      console.error('Generate manifest error:', error);
      return '';
    }
  }

  @Mutation(() => String)
  @UseMiddleware(isAuth, isAdmin)
  async generateLabel(
    @Arg('shipmentId') shipmentId: string
  ): Promise<string> {
    try {
      const response = await this.shiprocketService.generateLabel(shipmentId);
      return response.label_url || '';
    } catch (error) {
      console.error('Generate label error:', error);
      return '';
    }
  }
} 