# Handoff - Modulo 12 - Notifications Engagement

## Modulo

- nome: 12-notifications-engagement
- status: concluido
- data: 2026-04-17

## Entregas realizadas

- front: central de notificacoes em /dashboard/notifications com inbox e preferencias
- back: package @platform/notifications com orquestracao de notificacoes, preferencias e campanhas
- app: adiado, sem push provider e sem inbox mobile nesta fase
- banco: tabelas notifications, notification_preferences, notification_deliveries e campaign_runs
- testes: unitario de preferencia e integracao completa de notificacoes, leitura, preferencias e campanha

## Revisao final de completude

- UI web completa: sim, com estados de sucesso/erro e fluxo de leitura
- API completa: sim, com 5 endpoints do modulo e autorizacao por papel
- banco completo: sim, com migration aplicada e reset de testes atualizado
- app completo ou adiado com justificativa: adiado para fase mobile
- testes minimos completos: sim
- documentacao completa: sim

## Endpoints entregues

- GET /api/v1/notifications
- PATCH /api/v1/notifications/:id/read
- GET /api/v1/notification-preferences
- PATCH /api/v1/notification-preferences
- POST /api/v1/admin/campaigns/trigger

## Entidades e tabelas

- notifications: inbox de notificacoes por usuario
- notification_preferences: preferencias de canal e categoria por usuario
- notification_deliveries: trilha de entrega por canal e status
- campaign_runs: execucao de campanhas administrativas de reengajamento

## Componentes reutilizaveis criados

- package @platform/notifications
- servicos reutilizaveis: listNotifications, markNotificationRead, getNotificationPreferences, updateNotificationPreferences, createInAppNotification, notifyBusinessNewLead, triggerCampaign
- rotas web de apoio: /auth/notifications/[id]/read, /auth/notification-preferences, /auth/admin/campaigns/trigger

## Regras de negocio ativas

- notificacao in-app respeita preferencias por categoria
- marcar notificacao como lida e idempotente
- preferencia e criada automaticamente no primeiro acesso
- campanha de reengajamento so pode ser disparada por admin
- criacao de lead dispara notificacao automatica para negocio quando leadAlertsEnabled esta ativo
- cada notificacao entregue cria registro em notification_deliveries

## Dependencias resolvidas

- leads-contact-requests: notificacao automatica em novo lead
- core auth/session: contexto do usuario para inbox e preferencias
- admin settings: disparo manual de campanhas integrado via formulario

## Pendencias aceitas

- sem envio externo real de email e push
- sem worker assíncrono para retries de falha de entrega
- sem central de notificacoes no app mobile

## Riscos remanescentes

- risco: entregas ainda sao sincronas e in-app only
- mitigacao: modulo 13/14 pode introduzir fila, worker e provedores externos

## O que o proximo modulo pode assumir como pronto

- inbox de notificacoes funcional para todos os papeis
- preferencias por usuario persistidas e aplicadas
- trigger de campanha administrativa operacional
- alerta automatico de novo lead para negocio em producao local

## Validacao executada

- npm run test:api
- npm run build:api
- npm run build:web

## Leitura obrigatoria para o proximo modulo

- docs/01-foundation/construction-method.md
- docs/modules/13-monetization-billing/README.md
- docs/handoffs/12-notifications-engagement-2026-04-17.md
