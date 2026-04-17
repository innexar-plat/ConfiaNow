# Modulo 10 - Client Dashboard

## Status: CONCLUIDA

## Objetivo

Permitir ao cliente acompanhar contatos, favoritos, historico, reviews pendentes e denuncias abertas em um painel unico.

## Escopo

### Incluido
- dashboard web do cliente em `/dashboard`
- historico consolidado de leads e recontato
- favoritos com add/remove persistido
- lista de reviews pendentes por lead elegivel
- central simples de suporte e denuncia consumindo a infraestrutura do modulo 11
- overview e snapshots do dashboard do cliente

### Fora de escopo
- suporte ticketing completo com SLA proprio
- notificacoes push/mobile
- automacoes de remarketing

## Dependencias
- Modulo 04 - Leads/Contact Requests
- Modulo 06 - Reviews/Reputation
- Modulo 11 - Admin Moderation

## Front

- historico de leads
- favoritos
- avaliacao pendente
- central de suporte e denuncia

## Back

- agregacao do historico do cliente
- favoritos
- fluxo de recontato
- timeline de denuncias abertas

## App

- historico simplificado: adiado
- atalhos para recontato e avaliacao: adiado para fase mobile

## Banco

- client_favorites
- client_dashboard_views
- migration aplicada: `20260417185544_add_client_dashboard`

## Endpoints

### GET /api/v1/client-dashboard/overview
- Auth: client

### GET /api/v1/client-dashboard/favorites
- Auth: client

### POST /api/v1/client-dashboard/favorites/:businessId
- Auth: client

### DELETE /api/v1/client-dashboard/favorites/:businessId
- Auth: client

### GET /api/v1/client-dashboard/history
- Auth: client

### GET /api/v1/client-dashboard/pending-reviews
- Auth: client

## Regras de negocio

- somente usuario `client` autenticado acessa o client dashboard
- favoritos sao unicos por cliente + business
- overview sincroniza snapshot diario do dashboard do cliente
- review pendente depende de lead com contato liberado e ausencia de review finalizada
- denuncias do cliente reutilizam `moderation_cases` do modulo 11

## Testes

- unitario de regras de favoritos e historico
- integracao de favoritos, overview, history e pending-reviews
- validacao web do dashboard do cliente no build
- E2E minimo: aceito como pendencia por ausencia de suite E2E no repo

## Validacao executada

- `npm run test:api`
- `npm run build:api`
- `npm run build:web`