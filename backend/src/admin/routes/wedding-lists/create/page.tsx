import { defineRouteConfig } from "@medusajs/admin-sdk"
import {
  Container,
  Heading,
  Button,
  Input,
  Label,
  Textarea,
  Switch,
  Text,
  Toaster,
  toast,
} from "@medusajs/ui"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

const FONT_OPTIONS = [
  "Playfair Display",
  "Lora",
  "Cormorant Garamond",
  "Great Vibes",
  "Montserrat",
  "Raleway",
  "Inter",
]

function generateSlug(coupleNames: string): string {
  return coupleNames
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[&+]/g, " ")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

type FormData = {
  couple_names: string
  wedding_date: string
  couple_photo_url: string
  primary_color: string
  secondary_color: string
  font_family: string
  custom_message: string
  slug: string
  is_active: boolean
  pix_enabled: boolean
  boleto_enabled: boolean
  credit_card_enabled: boolean
}

const CreateWeddingListPage = () => {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)

  const [form, setForm] = useState<FormData>({
    couple_names: "",
    wedding_date: "",
    couple_photo_url: "",
    primary_color: "#d4af37",
    secondary_color: "#ffffff",
    font_family: "Playfair Display",
    custom_message: "",
    slug: "",
    is_active: true,
    pix_enabled: true,
    boleto_enabled: false,
    credit_card_enabled: true,
  })

  const updateField = <K extends keyof FormData>(
    key: K,
    value: FormData[K]
  ) => {
    setForm((prev) => {
      const updated = { ...prev, [key]: value }
      if (key === "couple_names" && !slugManuallyEdited) {
        updated.slug = generateSlug(value as string)
      }
      return updated
    })
  }

  const handleSlugChange = (value: string) => {
    setSlugManuallyEdited(true)
    setForm((prev) => ({ ...prev, slug: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.couple_names.trim()) {
      toast.error("Erro", { description: "Nome do casal e obrigatorio." })
      return
    }
    if (!form.wedding_date) {
      toast.error("Erro", { description: "Data do casamento e obrigatoria." })
      return
    }

    setSubmitting(true)
    try {
      const body: Record<string, unknown> = {
        couple_names: form.couple_names.trim(),
        wedding_date: new Date(form.wedding_date).toISOString(),
        primary_color: form.primary_color,
        secondary_color: form.secondary_color,
        font_family: form.font_family,
        is_active: form.is_active,
      }

      if (form.couple_photo_url.trim()) {
        body.couple_photo_url = form.couple_photo_url.trim()
      }
      if (form.custom_message.trim()) {
        body.custom_message = form.custom_message.trim()
      }
      if (form.slug.trim()) {
        body.slug = form.slug.trim()
      }

      body.metadata = {
        pix_enabled: form.pix_enabled,
        boleto_enabled: form.boleto_enabled,
        credit_card_enabled: form.credit_card_enabled,
      }

      const res = await fetch("/admin/wedding-lists", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        throw new Error(
          errData?.message || `Erro ${res.status}`
        )
      }

      toast.success("Lista criada!", {
        description: `Lista de "${form.couple_names}" criada com sucesso.`,
      })
      navigate("/wedding-lists")
    } catch (err) {
      toast.error("Erro ao criar lista", {
        description:
          err instanceof Error ? err.message : "Tente novamente.",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Toaster />
      <div className="flex items-center justify-between p-6 pb-0">
        <Heading level="h1">Criar Lista de Casamento</Heading>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="small"
            onClick={() => navigate("/wedding-lists")}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="small"
            isLoading={submitting}
            disabled={submitting}
          >
            Criar Lista
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
        {/* Basic Information */}
        <Container>
          <Heading level="h2" className="mb-4">
            Informacoes do Casal
          </Heading>
          <div className="flex flex-col gap-4">
            <div>
              <Label htmlFor="couple_names">Nome do Casal *</Label>
              <Input
                id="couple_names"
                placeholder="Ana & Pedro"
                value={form.couple_names}
                onChange={(e) =>
                  updateField("couple_names", e.target.value)
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="wedding_date">Data do Casamento *</Label>
              <Input
                id="wedding_date"
                type="date"
                value={form.wedding_date}
                onChange={(e) =>
                  updateField("wedding_date", e.target.value)
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="couple_photo_url">URL da Foto do Casal</Label>
              <Input
                id="couple_photo_url"
                type="url"
                placeholder="https://exemplo.com/foto.jpg"
                value={form.couple_photo_url}
                onChange={(e) =>
                  updateField("couple_photo_url", e.target.value)
                }
              />
            </div>

            <div>
              <Label htmlFor="custom_message">Mensagem Personalizada</Label>
              <Textarea
                id="custom_message"
                placeholder="Uma mensagem especial para os convidados..."
                value={form.custom_message}
                onChange={(e) =>
                  updateField("custom_message", e.target.value)
                }
                rows={3}
              />
            </div>
          </div>
        </Container>

        {/* Customization */}
        <Container>
          <Heading level="h2" className="mb-4">
            Personalizacao
          </Heading>
          <div className="flex flex-col gap-4">
            <div>
              <Label htmlFor="slug">Slug (subdominio)</Label>
              <Input
                id="slug"
                placeholder="ana-e-pedro"
                value={form.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
              />
              {form.slug && (
                <Text
                  size="xsmall"
                  className="text-ui-fg-muted mt-1"
                >
                  {form.slug}.lysatelier.com.br
                </Text>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="primary_color">Cor Primaria</Label>
                <div className="flex items-center gap-2">
                  <input
                    id="primary_color"
                    type="color"
                    value={form.primary_color}
                    onChange={(e) =>
                      updateField("primary_color", e.target.value)
                    }
                    className="h-10 w-10 cursor-pointer rounded border border-ui-border-base"
                  />
                  <Input
                    value={form.primary_color}
                    onChange={(e) =>
                      updateField("primary_color", e.target.value)
                    }
                    className="flex-1"
                    size="small"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="secondary_color">Cor Secundaria</Label>
                <div className="flex items-center gap-2">
                  <input
                    id="secondary_color"
                    type="color"
                    value={form.secondary_color}
                    onChange={(e) =>
                      updateField("secondary_color", e.target.value)
                    }
                    className="h-10 w-10 cursor-pointer rounded border border-ui-border-base"
                  />
                  <Input
                    value={form.secondary_color}
                    onChange={(e) =>
                      updateField("secondary_color", e.target.value)
                    }
                    className="flex-1"
                    size="small"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="font_family">Fonte</Label>
              <select
                id="font_family"
                value={form.font_family}
                onChange={(e) =>
                  updateField("font_family", e.target.value)
                }
                className="w-full rounded-lg border border-ui-border-base bg-ui-bg-field px-3 py-2 text-sm text-ui-fg-base focus:outline-none focus:ring-2 focus:ring-ui-fg-interactive"
              >
                {FONT_OPTIONS.map((font) => (
                  <option key={font} value={font}>
                    {font}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Container>

        {/* Settings */}
        <Container>
          <Heading level="h2" className="mb-4">
            Configuracoes
          </Heading>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <Text size="small" weight="plus">
                  Lista Ativa
                </Text>
                <Text size="xsmall" className="text-ui-fg-muted">
                  A lista estara visivel para os convidados
                </Text>
              </div>
              <Switch
                checked={form.is_active}
                onCheckedChange={(checked) =>
                  updateField("is_active", checked)
                }
              />
            </div>
          </div>
        </Container>

        {/* Payment Methods */}
        <Container>
          <Heading level="h2" className="mb-4">
            Metodos de Pagamento
          </Heading>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <Text size="small" weight="plus">
                  PIX
                </Text>
                <Text size="xsmall" className="text-ui-fg-muted">
                  Pagamento instantaneo via PIX
                </Text>
              </div>
              <Switch
                checked={form.pix_enabled}
                onCheckedChange={(checked) =>
                  updateField("pix_enabled", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Text size="small" weight="plus">
                  Boleto
                </Text>
                <Text size="xsmall" className="text-ui-fg-muted">
                  Pagamento via boleto bancario
                </Text>
              </div>
              <Switch
                checked={form.boleto_enabled}
                onCheckedChange={(checked) =>
                  updateField("boleto_enabled", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Text size="small" weight="plus">
                  Cartao de Credito
                </Text>
                <Text size="xsmall" className="text-ui-fg-muted">
                  Pagamento com cartao de credito
                </Text>
              </div>
              <Switch
                checked={form.credit_card_enabled}
                onCheckedChange={(checked) =>
                  updateField("credit_card_enabled", checked)
                }
              />
            </div>
          </div>
        </Container>
      </div>
    </form>
  )
}

export const config = defineRouteConfig({
  label: "Criar Lista",
})

export default CreateWeddingListPage
