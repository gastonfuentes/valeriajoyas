import type { QuoteInput, ShipmentRequest, ShipmentResult, ShippingProvider, ShippingQuote } from '@/lib/shipping/types'

// Intentional stub — implementation requires Andreani API credentials.
export class AndreaniProvider implements ShippingProvider {
  name = 'andreani'

  async quote(_input: QuoteInput): Promise<ShippingQuote[]> {
    throw new Error('Andreani shipping provider not implemented')
  }

  async createShipment(_req: ShipmentRequest): Promise<ShipmentResult> {
    throw new Error('Andreani shipping provider not implemented')
  }
}
