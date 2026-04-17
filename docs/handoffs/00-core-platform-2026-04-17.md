# Modulo

- nome: 00-core-platform
- status: pronto para abrir o modulo 01 com pendencias aceitas do core
- data: 2026-04-17

## Entregas realizadas

- front: home com branding configuravel, signin demo, dashboard protegido, banner de consentimento, area administrativa demo e pacote UI inicial com `Surface`, `Eyebrow`, `InfoCard` e `Pill`
- back: health checks, config publica, contexto de autenticacao demo por header, endpoint de usuario atual, endpoint de permissoes, settings administrativos e audit logs mockados
- app: apenas impacto documentado; nenhuma entrega mobile implementada nesta fase
- banco: apenas definicao documental das entidades alvo do core; sem schema Prisma e sem migracoes ainda
- testes: testes de API para config publica, autenticacao basica, settings administrativos e autorizacao de audit logs

## Revisao final de completude

- UI web completa: parcial
- API completa: parcial
- banco completo: nao
- app completo ou adiado com justificativa: adiado com justificativa
- testes minimos completos: parcial
- documentacao completa: sim

## Endpoints entregues

- GET /api/v1/health/live
- GET /api/v1/health/ready
- GET /api/v1/config/public
- GET /api/v1/me
- GET /api/v1/me/permissions
- GET /api/v1/admin/settings
- PATCH /api/v1/admin/settings
- GET /api/v1/admin/audit-logs

## Entidades e tabelas

- users: identidade do usuario e base da autenticacao futura
- roles: papeis de acesso globais
- permissions: permissoes finas por acao
- user_roles: associacao entre usuarios e papeis
- settings: configuracoes operacionais da plataforma
- feature_flags: liberacao gradual de capacidades
- audit_logs: rastreabilidade de acoes criticas

## Componentes reutilizaveis criados

- `packages/ui/src/index.tsx#Surface`: base de superficie visual para blocos e paineis
- `packages/ui/src/index.tsx#Eyebrow`: rotulo superior reutilizavel para secoes
- `packages/ui/src/index.tsx#InfoCard`: card simples para listas e capacidades
- `packages/ui/src/index.tsx#Pill`: badge simples para estados compactos
- `apps/web/src/components/consent-banner.tsx`: banner inicial de consentimento reaproveitavel enquanto a camada legal completa nao existe

## Regras de negocio ativas

- apenas `client`, `business` e `admin` podem abrir sessao demo
- rotas protegidas do web redirecionam para `/signin` quando nao existe sessao demo valida
- apenas `admin` acessa settings administrativos e audit logs
- `guest` nao recebe contexto de usuario nem permissoes na API
- atualizacao de settings administrativos gera registro de auditoria em memoria

## Dependencias resolvidas

- configuracao de nome e branding indefinido da plataforma: centralizada em `packages/config`
- necessidade de interface reaproveitavel minima: resolvida com `@platform/ui`
- necessidade de guardar fluxo protegido antes do modulo de autenticacao real: resolvida com cookie demo `httpOnly` e helper server-side
- necessidade de testar o core backend sem subir servidor real: resolvida com `createApp()` e `app.inject()`

## Pendencias aceitas

- item: substituir contexto demo por autenticacao real
- impacto: alto
- prioridade: alta

- item: implementar persistencia real com Prisma/PostgreSQL para users, roles, permissions, settings, feature flags e audit logs
- impacto: alto
- prioridade: alta

- item: conectar tela admin do web aos endpoints reais de settings e audit logs
- impacto: medio
- prioridade: alta

- item: adicionar testes de componente do web e E2E minimo do fluxo protegido
- impacto: medio
- prioridade: media

- item: implementar estados dedicados de erro/loading/vazio quando a UI passar a consumir dados reais
- impacto: medio
- prioridade: media

## Riscos remanescentes

- risco: o core ainda usa estado em memoria e nao representa comportamento multi-instancia
- mitigacao: modulo 01 deve introduzir persistencia e estrategia real de sessao

- risco: o fluxo demo pode mascarar lacunas de autorizacao ate a entrada da autenticacao real
- mitigacao: manter escopo do demo restrito e migrar guards para token/session real no proximo modulo

- risco: sem E2E ainda, regressao de navegacao protegida pode passar despercebida
- mitigacao: criar fluxo E2E minimo assim que a autenticacao real estiver definida

## O que o proximo modulo pode assumir como pronto

- existe uma base web publica com branding centralizado
- existe uma estrutura inicial de componentes UI compartilhados
- existe um helper server-side para proteger rotas no App Router
- existem endpoints base do core versionados em `/api/v1`
- existe uma separacao inicial entre area publica, dashboard protegido e area administrativa
- existe uma base documental e de handoff atualizada para continuar o produto modulo a modulo

## Leitura obrigatoria para o proximo modulo

- `blueprint-plataforma-local.md`
- `docs/01-foundation/construction-method.md`
- `docs/01-foundation/module-delivery-checklist.md`
- `docs/01-foundation/module-handoff-template.md`
- `docs/modules/01-authentication-verification/README.md`
- `docs/handoffs/00-core-platform-2026-04-17.md`