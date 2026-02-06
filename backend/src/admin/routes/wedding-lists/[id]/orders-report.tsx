import { Container, Heading, Text, Table } from "@medusajs/ui"
import { useEffect, useState, useCallback } from "react"

type OrderItem = {
  title?: string
  quantity: number
  total: number
  variant?: { product?: { title?: string } }
}

type Order = {
  id: string
  display_id: number
  created_at: string
  email?: string
  total: number
  currency_code?: string
  status?: string
  items?: OrderItem[]
}

type OrderSummary = {
  total_revenue: number
  total_orders: number
  total_items: number
  unique_guests: number
  top_products: {
    id: string
    name: string
    quantity: number
    revenue: number
  }[]
}

type OrdersResponse = {
  orders: Order[]
  summary: OrderSummary
  count: number
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

const formatCurrency = (amount: number, currency?: string) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency || "BRL",
  }).format(amount / 100)
}

export const OrdersReport = ({ listId }: { listId: string }) => {
  const [orders, setOrders] = useState<Order[]>([])
  const [summary, setSummary] = useState<OrderSummary | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `/admin/wedding-lists/${listId}/orders?limit=50`,
        { credentials: "include" }
      )
      if (!res.ok) throw new Error("Failed to fetch orders")
      const data: OrdersResponse = await res.json()
      setOrders(data.orders)
      setSummary(data.summary)
    } catch {
      // Orders may not exist yet
    } finally {
      setLoading(false)
    }
  }, [listId])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  return (
    <Container>
      <Heading level="h2" className="mb-4">
        Relatorio de Presentes
      </Heading>

      {loading ? (
        <Text className="text-ui-fg-muted">Carregando pedidos...</Text>
      ) : summary ? (
        <>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-lg border border-ui-border-base p-3 text-center">
              <Text size="xlarge" weight="plus">
                {formatCurrency(summary.total_revenue)}
              </Text>
              <Text size="xsmall" className="text-ui-fg-muted">
                Receita Total
              </Text>
            </div>
            <div className="rounded-lg border border-ui-border-base p-3 text-center">
              <Text size="xlarge" weight="plus">
                {summary.total_orders}
              </Text>
              <Text size="xsmall" className="text-ui-fg-muted">
                Pedidos
              </Text>
            </div>
            <div className="rounded-lg border border-ui-border-base p-3 text-center">
              <Text size="xlarge" weight="plus">
                {summary.unique_guests}
              </Text>
              <Text size="xsmall" className="text-ui-fg-muted">
                Convidados
              </Text>
            </div>
            <div className="rounded-lg border border-ui-border-base p-3 text-center">
              <Text size="xlarge" weight="plus">
                {summary.total_items}
              </Text>
              <Text size="xsmall" className="text-ui-fg-muted">
                Itens
              </Text>
            </div>
          </div>

          {summary.top_products.length > 0 && (
            <div className="mb-4">
              <Text size="small" weight="plus" className="mb-2">
                Top Produtos
              </Text>
              <div className="flex flex-col gap-1">
                {summary.top_products.slice(0, 5).map((tp) => (
                  <div
                    key={tp.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <Text size="xsmall">{tp.name}</Text>
                    <Text size="xsmall" className="text-ui-fg-muted">
                      {tp.quantity}x
                    </Text>
                  </div>
                ))}
              </div>
            </div>
          )}

          {orders.length > 0 && (
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>#</Table.HeaderCell>
                  <Table.HeaderCell>Data</Table.HeaderCell>
                  <Table.HeaderCell>Email</Table.HeaderCell>
                  <Table.HeaderCell>Total</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {orders.slice(0, 10).map((order) => (
                  <Table.Row key={order.id}>
                    <Table.Cell>
                      <Text size="small">#{order.display_id}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="small">
                        {formatDate(order.created_at)}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="small" className="text-ui-fg-muted">
                        {order.email || "-"}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="small">
                        {formatCurrency(order.total, order.currency_code)}
                      </Text>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          )}

          {orders.length === 0 && (
            <Text className="text-ui-fg-muted" size="small">
              Nenhum pedido registrado ainda.
            </Text>
          )}
        </>
      ) : (
        <Text className="text-ui-fg-muted" size="small">
          Nenhum dado de pedidos disponivel.
        </Text>
      )}
    </Container>
  )
}
