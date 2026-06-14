'use client'
import { useCheckout } from './checkout-context'
import { StepContacto } from './steps/step-contacto'
import { StepEnvio } from './steps/step-envio'
import { StepResumen } from './steps/step-resumen'
import { StepConfirmar } from './steps/step-confirmar'
import type { Database } from '@/lib/database.types'

type AddressRow = Database['public']['Tables']['addresses']['Row']

export function CheckoutFlow({
  initialEmail,
  initialPhone,
  savedAddresses,
  freeShippingThreshold,
}: {
  initialEmail?: string
  initialPhone?: string
  savedAddresses: AddressRow[]
  freeShippingThreshold: number | null
}) {
  const { state } = useCheckout()

  const steps: Array<{ key: string; label: string }> = [
    { key: 'contacto', label: 'Contacto' },
    { key: 'envio', label: 'Envío' },
    { key: 'resumen', label: 'Resumen' },
    { key: 'confirmar', label: 'Confirmar' },
  ]

  const currentIndex = steps.findIndex(s => s.key === state.step)

  return (
    <div className="max-w-xl mx-auto px-4 py-10 space-y-8">
      {/* Step indicator */}
      <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
        {steps.map((s, idx) => (
          <span key={s.key} className="flex items-center gap-2">
            <span className={idx === currentIndex ? 'text-[var(--color-primary)] font-medium' : ''}>
              {s.label}
            </span>
            {idx < steps.length - 1 && <span>›</span>}
          </span>
        ))}
      </div>

      {/* Step content */}
      {state.step === 'contacto' && (
        <StepContacto initialEmail={initialEmail} initialPhone={initialPhone} />
      )}
      {state.step === 'envio' && (
        <StepEnvio savedAddresses={savedAddresses} />
      )}
      {state.step === 'resumen' && <StepResumen freeShippingThreshold={freeShippingThreshold} />}
      {state.step === 'confirmar' && (
        <StepConfirmar freeShippingThreshold={freeShippingThreshold} />
      )}
    </div>
  )
}
