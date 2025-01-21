export interface ParcelXAuthResponse {
  token: string;
  expires_in: number;
}

export interface ParcelXAddress {
  name: string;
  phone: string;
  address_line1: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  email?: string;
}

export interface ParcelXPackage {
  weight: number;
  length: number;
  width: number;
  height: number;
  value: number;
  description: string;
  quantity: number;
}

export interface ParcelXShipmentRequest {
  order_id: string;
  pickup_address: ParcelXAddress;
  delivery_address: ParcelXAddress;
  packages: ParcelXPackage[];
  payment_type: 'PREPAID' | 'COD';
  cod_amount?: number;
  insurance_required: boolean;
  insurance_amount?: number;
}

export interface ParcelXShipmentResponse {
  shipment_id: string;
  tracking_number: string;
  label_url: string;
  status: string;
  estimated_delivery_date: string;
  courier_partner: string;
  shipping_charges: {
    freight_charges: number;
    cod_charges?: number;
    insurance_charges?: number;
    total_charges: number;
  };
}

export interface ParcelXTrackingResponse {
  tracking_number: string;
  current_status: string;
  estimated_delivery_date: string;
  delivered_date?: string;
  tracking_events: Array<{
    date: string;
    status: string;
    location: string;
    description: string;
  }>;
}

export interface ParcelXCancelResponse {
  success: boolean;
  message: string;
  cancellation_id?: string;
  refund_amount?: number;
} 