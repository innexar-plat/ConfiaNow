# Handoff - Modulo 13 - Monetization Billing

## Modulo

- nome: 13-monetization-billing
- status: concluido
- data: 2026-04-17

## Entregas realizadas

- front: area protegida `/dashboard/billing` com planos, status da assinatura, invoices, boosts e simulacao de checkout local
- back: package `@platform/billing` com catalogo de planos, assinatura, invoices, payments, boosts, webhook HMAC e regras de elegibilidade
- app: adiado, sem tela mobile nativa nesta fase
- banco: tabelas `subscriptions`, `invoices`, `payments`, `boosts` e `billing_events`
- testes: unitario de elegibilidade de plano/boost, integracao de assinatura + webhook + boost e teste de componente do seletor de planos

## Revisao final de completude

- UI web completa: sim, com planos, historico, boosts, estados de sucesso/erro e confirmacao local de pagamento
- API completa: sim, com 9 endpoints do modulo e webhook publico assinado
- banco completo: sim, com migration aplicada e reset de testes atualizado
- app completo ou adiado com justificativa: adiado para fase mobile
- testes minimos completos: sim
- documentacao completa: sim

## Endpoints entregues

- GET /api/v1/plans
- POST /api/v1/subscriptions
- GET /api/v1/subscriptions/current
- PATCH /api/v1/subscriptions/current
- POST /api/v1/subscriptions/current/cancel
- GET /api/v1/billing/invoices
- POST /api/v1/boosts
- GET /api/v1/boosts/current
- POST /api/v1/webhooks/billing-provider

## Entidades e tabelas

- subscriptions: assinatura atual do negocio com plano, ciclo, status e cancelamento
- invoices: cobrancas abertas, pagas ou falhadas para assinatura, verificacao e boost
- payments: tentativa de pagamento vinculada a invoice e confirmada por webhook
- boosts: destaque comercial pago para aumentar ranking no discovery
- billing_events: trilha idempotente de eventos de checkout, webhook, pagamento, cancelamento e boost

## Componentes reutilizaveis criados

- package `@platform/billing`
- `BillingPlanSelector` em `apps/web/src/app/dashboard/billing/billing-plan-selector.tsx`
- rotas web de apoio: `/auth/subscriptions`, `/auth/subscriptions/current`, `/auth/subscriptions/current/cancel`, `/auth/boosts`, `/auth/billing/simulate-payment`

## Regras de negocio ativas

- somente negocio autenticado pode contratar plano, ver invoices e comprar boost
- plano novo nasce `incomplete` e so vira `active` por webhook valido
- webhook HMAC usa timestamp com tolerancia e comparacao segura de assinatura
- boost so pode ser comprado por negocio com assinatura ativa e plano pago
- boost ativo aumenta a exposicao no discovery com bonus dinamico de ranking
- provider dashboard agora reflete status real de assinatura em vez de `not_enabled` fixo
- verificacao pode gerar invoice adicional de taxa quando o negocio ainda nao esta aprovado
- cancelamento preserva historico e encerra no fim do ciclo quando a assinatura esta ativa

## Dependencias resolvidas

- search-discovery: passou a considerar boost ativo no ranking retornado
- provider-dashboard: passou a usar subscription real para overview e pending actions
- notifications-engagement: pagamentos e cancelamentos relevantes geram notificacao in-app

## Pendencias aceitas

- sem integracao com gateway externo real como Stripe/Asaas nesta fase
- sem refund automatico, dispute ou chargeback
- sem portal self-service externo do provedor de billing

## Riscos remanescentes

- risco: checkout local simulado nao cobre particularidades de gateway externo real
- mitigacao: modulo 16 pode plugar adaptador externo mantendo o webhook interno como contrato
- risco: expiracao de boost depende de leitura operacional para reclassificar ranking dinamico
- mitigacao: ranking ja filtra boost vencido; modulo 14/16 pode mover expiracao para job agendado

## O que o proximo modulo pode assumir como pronto

- plano pro mensal e anual contrataveis em banco real
- invoices e payments persistidos e consultaveis por negocio
- boosts pagos ativam exposicao adicional no discovery
- webhook assinado e idempotente operacional para billing local
- dashboard do negocio ja mostra estado comercial da assinatura

## Validacao executada

- npm install
- npm run test:api
- npm run build:api
- npm run build:web
- npx tsx --test apps/web/src/app/dashboard/billing/billing-plan-selector.test.tsx

## Leitura obrigatoria para o proximo modulo

- docs/01-foundation/construction-method.md
- docs/modules/14-analytics-reporting/README.md
- docs/handoffs/13-monetization-billing-2026-04-17.md
