# Handoff - Modulo 14 - Analytics Reporting

## Modulo

- nome: 14-analytics-reporting
- status: concluido
- data: 2026-04-17

## Entregas realizadas

- front: dashboards dedicados em `/dashboard/analytics` e `/admin/analytics`, com graficos simples, funil e comparativos operacionais
- back: package `@platform/analytics` com tracking interno, agregacao diaria, relatorio consolidado do negocio e exportacao CSV
- app: adiado, sem tela mobile nativa nesta fase
- banco: tabelas `analytics_events`, `daily_metrics` e `business_reports`
- testes: integracao de endpoints admin/business, teste de componente do grafico e validacao completa de build

## Revisao final de completude

- UI web completa: sim, com dashboard business, dashboard admin, estados vazios e exportacao
- API completa: sim, com 6 endpoints do modulo e exportacao CSV autenticada
- banco completo: sim, com migration aplicada e reset de testes atualizado
- app completo ou adiado com justificativa: adiado para fase mobile
- testes minimos completos: sim
- documentacao completa: sim

## Endpoints entregues

- GET /api/v1/analytics/admin/overview
- GET /api/v1/analytics/admin/funnels
- GET /api/v1/analytics/business/overview
- GET /api/v1/analytics/business/leads
- GET /api/v1/analytics/business/reputation
- GET /api/v1/analytics/business/export

## Entidades e tabelas

- analytics_events: trilha de eventos internos para `profile_view`, `contact_click`, `lead_created`, `review_submitted`, `subscription_activated` e `boost_activated`
- daily_metrics: snapshots diarios agregados por plataforma e por negocio com chave de escopo persistida
- business_reports: consolidado por periodo para relatorio operacional do negocio e exportacao

## Componentes reutilizaveis criados

- package `@platform/analytics`
- `MetricsBarChart` em `apps/web/src/components/analytics/metrics-bar-chart.tsx`
- rotas web de apoio: `/track/contact` e `/auth/analytics/export`

## Regras de negocio ativas

- somente `admin` autenticado acessa analytics administrativos
- somente `business` autenticado acessa relatorios e export do proprio negocio
- os snapshots diarios sao sincronizados sob demanda no acesso aos endpoints nesta fase
- o funil observado nesta fase usa `profile_view`, `contact_click` e `lead_created` como etapas internas confiaveis
- a exportacao do negocio respeita ownership e retorna CSV sem dados de terceiros
- cliques de e-mail e telefone do perfil publico passam por tracking server-side antes do redirect
- criacao de lead, envio de review e ativacao comercial alimentam analytics em tempo real no dominio

## Dependencias resolvidas

- search-discovery: snapshots de busca agora alimentam demanda por regiao no admin analytics
- provider-dashboard: snapshots existentes de provider ajudam a compor serie de trust score no negocio
- client-dashboard e leads: historico operacional segue como fonte para conversao e resposta
- monetization-billing: ativacao de assinatura e boost passa a registrar eventos de analytics

## Pendencias aceitas

- sem integracao externa com GA4, Mixpanel, Amplitude, Metabase ou Redash nesta fase
- sem job agendado dedicado para materializacao offline das metricas
- sem NPS pos-servico com coleta especifica
- sem E2E browser dedicado; a cobertura ficou em integracao de API + build web + teste de componente

## Riscos remanescentes

- risco: sincronizacao sob demanda pode gerar custo de leitura maior em periodos longos
- mitigacao: modulo 16 pode mover consolidacao para job recorrente e cache de relatorios
- risco: historico de trust depende de snapshots existentes ou fallback para score atual
- mitigacao: a partir deste modulo os acessos passam a persistir serie diaria e estabilizam historico futuro

## O que o proximo modulo pode assumir como pronto

- existe tracking interno persistido para perfil publico, contato, lead, review e billing
- existe dashboard administrativo com volume, funnel e demanda agregada por regiao
- existe dashboard do negocio com leads, trust, reputacao e exportacao CSV
- existe materializacao em `daily_metrics` e `business_reports` pronta para growth e atribuicao futura
- modulo 15 pode plugar aquisicao, UTM e ads internos sobre eventos e relatorios ja existentes

## Validacao executada

- npm install
- npx prisma migrate dev --schema packages/database/prisma/schema.prisma --name add_analytics_reporting
- npm run test:api
- npm run build:api
- npm run build:web
- npx tsx --test apps/web/src/components/analytics/metrics-bar-chart.test.tsx

## Leitura obrigatoria para o proximo modulo

- docs/01-foundation/construction-method.md
- docs/modules/15-growth-cms/README.md
- docs/handoffs/14-analytics-reporting-2026-04-17.md
