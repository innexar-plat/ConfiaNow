# Handoff - Modulo 10 - Client Dashboard

## Modulo

- nome: 10-client-dashboard
- status: concluido
- data: 2026-04-17

## Entregas realizadas

- front: dashboard real para papel `client` em `/dashboard` com overview, favoritos, reviews pendentes, historico recente e central simples de denuncias
- back: package `@platform/client-dashboard` com agregacao de overview, historico, favoritos, reviews pendentes e timeline de denuncias
- app: adiado, dependente de fase mobile
- banco: tabelas `client_favorites` e `client_dashboard_views`
- testes: unitario de elegibilidade de review pendente e integracao dos endpoints do client dashboard

## Revisao final de completude

- UI web completa: sim, para fluxo base do cliente autenticado
- API completa: sim, com 6 endpoints dedicados e autorizacao por papel `client`
- banco completo: sim, com migration aplicada e reset de testes atualizado
- app completo ou adiado com justificativa: adiado para fase mobile
- testes minimos completos: sim
- documentacao completa: sim

## Endpoints entregues

- GET /api/v1/client-dashboard/overview
- GET /api/v1/client-dashboard/favorites
- POST /api/v1/client-dashboard/favorites/:businessId
- DELETE /api/v1/client-dashboard/favorites/:businessId
- GET /api/v1/client-dashboard/history
- GET /api/v1/client-dashboard/pending-reviews

## Entidades e tabelas

- client_favorites: favoritos persistidos por cliente e negocio
- client_dashboard_views: snapshot diario consolidado do painel do cliente

## Componentes reutilizaveis criados

- package `@platform/client-dashboard`
- agregadores reutilizaveis: `getClientDashboardOverview`, `listClientDashboardFavorites`, `listClientDashboardHistory`, `listClientPendingReviews`, `listClientReportTimeline`
- rotas web de apoio: `/auth/client-dashboard/favorites/[businessId]` e `/auth/client-dashboard/reports`

## Regras de negocio ativas

- somente usuario `client` autenticado acessa client dashboard e endpoints dedicados
- favoritos sao idempotentes e unicos por cliente + business
- leitura do overview sincroniza snapshot diario em `client_dashboard_views`
- review pendente depende de lead com contato liberado e sem review finalizada
- denuncias do cliente reutilizam `moderation_cases` do modulo 11 sem criar sistema paralelo de suporte

## Dependencias resolvidas

- leads-contact-requests: usado como base do historico e recontato
- reviews-reputation: usado para elegibilidade de reviews pendentes
- admin-moderation: usado para timeline e criacao de denuncias
- provider-dashboard: mantido isolado por papel sem misturar agregacoes de negocio e cliente

## Pendencias aceitas

- app mobile do client dashboard ainda nao existe
- nao ha suite E2E no repo para cobrir favoritos e denuncias ponta a ponta
- pagina publica de negocio ainda nao ganhou CTA dedicada de favoritar fora do dashboard

## Riscos remanescentes

- risco: snapshot do cliente depende de leitura do dashboard e ainda nao de job periodico
- mitigacao: modulo 14 pode consolidar coleta historica e analytics de uso do cliente

## O que o proximo modulo pode assumir como pronto

- cliente autenticado possui dashboard operacional no web
- favoritos persistidos e acessiveis por API e web
- historico consolidado e reviews pendentes disponiveis num unico painel
- denuncias do cliente entram na fila administrativa ja existente

## Validacao executada

- `npm run test:api`
- `npm run build:api`
- `npm run build:web`

## Leitura obrigatoria para o proximo modulo

- docs/01-foundation/construction-method.md
- docs/modules/07-in-app-communication/README.md
- docs/handoffs/10-client-dashboard-2026-04-17.md
