const arsFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

export function centavosToPesos(centavos: number): number {
  return centavos / 100
}

export function formatARS(centavos: number): string {
  return arsFormatter.format(centavosToPesos(centavos))
}
