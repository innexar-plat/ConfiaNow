# Handoff - Modulo 09 - Provider Dashboard

## Modulo

- nome: 09-provider-dashboard
- status: concluido
- data: 2026-04-17

## Entregas realizadas

- front: dashboard real para papel `business` em `/dashboard` com KPIs, atalhos, pendencias e recomendacoes
- back: package `@platform/provider-dashboard` com agregacao, snapshots e recomendacoes persistidas
- app: adiado, dependente de notificacoes do modulo 12
- banco: tabelas `provider_dashboard_snapshots` e `provider_recommendations`
- testes: unitario de pendencias e integracao dos 4 endpoints do provider dashboard

## Revisao final de completude

- UI web completa: sim, para fluxo base do negocio
- API completa: sim, com 4 endpoints dedicados e autorizacao por papel `business`
- banco completo: sim, com migration aplicada e reset de testes atualizado
- app completo ou adiado com justificativa: adiado, dependencia do modulo 12 e modulo 13
- testes minimos completos: sim
- documentacao completa: sim

## Endpoints entregues

- GET /api/v1/provider-dashboard/overview
- GET /api/v1/provider-dashboard/recommendations
- GET /api/v1/provider-dashboard/performance
- GET /api/v1/provider-dashboard/pending-actions

## Entidades e tabelas

- provider_dashboard_snapshots: snapshot diario consolidado de operacao do negocio
- provider_recommendations: recomendacoes persistidas e priorizadas por negocio

## Componentes reutilizaveis criados

- package `@platform/provider-dashboard`
- agregadores reutilizaveis: `computeProviderPendingActions`, `computeProviderRecommendations`

## Regras de negocio ativas

- somente usuario `business` autenticado acessa provider dashboard
- cada leitura de overview/performance sincroniza snapshot e recomendacoes do negocio
- assinatura fica em `not_enabled` ate entrega do modulo 13
- pendencias priorizam verificacao, publicacao do perfil, completude de catalogo e resposta a leads

## Dependencias resolvidas

- profiles-catalog: usado como base do perfil publicado e servicos
- leads-contact-requests: usado para KPIs de inbox e SLA
- badge-trust-scoring: usado para selo, trust e pendencias de completude
- reviews-reputation: usado para volume de reviews aprovadas e pendentes

## Pendencias aceitas

- status de assinatura ainda sem cobranca real
- app mobile do provider dashboard adiado
- testes de componente/E2E ainda nao existem no repo

## Riscos remanescentes

- risco: snapshots historicos dependem de leitura do dashboard e ainda nao de job agendado
- mitigacao: modulo 14 pode evoluir isso com coleta periodica e analytics historico

## O que o proximo modulo pode assumir como pronto

- dashboard de negocio operacional no web
- endpoints REST do provider dashboard funcionais
- snapshots e recomendacoes persistidos no banco
- negocio ja consegue enxergar trust, leads e pendencias num unico painel

## Leitura obrigatoria para o proximo modulo

- docs/01-foundation/construction-method.md
- docs/modules/10-client-dashboard/README.md
- docs/handoffs/09-provider-dashboard-2026-04-17.md
