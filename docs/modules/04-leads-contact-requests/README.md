# Modulo 04 - Leads Contact Requests

## Status

- pronto para handoff com pendencias aceitas

## Fora de escopo nesta primeira entrega real

- anexos binarios no lead
- chat completo em tempo real
- automacoes de notificacao multicanal
- SLA analitico avancado e escalonamento operacional
- lead publico anonimo sem autenticacao

## Atores envolvidos

- cliente autenticado
- negocio autenticado
- visitante publico que chega ate o CTA e precisa autenticar

## Fluxos principais desta fase

- cliente autenticado envia lead a partir da pagina publica do negocio
- negocio autenticado visualiza inbox de leads recebidos
- negocio autenticado atualiza status basico do lead
- cliente autenticado consulta seu historico de leads enviados
- cliente e negocio acessam o detalhe do lead respeitando ownership

## Objetivo

Registrar leads, liberar contato e acompanhar resposta do negocio.

## Front

- formulario de lead
- tela de sucesso de envio
- historico de leads do cliente
- inbox de leads do negocio

## Back

- criacao de lead
- controle de status do lead
- liberacao de canal de contato
- SLA de resposta e eventos de engajamento
- primeira versao real com ownership, historico de status e liberacao simples de contato

## App

- envio de lead com anexos
- notificacao de resposta
- historico de contatos

## Banco

- leads
- lead_messages
- lead_status_history
- lead_contact_releases

## Modelo de dados desta fase

- `leads`: cabecalho do lead com cliente, negocio, resumo da necessidade, status e timestamps operacionais
- `lead_messages`: mensagem inicial do cliente e respostas iniciais do negocio dentro do mesmo lead
- `lead_status_history`: trilha de mudanca de status para auditoria operacional
- `lead_contact_releases`: registro da liberacao de canal de contato apos resposta do negocio

## Endpoints

- POST /api/v1/leads
- GET /api/v1/me/leads
- GET /api/v1/me/leads/inbox
- GET /api/v1/leads/:id
- PATCH /api/v1/leads/:id/status
- POST /api/v1/leads/:id/contact-release

## Autenticacao e autorizacao por endpoint

- `POST /api/v1/leads`: cliente autenticado
- `GET /api/v1/me/leads`: cliente autenticado
- `GET /api/v1/me/leads/inbox`: negocio autenticado
- `GET /api/v1/leads/:id`: cliente ou negocio dono do lead
- `PATCH /api/v1/leads/:id/status`: negocio autenticado dono do lead
- `POST /api/v1/leads/:id/contact-release`: negocio autenticado dono do lead
- `POST /api/v1/leads/:id/attachments`: fora de escopo nesta fase

## Regras de negocio desta fase

- apenas clientes autenticados podem abrir leads
- o lead so pode ser criado para negocio publicado
- cliente nao pode abrir lead para o proprio negocio
- apenas o negocio dono do lead pode responder, mudar status e liberar contato
- a liberacao de contato depende de resposta inicial do negocio ou decisao explicita de liberar contato

## Testes

- unitario de regras de SLA e transicao de status
- integracao de criacao e resposta ao lead
- componente de formulario de lead
- E2E de visitante enviar lead e negocio responder

## Estrategia de implementacao desta fase

- ampliar schema Prisma com tabelas de leads e historico
- criar camada compartilhada `@platform/leads` para regras de criacao, ownership, SLA basico e transicoes
- expor endpoints reais no Fastify para criacao, historico, inbox, detalhe e transicoes
- adicionar CTA funcional na pagina publica do negocio e dashboards iniciais de cliente e negocio

## Implementado nesta fase

- schema Prisma ampliado com `leads`, `lead_messages`, `lead_status_history` e `lead_contact_releases`
- migration aplicada: `20260417170707_add_leads_contact_requests`
- pacote compartilhado `@platform/leads` com criacao, ownership, inbox, historico, SLA e transicoes de status
- endpoints reais no Fastify para criacao, inbox do negocio, historico do cliente, detalhe, resposta e liberacao de contato
- CTA funcional na pagina publica do negocio para cliente autenticado enviar lead
- dashboard do cliente com historico de leads enviados
- dashboard do negocio com inbox de leads e pagina de detalhe com resposta, fechamento e liberacao de contato
- testes unitarios de SLA e transicao e testes de integracao do fluxo real de lead

## Revisao de completude desta fase

- UI web: completa para a primeira fatia real de leads autenticados
- API: completa para a primeira fatia real de leads autenticados
- banco: completo para a primeira fatia real de leads autenticados
- app mobile: adiado com justificativa; sem implementacao mobile nesta fase
- componentes compartilhados: completo para esta fase com `@platform/leads`
- estados de erro, loading e vazio: parcial-alta
- autorizacao e seguranca: completa para ownership de cliente e negocio nas operacoes entregues
- testes unitarios e integracao: completos para a primeira fatia
- testes de componente e E2E: pendentes aceitos
- documentacao e handoff: completos nesta entrega

## Pendencias aceitas

- item: adicionar anexos e fluxo documental no lead
- impacto: medio
- prioridade: media

- item: evoluir para conversa mais completa, notificacoes e automacoes operacionais
- impacto: medio
- prioridade: alta

- item: adicionar testes de componente no web e E2E do funil publico ate o inbox do negocio
- impacto: medio
- prioridade: media

- item: incorporar SLA analitico, alertas e relatorios operacionais
- impacto: medio
- prioridade: media