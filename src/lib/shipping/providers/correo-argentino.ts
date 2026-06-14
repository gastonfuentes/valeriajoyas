import type { QuoteInput, ShipmentRequest, ShipmentResult, ShippingProvider, ShippingQuote } from '@/lib/shipping/types'

// Intentional stub — implementation requires Correo Argentino API credentials.
export class CorreoArgentinoProvider implements ShippingProvider {
  name = 'correo-argentino'

  async quote(_input: QuoteInput): Promise<ShippingQuote[]> {
    throw new Error('Correo Argentino shipping provider not implemented')
  }

  async createShipment(_req: ShipmentRequest): Promise<ShipmentResult> {
    throw new Error('Correo Argentino shipping provider not implemented')
  }
}
