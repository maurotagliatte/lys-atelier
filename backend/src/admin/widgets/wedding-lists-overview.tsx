import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Badge, Text } from "@medusajs/ui"
import { Gift } from "@medusajs/icons"
import { useEffect, useState } from "react"

type WeddingListSummary = {
  id: string
  couple_names: string
  slug: string
  wedding_date: string
  is_active: boolean
  created_at: string
}

type ListResponse = {
  wedding_lists: WeddingListSummary[]
  count: number
}

const WeddingListsOverviewWidget = () => {
  const [lists, setLists] = useState<WeddingListSummary[]>([])
  const [totalActive, setTotalActive] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLists = async () => {
      try {
        const res = await fetch(
          "/admin/wedding-lists?is_active=true&limit=5&order=-created_at",
          { credentials: "include" }
        )
        if (!res.ok) {
          throw new Error(`Failed to fetch: ${res.status}`)
        }
        const data: ListResponse = await res.json()
        setLists(data.wedding_lists)
        setTotalActive(data.count)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load")
      } finally {
        setLoading(false)
      }
    }

    fetchLists()
  }, [])

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    } catch {
      return dateStr
    }
  }

  if (loading) {
    return (
      <Container className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Gift />
          <Heading level="h2">Listas de Casamento</Heading>
        </div>
        <Text className="text-ui-fg-muted">Carregando...</Text>
      </Container>
    )
  }

  if (error) {
    return (
      <Container className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Gift />
          <Heading level="h2">Listas de Casamento</Heading>
        </div>
        <Text className="text-ui-fg-error">{error}</Text>
      </Container>
    )
  }

  return (
    <Container className="mb-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Gift />
          <Heading level="h2">Listas de Casamento</Heading>
        </div>
        <Badge color="green" size="small">
          {totalActive} ativa{totalActive !== 1 ? "s" : ""}
        </Badge>
      </div>

      {lists.length === 0 ? (
        <Text className="text-ui-fg-muted">
          Nenhuma lista ativa encontrada.
        </Text>
      ) : (
        <div className="flex flex-col gap-2">
          {lists.map((list) => (
            <a
              key={list.id}
              href={`/app/wedding-lists/${list.id}`}
              className="flex items-center justify-between rounded-lg border border-ui-border-base p-3 hover:bg-ui-bg-base-hover transition-colors no-underline"
            >
              <div className="flex flex-col gap-0.5">
                <Text size="small" weight="plus">
                  {list.couple_names}
                </Text>
                <Text size="xsmall" className="text-ui-fg-muted">
                  {list.slug}.lysatelier.com.br
                </Text>
              </div>
              <Text size="xsmall" className="text-ui-fg-subtle">
                {formatDate(list.wedding_date)}
              </Text>
            </a>
          ))}
        </div>
      )}

      {totalActive > 5 && (
        <div className="mt-3 text-center">
          <a
            href="/app/wedding-lists"
            className="text-ui-fg-interactive text-sm hover:underline no-underline"
          >
            Ver todas as listas ({totalActive})
          </a>
        </div>
      )}
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.list.before",
})

export default WeddingListsOverviewWidget
