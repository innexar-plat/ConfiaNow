# Modulo 07 - In App Communication

## Status

- pronto para handoff com pendencias aceitas

## Objetivo

Centralizar chat e mensagens entre cliente e negocio com trilha auditavel.

## Fora de escopo nesta primeira entrega real

- envio de binario real (imagem/pdf) para storage externo
- websocket em tempo real (entrega inicial sera polling server-first)
- notificacao push mobile em tempo real
- moderacao automatica com IA e classificacao semantica

## Atores envolvidos

- cliente autenticado participante do lead
- negocio autenticado dono do lead
- administrador autenticado com acesso de leitura e trilha de auditoria

## Fluxos principais desta fase

- criar ou recuperar conversa de um lead elegivel
- enviar mensagem textual entre cliente e negocio dentro da conversa
- listar inbox de conversas por usuario participante
- marcar conversa como lida
- registrar anexo como metadata vinculada a uma mensagem

## Front

- inbox de conversas
- janela de chat
- anexos de imagem e PDF
- indicadores de leitura

## Back

- criacao de conversa por lead
- mensagens e anexos
- regras de liberacao de contato
- moderacao e bloqueio de padroes proibidos
- primeira versao real baseada em conversa vinculada ao lead com participantes fixos, leitura e anexos metadata

## App

- chat mobile
- push de nova mensagem
- anexos por camera e galeria

## Banco

- conversations
- messages
- message_attachments
- conversation_participants

## Modelo de dados desta fase

- `conversations`: conversa de chat vinculada a um lead
- `conversation_participants`: participantes da conversa com marcador de leitura
- `conversation_messages`: mensagens textuais com remetente e timestamps
- `message_attachments`: anexos como metadata (nome, mime, url e tamanho)

## Endpoints

- GET /api/v1/conversations
- POST /api/v1/conversations
- GET /api/v1/conversations/:id/messages
- POST /api/v1/conversations/:id/messages
- POST /api/v1/messages/:id/attachments
- PATCH /api/v1/conversations/:id/read

## Autenticacao e autorizacao por endpoint

- `GET /api/v1/conversations`: usuario autenticado participante
- `POST /api/v1/conversations`: usuario autenticado participante do lead
- `GET /api/v1/conversations/:id/messages`: participante da conversa
- `POST /api/v1/conversations/:id/messages`: participante da conversa
- `POST /api/v1/messages/:id/attachments`: participante da conversa e dono da mensagem
- `PATCH /api/v1/conversations/:id/read`: participante da conversa

## Regras de negocio desta fase

- conversa pertence a um unico lead
- somente cliente do lead e negocio dono do lead participam da conversa
- mensagens com padroes proibidos sao bloqueadas com erro de validacao
- mensagens e anexos ficam auditaveis por actor e timestamp
- marcacao de leitura e por participante

## Testes

- unitario de bloqueio de padroes proibidos
- integracao de envio e leitura de mensagens
- componente de inbox e chat
- E2E de conversa iniciada a partir do lead

## Estrategia de implementacao desta fase

- adicionar entidades de conversa/mensagem/anexo no schema Prisma
- criar pacote compartilhado `@platform/communication` para regras de conversa e chat
- expor endpoints reais no API Fastify para inbox, mensagens, anexos e leitura
- integrar janela de chat no detalhe de lead existente no web

## Implementado nesta fase

- schema Prisma ampliado com `ConversationParticipantRole`, `conversations`, `conversation_participants`, `conversation_messages` e `message_attachments`
- migration aplicada: `20260417180519_add_in_app_communication`
- pacote compartilhado `@platform/communication` com criacao/listagem de conversas, envio de mensagens, anexos metadata, marcacao de leitura e filtro de padroes proibidos
- rotas reais de API para inbox, criacao de conversa por lead, mensagens, anexos e leitura
- integracao web no detalhe do lead com timeline de chat in-app, envio de mensagem e acao de marcar como lida
- handlers server-first no web para mensagens e leitura de conversa por lead
- testes unitarios e de integracao cobrindo bloqueio de padroes proibidos e fluxo de conversa/mensagem/anexo/leitura

## Revisao de completude desta fase

- UI web: completa para a primeira fatia real de comunicacao in-app
- API: completa para a primeira fatia real de comunicacao in-app
- banco: completo para a primeira fatia real de comunicacao in-app
- app mobile: adiado com justificativa; sem implementacao mobile nesta fase
- componentes compartilhados: completo para esta fase com `@platform/communication`
- estados de erro, loading e vazio: parcial-alta
- autorizacao e seguranca: completa para leitura e escrita por participantes da conversa
- testes unitarios e integracao: completos para a primeira fatia
- testes de componente e E2E: pendentes aceitos
- documentacao e handoff: completos nesta entrega

## Pendencias aceitas

- item: websocket/presenca/digitando para chat em tempo real
- impacto: medio
- prioridade: media

- item: upload binario real de anexos com storage seguro e antivirus
- impacto: alto
- prioridade: alta

- item: inbox dedicada e pagina de conversas separada do detalhe de lead
- impacto: medio
- prioridade: media

- item: testes E2E web do fluxo completo de comunicacao in-app
- impacto: medio
- prioridade: media