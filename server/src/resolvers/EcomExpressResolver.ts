import { Resolver, Mutation, Query, Arg, UseMiddleware } from 'type-graphql';
import { EcomExpressService } from '../services/shipping/ecomexpress';
import { isAuth } from '../middleware/isAuth';
import { isAdmin } from '../middleware/isAdmin';

@Resolver()
export class EcomExpressResolver {
  private ecomExpressService: EcomExpressService;

  constructor() {
    this.ecomExpressService = new EcomExpressService();
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth, isAdmin)
  async createEcomExpressShipment(
    @Arg('orderId') orderId: string
  ): Promise<boolean> {
    try {
      const response = await this.ecomExpressService.createShipment(orderId);
      return response.success;
    } catch (error) {
      console.error('Create Ecom Express shipment error:', error);
      return false;
    }
  }

  @Query(() => String)
  @UseMiddleware(isAuth)
  async trackEcomExpressShipment(
    @Arg('awbNumber') awbNumber: string
  ): Promise<string> {
    try {
      const tracking = await this.ecomExpressService.trackShipment(awbNumber);
      return tracking.current_status;
    } catch (error) {
      console.error('Track Ecom Express shipment error:', error);
      return 'Unable to track shipment';
    }
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth, isAdmin)
  async cancelEcomExpressShipment(
    @Arg('orderId') orderId: string
  ): Promise<boolean> {
    try {
      const response = await this.ecomExpressService.cancelShipment(orderId);
      return response.success;
    } catch (error) {
      console.error('Cancel Ecom Express shipment error:', error);
      return false;
    }
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth, isAdmin)
  async scheduleEcomExpressPickup(
    @Arg('orderId') orderId: string
  ): Promise<boolean> {
    try {
      const response = await this.ecomExpressService.schedulePickup(orderId);
      return response.success;
    } catch (error) {
      console.error('Schedule Ecom Express pickup error:', error);
      return false;
    }
  }
} 