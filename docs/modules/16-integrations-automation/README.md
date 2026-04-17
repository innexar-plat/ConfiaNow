# Modulo 16 - Integrations Automation

## Status: CONCLUIDA

## Objetivo

Centralizar provedores externos, webhooks, jobs e automacoes internas.

## Atores

- Provedores externos: enviam webhooks de verificacao, email e storage
- Admin: monitora status de integracoes e retenta jobs com falha
- Sistema interno: enfileira automacoes operacionais e housekeeping

## Fluxos principais

1. Provedor externo envia webhook para endpoint dedicado por dominio
2. Sistema valida entrada, registra `integration_events` e cria entrega em `webhook_deliveries`
3. Evento gera job assíncrono em `background_jobs` para processamento interno
4. Falhas de processamento criam itens em `retry_queue` para reprocessamento controlado
5. Admin visualiza saude das integracoes e executa retentativa manual de jobs

## Front

- sem UI publica principal; apenas telas administrativas de status e logs quando necessario
- `/admin/integrations` para status por provedor e fila de jobs
- componente reutilizavel para cards de status de integracao

## Back

- adaptadores de billing, email, SMS, biometria e storage
- processamento de webhooks
- jobs recorrentes e retentativas
- fila de automacao e housekeeping
- package `@platform/integrations` encapsulando dominio de webhooks/jobs

## App

- consumo indireto via notificacoes, autenticacao e status

## Banco

- integration_events
- webhook_deliveries
- background_jobs
- retry_queue

## Regras de negocio

- webhooks usam entrega at-least-once e processamento idempotente por `providerEventId` quando disponivel
- evento recebido nunca e descartado silenciosamente; falhas ficam registradas com status e mensagem de erro
- toda falha de job gera item rastreavel em `retry_queue`
- somente admin autenticado pode consultar status e retentar jobs
- retentativa manual nao recria job duplicado quando job ja estiver em execucao

## Endpoints

- POST /api/v1/webhooks/verification-provider
- POST /api/v1/webhooks/email-provider
- POST /api/v1/webhooks/storage-provider
- GET /api/v1/admin/integrations/status
- GET /api/v1/admin/jobs
- POST /api/v1/admin/jobs/:id/retry

## Contrato de resposta

- webhooks: `200 OK` com `{ data: { accepted: true, eventId } }`
- admin status: `200 OK` com saude por provedor, totais por status e ultima atividade
- admin jobs: `200 OK` com listagem paginada e filtros por status/provedor/tipo
- retry job: `200 OK` com estado atualizado do job e item de retentativa criado
- erros seguem formato padrao do projeto (`type`, `title`, `status`, `detail`, `instance`)

## Testes

- unitario de mapeamento de provedores
- integracao de webhook e retentativa
- componente admin de status de integracao
- E2E tecnico de webhook atualizando estado interno

## Dependencias

- modulo 01 (authentication): autorizacao admin para endpoints de operacao
- modulo 12 (notifications): jobs de notificacao podem ser enfileirados para reprocessamento
- modulo 13 (monetization-billing): reaproveita padrao de eventos para webhooks de cobranca

## Fora de escopo

- integracao real com credenciais de provedores externos em producao
- worker distribuido com broker externo (BullMQ/SQS/Kafka)
- painel de observabilidade em tempo real com streaming
- replay automatico em lote de dead letters