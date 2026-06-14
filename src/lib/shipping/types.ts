import type { Database, Json } from '@/lib/database.types'

export type QuoteInput = {
  originPostalCode: string
  destinationPostalCode: string
  itemCount: number              // total units in cart
  defaultItemWeightGrams: number
  packagingWeightGrams: number
}

export type ShippingQuote = {
  provider: string
  service: string                // e.g. 'standard'
  cost: number                   // centavos
  currency: string               // 'ARS'
  estimatedDays: number | null
  billableWeightGrams: number
}

export type ShipmentRequest = {
  orderId: string
  destinationPostalCode: string
  billableWeightGrams: number
  service: string
}

export type ShipmentResult = {
  provider: string
  cost: number
  currency: string
  destinationPostalCode: string | null
  estimatedDays: number | null
  trackingNumber: string | null
  labelUrl: string | null
  status: Database['public']['Enums']['shipment_status']
  raw: Json | null
}

export interface ShippingProvider {
  name: string
  quote(input: QuoteInput): Promise<ShippingQuote[]>
  createShipment(req: ShipmentRequest): Promise<ShipmentResult>
}
