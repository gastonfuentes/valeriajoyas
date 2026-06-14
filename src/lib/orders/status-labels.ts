// Status labels for order_status enum — shared between admin and customer-facing views.
import type { OrderStatus } from './transitions'

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  paid: 'Pagado',
  fulfilled: 'Preparando',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
}
