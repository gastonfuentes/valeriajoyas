import { computeBillableWeight } from '@/lib/shipping/quote'
import type { QuoteInput, ShipmentRequest, ShipmentResult, ShippingProvider, ShippingQuote } from '@/lib/shipping/types'

// ─── Carrier constants ───────────────────────────────────────────────────────
const MOCK_CARRIER_MINIMUM_GRAMS = 500
const MOCK_WEIGHT_GRID_GRAMS = 1000
const MOCK_BASE_CENTAVOS = 80_000   // $800 base
const MOCK_PER_KG_CENTAVOS = 70_000 // $700 per billable kg
const MOCK_ESTIMATED_DAYS = 5
// ────────────────────────────────────────────────────────────────────────────

function costFromBillableWeight(billableGrams: number): number {
  return MOCK_BASE_CENTAVOS + Math.ceil(billableGrams / 1000) * MOCK_PER_KG_CENTAVOS
}

export class MockProvider implements ShippingProvider {
  name = 'mock'

  async quote(input: QuoteInput): Promise<ShippingQuote[]> {
    const billable = computeBillableWeight({
      itemCount: input.itemCount,
      defaultItemWeightGrams: input.defaultItemWeightGrams,
      packagingWeightGrams: input.packagingWeightGrams,
      carrierMinimumGrams: MOCK_CARRIER_MINIMUM_GRAMS,
      weightGridGrams: MOCK_WEIGHT_GRID_GRAMS,
    })

    return [
      {
        provider: 'mock',
        service: 'standard',
        cost: costFromBillableWeight(billable),
        currency: 'ARS',
        estimatedDays: MOCK_ESTIMATED_DAYS,
        billableWeightGrams: billable,
      },
    ]
  }

  async createShipment(req: ShipmentRequest): Promise<ShipmentResult> {
    return {
      provider: 'mock',
      cost: costFromBillableWeight(req.billableWeightGrams),
      currency: 'ARS',
      destinationPostalCode: req.destinationPostalCode,
      estimatedDays: MOCK_ESTIMATED_DAYS,
      trackingNumber: `MOCK-${req.orderId}`,
      labelUrl: null,
      status: 'ready',
      raw: null,
    }
  }
}
