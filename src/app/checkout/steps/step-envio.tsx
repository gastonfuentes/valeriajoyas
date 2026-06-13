'use client'
import { useState } from 'react'
import { useCheckout, type ShippingAddress } from '../checkout-context'
import type { Database } from '@/lib/database.types'

type AddressRow = Database['public']['Tables']['addresses']['Row']

const emptyAddress: ShippingAddress = {
  recipient_name: '',
  street: '',
  street_number: '',
  apartment: '',
  city: '',
  province: '',
  postal_code: '',
}

export function StepEnvio({ savedAddresses }: { savedAddresses: AddressRow[] }) {
  const { setShipping, setPickup, setStep } = useCheckout()
  const [isPickup, setIsPickup] = useState(false)
  const [selectedAddressId, setSelectedAddressId] = useState<string | 'new'>(
    savedAddresses.length > 0 ? savedAddresses[0].id : 'new'
  )
  const [form, setForm] = useState<ShippingAddress>(emptyAddress)

  function handlePickupChange(e: React.ChangeEvent<HTMLInputElement>) {
    setIsPickup(e.target.checked)
  }

  function handlePickupSubmit() {
    setPickup(true)
    setStep('resumen')
  }

  function getFormAddress(): ShippingAddress {
    if (selectedAddressId !== 'new' && savedAddresses.length > 0) {
      const addr = savedAddresses.find(a => a.id === selectedAddressId)
      if (addr) {
        return {
          recipient_name: addr.recipient_name,
          street: addr.street,
          street_number: addr.street_number ?? '',
          apartment: addr.apartment ?? '',
          city: addr.city,
          province: addr.province,
          postal_code: addr.postal_code,
        }
      }
    }
    return form
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const address = getFormAddress()
    setPickup(false)
    setShipping(address)
    setStep('resumen')
  }

  return (
    <div className="space-y-6">
      <h2
        style={{ fontFamily: 'var(--font-serif)' }}
        className="text-2xl font-light text-[var(--color-text)]"
      >
        Dirección de envío
      </h2>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isPickup}
          onChange={handlePickupChange}
          className="w-4 h-4"
        />
        <span className="text-sm text-[var(--color-text)]">Retiro en local</span>
      </label>

      {isPickup ? (
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-muted)]">
            Pasaremos el domicilio de retiro.
          </p>
          <button
            type="button"
            onClick={handlePickupSubmit}
            className="w-full bg-[var(--color-primary)] text-white py-3 text-sm tracking-widest hover:opacity-90 transition-opacity"
          >
            Continuar
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {savedAddresses.length > 0 && (
            <div className="space-y-2">
              {savedAddresses.map(addr => (
                <label key={addr.id} className="flex items-start gap-2 cursor-pointer p-3 border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors">
                  <input
                    type="radio"
                    name="address"
                    value={addr.id}
                    checked={selectedAddressId === addr.id}
                    onChange={() => setSelectedAddressId(addr.id)}
                    className="mt-0.5"
                  />
                  <span className="text-sm text-[var(--color-text)]">
                    {addr.label ? `${addr.label} — ` : ''}{addr.recipient_name}, {addr.street} {addr.street_number}
                  </span>
                </label>
              ))}
              <label className="flex items-start gap-2 cursor-pointer p-3 border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors">
                <input
                  type="radio"
                  name="address"
                  value="new"
                  checked={selectedAddressId === 'new'}
                  onChange={() => setSelectedAddressId('new')}
                  className="mt-0.5"
                />
                <span className="text-sm text-[var(--color-text)]">Agregar nueva dirección</span>
              </label>
            </div>
          )}

          {(selectedAddressId === 'new' || savedAddresses.length === 0) && (
            <div className="space-y-4">
              {[
                { label: 'Nombre del destinatario', field: 'recipient_name' as const, type: 'text', required: true },
                { label: 'Calle', field: 'street' as const, type: 'text', required: true },
                { label: 'Número', field: 'street_number' as const, type: 'text', required: true },
                { label: 'Piso/Depto', field: 'apartment' as const, type: 'text', required: false },
                { label: 'Ciudad', field: 'city' as const, type: 'text', required: true },
                { label: 'Provincia', field: 'province' as const, type: 'text', required: true },
                { label: 'Código postal', field: 'postal_code' as const, type: 'text', required: true },
              ].map(({ label, field, type, required }) => (
                <div key={field}>
                  <label className="block text-sm text-[var(--color-text)] mb-1">{label}</label>
                  <input
                    type={type}
                    required={required}
                    value={form[field]}
                    onChange={e => setForm(prev => ({ ...prev, [field]: e.target.value }))}
                    className="w-full border border-[var(--color-border)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
              ))}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-[var(--color-primary)] text-white py-3 text-sm tracking-widest hover:opacity-90 transition-opacity"
          >
            Continuar
          </button>
        </form>
      )}
    </div>
  )
}
