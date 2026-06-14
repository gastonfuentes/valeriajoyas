'use client'
import { useState, useRef } from 'react'
import { useCheckout, type ShippingAddress } from '../checkout-context'
import { quoteShipping } from '../actions'
import { formatARS } from '@/lib/format'
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
  const { setShipping, setPickup, setStep, setShippingQuote } = useCheckout()
  const [isPickup, setIsPickup] = useState(false)
  const [selectedAddressId, setSelectedAddressId] = useState<string | 'new'>(
    savedAddresses.length > 0 ? savedAddresses[0].id : 'new'
  )
  const [form, setForm] = useState<ShippingAddress>(emptyAddress)

  // Shipping quote state (local, synced to context on success)
  type QuoteStatus = 'idle' | 'loading' | 'success' | 'invalid'
  const [quoteStatus, setQuoteStatus] = useState<QuoteStatus>('idle')
  const [quotedCost, setQuotedCost] = useState<number | null>(null)
  const [quotedDays, setQuotedDays] = useState<number | null>(null)
  // Track the last postal code we quoted to avoid redundant fetches
  const lastQuotedPostalCode = useRef<string>('')

  function handlePickupChange(e: React.ChangeEvent<HTMLInputElement>) {
    const checked = e.target.checked
    setIsPickup(checked)
    if (checked) {
      // Clear any pending quote when switching to pickup
      setQuoteStatus('idle')
      setQuotedCost(null)
      setQuotedDays(null)
      lastQuotedPostalCode.current = ''
      setShippingQuote(null, null)
    }
    // When unchecking pickup, leave the quote null so the steps show "A calcular"
    // until the user (re)enters a postal code.
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

  async function fetchQuote(postalCode: string) {
    const trimmed = postalCode.trim()
    if (!trimmed || trimmed === lastQuotedPostalCode.current) return
    lastQuotedPostalCode.current = trimmed

    setQuoteStatus('loading')
    try {
      const quote = await quoteShipping(trimmed)
      if (quote) {
        setQuotedCost(quote.cost)
        setQuotedDays(quote.estimatedDays)
        setShippingQuote(quote.cost, quote.estimatedDays)
        setQuoteStatus('success')
      } else {
        setQuotedCost(null)
        setQuotedDays(null)
        setShippingQuote(null, null)
        setQuoteStatus('invalid')
      }
    } catch {
      setQuotedCost(null)
      setQuotedDays(null)
      setShippingQuote(null, null)
      setQuoteStatus('invalid')
    }
  }

  function handlePostalCodeBlur(e: React.FocusEvent<HTMLInputElement>) {
    void fetchQuote(e.target.value)
  }

  // When user selects a saved address, trigger a quote for its postal code
  function handleSavedAddressChange(id: string) {
    setSelectedAddressId(id)
    lastQuotedPostalCode.current = '' // allow re-quote for the new address
    if (id !== 'new') {
      const addr = savedAddresses.find(a => a.id === id)
      if (addr?.postal_code) {
        void fetchQuote(addr.postal_code)
      }
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const address = getFormAddress()
    setPickup(false)
    setShipping(address)
    setStep('resumen')
  }

  // Determine the postal code currently active for the quote widget
  const activePostalCode =
    selectedAddressId !== 'new' && savedAddresses.length > 0
      ? (savedAddresses.find(a => a.id === selectedAddressId)?.postal_code ?? '')
      : form.postal_code

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
            Retiro en local — sin costo de envío.
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
                    onChange={() => handleSavedAddressChange(addr.id)}
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
                  onChange={() => {
                    setSelectedAddressId('new')
                    // Clear the stale quote so the total shows "A calcular" until
                    // the user provides and blurs a postal code for the new address.
                    setShippingQuote(null, null)
                    lastQuotedPostalCode.current = ''
                    setQuoteStatus('idle')
                    setQuotedCost(null)
                    setQuotedDays(null)
                  }}
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

              {/* Postal code gets special treatment for blur-based quoting */}
              <div>
                <label className="block text-sm text-[var(--color-text)] mb-1">Código postal</label>
                <input
                  type="text"
                  required
                  value={form.postal_code}
                  onChange={e => {
                    const val = e.target.value
                    setForm(prev => ({ ...prev, postal_code: val }))
                    // Invalidate previous quote when the user edits the postal code
                    if (val !== lastQuotedPostalCode.current) {
                      setQuoteStatus('idle')
                      setQuotedCost(null)
                      setQuotedDays(null)
                      setShippingQuote(null, null)
                    }
                  }}
                  onBlur={handlePostalCodeBlur}
                  className="w-full border border-[var(--color-border)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)]"
                />
              </div>
            </div>
          )}

          {/* Shipping quote widget */}
          {!isPickup && (
            <div className="text-sm text-[var(--color-muted)] min-h-[1.5rem]">
              {quoteStatus === 'loading' && (
                <span>Calculando envío…</span>
              )}
              {quoteStatus === 'success' && quotedCost !== null && (
                <span className="text-[var(--color-text)]">
                  Envío estándar: {formatARS(quotedCost)}
                  {quotedDays != null && (
                    <span className="text-[var(--color-muted)]"> · Llega en ~{quotedDays} días</span>
                  )}
                </span>
              )}
              {quoteStatus === 'invalid' && (
                <span>Ingresá un código postal válido para calcular el envío.</span>
              )}
              {quoteStatus === 'idle' && activePostalCode === '' && (
                <span>Ingresá el código postal para ver el costo de envío.</span>
              )}
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
