# Handoff - Modulo 07 In App Communication (2026-04-17)

## Resumo da entrega

O modulo 07 foi entregue com a primeira fatia real de comunicacao in-app vinculada ao lead. Cliente e negocio agora conseguem criar/recuperar conversa por lead, enviar mensagens no chat, anexar metadata de arquivo na mensagem e marcar conversa como lida. O fluxo foi integrado no detalhe do lead e protegido por regras de participacao.

## O que foi entregue

- modelagem de dados real para conversas, participantes, mensagens e anexos metadata
- pacote compartilhado `@platform/communication` com regras de negocio de conversa por lead
- filtro de padroes proibidos em mensagem (bloqueio de conteudo sensivel)
- API real com endpoints para inbox, conversa, mensagens, anexos e leitura
- integracao no web no detalhe do lead com timeline de chat, envio e marcacao de leitura
- handlers server-first para enviar mensagem e marcar conversa como lida

## Endpoints ativos

- GET /api/v1/conversations
- POST /api/v1/conversations
- GET /api/v1/conversations/:id/messages
- POST /api/v1/conversations/:id/messages
- POST /api/v1/messages/:id/attachments
- PATCH /api/v1/conversations/:id/read

## Entidades e tabelas criadas/alteradas

- novas:
  - `conversations`
  - `conversation_participants`
  - `conversation_messages`
  - `message_attachments`
- alteradas:
  - relacoes em `users` e `leads` para suportar comunicacao in-app por conversa vinculada a lead

## Migracao aplicada

- `20260417180519_add_in_app_communication`

## Regras de negocio ativas

- conversa pertence a um unico lead
- somente cliente do lead e negocio dono do lead participam da conversa
- mensagens com padroes proibidos sao rejeitadas
- anexos metadata so podem ser cadastrados pelo dono da mensagem
- marcacao de leitura e registrada por participante

## Validacoes executadas

- `npm run db:migrate -- --name add_in_app_communication` (migration criada e aplicada)
- `npm run test:api` (34 testes passando)
- `npm run build:api` (ok)
- `npm run build:web` (ok)

## Pendencias aceitas

- websocket/presenca/digitando para chat em tempo real
- upload binario real de anexos com storage seguro
- inbox dedicada e pagina de conversas separada do detalhe de lead
- testes E2E web completos para comunicacao in-app

## O que o proximo modulo pode assumir como pronto

- infraestrutura de conversas por lead funcional no banco, API e web
- regra de participacao e leitura aplicada por usuario autenticado
- base pronta para evoluir notificacoes em tempo real e anexos binarios seguros
