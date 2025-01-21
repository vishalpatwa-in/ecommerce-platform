import { Resolver, Mutation, Query, Arg, UseMiddleware } from 'type-graphql';
import { ParcelXService } from '../services/shipping/parcelx';
import { isAuth } from '../middleware/isAuth';
import { isAdmin } from '../middleware/isAdmin';

@Resolver()
export class ParcelXResolver {
  private parcelXService: ParcelXService;

  constructor() {
    this.parcelXService = new ParcelXService();
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth, isAdmin)
  async createParcelXShipment(
    @Arg('orderId') orderId: string
  ): Promise<boolean> {
    try {
      await this.parcelXService.createShipment(orderId);
      return true;
    } catch (error) {
      console.error('Create ParcelX shipment error:', error);
      return false;
    }
  }

  @Query(() => String)
  @UseMiddleware(isAuth)
  async trackParcelXShipment(
    @Arg('trackingNumber') trackingNumber: string
  ): Promise<string> {
    try {
      const tracking = await this.parcelXService.trackShipment(trackingNumber);
      return tracking.current_status;
    } catch (error) {
      console.error('Track ParcelX shipment error:', error);
      return 'Unable to track shipment';
    }
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth, isAdmin)
  async cancelParcelXShipment(
    @Arg('orderId') orderId: string
  ): Promise<boolean> {
    try {
      const response = await this.parcelXService.cancelShipment(orderId);
      return response.success;
    } catch (error) {
      console.error('Cancel ParcelX shipment error:', error);
      return false;
    }
  }
} 