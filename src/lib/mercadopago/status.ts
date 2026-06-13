// Maps Mercado Pago payment statuses onto our DB enums. Kept as local string
// unions (matching the `payment_status` / `order_status` enums in the initial
// migration) so this pure module needs no path-alias resolution in tests.

export type AppPaymentStatus =
  | 'pending'
  | 'in_process'
  | 'approved'
  | 'rejected'
  | 'refunded'
  | 'cancelled'
  | 'charged_back'

export type AppOrderStatus =
  | 'pending'
  | 'paid'
  | 'fulfilled'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'

export function mapMpPaymentStatus(mpStatus: string): AppPaymentStatus {
  switch (mpStatus) {
    case 'approved':
      return 'approved'
    case 'authorized':
    case 'in_process':
    case 'in_mediation':
      return 'in_process'
    case 'pending':
      return 'pending'
    case 'rejected':
      return 'rejected'
    case 'cancelled':
      return 'cancelled'
    case 'refunded':
      return 'refunded'
    case 'charged_back':
      return 'charged_back'
    default:
      return 'pending'
  }
}

export function mapToOrderStatus(payment: AppPaymentStatus): AppOrderStatus {
  switch (payment) {
    case 'approved':
      return 'paid'
    case 'pending':
    case 'in_process':
      return 'pending'
    case 'rejected':
    case 'cancelled':
      return 'cancelled'
    case 'refunded':
    case 'charged_back':
      return 'refunded'
    default:
      return 'pending'
  }
}
