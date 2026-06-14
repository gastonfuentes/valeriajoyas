// Product status (a TEXT column on products constrained to these three values,
// NOT a Postgres enum). Kept in a plain module so both server actions and
// client components can import the type/labels ('use server' files may only
// export async functions).

export const PRODUCT_STATUSES = ['draft', 'active', 'archived'] as const
export type ProductStatus = (typeof PRODUCT_STATUSES)[number]

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  draft: 'Borrador',
  active: 'Activo',
  archived: 'Archivado',
}
