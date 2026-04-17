# Modulo 14 - Analytics Reporting

## Status: CONCLUIDA

## Objetivo

Medir aquisicao, conversao, selo, reputacao e retorno para operacao e negocios.

## Escopo

### Incluido
- dashboard administrativo com visao consolidada de cadastros, funil, trust, moderacao e monetizacao
- relatorio do negocio com leads por periodo, reputacao, trust e comparativo com media da plataforma
- exportacao de relatorio do negocio em CSV serializado pela API
- eventos analiticos internos para `profile_view`, `contact_click`, `lead_created`, `review_submitted` e marcos de billing
- snapshots diarios e relatorios persistidos em banco real

### Fora de escopo
- integracao externa com Google Analytics 4, Mixpanel, Amplitude, Metabase ou Redash
- atribuicao de campanha, UTM e pixels de marketing
- NPS pos-servico com coleta dedicada

## Dependencias
- Modulo 03 - Search Discovery
- Modulo 05 - Badge Trust Scoring
- Modulo 06 - Reviews Reputation
- Modulo 09 - Provider Dashboard
- Modulo 10 - Client Dashboard
- Modulo 11 - Admin Moderation
- Modulo 13 - Monetization Billing

## Front

- dashboards administrativos
- relatorios do negocio
- graficos de leads, resposta e score

## Back

- agregacao de metricas
- snapshots periodicos
- exportacao de relatorios

## App

- resumo de metricas do negocio

## App (status)

- resumo de metricas do negocio: adiado para fase mobile

## Banco

- analytics_events
- daily_metrics
- business_reports

## Endpoints

- GET /api/v1/analytics/admin/overview
- GET /api/v1/analytics/admin/funnels
- GET /api/v1/analytics/business/overview
- GET /api/v1/analytics/business/leads
- GET /api/v1/analytics/business/reputation
- GET /api/v1/analytics/business/export

## Regras de negocio

- somente `admin` autenticado acessa visoes administrativas de analytics
- somente `business` autenticado acessa relatorios operacionais do proprio negocio
- eventos de analytics internos nao dependem de provedor externo para persistencia
- snapshots diarios podem ser sincronizados sob demanda na leitura do endpoint nesta fase
- exportacao do negocio respeita ownership do perfil e nao expoe dados de terceiros
- funnel desta fase usa `profile_view`, `contact_click` e `lead_created` como etapas observaveis internas

## Entrega realizada nesta fase

- package `@platform/analytics` com agregacao, snapshots, exportacao e tracking interno
- dashboard web do negocio em `/dashboard/analytics` com conversao, leads, reputacao e exportacao CSV
- dashboard administrativo em `/admin/analytics` com overview, funnel e demanda por regiao
- instrumentacao do perfil publico, clique em contato, criacao de lead, envio de review e ativacao comercial
- rotas web de apoio em `/track/contact` e `/auth/analytics/export`

## Testes

- unitario de agregacao de metricas
- integracao de relatorios e filtros por periodo
- componente de dashboard e graficos
- E2E de negocio consultando relatorio mensal

## Migration aplicada

- `20260417203110_add_analytics_reporting`

## Validacao executada

- npm install
- npm run test:api
- npm run build:api
- npm run build:web
- npx tsx --test apps/web/src/components/analytics/metrics-bar-chart.test.tsx