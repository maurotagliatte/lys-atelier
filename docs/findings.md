# Findings & Decisions - Lys Atelier E-Commerce

## Requirements
- E-commerce de listas de casamento multi-tenant
- Backend: Medusa.js v2 com módulos customizados
- Frontend: Next.js com App Router
- Multi-tenant via subdomínios automáticos (*.lysatelier.com.br)
- Cada lista = 1 Sales Channel com metadata customizada
- Pagamento via Asaas (gateway brasileiro)
- Admin panel para gestão de listas
- Emails automáticos: presente recebido + confirmação de compra
- Relatórios com export Excel/PDF

## Research Findings

### Medusa.js v2 (Pesquisa Completa - docs oficiais)
- **@medusajs/claude-plugin NÃO EXISTE** no npm - documentação baixada diretamente de docs.medusajs.com/llms-full.txt (166K linhas)
- **ORM**: MikroORM (NÃO TypeORM) - mudança crítica do v1 para v2
- **Data Models**: Usar `model.define()` com DML (Domain Model Language) - não decorators
- **Services**: Extend `MedusaService({})` factory - gera CRUD automático (createBrands, listBrands, etc.)
- **Module Pattern**: models/ + service.ts + index.ts com `Module()` export
- **API Routes**: File-system based em `src/api/` - admin/ auto-protegido, store/ público
- **Workflows**: `createWorkflow` + `createStep` com `StepResponse` (1o param: dados, 2o param: dados para compensação)
- **Links**: `defineLink()` para conectar módulos - módulos são ISOLADOS
- **Subscribers**: File-based em `src/subscribers/` com `SubscriberConfig`
- **Payment Provider**: Extends `AbstractPaymentProvider` com methods obrigatórios
- **Zod**: OBRIGATÓRIO importar de `@medusajs/framework/zod` (NÃO de `zod` diretamente) a partir v2.13.0
- **Config**: `medusa-config.ts` com `defineConfig()`
- **Migrations**: `npx medusa db:generate <module>` + `npx medusa db:migrate`
- **Links sync**: `npx medusa db:sync-links` (ou db:migrate que faz ambos)
- **Query**: `query.graph()` API para querying linked data
- **Sales Channel multi-tenant**: 1 Sales Channel por lista + 1 Publishable API Key por lista + header `x-publishable-api-key`
- **Scheduled Jobs**: Em `src/jobs/` com config de cron
- **Admin UI**: Built-in em `/app` - customizável via `src/admin/routes/` e `src/admin/widgets/`
- **create-medusa-app**: `npx create-medusa-app@latest lys-atelier-backend` - requer PostgreSQL rodando
- **Node.js**: v20+ LTS only
- **Redis**: Opcional para dev, recomendado para produção (events/cache)
- **Docs completa**: /tmp/medusa-docs-full.txt

### Asaas Payment API
- **Sem SDK oficial no npm** - usar REST API diretamente com wrapper tipado
- **API Base URLs**:
  - Sandbox: `https://sandbox.asaas.com/api/v3`
  - Production: `https://api.asaas.com/v3`
- **Autenticação**: Header `access_token` com API key
- **Payment Methods**: BOLETO, CREDIT_CARD, PIX, UNDEFINED (customer escolhe)
- **Fluxo**: Criar customer → Criar payment → (PIX: buscar QR code) → Webhook confirmation
- **PIX**: 2 chamadas - POST /payments + GET /payments/{id}/pixQrCode
- **Customer**: CPF/CNPJ obrigatório (regulamentação brasileira)
- **Mínimo**: R$5.00 por cobrança
- **Webhook Events Chave**: PAYMENT_CONFIRMED, PAYMENT_RECEIVED
- **Webhook Security**: Header `asaas-access-token` para validação
- **Retry**: Asaas faz retry com backoff exponencial para webhooks que falham
- **externalReference**: Campo para mapear IDs internos → IDs Asaas
- **Env vars necessárias**: ASAAS_API_KEY, ASAAS_BASE_URL, ASAAS_WEBHOOK_TOKEN

### Vercel + Next.js Subdomínios
- **Wildcard disponível em TODOS os planos** (Hobby, Pro, Enterprise)
- **OBRIGATÓRIO usar Vercel Nameservers** - não funciona com CNAME/A para wildcards
- **SSL**: Automático via Let's Encrypt com DNS-01 challenge
- **Next.js mais recente**: 16.1.6 - MAS middleware.ts renomeado para proxy.ts no v16
- **Decisão: Usar Next.js 15.x** para compatibilidade com Medusa starter
- **Subdomain detection**: `request.headers.get('host')` no middleware
- **URL rewriting**: `NextResponse.rewrite(new URL('/lista/${subdomain}', request.url))`
- **Local dev**: `tenant.localhost:3000` funciona nativamente em browsers modernos
- **App Router params**: São Promises no Next.js 15+ (await params)
- **Reference implementation**: github.com/vercel/platforms (Platforms Starter Kit)
- **Route structure**: `app/s/[subdomain]/page.tsx` pattern
- **Matcher**: `/((?!api|_next|[\\w-]+\\.\\w+).*)`

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| Medusa v2 (não v1) | Arquitetura modular, workflows, links nativos |
| Sales Channel = Wedding List | Reusa isolamento nativo do Medusa com Publishable API Keys |
| Slug gerado a partir dos nomes | UX amigável para URLs de subdomínio |
| CSS Variables para temas | Performance, sem re-render, compatível com SSR |
| Next.js 15.x (não 16) | Compatibilidade com Medusa starter, middleware.ts pattern estável |
| Asaas REST API direto (sem SDK) | Sem SDK oficial, wrapper tipado dá mais controle |
| Docker Compose para PostgreSQL + Redis | Ambiente isolado e reproduzível |
| Vercel Nameservers para wildcard | Obrigatório para wildcards, SSL automático |
| MikroORM DML (model.define) | Padrão obrigatório do Medusa v2 |
| Zod de @medusajs/framework/zod | Obrigatório a partir de v2.13.0 |

## Issues Encountered
| Issue | Resolution |
|-------|------------|
| @medusajs/claude-plugin não existe | Usar documentação direta + docs baixada em /tmp |
| PostgreSQL não instalado localmente | Usar Docker Compose |
| Node.js v24 instalado (Medusa requer v20+ LTS) | Verificar compatibilidade - pode precisar nvm |

## Resources
- Medusa v2 Docs (completa): /tmp/medusa-docs-full.txt
- Medusa v2 Docs: https://docs.medusajs.com/
- Medusa LLM Docs: https://docs.medusajs.com/llms-full.txt
- Next.js Middleware: https://nextjs.org/docs/app/building-your-application/routing/middleware
- Asaas API: https://docs.asaas.com/
- Vercel Wildcard Domains: https://vercel.com/docs/projects/domains/wildcard-domains
- Vercel Platforms Starter: https://github.com/vercel/platforms
- Medusa Payment Provider Docs: AbstractPaymentProvider pattern em /tmp/medusa-docs-full.txt

## Visual/Browser Findings
- Vercel Platforms Starter Kit usa Next.js 15.3.6 com middleware.ts pattern
- Middleware extrai subdomain de request.headers.get('host')
- Route pattern: app/s/[subdomain]/page.tsx

---
*Update this file after every 2 view/browser/search operations*
