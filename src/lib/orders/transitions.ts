// Order status state machine — admin-driven forward fulfillment (Stage 6, slice 1).
//
// Pure and import-free (local string-union enum, mirroring
// src/lib/mercadopago/status.ts) so it is trivially unit-testable.
//
// Scope (slice 1): the admin only ADVANCES an already-paid order through
// fulfillment: paid -> fulfilled -> shipped -> delivered. Entry into 'paid' is
// payment-driven (the apply_mp_payment RPC, which also moves stock) and
// cancel/refund are deferred to a later slice because they require server-side
// stock restoration. Neither is an allowed admin transition here.

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'fulfilled'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'

// Admin-allowed forward transitions for slice 1.
const ADMIN_FORWARD: Record<OrderStatus, OrderStatus[]> = {
  pending: [], // unpaid — payment drives pending -> paid
  paid: ['fulfilled'],
  fulfilled: ['shipped'],
  shipped: ['delivered'],
  delivered: [], // terminal
  cancelled: [], // terminal (not admin-reachable in slice 1)
  refunded: [], // terminal (not admin-reachable in slice 1)
}

/** The status(es) an admin may advance the given status to. */
export function nextStatuses(from: OrderStatus): OrderStatus[] {
  return ADMIN_FORWARD[from] ?? []
}

/** Whether the admin may move an order from `from` to `to`, with a reason when not. */
export function canTransition(
  from: OrderStatus,
  to: OrderStatus,
): { allowed: boolean; reason?: string } {
  if (from === to) {
    return { allowed: false, reason: 'El pedido ya está en ese estado.' }
  }
  if (nextStatuses(from).includes(to)) {
    return { allowed: true }
  }
  if (to === 'paid') {
    return {
      allowed: false,
      reason: 'El estado "pagado" lo determina el pago, no se cambia manualmente.',
    }
  }
  if (to === 'cancelled' || to === 'refunded') {
    return {
      allowed: false,
      reason: 'Cancelar o reembolsar todavía no está disponible en el panel.',
    }
  }
  return { allowed: false, reason: `Transición inválida: de "${from}" a "${to}".` }
}
