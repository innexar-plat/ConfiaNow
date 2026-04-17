# Modulo 12 - Notifications Engagement

## Status: CONCLUIDA

## Objetivo

Notificar eventos criticos e automatizar reengajamento de cliente e negocio.

## Escopo

### Incluido
- inbox in-app para cliente, negocio e admin
- preferencias por usuario para canais e categorias principais
- entrega rastreada por canal (in-app/email/push)
- disparo automatico de alerta de novo lead para negocio
- disparo manual de campanha por admin

### Fora de escopo
- provedor externo real de email/push
- segmentacao avancada com filtros comportamentais
- automacao de jornada multi-etapa

## Dependencias
- Modulo 00 - Core Platform
- Modulo 04 - Leads/Contact Requests
- Modulo 11 - Admin Moderation

## Front

- central de notificacoes
- preferencias de notificacao

## Back

- orquestracao de eventos de notificacao
- templates transacionais
- reengajamento por gatilho

## App

- push notifications
- inbox nativa

## App (status)

- push notifications: adiado ate integracao com provider externo
- inbox nativa: adiado para fase mobile

## Banco

- notifications
- notification_preferences
- notification_deliveries
- campaign_runs
- migration aplicada: `20260417192828_add_notifications_engagement`

## Endpoints

- GET /api/v1/notifications
- PATCH /api/v1/notifications/:id/read
- GET /api/v1/notification-preferences
- PATCH /api/v1/notification-preferences
- POST /api/v1/admin/campaigns/trigger

## Regras de negocio

- usuario autenticado acessa apenas suas notificacoes e preferencias
- marcar notificacao como lida e idempotente
- preferencia e criada automaticamente no primeiro acesso
- campanha manual exige papel `admin`
- notificacao de novo lead respeita preferencia de categoria `leadAlertsEnabled`
- todas as entregas criadas devem gerar trilha em `notification_deliveries`

## Testes

- unitario de regras de disparo e preferencia
- integracao de envio e leitura
- componente de central de notificacoes
- E2E de alerta de novo lead

## Validacao planejada

- npm run test:api
- npm run build:api
- npm run build:web

## Validacao executada

- npm run test:api
- npm run build:api
- npm run build:web