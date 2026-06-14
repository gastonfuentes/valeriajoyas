import { AndreaniProvider } from '@/lib/shipping/providers/andreani'
import { CorreoArgentinoProvider } from '@/lib/shipping/providers/correo-argentino'
import { MockProvider } from '@/lib/shipping/providers/mock'
import { OcaProvider } from '@/lib/shipping/providers/oca'
import type { ShippingProvider } from '@/lib/shipping/types'

// Read at request time (lazy) so missing env vars fail at runtime, not import.
export function getShippingProvider(): ShippingProvider {
  const name = (process.env.SHIPPING_PROVIDER ?? 'mock').toLowerCase()
  switch (name) {
    case 'andreani':
      return new AndreaniProvider()
    case 'oca':
      return new OcaProvider()
    case 'correo-argentino':
      return new CorreoArgentinoProvider()
    case 'mock':
    default:
      return new MockProvider()
  }
}
