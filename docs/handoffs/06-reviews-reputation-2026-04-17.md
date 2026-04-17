# Handoff - Modulo 06 Reviews Reputation (2026-04-17)

## Resumo da entrega

O modulo 06 foi entregue com a primeira fatia real de reputacao baseada em reviews moderadas. O cliente agora pode enviar review apos lead elegivel com contato liberado, a review entra em fila de moderacao manual e apenas reviews aprovadas sao publicadas no perfil do negocio. A reputacao aprovada foi conectada ao trust score existente do modulo 05.

## O que foi entregue

- modelagem de dados real para reviews, evidencias textuais e fila de moderacao manual
- rotas de API para submissao de review, anexo de evidencia textual e moderacao admin
- camada compartilhada `@platform/reviews` com regras de elegibilidade por lead e fluxo de moderacao
- integracao no web:
  - detalhe de lead do cliente com formulario de review
  - area admin com fila de reviews pendentes e acoes de decisao
  - perfil publico de negocio exibindo resumo e lista de reviews aprovadas
- integracao no trust score:
  - novos campos de reputacao no snapshot (`reputationPoints`, `approvedReviewCount`, `averageRating`)
  - recalculo de trust disparado apos decisao de moderacao

## Endpoints ativos

- POST /api/v1/reviews
- GET /api/v1/businesses/:id/reviews
- GET /api/v1/me/reviews/pending
- POST /api/v1/reviews/:id/evidence
- POST /api/v1/admin/reviews/:id/approve
- POST /api/v1/admin/reviews/:id/request-more-info
- POST /api/v1/admin/reviews/:id/reject

## Entidades e tabelas criadas/alteradas

- novas:
  - `reviews`
  - `review_evidence`
  - `review_moderation_queue`
- alteradas:
  - `trust_scores` com `reputationPoints`, `approvedReviewCount`, `averageRating`
  - relacoes em `users`, `business_profiles` e `leads` para suportar reviews

## Migracao aplicada

- `20260417175411_add_reviews_reputation`

## Regras de negocio ativas

- cliente so pode avaliar se for dono do lead e se houver contato liberado
- uma review por lead elegivel (com reenvio permitido quando status for `more_info_required`)
- review nasce pendente e nao e publica ate aprovacao do admin
- decisoes de moderacao:
  - `approve`: publica review
  - `request-more-info`: devolve para ajuste
  - `reject`: encerra como rejeitada
- apenas reviews aprovadas entram no resumo publico e no componente de reputacao do trust score

## Validacoes executadas

- `npm run db:migrate -- --name add_reviews_reputation` (migration criada e aplicada)
- `npm run test:api` (31 testes passando)
- `npm run build:api` (ok)
- `npm run build:web` (ok)

## Pendencias aceitas

- endpoint e fluxo de `client-rating` (negocio avaliando cliente)
- upload binario real de evidencias
- timeline detalhada de moderacao e reabertura
- testes E2E web completos

## O que o proximo modulo pode assumir como pronto

- infraestrutura de reviews e moderacao manual funcional em banco, API e web
- reputacao aprovada integrada ao trust score e refletida no perfil publico
- base pronta para evoluir antifraude, storage real de anexos e governanca avancada de moderacao
