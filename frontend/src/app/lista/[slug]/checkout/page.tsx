'use client'

import { use, useState } from 'react'
import { useCart } from '@/lib/cart-context'
import { completeCheckout, formatPrice } from '@/lib/medusa'
import BackToWeddingButton from '@/components/wedding/BackToWeddingButton'
import type {
  GiftMessage,
  PaymentMethod,
  BillingInfo,
  CreditCardData,
  PaymentResult,
} from '@/types/wedding'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9)
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 16)
  return digits.replace(/(.{4})/g, '$1 ').trim()
}

function formatPostalCode(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

function isValidCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '')
  if (digits.length !== 11) return false
  if (/^(\d)\1{10}$/.test(digits)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i)
  let remainder = (sum * 10) % 11
  if (remainder === 10) remainder = 0
  if (remainder !== parseInt(digits[9])) return false

  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i)
  remainder = (sum * 10) % 11
  if (remainder === 10) remainder = 0
  return remainder === parseInt(digits[10])
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function InputField({
  id,
  label,
  required,
  type = 'text',
  placeholder,
  value,
  onChange,
  hint,
  maxLength,
}: {
  id: string
  label: string
  required?: boolean
  type?: string
  placeholder?: string
  value: string
  onChange: (v: string) => void
  hint?: string
  maxLength?: number
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium"
        style={{ color: 'var(--wedding-text)' }}
      >
        {label}
        {required && ' *'}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="mt-1 h-10 w-full rounded-lg border px-3 text-sm outline-none transition-colors focus:ring-2"
        style={{
          borderColor: 'var(--wedding-secondary)',
          color: 'var(--wedding-text)',
        }}
      />
      {hint && (
        <p
          className="mt-1 text-xs"
          style={{ color: 'var(--wedding-text)', opacity: 0.5 }}
        >
          {hint}
        </p>
      )}
    </div>
  )
}

function SectionCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section
      className="rounded-lg border p-6"
      style={{ borderColor: 'var(--wedding-secondary)' }}
    >
      <h2
        className="text-lg font-medium"
        style={{ color: 'var(--wedding-text)' }}
      >
        {title}
      </h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  )
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: string }[] =
  [
    { value: 'PIX', label: 'PIX', icon: 'Instantaneo' },
    { value: 'BOLETO', label: 'Boleto Bancario', icon: 'Ate 3 dias uteis' },
    {
      value: 'CREDIT_CARD',
      label: 'Cartao de Credito',
      icon: 'Aprovacao imediata',
    },
  ]

const BR_STATES = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
]

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

interface PageProps {
  params: Promise<{ slug: string }>
}

export default function CheckoutPage({ params }: PageProps) {
  const { slug } = use(params)
  const { cart, isLoading: cartLoading } = useCart()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({})
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null)

  // Gift message state
  const [fromName, setFromName] = useState('')
  const [giftMessageText, setGiftMessageText] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)

  // Contact
  const [email, setEmail] = useState('')

  // Billing info
  const [fullName, setFullName] = useState('')
  const [cpf, setCpf] = useState('')
  const [phone, setPhone] = useState('')
  const [address1, setAddress1] = useState('')
  const [address2, setAddress2] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [postalCode, setPostalCode] = useState('')

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX')

  // Credit card fields
  const [cardHolder, setCardHolder] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiryMonth, setCardExpiryMonth] = useState('')
  const [cardExpiryYear, setCardExpiryYear] = useState('')
  const [cardCvv, setCardCvv] = useState('')

  const items = cart?.items ?? []

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  function validate(): boolean {
    const errors: Record<string, string> = {}

    if (!fromName.trim()) errors.fromName = 'Nome e obrigatorio'
    if (!email.trim()) errors.email = 'Email e obrigatorio'
    if (!fullName.trim()) errors.fullName = 'Nome completo e obrigatorio'

    const cpfDigits = cpf.replace(/\D/g, '')
    if (!cpfDigits) {
      errors.cpf = 'CPF e obrigatorio'
    } else if (!isValidCPF(cpfDigits)) {
      errors.cpf = 'CPF invalido'
    }

    const phoneDigits = phone.replace(/\D/g, '')
    if (!phoneDigits) {
      errors.phone = 'Telefone e obrigatorio'
    } else if (phoneDigits.length < 10) {
      errors.phone = 'Telefone invalido'
    }

    if (!address1.trim()) errors.address1 = 'Endereco e obrigatorio'
    if (!city.trim()) errors.city = 'Cidade e obrigatoria'
    if (!state) errors.state = 'Estado e obrigatorio'

    const cepDigits = postalCode.replace(/\D/g, '')
    if (!cepDigits) {
      errors.postalCode = 'CEP e obrigatorio'
    } else if (cepDigits.length !== 8) {
      errors.postalCode = 'CEP invalido'
    }

    if (paymentMethod === 'CREDIT_CARD') {
      if (!cardHolder.trim())
        errors.cardHolder = 'Nome no cartao e obrigatorio'
      const cardDigits = cardNumber.replace(/\D/g, '')
      if (!cardDigits) {
        errors.cardNumber = 'Numero do cartao e obrigatorio'
      } else if (cardDigits.length < 13 || cardDigits.length > 16) {
        errors.cardNumber = 'Numero do cartao invalido'
      }
      if (!cardExpiryMonth || !cardExpiryYear) {
        errors.cardExpiry = 'Validade e obrigatoria'
      }
      if (!cardCvv || cardCvv.length < 3) {
        errors.cardCvv = 'CVV invalido'
      }
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!cart?.id) return
    if (!validate()) return

    setError(null)
    setIsSubmitting(true)

    try {
      const giftMessage: GiftMessage = {
        from_name: fromName,
        message: giftMessageText || undefined,
        is_anonymous: isAnonymous,
      }

      const billingInfo: BillingInfo = {
        full_name: fullName,
        cpf: cpf.replace(/\D/g, ''),
        phone: phone.replace(/\D/g, ''),
        address_1: address1,
        address_2: address2 || undefined,
        city,
        state,
        postal_code: postalCode.replace(/\D/g, ''),
        country_code: 'BR',
      }

      let creditCard: CreditCardData | undefined
      if (paymentMethod === 'CREDIT_CARD') {
        creditCard = {
          holder_name: cardHolder,
          number: cardNumber.replace(/\s/g, ''),
          expiry_month: cardExpiryMonth,
          expiry_year: cardExpiryYear,
          cvv: cardCvv,
        }
      }

      const result = await completeCheckout(
        cart.id,
        giftMessage,
        email,
        billingInfo,
        paymentMethod,
        creditCard,
      )

      if (result?.order_id) {
        setPaymentResult(result)
      } else {
        setError('Nao foi possivel completar o pedido. Tente novamente.')
      }
    } catch {
      setError('Ocorreu um erro. Por favor tente mais tarde.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Success / Payment confirmation screen
  // ---------------------------------------------------------------------------

  if (paymentResult) {
    return (
      <main className="mx-auto min-h-screen max-w-4xl px-4 py-8 sm:px-6">
        <div className="mt-12 text-center">
          <div
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: 'var(--wedding-secondary)' }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: 'var(--wedding-primary)' }}
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>

          <h1
            className="mt-6 text-2xl font-light sm:text-3xl"
            style={{
              fontFamily: 'var(--wedding-heading-font)',
              color: 'var(--wedding-text)',
            }}
          >
            Obrigado pelo presente!
          </h1>

          <p
            className="mt-3 text-sm"
            style={{ color: 'var(--wedding-text)', opacity: 0.7 }}
          >
            Pedido #{paymentResult.order_id}
          </p>

          {/* PIX payment details */}
          {paymentResult.payment_method === 'PIX' &&
            paymentResult.payment_status === 'PENDING' && (
              <div
                className="mx-auto mt-8 max-w-md rounded-lg border p-6"
                style={{ borderColor: 'var(--wedding-secondary)' }}
              >
                <h2
                  className="text-lg font-medium"
                  style={{ color: 'var(--wedding-text)' }}
                >
                  Pagamento via PIX
                </h2>
                <p
                  className="mt-2 text-sm"
                  style={{ color: 'var(--wedding-text)', opacity: 0.7 }}
                >
                  Escaneie o QR code ou copie o codigo para pagar
                </p>

                {paymentResult.pix_qr_code_url && (
                  <div className="mt-4 flex justify-center">
                    {/* QR code image from the payment gateway */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={paymentResult.pix_qr_code_url}
                      alt="PIX QR Code"
                      width={200}
                      height={200}
                      className="rounded-lg"
                    />
                  </div>
                )}

                {paymentResult.pix_copy_paste && (
                  <div className="mt-4">
                    <p
                      className="text-xs font-medium"
                      style={{ color: 'var(--wedding-text)' }}
                    >
                      PIX Copia e Cola:
                    </p>
                    <div
                      className="mt-1 break-all rounded-lg border p-3 text-xs"
                      style={{
                        borderColor: 'var(--wedding-secondary)',
                        color: 'var(--wedding-text)',
                        backgroundColor: 'var(--wedding-secondary)',
                        opacity: 0.8,
                      }}
                    >
                      {paymentResult.pix_copy_paste}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          paymentResult.pix_copy_paste ?? '',
                        )
                      }}
                      className="mt-2 rounded-lg px-4 py-2 text-xs font-medium text-white transition-colors hover:opacity-90"
                      style={{ backgroundColor: 'var(--wedding-primary)' }}
                    >
                      Copiar codigo
                    </button>
                  </div>
                )}

                {!paymentResult.pix_qr_code_url &&
                  !paymentResult.pix_copy_paste && (
                    <div
                      className="mt-4 rounded-lg p-4 text-sm"
                      style={{
                        backgroundColor: 'var(--wedding-secondary)',
                        color: 'var(--wedding-text)',
                      }}
                    >
                      O QR Code PIX sera enviado para o seu email em instantes.
                    </div>
                  )}
              </div>
            )}

          {/* Boleto payment details */}
          {paymentResult.payment_method === 'BOLETO' &&
            paymentResult.payment_status === 'PENDING' && (
              <div
                className="mx-auto mt-8 max-w-md rounded-lg border p-6"
                style={{ borderColor: 'var(--wedding-secondary)' }}
              >
                <h2
                  className="text-lg font-medium"
                  style={{ color: 'var(--wedding-text)' }}
                >
                  Pagamento via Boleto
                </h2>
                <p
                  className="mt-2 text-sm"
                  style={{ color: 'var(--wedding-text)', opacity: 0.7 }}
                >
                  O boleto vence em 3 dias uteis
                </p>

                {paymentResult.boleto_url && (
                  <a
                    href={paymentResult.boleto_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex h-10 items-center justify-center rounded-lg px-6 text-sm font-medium text-white transition-colors hover:opacity-90"
                    style={{ backgroundColor: 'var(--wedding-primary)' }}
                  >
                    Abrir boleto
                  </a>
                )}

                {paymentResult.boleto_barcode && (
                  <div className="mt-4">
                    <p
                      className="text-xs font-medium"
                      style={{ color: 'var(--wedding-text)' }}
                    >
                      Linha digitavel:
                    </p>
                    <div
                      className="mt-1 break-all rounded-lg border p-3 text-xs"
                      style={{
                        borderColor: 'var(--wedding-secondary)',
                        color: 'var(--wedding-text)',
                        backgroundColor: 'var(--wedding-secondary)',
                        opacity: 0.8,
                      }}
                    >
                      {paymentResult.boleto_barcode}
                    </div>
                  </div>
                )}

                {!paymentResult.boleto_url &&
                  !paymentResult.boleto_barcode && (
                    <div
                      className="mt-4 rounded-lg p-4 text-sm"
                      style={{
                        backgroundColor: 'var(--wedding-secondary)',
                        color: 'var(--wedding-text)',
                      }}
                    >
                      O boleto sera enviado para o seu email em instantes.
                    </div>
                  )}
              </div>
            )}

          {/* Credit card confirmed */}
          {paymentResult.payment_method === 'CREDIT_CARD' &&
            paymentResult.payment_status === 'CONFIRMED' && (
              <div
                className="mx-auto mt-8 max-w-md rounded-lg border p-6"
                style={{ borderColor: 'var(--wedding-secondary)' }}
              >
                <p
                  className="text-sm"
                  style={{ color: 'var(--wedding-text)' }}
                >
                  Pagamento aprovado! Uma confirmacao foi enviada para o seu
                  email.
                </p>
              </div>
            )}

          {/* Credit card refused */}
          {paymentResult.payment_method === 'CREDIT_CARD' &&
            paymentResult.payment_status === 'REFUSED' && (
              <div className="mx-auto mt-8 max-w-md rounded-lg border border-red-200 bg-red-50 p-6">
                <p className="text-sm text-red-600">
                  Pagamento recusado. Por favor, tente outro metodo de
                  pagamento.
                </p>
              </div>
            )}

          <div className="mt-8">
            <BackToWeddingButton slug={slug} label="Voltar a lista" />
          </div>
        </div>
      </main>
    )
  }

  // ---------------------------------------------------------------------------
  // Empty cart
  // ---------------------------------------------------------------------------

  if (items.length === 0 && !cartLoading) {
    return (
      <main className="mx-auto min-h-screen max-w-4xl px-4 py-8 sm:px-6">
        <BackToWeddingButton slug={slug} />
        <div className="mt-16 text-center">
          <p className="text-muted-foreground">
            O seu carrinho esta vazio. Adicione presentes antes de continuar.
          </p>
        </div>
      </main>
    )
  }

  // ---------------------------------------------------------------------------
  // Render helper for validation error
  // ---------------------------------------------------------------------------

  function fieldError(key: string) {
    if (!validationErrors[key]) return null
    return (
      <p className="mt-1 text-xs text-red-500">{validationErrors[key]}</p>
    )
  }

  // ---------------------------------------------------------------------------
  // Main checkout form
  // ---------------------------------------------------------------------------

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-8 sm:px-6">
      <BackToWeddingButton slug={slug} label="Voltar ao carrinho" />

      <h1
        className="mt-6 text-2xl font-light sm:text-3xl"
        style={{
          fontFamily: 'var(--wedding-heading-font)',
          color: 'var(--wedding-text)',
        }}
      >
        Finalizar presente
      </h1>

      <form
        onSubmit={handleSubmit}
        className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-5"
      >
        {/* Left column: form fields */}
        <div className="space-y-6 md:col-span-3">
          {/* Gift message section */}
          <SectionCard title="Mensagem de presente">
            <div>
              <InputField
                id="fromName"
                label="O seu nome"
                required
                value={fromName}
                onChange={setFromName}
                placeholder="Ex: Maria e Joao"
              />
              {fieldError('fromName')}
            </div>

            <div>
              <label
                htmlFor="giftMessage"
                className="block text-sm font-medium"
                style={{ color: 'var(--wedding-text)' }}
              >
                Mensagem (opcional)
              </label>
              <textarea
                id="giftMessage"
                value={giftMessageText}
                onChange={(e) => setGiftMessageText(e.target.value)}
                rows={3}
                placeholder="Escreva uma mensagem para os noivos..."
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:ring-2"
                style={{
                  borderColor: 'var(--wedding-secondary)',
                  color: 'var(--wedding-text)',
                }}
              />
            </div>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="h-4 w-4 rounded"
                style={{ accentColor: 'var(--wedding-primary)' }}
              />
              <span
                className="text-sm"
                style={{ color: 'var(--wedding-text)' }}
              >
                Oferecer anonimamente
              </span>
            </label>
          </SectionCard>

          {/* Contact section */}
          <SectionCard title="Contacto">
            <InputField
              id="email"
              label="Email"
              type="email"
              required
              value={email}
              onChange={setEmail}
              placeholder="o-seu-email@exemplo.com"
              hint="Receberao uma confirmacao do presente neste email."
            />
            {fieldError('email')}
          </SectionCard>

          {/* Billing info section */}
          <SectionCard title="Dados de cobranca">
            <div>
              <InputField
                id="fullName"
                label="Nome completo"
                required
                value={fullName}
                onChange={setFullName}
                placeholder="Nome como consta no documento"
              />
              {fieldError('fullName')}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <InputField
                  id="cpf"
                  label="CPF"
                  required
                  value={cpf}
                  onChange={(v) => setCpf(formatCPF(v))}
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
                {fieldError('cpf')}
              </div>
              <div>
                <InputField
                  id="phone"
                  label="Telefone"
                  required
                  value={phone}
                  onChange={(v) => setPhone(formatPhone(v))}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                />
                {fieldError('phone')}
              </div>
            </div>

            <div>
              <InputField
                id="address1"
                label="Endereco"
                required
                value={address1}
                onChange={setAddress1}
                placeholder="Rua, numero"
              />
              {fieldError('address1')}
            </div>

            <InputField
              id="address2"
              label="Complemento"
              value={address2}
              onChange={setAddress2}
              placeholder="Apto, bloco, etc. (opcional)"
            />

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <InputField
                  id="city"
                  label="Cidade"
                  required
                  value={city}
                  onChange={setCity}
                />
                {fieldError('city')}
              </div>

              <div>
                <label
                  htmlFor="state"
                  className="block text-sm font-medium"
                  style={{ color: 'var(--wedding-text)' }}
                >
                  Estado *
                </label>
                <select
                  id="state"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border px-3 text-sm outline-none transition-colors focus:ring-2"
                  style={{
                    borderColor: 'var(--wedding-secondary)',
                    color: state
                      ? 'var(--wedding-text)'
                      : 'var(--wedding-text)',
                  }}
                >
                  <option value="">UF</option>
                  {BR_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                {fieldError('state')}
              </div>

              <div>
                <InputField
                  id="postalCode"
                  label="CEP"
                  required
                  value={postalCode}
                  onChange={(v) => setPostalCode(formatPostalCode(v))}
                  placeholder="00000-000"
                  maxLength={9}
                />
                {fieldError('postalCode')}
              </div>
            </div>
          </SectionCard>

          {/* Payment method selection */}
          <SectionCard title="Forma de pagamento">
            <div className="space-y-3">
              {PAYMENT_METHODS.map((pm) => (
                <label
                  key={pm.value}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${
                    paymentMethod === pm.value
                      ? 'ring-2'
                      : ''
                  }`}
                  style={{
                    borderColor:
                      paymentMethod === pm.value
                        ? 'var(--wedding-primary)'
                        : 'var(--wedding-secondary)',
                    ...(paymentMethod === pm.value
                      ? {
                          ringColor: 'var(--wedding-primary)',
                          backgroundColor: 'var(--wedding-secondary)',
                        }
                      : {}),
                  }}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={pm.value}
                    checked={paymentMethod === pm.value}
                    onChange={() => setPaymentMethod(pm.value)}
                    className="h-4 w-4"
                    style={{ accentColor: 'var(--wedding-primary)' }}
                  />
                  <div>
                    <span
                      className="text-sm font-medium"
                      style={{ color: 'var(--wedding-text)' }}
                    >
                      {pm.label}
                    </span>
                    <span
                      className="ml-2 text-xs"
                      style={{
                        color: 'var(--wedding-text)',
                        opacity: 0.5,
                      }}
                    >
                      {pm.icon}
                    </span>
                  </div>
                </label>
              ))}
            </div>

            {/* Credit card fields */}
            {paymentMethod === 'CREDIT_CARD' && (
              <div className="mt-4 space-y-4 rounded-lg border p-4" style={{ borderColor: 'var(--wedding-secondary)' }}>
                <div>
                  <InputField
                    id="cardHolder"
                    label="Nome no cartao"
                    required
                    value={cardHolder}
                    onChange={setCardHolder}
                    placeholder="Como impresso no cartao"
                  />
                  {fieldError('cardHolder')}
                </div>

                <div>
                  <InputField
                    id="cardNumber"
                    label="Numero do cartao"
                    required
                    value={cardNumber}
                    onChange={(v) => setCardNumber(formatCardNumber(v))}
                    placeholder="0000 0000 0000 0000"
                    maxLength={19}
                  />
                  {fieldError('cardNumber')}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label
                      htmlFor="cardExpiryMonth"
                      className="block text-sm font-medium"
                      style={{ color: 'var(--wedding-text)' }}
                    >
                      Mes *
                    </label>
                    <select
                      id="cardExpiryMonth"
                      required
                      value={cardExpiryMonth}
                      onChange={(e) => setCardExpiryMonth(e.target.value)}
                      className="mt-1 h-10 w-full rounded-lg border px-3 text-sm outline-none transition-colors focus:ring-2"
                      style={{
                        borderColor: 'var(--wedding-secondary)',
                        color: 'var(--wedding-text)',
                      }}
                    >
                      <option value="">MM</option>
                      {Array.from({ length: 12 }, (_, i) => {
                        const m = String(i + 1).padStart(2, '0')
                        return (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        )
                      })}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="cardExpiryYear"
                      className="block text-sm font-medium"
                      style={{ color: 'var(--wedding-text)' }}
                    >
                      Ano *
                    </label>
                    <select
                      id="cardExpiryYear"
                      required
                      value={cardExpiryYear}
                      onChange={(e) => setCardExpiryYear(e.target.value)}
                      className="mt-1 h-10 w-full rounded-lg border px-3 text-sm outline-none transition-colors focus:ring-2"
                      style={{
                        borderColor: 'var(--wedding-secondary)',
                        color: 'var(--wedding-text)',
                      }}
                    >
                      <option value="">AAAA</option>
                      {Array.from({ length: 10 }, (_, i) => {
                        const y = String(new Date().getFullYear() + i)
                        return (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        )
                      })}
                    </select>
                    {fieldError('cardExpiry')}
                  </div>

                  <div>
                    <InputField
                      id="cardCvv"
                      label="CVV"
                      required
                      value={cardCvv}
                      onChange={(v) =>
                        setCardCvv(v.replace(/\D/g, '').slice(0, 4))
                      }
                      placeholder="000"
                      maxLength={4}
                    />
                    {fieldError('cardCvv')}
                  </div>
                </div>
              </div>
            )}

            {/* PIX info box */}
            {paymentMethod === 'PIX' && (
              <div
                className="mt-4 rounded-lg p-4 text-sm"
                style={{
                  backgroundColor: 'var(--wedding-secondary)',
                  color: 'var(--wedding-text)',
                }}
              >
                Apos confirmar, voce recebera um QR code PIX para pagamento
                instantaneo.
              </div>
            )}

            {/* Boleto info box */}
            {paymentMethod === 'BOLETO' && (
              <div
                className="mt-4 rounded-lg p-4 text-sm"
                style={{
                  backgroundColor: 'var(--wedding-secondary)',
                  color: 'var(--wedding-text)',
                }}
              >
                O boleto sera gerado apos a confirmacao e vence em 3 dias
                uteis.
              </div>
            )}
          </SectionCard>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        {/* Right column: order summary */}
        <div className="md:col-span-2">
          <div
            className="sticky top-20 rounded-lg border p-6"
            style={{ borderColor: 'var(--wedding-secondary)' }}
          >
            <h2
              className="text-lg font-medium"
              style={{ color: 'var(--wedding-text)' }}
            >
              Resumo
            </h2>

            <div className="mt-4 space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between text-sm"
                  style={{ color: 'var(--wedding-text)' }}
                >
                  <span className="truncate pr-2">
                    {item.title} x{item.quantity}
                  </span>
                  <span className="flex-shrink-0">
                    {formatPrice(item.total, item.currency_code)}
                  </span>
                </div>
              ))}
            </div>

            <div
              className="mt-4 border-t pt-4"
              style={{ borderColor: 'var(--wedding-secondary)' }}
            >
              <div
                className="flex justify-between text-base font-semibold"
                style={{ color: 'var(--wedding-text)' }}
              >
                <span>Total</span>
                <span style={{ color: 'var(--wedding-primary)' }}>
                  {formatPrice(cart?.total ?? 0, cart?.currency_code)}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || cartLoading}
              className="mt-6 flex h-12 w-full items-center justify-center rounded-lg text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: 'var(--wedding-primary)' }}
            >
              {isSubmitting ? (
                <svg
                  className="h-5 w-5 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              ) : (
                `Pagar com ${paymentMethod === 'PIX' ? 'PIX' : paymentMethod === 'BOLETO' ? 'Boleto' : 'Cartao'}`
              )}
            </button>

            <p
              className="mt-3 text-center text-xs"
              style={{ color: 'var(--wedding-text)', opacity: 0.5 }}
            >
              Pagamento processado com seguranca via Asaas
            </p>
          </div>
        </div>
      </form>
    </main>
  )
}
