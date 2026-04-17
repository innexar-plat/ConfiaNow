# Handoff - Modulo 11 - Admin Moderation

## Entregue
- Fila administrativa de verificacoes com listagem paginada e filtro de status
- Alias administrativo para fila de reviews pendentes
- Fluxo completo de denuncias/reports com criacao, listagem e resolucao
- Consulta administrativa de negocio com dados internos e trust score
- Log de auditoria paginado via endpoint dedicado
- Interface web admin expandida com fila de denuncias e decisao operacional

## Endpoints ativos
- GET /api/v1/admin/verifications
- GET /api/v1/admin/reviews/pending
- POST /api/v1/admin/reports
- GET /api/v1/admin/reports
- POST /api/v1/admin/reports/:id/resolve
- GET /api/v1/admin/businesses/:id
- GET /api/v1/admin/audit-log

## Banco / entidades criadas
- Enum ModerationCaseStatus
- Enum ModerationCaseType
- Tabela moderation_cases
- Tabela moderation_decisions
- Relacoes novas em users para reporter e admin decision actor

## Migration aplicada
- 20260417183119_add_admin_moderation

## Regras de negocio ativas
- Qualquer usuario autenticado pode abrir uma denuncia
- Somente admin pode listar e decidir denuncias
- Casos fechados nao podem ser resolvidos novamente
- Cada criacao e resolucao de caso gera audit log
- Visualizacao detalhada de negocio em rota admin exige papel admin
- Fila administrativa de verificacao usa o schema real de verification_requests

## Implementacao
- Package compartilhado: @platform/moderation
- API: apps/api/src/modules/moderation/routes/moderation.ts
- Web: apps/web/src/app/admin/settings/page.tsx
- Handler web: apps/web/src/app/auth/admin/reports/route.ts
- Reset de testes atualizado para limpar moderation_cases e moderation_decisions

## Testes executados
- npm run test:api
- npm run build:api
- npm run build:web

## Resultado da validacao
- test:api: 42 testes, 42 passando
- build:api: OK
- build:web: OK

## Pendencias
- Os modulos 09-provider-dashboard e 10-client-dashboard continuam sem handoff e sem entrega fechada; foram pulados na sequencia anterior e precisam ser retomados como modulos completos
- Falta tela dedicada de busca administrativa mais completa com filtros cruzados por negocio, usuario e caso
- Nao foi implementada reabertura de caso, por estar fora do escopo definido
- Nao ha fluxo web publico para usuarios criarem denuncias fora do painel admin; a API suporta criacao autenticada

## O proximo modulo pode assumir pronto
- Estrutura de moderacao administrativa com casos e decisoes persistidos
- Endpoints admin de verificacao, reports, audit-log e business details operacionais
- UI administrativa basica para operacao manual de denuncias