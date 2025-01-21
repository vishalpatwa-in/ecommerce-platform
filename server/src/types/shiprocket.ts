export interface ShiprocketAuthResponse {
  token: string;
  expires_in: number;
}

export interface ShiprocketOrderItem {
  name: string;
  sku: string;
  units: number;
  selling_price: number;
  discount: number;
  tax: number;
  hsn?: string;
}

export interface ShiprocketOrder {
  order_id: string;
  order_date: string;
  pickup_location: string;
  billing_customer_name: string;
  billing_last_name: string;
  billing_address: string;
  billing_city: string;
  billing_state: string;
  billing_country: string;
  billing_pincode: string;
  billing_email: string;
  billing_phone: string;
  shipping_is_billing: boolean;
  shipping_customer_name?: string;
  shipping_last_name?: string;
  shipping_address?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_country?: string;
  shipping_pincode?: string;
  shipping_email?: string;
  shipping_phone?: string;
  order_items: ShiprocketOrderItem[];
  payment_method: 'COD' | 'Prepaid';
  sub_total: number;
  length: number;
  breadth: number;
  height: number;
  weight: number;
}

export interface ShiprocketOrderResponse {
  order_id: number;
  shipment_id: number;
  status: string;
  status_code: number;
  courier_company_id?: number;
  courier_name?: string;
  awb_code?: string;
  order_status: string;
  pickup_scheduled_date?: string;
  pickup_token_number?: string;
  label_url?: string;
  manifest_url?: string;
}

export interface ShiprocketTrackingResponse {
  tracking_data: {
    track_status: number;
    shipment_status: number;
    shipment_track: Array<{
      date: string;
      status: string;
      activity: string;
      location: string;
    }>;
    shipment_track_activities: Array<{
      date: string;
      status: string;
      activity: string;
      location: string;
    }>;
    delivered_date?: string;
    eta?: string;
  };
}

export interface ShiprocketCancelResponse {
  success: boolean;
  message: string;
}

export interface ShiprocketManifestResponse {
  manifest_url: string;
  message: string;
}

export interface ShiprocketLabelResponse {
  label_url: string;
  message: string;
}

export interface ShiprocketPickupResponse {
  success: boolean;
  pickup_token_number: string;
  pickup_scheduled_date: string;
  message: string;
} 