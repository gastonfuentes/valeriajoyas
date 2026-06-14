'use client'
import { createContext, useContext, useState } from 'react'

export type CheckoutStep = 'contacto' | 'envio' | 'resumen' | 'confirmar'

export type ContactData = {
  email: string
  phone: string
}

export type ShippingAddress = {
  recipient_name: string
  street: string
  street_number: string
  apartment: string
  city: string
  province: string
  postal_code: string
}

export type CheckoutState = {
  step: CheckoutStep
  contact: ContactData | null
  shipping: ShippingAddress | null
  pickup: boolean
  couponCode: string
  couponValid: boolean
  couponDiscount: number
  couponId: string | null
  /** Carrier cost in centavos from the last successful quote. null = not yet quoted. */
  shippingCostCentavos: number | null
  /** Estimated delivery days from the last successful quote. null = not quoted or unavailable. */
  shippingEstimatedDays: number | null
}

type CheckoutContextValue = {
  state: CheckoutState
  setStep: (step: CheckoutStep) => void
  setContact: (contact: ContactData) => void
  setShipping: (shipping: ShippingAddress) => void
  setPickup: (pickup: boolean) => void
  setShippingQuote: (costCentavos: number | null, estimatedDays: number | null) => void
  applyCoupon: (code: string, discount: number, couponId: string) => void
  clearCoupon: () => void
}

const CheckoutContext = createContext<CheckoutContextValue | null>(null)

const initialState: CheckoutState = {
  step: 'contacto',
  contact: null,
  shipping: null,
  pickup: false,
  couponCode: '',
  couponValid: false,
  couponDiscount: 0,
  couponId: null,
  shippingCostCentavos: null,
  shippingEstimatedDays: null,
}

export function CheckoutProvider({
  children,
  initialEmail,
  initialPhone,
}: {
  children: React.ReactNode
  initialEmail?: string
  initialPhone?: string
}) {
  const [state, setState] = useState<CheckoutState>({
    ...initialState,
    contact: initialEmail ? { email: initialEmail, phone: initialPhone ?? '' } : null,
  })

  function setStep(step: CheckoutStep) {
    setState(prev => ({ ...prev, step }))
  }

  function setContact(contact: ContactData) {
    setState(prev => ({ ...prev, contact }))
  }

  function setShipping(shipping: ShippingAddress) {
    setState(prev => ({ ...prev, shipping }))
  }

  function setPickup(pickup: boolean) {
    setState(prev => ({
      ...prev,
      pickup,
      // When switching to pickup, clear any carrier quote — pickup has no shipping cost.
      shippingCostCentavos: pickup ? null : prev.shippingCostCentavos,
      shippingEstimatedDays: pickup ? null : prev.shippingEstimatedDays,
    }))
  }

  function setShippingQuote(costCentavos: number | null, estimatedDays: number | null) {
    setState(prev => ({ ...prev, shippingCostCentavos: costCentavos, shippingEstimatedDays: estimatedDays }))
  }

  function applyCoupon(code: string, discount: number, couponId: string) {
    setState(prev => ({
      ...prev,
      couponCode: code,
      couponValid: true,
      couponDiscount: discount,
      couponId,
    }))
  }

  function clearCoupon() {
    setState(prev => ({
      ...prev,
      couponCode: '',
      couponValid: false,
      couponDiscount: 0,
      couponId: null,
    }))
  }

  return (
    <CheckoutContext.Provider value={{ state, setStep, setContact, setShipping, setPickup, setShippingQuote, applyCoupon, clearCoupon }}>
      {children}
    </CheckoutContext.Provider>
  )
}

export function useCheckout(): CheckoutContextValue {
  const ctx = useContext(CheckoutContext)
  if (!ctx) throw new Error('useCheckout must be used inside <CheckoutProvider>')
  return ctx
}
