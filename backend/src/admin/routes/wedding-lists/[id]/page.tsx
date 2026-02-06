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
  Badge,
  Toaster,
  toast,
} from "@medusajs/ui"
import { ArrowUpRightOnBox, PencilSquare } from "@medusajs/icons"
import { useEffect, useState, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { OrdersReport } from "./orders-report"

const FONT_OPTIONS = [
  "Playfair Display",
  "Lora",
  "Cormorant Garamond",
  "Great Vibes",
  "Montserrat",
  "Raleway",
  "Inter",
]

type Product = {
  id: string
  title: string
  thumbnail?: string
  status?: string
}

type WeddingList = {
  id: string
  couple_names: string
  wedding_date: string
  couple_photo_url?: string
  primary_color: string
  secondary_color: string
  font_family: string
  custom_message?: string
  slug: string
  is_active: boolean
  metadata?: Record<string, unknown>
  products?: Product[]
  created_at: string
  updated_at: string
}

const WeddingListDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [list, setList] = useState<WeddingList | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [newProductId, setNewProductId] = useState("")

  const [form, setForm] = useState({
    couple_names: "",
    wedding_date: "",
    couple_photo_url: "",
    primary_color: "#d4af37",
    secondary_color: "#ffffff",
    font_family: "Playfair Display",
    custom_message: "",
    slug: "",
    is_active: true,
  })

  const fetchList = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await fetch(`/admin/wedding-lists/${id}`, {
        credentials: "include",
      })
      if (!res.ok) throw new Error("Not found")
      const data = await res.json()
      const wl: WeddingList = data.wedding_list
      setList(wl)
      setForm({
        couple_names: wl.couple_names || "",
        wedding_date: wl.wedding_date ? wl.wedding_date.split("T")[0] : "",
        couple_photo_url: wl.couple_photo_url || "",
        primary_color: wl.primary_color || "#d4af37",
        secondary_color: wl.secondary_color || "#ffffff",
        font_family: wl.font_family || "Playfair Display",
        custom_message: wl.custom_message || "",
        slug: wl.slug || "",
        is_active: wl.is_active ?? true,
      })
    } catch {
      toast.error("Erro", { description: "Lista nao encontrada." })
      navigate("/wedding-lists")
    } finally {
      setLoading(false)
    }
  }, [id, navigate])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  const handleSave = async () => {
    if (!id) return
    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        couple_names: form.couple_names.trim(),
        wedding_date: new Date(form.wedding_date).toISOString(),
        primary_color: form.primary_color,
        secondary_color: form.secondary_color,
        font_family: form.font_family,
        slug: form.slug.trim(),
        is_active: form.is_active,
      }
      if (form.couple_photo_url.trim()) {
        body.couple_photo_url = form.couple_photo_url.trim()
      } else {
        body.couple_photo_url = null
      }
      if (form.custom_message.trim()) {
        body.custom_message = form.custom_message.trim()
      } else {
        body.custom_message = null
      }

      const res = await fetch(`/admin/wedding-lists/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        throw new Error(errData?.message || `Erro ${res.status}`)
      }

      toast.success("Salvo!", {
        description: "Lista atualizada com sucesso.",
      })
      setEditing(false)
      fetchList()
    } catch (err) {
      toast.error("Erro ao salvar", {
        description:
          err instanceof Error ? err.message : "Tente novamente.",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleAddProduct = async () => {
    if (!id || !newProductId.trim()) return
    const currentIds = (list?.products || []).map((p) => p.id)
    if (currentIds.includes(newProductId.trim())) {
      toast.error("Produto ja esta na lista.")
      return
    }
    try {
      const res = await fetch(`/admin/wedding-lists/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_ids: [...currentIds, newProductId.trim()],
        }),
      })
      if (!res.ok) throw new Error("Failed")
      toast.success("Produto adicionado!")
      setNewProductId("")
      fetchList()
    } catch {
      toast.error("Erro ao adicionar produto.")
    }
  }

  const handleRemoveProduct = async (productId: string) => {
    if (!id) return
    const currentIds = (list?.products || []).map((p) => p.id)
    try {
      const res = await fetch(`/admin/wedding-lists/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_ids: currentIds.filter((pid) => pid !== productId),
        }),
      })
      if (!res.ok) throw new Error("Failed")
      toast.success("Produto removido!")
      fetchList()
    } catch {
      toast.error("Erro ao remover produto.")
    }
  }

  if (loading) {
    return (
      <Container>
        <Text className="text-ui-fg-muted">Carregando...</Text>
      </Container>
    )
  }

  if (!list) return null

  return (
    <div>
      <Toaster />

      {/* Header */}
      <div className="flex items-center justify-between p-6 pb-0">
        <div>
          <Heading level="h1">{list.couple_names}</Heading>
          <div className="flex items-center gap-2 mt-1">
            <Badge
              color={list.is_active ? "green" : "grey"}
              size="small"
            >
              {list.is_active ? "Ativa" : "Inativa"}
            </Badge>
            <a
              href={`https://${list.slug}.lysatelier.com.br`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-ui-fg-interactive text-sm hover:underline no-underline"
            >
              {list.slug}.lysatelier.com.br
              <ArrowUpRightOnBox className="w-3 h-3" />
            </a>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button
                variant="secondary"
                size="small"
                onClick={() => {
                  setEditing(false)
                  fetchList()
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="small"
                isLoading={saving}
                disabled={saving}
                onClick={handleSave}
              >
                Salvar
              </Button>
            </>
          ) : (
            <Button
              variant="secondary"
              size="small"
              onClick={() => setEditing(true)}
            >
              <PencilSquare />
              Editar
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
        {/* Details Form */}
        <Container>
          <Heading level="h2" className="mb-4">
            Detalhes
          </Heading>
          <div className="flex flex-col gap-4">
            <div>
              <Label>Nome do Casal</Label>
              <Input
                value={form.couple_names}
                onChange={(e) =>
                  setForm((p) => ({ ...p, couple_names: e.target.value }))
                }
                disabled={!editing}
              />
            </div>
            <div>
              <Label>Data do Casamento</Label>
              <Input
                type="date"
                value={form.wedding_date}
                onChange={(e) =>
                  setForm((p) => ({ ...p, wedding_date: e.target.value }))
                }
                disabled={!editing}
              />
            </div>
            <div>
              <Label>URL da Foto</Label>
              <Input
                type="url"
                value={form.couple_photo_url}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    couple_photo_url: e.target.value,
                  }))
                }
                disabled={!editing}
              />
            </div>
            <div>
              <Label>Slug</Label>
              <Input
                value={form.slug}
                onChange={(e) =>
                  setForm((p) => ({ ...p, slug: e.target.value }))
                }
                disabled={!editing}
              />
              <Text size="xsmall" className="text-ui-fg-muted mt-1">
                {form.slug}.lysatelier.com.br
              </Text>
            </div>
            <div>
              <Label>Mensagem</Label>
              <Textarea
                value={form.custom_message}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    custom_message: e.target.value,
                  }))
                }
                disabled={!editing}
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cor Primaria</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={form.primary_color} disabled={!editing}
                    onChange={(e) => setForm((p) => ({ ...p, primary_color: e.target.value }))}
                    className="h-10 w-10 cursor-pointer rounded border border-ui-border-base" />
                  <Input value={form.primary_color} disabled={!editing} size="small"
                    onChange={(e) => setForm((p) => ({ ...p, primary_color: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>Cor Secundaria</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={form.secondary_color} disabled={!editing}
                    onChange={(e) => setForm((p) => ({ ...p, secondary_color: e.target.value }))}
                    className="h-10 w-10 cursor-pointer rounded border border-ui-border-base" />
                  <Input value={form.secondary_color} disabled={!editing} size="small"
                    onChange={(e) => setForm((p) => ({ ...p, secondary_color: e.target.value }))} />
                </div>
              </div>
            </div>
            <div>
              <Label>Fonte</Label>
              <select
                value={form.font_family}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    font_family: e.target.value,
                  }))
                }
                disabled={!editing}
                className="w-full rounded-lg border border-ui-border-base bg-ui-bg-field px-3 py-2 text-sm text-ui-fg-base disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ui-fg-interactive"
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between">
              <Text size="small" weight="plus">
                Lista Ativa
              </Text>
              <Switch
                checked={form.is_active}
                onCheckedChange={(checked) =>
                  setForm((p) => ({ ...p, is_active: checked }))
                }
                disabled={!editing}
              />
            </div>
          </div>
        </Container>

        {/* Products */}
        <Container>
          <Heading level="h2" className="mb-4">
            Produtos ({list.products?.length || 0})
          </Heading>
          <div className="flex items-center gap-2 mb-4">
            <Input
              placeholder="ID do produto (prod_...)"
              value={newProductId}
              onChange={(e) => setNewProductId(e.target.value)}
              size="small"
              className="flex-1"
            />
            <Button
              variant="secondary"
              size="small"
              onClick={handleAddProduct}
              disabled={!newProductId.trim()}
            >
              Adicionar
            </Button>
          </div>
          {(list.products || []).length === 0 ? (
            <Text className="text-ui-fg-muted" size="small">
              Nenhum produto vinculado.
            </Text>
          ) : (
            <div className="flex flex-col gap-2">
              {(list.products || []).map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between rounded-lg border border-ui-border-base p-3"
                >
                  <div className="flex items-center gap-3">
                    {product.thumbnail && (
                      <img
                        src={product.thumbnail}
                        alt={product.title}
                        className="h-10 w-10 rounded object-cover"
                      />
                    )}
                    <div>
                      <Text size="small" weight="plus">
                        {product.title}
                      </Text>
                      <Text
                        size="xsmall"
                        className="text-ui-fg-muted font-mono"
                      >
                        {product.id}
                      </Text>
                    </div>
                  </div>
                  <Button
                    variant="danger"
                    size="small"
                    onClick={() => handleRemoveProduct(product.id)}
                  >
                    Remover
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Container>

        {/* Orders Report */}
        {id && <OrdersReport listId={id} />}
      </div>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Detalhes da Lista",
})

export default WeddingListDetailPage
