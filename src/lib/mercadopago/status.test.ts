import { describe, it, expect } from 'vitest'
import { mapMpPaymentStatus, mapToOrderStatus } from './status'

// Maps Mercado Pago payment statuses onto our DB enums (payment_status /
// order_status). A wrong mapping here means an order shows the wrong state to
// the customer or ships without being paid.

describe('mapMpPaymentStatus', () => {
  it('maps the core MP statuses 1:1', () => {
    expect(mapMpPaymentStatus('approved')).toBe('approved')
    expect(mapMpPaymentStatus('in_process')).toBe('in_process')
    expect(mapMpPaymentStatus('pending')).toBe('pending')
    expect(mapMpPaymentStatus('rejected')).toBe('rejected')
    expect(mapMpPaymentStatus('cancelled')).toBe('cancelled')
    expect(mapMpPaymentStatus('refunded')).toBe('refunded')
    expect(mapMpPaymentStatus('charged_back')).toBe('charged_back')
  })
  it('treats authorized / in_mediation as in_process', () => {
    expect(mapMpPaymentStatus('authorized')).toBe('in_process')
    expect(mapMpPaymentStatus('in_mediation')).toBe('in_process')
  })
  it('falls back to pending for unknown statuses', () => {
    expect(mapMpPaymentStatus('brand_new_status')).toBe('pending')
  })
})

describe('mapToOrderStatus', () => {
  it('approved -> paid', () => {
    expect(mapToOrderStatus('approved')).toBe('paid')
  })
  it('pending / in_process -> pending', () => {
    expect(mapToOrderStatus('pending')).toBe('pending')
    expect(mapToOrderStatus('in_process')).toBe('pending')
  })
  it('rejected / cancelled -> cancelled', () => {
    expect(mapToOrderStatus('rejected')).toBe('cancelled')
    expect(mapToOrderStatus('cancelled')).toBe('cancelled')
  })
  it('refunded / charged_back -> refunded', () => {
    expect(mapToOrderStatus('refunded')).toBe('refunded')
    expect(mapToOrderStatus('charged_back')).toBe('refunded')
  })
})
