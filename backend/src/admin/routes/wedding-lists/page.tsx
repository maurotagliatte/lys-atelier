import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Gift, Plus, Trash, ArrowUpRightOnBox } from "@medusajs/icons"
import {
  Container,
  Heading,
  Table,
  Badge,
  Button,
  Input,
  Text,
  IconButton,
  Toaster,
  toast,
} from "@medusajs/ui"
import { useEffect, useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"

type WeddingList = {
  id: string
  couple_names: string
  slug: string
  wedding_date: string
  is_active: boolean
  created_at: string
}

type ListResponse = {
  wedding_lists: WeddingList[]
  count: number
  offset: number
  limit: number
}

const PAGE_SIZE = 20

const WeddingListsPage = () => {
  const navigate = useNavigate()
  const [lists, setLists] = useState<WeddingList[]>([])
  const [count, setCount] = useState(0)
  const [offset, setOffset] = useState(0)
  const [search, setSearch] = useState("")
  const [filterActive, setFilterActive] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchLists = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        offset: String(offset),
        limit: String(PAGE_SIZE),
        order: "-created_at",
      })
      if (search) {
        params.set("q", search)
      }
      if (filterActive !== "all") {
        params.set("is_active", filterActive)
      }

      const res = await fetch(`/admin/wedding-lists?${params.toString()}`, {
        credentials: "include",
      })
      if (!res.ok) throw new Error("Failed to fetch")
      const data: ListResponse = await res.json()
      setLists(data.wedding_lists)
      setCount(data.count)
    } catch {
      toast.error("Erro", {
        description: "Falha ao carregar listas de casamento.",
      })
    } finally {
      setLoading(false)
    }
  }, [offset, search, filterActive])

  useEffect(() => {
    fetchLists()
  }, [fetchLists])

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Excluir a lista "${name}"? Esta acao nao pode ser desfeita.`)) {
      return
    }
    setDeleting(id)
    try {
      const res = await fetch(`/admin/wedding-lists/${id}`, {
        method: "DELETE",
        credentials: "include",
      })
      if (!res.ok) throw new Error("Failed to delete")
      toast.success("Lista excluida", {
        description: `"${name}" foi removida com sucesso.`,
      })
      fetchLists()
    } catch {
      toast.error("Erro", {
        description: "Falha ao excluir a lista.",
      })
    } finally {
      setDeleting(null)
    }
  }

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

  const totalPages = Math.ceil(count / PAGE_SIZE)
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1

  return (
    <Container className="p-0">
      <Toaster />
      <div className="flex items-center justify-between p-6 pb-4">
        <Heading level="h1">Listas de Casamento</Heading>
        <Button
          variant="primary"
          size="small"
          onClick={() => navigate("/wedding-lists/create")}
        >
          <Plus />
          Criar Lista
        </Button>
      </div>

      <div className="flex items-center gap-3 px-6 pb-4">
        <div className="flex-1">
          <Input
            type="search"
            placeholder="Buscar por nome do casal..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setOffset(0)
            }}
            size="small"
          />
        </div>
        <select
          value={filterActive}
          onChange={(e) => {
            setFilterActive(e.target.value)
            setOffset(0)
          }}
          className="rounded-lg border border-ui-border-base bg-ui-bg-field px-3 py-1.5 text-sm text-ui-fg-base focus:outline-none focus:ring-2 focus:ring-ui-fg-interactive"
        >
          <option value="all">Todas</option>
          <option value="true">Ativas</option>
          <option value="false">Inativas</option>
        </select>
      </div>

      {loading ? (
        <div className="p-6">
          <Text className="text-ui-fg-muted">Carregando...</Text>
        </div>
      ) : lists.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 gap-3">
          <Gift className="text-ui-fg-muted" />
          <Text className="text-ui-fg-muted">
            Nenhuma lista encontrada.
          </Text>
        </div>
      ) : (
        <>
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Casal</Table.HeaderCell>
                <Table.HeaderCell>Slug</Table.HeaderCell>
                <Table.HeaderCell>Data do Casamento</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell>Criada em</Table.HeaderCell>
                <Table.HeaderCell className="text-right">
                  Acoes
                </Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {lists.map((list) => (
                <Table.Row
                  key={list.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/wedding-lists/${list.id}`)}
                >
                  <Table.Cell>
                    <Text size="small" weight="plus">
                      {list.couple_names}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="small" className="text-ui-fg-muted font-mono">
                      {list.slug}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="small">
                      {formatDate(list.wedding_date)}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge
                      color={list.is_active ? "green" : "grey"}
                      size="small"
                    >
                      {list.is_active ? "Ativa" : "Inativa"}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="small" className="text-ui-fg-subtle">
                      {formatDate(list.created_at)}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <div
                      className="flex items-center justify-end gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <IconButton
                        size="small"
                        variant="transparent"
                        onClick={() => {
                          window.open(
                            `https://${list.slug}.lysatelier.com.br`,
                            "_blank"
                          )
                        }}
                      >
                        <ArrowUpRightOnBox />
                      </IconButton>
                      <IconButton
                        size="small"
                        variant="transparent"
                        disabled={deleting === list.id}
                        onClick={() =>
                          handleDelete(list.id, list.couple_names)
                        }
                      >
                        <Trash />
                      </IconButton>
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-ui-border-base">
              <Text size="small" className="text-ui-fg-muted">
                {count} lista{count !== 1 ? "s" : ""} encontrada{count !== 1 ? "s" : ""}
              </Text>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="small"
                  disabled={offset === 0}
                  onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                >
                  Anterior
                </Button>
                <Text size="small" className="text-ui-fg-muted">
                  {currentPage} / {totalPages}
                </Text>
                <Button
                  variant="secondary"
                  size="small"
                  disabled={offset + PAGE_SIZE >= count}
                  onClick={() => setOffset(offset + PAGE_SIZE)}
                >
                  Proximo
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Listas de Casamento",
  icon: Gift,
})

export default WeddingListsPage
