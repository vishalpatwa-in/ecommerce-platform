export interface EcomExpressAddress {
  name: string;
  address1: string;
  city: string;
  state: string;
  country: string;
  pin_code: string;
  phone: string;
  email?: string;
}

export interface EcomExpressShipment {
  awb_number?: string;
  order_number: string;
  product_name: string;
  consignee: EcomExpressAddress;
  pickup_location: {
    name: string;
    address1: string;
    city: string;
    state: string;
    country: string;
    pin_code: string;
    phone: string;
  };
  payment_mode: 'COD' | 'PPD';
  cod_amount?: number;
  actual_weight: number;
  volumetric_weight?: number;
  length: number;
  breadth: number;
  height: number;
  declared_value: number;
  item_description: string;
  quantity: number;
}

export interface EcomExpressShipmentResponse {
  success: boolean;
  awb_number?: string;
  order_number: string;
  status: string;
  status_code: number;
  courier_partner?: string;
  pickup_date?: string;
  expected_delivery_date?: string;
  reference_number?: string;
  error_message?: string;
}

export interface EcomExpressTrackingResponse {
  awb_number: string;
  order_number: string;
  current_status: string;
  status_code: number;
  scans: Array<{
    scan_date_time: string;
    scan_type: string;
    scan_status: string;
    location: string;
    comment?: string;
  }>;
  pickup_date?: string;
  delivered_date?: string;
  expected_delivery_date?: string;
  recipient_name?: string;
}

export interface EcomExpressCancelResponse {
  success: boolean;
  awb_number: string;
  order_number: string;
  cancellation_status: string;
  message: string;
}

export interface EcomExpressPickupResponse {
  success: boolean;
  pickup_reference_number: string;
  message: string;
  scheduled_date?: string;
  pickup_time_slot?: string;
} 