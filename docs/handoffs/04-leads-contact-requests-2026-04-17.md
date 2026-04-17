# Modulo

- nome: 04-leads-contact-requests
- status: pronto para abrir o modulo 05 com pendencias aceitas
- data: 2026-04-17

## Entregas realizadas

- front: CTA funcional na pagina publica do negocio, historico de leads do cliente, inbox do negocio e pagina de detalhe com acoes operacionais
- back: endpoints reais para criar lead, listar historico do cliente, listar inbox do negocio, consultar detalhe, responder e liberar contato
- app: impacto documentado; sem implementacao mobile nesta fase
- banco: Prisma + PostgreSQL ampliados com `leads`, `lead_messages`, `lead_status_history` e `lead_contact_releases`
- testes: unitario de SLA e transicao de status, integracoes reais de criacao, inbox, resposta e liberacao de contato

## Revisao final de completude

- UI web completa: sim para a primeira entrega real do modulo
- API completa: sim para a primeira entrega real do modulo
- banco completo: sim para a primeira entrega real do modulo
- app completo ou adiado com justificativa: adiado com justificativa
- testes minimos completos: sim
- documentacao completa: sim

## Endpoints entregues

- POST /api/v1/leads
- GET /api/v1/me/leads
- GET /api/v1/me/leads/inbox
- GET /api/v1/leads/:id
- PATCH /api/v1/leads/:id/status
- POST /api/v1/leads/:id/contact-release

## Entidades e tabelas

- leads: cabecalho do lead com cliente, negocio, resumo da demanda, status e timestamps operacionais
- lead_messages: mensagem inicial do cliente e resposta inicial do negocio dentro do lead
- lead_status_history: trilha operacional de mudancas de status para auditoria e leitura de contexto
- lead_contact_releases: registro da liberacao de contato do cliente apos resposta do negocio

## Componentes reutilizaveis criados

- `@platform/leads`: regras compartilhadas de criacao, ownership, inbox, historico, detalhe, SLA e transicoes
- rotas server-first de leads no web: base para evolucao do funil publico e do workspace autenticado
- paginas `dashboard/leads`, `dashboard/leads/inbox` e `dashboard/leads/[id]`: base para CRM operacional inicial

## Regras de negocio ativas

- apenas clientes autenticados podem abrir leads
- o lead so pode ser criado para negocio publicado
- cliente nao pode abrir lead para o proprio negocio
- apenas o negocio dono do lead pode responder, fechar e liberar contato
- cliente e negocio so acessam detalhes do lead quando sao donos daquele lead
- a liberacao de contato fica registrada com snapshot simples de e-mail e telefone
- SLA inicial considera lead atrasado quando fica aberto sem resposta por mais de 24 horas

## Dependencias resolvidas

- captura de demanda autenticada a partir do perfil publico: resolvida com CTA server-first e pacote compartilhado
- ownership de cliente e negocio no mesmo lead: resolvida com regras no `@platform/leads` e endpoints protegidos
- historico operacional basico: resolvido com mensagens, status history e contato liberado persistidos
- migration obrigatoria do modulo: resolvida com `20260417170707_add_leads_contact_requests`

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

## Riscos remanescentes

- risco: o fluxo ainda depende de autenticacao previa e nao captura visitante anonimo no funil publico
- mitigacao: abrir etapa futura com pre-lead anonimo e conversao posterior autenticada

- risco: a comunicacao do lead ainda e curta e nao cobre conversa estruturada ou anexos
- mitigacao: evoluir para thread operacional e anexos no modulo seguinte de relacionamento

- risco: ainda nao existe notificacao ativa quando o negocio responde ou libera contato
- mitigacao: conectar modulo futuro de notificacoes e automacoes ao evento de lead

## O que o proximo modulo pode assumir como pronto

- existe criacao real de lead autenticado a partir da pagina publica do negocio
- existe inbox do negocio e historico do cliente em cima dos leads persistidos
- existe detalhe do lead com mensagens iniciais, historico de status e contato liberado
- existe regra de ownership entre cliente e negocio para leitura e operacao do lead
- existe base persistida pronta para reputacao, notificacoes ou relacionamento operacional avancado

## Leitura obrigatoria para o proximo modulo

- `blueprint-plataforma-local.md`
- `docs/01-foundation/construction-method.md`
- `docs/01-foundation/module-delivery-checklist.md`
- `docs/01-foundation/module-handoff-template.md`
- `docs/modules/05-badge-trust-scoring/README.md`
- `docs/handoffs/04-leads-contact-requests-2026-04-17.md`