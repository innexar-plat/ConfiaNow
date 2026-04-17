# Modulo 09 - Provider Dashboard

## Status: CONCLUIDA

## Objetivo

Dar ao negocio uma visao operacional consolidada de leads, selo/trust, perfil publico, assinatura e desempenho, com recomendacoes acionaveis para evolucao do catalogo.

## Escopo

### Incluido
- dashboard web de negocio em `/dashboard` para papel `business`
- KPIs agregados de leads, reviews, trust e publicacao do perfil
- feed de pendencias operacionais e recomendacoes priorizadas
- status de assinatura em modo readiness para o futuro modulo 13
- endpoints REST dedicados do provider dashboard
- snapshots persistidos do dashboard e recomendacoes persistidas no banco

### Fora de escopo
- cobranca real e gestao de plano pago (fica para modulo 13)
- notificacoes push/mobile reais (fica para modulo 12)
- analytics avancado com series historicas extensas (fica para modulo 14)

## Dependencias
- Modulo 02 - Profiles/Catalog
- Modulo 04 - Leads/Contact Requests
- Modulo 05 - Badge/Trust Scoring
- Modulo 06 - Reviews/Reputation
- Modulo 11 - Admin Moderation

## Front

- dashboard com KPIs principais
- atalhos para perfil, inbox de leads e detalhes do selo
- cards de pendencias e recomendacoes
- status da assinatura como readiness state (`not_enabled` ate modulo 13)

## Back

- agregacao de KPIs do negocio
- feed de pendencias operacionais
- recomendacoes priorizadas para evolucao de categoria/perfil
- snapshots diarios do dashboard para historico curto

## App

- dashboard resumido: adiado
- notificacoes de lead e pendencias: dependencia do modulo 12

## Banco

- provider_dashboard_snapshots
- provider_recommendations

## Migration aplicada

- 20260417184921_add_provider_dashboard

## Endpoints

### GET /api/v1/provider-dashboard/overview
- Auth: business
- Retorna KPIs principais, status do perfil, selo e assinatura

### GET /api/v1/provider-dashboard/recommendations
- Auth: business
- Retorna recomendacoes priorizadas e persistidas

### GET /api/v1/provider-dashboard/performance
- Auth: business
- Retorna performance consolidada e snapshots recentes

### GET /api/v1/provider-dashboard/pending-actions
- Auth: business
- Retorna pendencias operacionais imediatas

## Regras de negocio

- somente usuarios `business` podem acessar o provider dashboard
- cada leitura de overview/performance atualiza snapshot atual do dashboard
- recomendacoes sao regeneradas a partir do estado real do perfil e da operacao
- status de assinatura sera `not_enabled` ate o modulo 13 entregar billing real
- pendencias priorizam resposta a leads abertos, completude do perfil e reputacao inicial

## Testes

- unitario de agregacao dos indicadores e recomendacoes
- integracao de overview, recommendations, performance e pending-actions
- validacao web do dashboard de negocio no build
- E2E minimo: aceito como pendencia por ausencia de suite E2E no repo