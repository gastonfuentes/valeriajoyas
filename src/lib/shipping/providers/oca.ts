import type { QuoteInput, ShipmentRequest, ShipmentResult, ShippingProvider, ShippingQuote } from '@/lib/shipping/types'

// Intentional stub — implementation requires OCA API credentials.
export class OcaProvider implements ShippingProvider {
  name = 'oca'

  async quote(_input: QuoteInput): Promise<ShippingQuote[]> {
    throw new Error('OCA shipping provider not implemented')
  }

  async createShipment(_req: ShipmentRequest): Promise<ShipmentResult> {
    throw new Error('OCA shipping provider not implemented')
  }
}
