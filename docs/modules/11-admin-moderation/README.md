# Modulo 11 - Admin Moderation

## Status: CONCLUIDA

## Objetivo

Operar verificacoes, reviews, denuncias (reports), selos e acoes administrativas com fila dedicada, casos de moderacao rastreados e trilha de auditoria.

## Escopo

### Incluido
- Fila de verificacoes pendentes (GET /api/v1/admin/verifications)
- Fila de reviews pendentes de moderacao (GET /api/v1/admin/reviews/pending — consolidado de /me/reviews/pending)
- CRUD de casos de moderacao / denuncias (moderation_cases + moderation_decisions)
- Decisao sobre caso: resolver ou arquivar
- Busca de negocio com dados administrativos (GET /api/v1/admin/businesses/:id)
- Log de auditoria paginado (GET /api/v1/admin/audit-log)
- Interface web admin com filas separadas por tipo

### Fora de escopo
- Suspensao/restauracao de badge (ja coberta pelo Modulo 05 - Trust)
- Aprovacao/rejeicao de reviews (ja coberta pelo Modulo 06 - Reviews)
- Aprovacao/rejeicao de verificacoes (ja coberta pelo Modulo 01 - Auth)
- App mobile (adiado)

## Dependencias
- Modulo 01 (Auth/Verification): listagem de verificacoes pendentes
- Modulo 05 (Trust): suspensao/restauracao de badge
- Modulo 06 (Reviews): moderacao de reviews

## Banco de Dados

### Novos enums
- ModerationCaseStatus: OPEN, UNDER_REVIEW, RESOLVED, DISMISSED
- ModerationCaseType: REPORT_BUSINESS, REPORT_REVIEW, REPORT_USER, FRAUD_SUSPECTED, SPAM, OTHER

### Novas tabelas
- moderation_cases: casos/denuncias com tipo, status, reporter, target
- moderation_decisions: decisoes administrativas sobre cada caso

### Migration aplicada
- 20260417183119_add_admin_moderation

## Contrato de API

### GET /api/v1/admin/verifications
- Auth: admin
- Query: status? (PENDING_REVIEW | MORE_INFO_REQUIRED | APPROVED | REJECTED), page?, limit?
- Response: { data: VerificationRequest[], meta: { total, page, limit } }

### GET /api/v1/admin/reviews/pending
- Auth: admin
- Response: { data: Review[] }
- Obs: endpoint /me/reviews/pending ja existia — adicionado alias em /admin/reviews/pending

### GET /api/v1/admin/reports
- Auth: admin
- Query: status? (OPEN | UNDER_REVIEW | RESOLVED | DISMISSED), page?, limit?
- Response: { data: ModerationCase[], meta: { total, page, limit } }

### POST /api/v1/admin/reports
- Auth: admin ou qualquer usuario autenticado
- Body: { type, targetType, targetId, description }
- Response: 201 { data: ModerationCase }

### POST /api/v1/admin/reports/:id/resolve
- Auth: admin
- Body: { decision: "resolved" | "dismissed", note? }
- Response: { data: ModerationCase }

### GET /api/v1/admin/businesses/:id
- Auth: admin
- Response: { data: BusinessProfile com user, trustScore, reviews pendentes }

### GET /api/v1/admin/audit-log
- Auth: admin
- Query: page?, limit?
- Response: { data: AuditLog[], meta: { total, page, limit } }

## Regras de Negocio
- Qualquer usuario autenticado pode criar um report (denuncia)
- Somente admin pode listar, ver e decidir sobre reports
- Um caso resolvido ou arquivado nao pode ser reaberto via API
- Cada decisao administrativa gera um AuditLog
- GET /admin/businesses/:id retorna dados sensíveis visíveis apenas para admin

## Testes
- Ciclo completo: criar denuncia, listar como admin, resolver, verificar status
- Isolamento: usuario nao-admin nao pode listar ou resolver reports
- Listagem de verificacoes pendentes: retorna somente status filtrado
- Listagem de reviews pendentes: alias funcional

## Interface Web
- /admin/settings: expandida com fila de reports/denuncias
- /auth/admin/reports/route.ts: handler POST para submit de denuncia