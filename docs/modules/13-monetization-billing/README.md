# Modulo 13 - Monetization Billing

## Status: CONCLUIDA

## Objetivo

Cobrar assinatura, taxa de verificacao e boosts, sem intermediar servico do cliente final.

## Escopo

### Incluido
- catalogo de planos publico
- assinatura pro para negocio com mensal e anual
- historico de invoices e payments do negocio
- boost pago com ativacao por webhook
- webhook HMAC do provedor de billing como fonte de verdade

### Fora de escopo
- conciliacao financeira e relatorios gerenciais
- portal externo real de billing provider
- refund automatico e chargeback

## Dependencias
- Modulo 03 - Search Discovery
- Modulo 09 - Provider Dashboard
- Modulo 12 - Notifications Engagement

## Front

- pagina de planos
- checkout da assinatura
- historico de cobrancas
- pagina de upgrade e boost

## Back

- billing de assinatura
- cobranca de verificacao
- controle de inadimplencia
- boosts e beneficios comerciais

## App

- consulta de plano
- upgrade e renovacao futura

## App (status)

- consulta de plano: adiado para fase mobile
- upgrade e renovacao futura: adiado para fase mobile

## Banco

- subscriptions
- invoices
- payments
- boosts
- billing_events

## Endpoints

- GET /api/v1/plans
- POST /api/v1/subscriptions
- GET /api/v1/subscriptions/current
- PATCH /api/v1/subscriptions/current
- POST /api/v1/subscriptions/current/cancel
- GET /api/v1/billing/invoices
- POST /api/v1/boosts
- GET /api/v1/boosts/current
- POST /api/v1/webhooks/billing-provider

## Regras de negocio

- somente usuario `business` autenticado pode contratar assinatura, ver invoices e contratar boosts
- webhook do billing provider e a fonte de verdade para ativar assinatura, marcar invoice paga e ativar boost
- assinatura nova nasce `incomplete` ate confirmacao do webhook
- cancelamento marca fim de ciclo e nao remove historico financeiro
- boost ativo aumenta exposicao do negocio no discovery
- subscription ativa substitui o status `not_enabled` do provider dashboard

## Entregue nesta fase

- package `@platform/billing` com regras de planos, assinatura, invoices, payments, boosts e webhook HMAC
- dashboard web em `/dashboard/billing` com planos, historico financeiro, boosts e simulacao local de pagamento
- acoes web autenticadas para contratar assinatura, trocar plano, cancelar assinatura, criar boost e confirmar pagamento local
- discovery passou a considerar bonus dinamico de boost ativo
- provider dashboard passou a refletir status real da assinatura

## Migration aplicada

- `20260417200443_add_monetization_billing`

## Testes

- unitario de regras de elegibilidade por plano
- integracao de assinatura e webhook
- componente de selecao de plano
- E2E de assinatura ativa liberando beneficio

## Validacao executada

- npm run test:api
- npm run build:api
- npm run build:web
- npx tsx --test apps/web/src/app/dashboard/billing/billing-plan-selector.test.tsx