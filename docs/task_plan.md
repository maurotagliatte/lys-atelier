# Task Plan: E-Commerce Lys Atelier - Listas de Casamento

## Goal
Construir um e-commerce multi-tenant com Medusa.js v2 (backend) + Next.js (frontend) que permite criar listas de casamento com subdomínios automáticos (ex: joao-maria.lysatelier.com.br), integração de pagamento Asaas, e painel admin completo.

## Current Phase
PHASES 0-7 COMPLETE | Pending: Phase 2 (DNS) + Phase 8 (Deploy)

## Phases

### Phase 0: Setup do Ambiente
- [x] Pesquisar documentação atualizada Medusa.js v2
- [x] Inicializar projeto Medusa backend (create-medusa-app)
- [x] Inicializar projeto Next.js frontend
- [x] Configurar PostgreSQL e variáveis de ambiente
- [x] Criar estrutura de diretórios do ecossistema
- **Status:** COMPLETE

### Phase 1: Backend - Estrutura Base e Multi-Tenant (Dias 2-6)
- [x] Criar módulo WeddingList com Entity, Repository, Service
- [x] Campos: couple_names, wedding_date, couple_photo_url, primary_color, secondary_color, font_family, custom_message, slug, is_active
- [x] Criar API Routes (admin + store) para wedding-lists
- [x] Criar WeddingListService com métodos: createWeddingList, generateSlug, validateSubdomainAvailability, getListBySubdomain
- [x] Criar Workflow: create-wedding-list-with-subdomain (+ update, delete, configure-products)
- [x] Criar Links: Product <-> WeddingList + WeddingList <-> SalesChannel
- [x] FIX: Corrigir 5 issues criticos do backend (+ 5 adicionais encontrados)
- [x] FIX: Fazer backend compilar (ts-node + ConfigManager + module name + types)
- [ ] Testes unitarios e de integracao
- **Status:** COMPLETE (BUILD OK)

### Phase 2: Configuração DNS e Infraestrutura (Dia 7)
- [ ] Configurar wildcard DNS (*.lysatelier.com.br)
- [ ] Configurar Vercel para aceitar wildcards
- [ ] Configurar SSL automático
- **Status:** pending

### Phase 3: Frontend - Sistema de Subdomínios (Dias 8-12)
- [x] Criar middleware.ts para detecção de subdomínio
- [x] Criar rotas dinâmicas: /lista/[slug]/*
- [x] Criar WeddingThemeProvider com CSS variables dinâmicas
- [x] Componentes: SubdomainVerifier, WeddingHeader, BackToWeddingButton + ProductCard, WeddingNav, AddToCartButton
- [x] Páginas: produtos, produto/[handle], carrinho, checkout
- [x] FIX: Corrigir 3 issues criticos do frontend (XSS, wildcard images, checkout payment)
- [x] FIX: Variant selector funcional em produto/[handle] (Client Component)
- [ ] Testes E2E
- **Status:** COMPLETE (BUILD OK)

### Phase 4: Integração Asaas (Dias 13-18)
- [x] Criar Payment Provider Asaas (initiatePayment, authorizePayment, capturePayment)
- [x] Criar webhook handler POST /hooks/asaas
- [x] FIX: Corrigir module registration e option naming mismatch
- [x] Integrar checkout frontend com Asaas (PIX QR, boleto, cartao)
- [ ] Integrar com Notification Module para emails
- [ ] Testes de pagamento
- **Status:** BACKEND + FRONTEND COMPLETE

### Phase 5: Admin - Gestao de Listas (Dias 19-25)
- [x] Widget no dashboard: Listas Ativas
- [x] Formulario de criacao com color picker, font select, upload foto
- [x] Preview ao vivo da URL do subdominio
- [x] Tabela de listas com acoes (ver loja, relatorio)
- [x] Relatorio de presentes com summary cards e top products
- **Status:** COMPLETE (BUILD OK)

### Phase 6: Emails e Notificações (Dias 26-28)
- [x] Subscriber skeletons criados (order-placed, wedding-list-created)
- [x] Integrar Resend para envio de emails transacionais
- [x] Template: "Novo Presente Recebido" (para casal) - pronto, aguarda couple_email
- [x] Template: "Confirmação de Compra" (para convidado) - ATIVO
- [x] Template: "Boas-vindas" (para casal) - pronto, aguarda couple_email
- [x] Trigger: evento order.placed envia email ao guest
- **Status:** COMPLETE (BUILD OK)

### Phase 7: Testes e Refinamento (Dias 29-35)
- [x] Configurar vitest para backend e frontend
- [x] Unit tests backend: slug, validators, parseOrderParam, email templates, email service (88 tests)
- [x] Unit tests frontend: formatPrice, formatDate, VariantSelector, medusaFetch (21 tests)
- [x] Total: 109 testes passando, 0 falhas
- **Status:** COMPLETE

### Phase 8: Deploy e Produção (Dias 36-40)
- [ ] Deploy backend para Medusa Cloud
- [ ] Deploy frontend para Vercel
- [ ] Configurar domínio e wildcard em produção
- [ ] Validação final
- **Status:** NOT STARTED

## Key Questions (Respondidas)
1. Medusa v2 estável - usando v2.13.1 com MikroORM DML
2. @medusajs/claude-plugin NÃO EXISTE - usar docs diretamente
3. Next.js 15.x com App Router (15.5.12 instalado)
4. Asaas sem SDK - wrapper REST API tipado
5. Vercel wildcard disponível em todos os planos (precisa Vercel Nameservers)

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| Medusa.js v2 para backend | Headless commerce com extensibilidade via módulos, workflows e links |
| Next.js App Router para frontend | SSR, subdomínio via middleware, React Server Components |
| Multi-tenant via Sales Channel | Padrão nativo do Medusa para isolamento de dados |
| Subdomínio automático via slug | UX superior para casais compartilharem a lista |
| Asaas para pagamentos | Requisito do cliente, gateway brasileiro |
| PostgreSQL | Requerido pelo Medusa v2 |
| Zod de @medusajs/framework/zod | Obrigatório a partir de v2.13.0 |
| MikroORM DML (model.define) | Padrão obrigatório do Medusa v2 |
| CSS Variables para temas | Performance, sem re-render, compatível com SSR |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| Backend build: ts-node missing | 1 | Instalar ts-node como devDep |
| Backend build: ConfigManager null admin | 1 | Verificar medusa-config.ts format |
| Payment provider: option naming mismatch | 0 | Corrigir camelCase -> snake_case |
| Admin route: workflow invocation incorreta | 0 | Importar workflow diretamente |

## Notes
- CLAUDE.md define regras comportamentais inegociáveis
- Usar Claude Flow MCP para coordenação de agentes
- Checkpoint salvo em claude-flow memory (project-state-checkpoint-1)
- Agente anterior crashou por context overflow - manter checkpoints frequentes
