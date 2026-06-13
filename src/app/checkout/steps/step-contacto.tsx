'use client'
import { useState } from 'react'
import { useCheckout } from '../checkout-context'

export function StepContacto({
  initialEmail = '',
  initialPhone = '',
}: {
  initialEmail?: string
  initialPhone?: string
}) {
  const { setContact, setStep } = useCheckout()
  const [email, setEmail] = useState(initialEmail)
  const [phone, setPhone] = useState(initialPhone)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setContact({ email, phone })
    setStep('envio')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2
        style={{ fontFamily: 'var(--font-serif)' }}
        className="text-2xl font-light text-[var(--color-text)]"
      >
        Datos de contacto
      </h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-[var(--color-text)] mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full border border-[var(--color-border)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)]"
          />
        </div>
        <div>
          <label className="block text-sm text-[var(--color-text)] mb-1">Teléfono</label>
          <input
            type="tel"
            required
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="w-full border border-[var(--color-border)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)]"
          />
        </div>
      </div>
      <button
        type="submit"
        className="w-full bg-[var(--color-primary)] text-white py-3 text-sm tracking-widest hover:opacity-90 transition-opacity"
      >
        Continuar
      </button>
    </form>
  )
}
