# Modulo 06 - Reviews Reputation

## Status

- pronto para handoff com pendencias aceitas

## Objetivo

Publicar avaliacoes verificadas, moderar prova manual e alimentar reputacao publica.

## Fora de escopo nesta primeira entrega real

- upload binario real de anexos de prova
- avaliacao do cliente pelo negocio
- resposta publica do negocio a review
- reputacao com NLP, fraude avancada ou score temporal sofisticado
- pagina dedicada com timeline completa de moderacao

## Atores envolvidos

- cliente autenticado elegivel para avaliar apos lead com contato liberado
- negocio autenticado que acompanha a reputacao publicada do proprio perfil
- administrador que aprova, rejeita ou solicita mais informacoes na moderacao manual
- visitante publico que visualiza apenas reviews aprovadas

## Fluxos principais desta fase

- cliente elegivel envia review para um negocio com nota, titulo, comentario e referencia opcional de prova textual
- review entra em fila de moderacao manual com status pendente
- administrador aprova, rejeita ou solicita mais informacoes
- apenas reviews aprovadas aparecem no perfil publico do negocio
- reviews aprovadas passam a alimentar a reputacao publica e o trust score do modulo 05

## Front

- lista de avaliacoes do negocio
- formulario de avaliacao
- upload de prova
- estados pendente, aprovada e recusada

## Back

- submissao de avaliacao
- validacao manual
- score de reputacao
- avaliacao do cliente pelo negocio
- primeira versao real baseada em elegibilidade por lead com contato liberado, moderacao manual e publicacao somente apos aprovacao

## App

- avaliacao simplificada com anexos
- retorno de status da validacao manual

## Banco

- reviews
- review_evidence
- review_moderation_queue
- client_ratings

## Modelo de dados desta fase

- `reviews`: review principal com cliente, negocio, lead elegivel, nota, comentario, status e timestamps
- `review_evidence`: evidencias textuais e referencias simples anexadas a uma review
- `review_moderation_queue`: fila operacional de moderacao manual com decisao, nota interna e actor
- `client_ratings`: fora de escopo nesta fase

## Endpoints

- POST /api/v1/reviews
- GET /api/v1/businesses/:id/reviews
- GET /api/v1/me/reviews/pending
- POST /api/v1/reviews/:id/evidence
- POST /api/v1/admin/reviews/:id/approve
- POST /api/v1/admin/reviews/:id/request-more-info
- POST /api/v1/admin/reviews/:id/reject

## Autenticacao e autorizacao por endpoint

- `POST /api/v1/reviews`: cliente autenticado e elegivel
- `GET /api/v1/businesses/:id/reviews`: publico
- `GET /api/v1/me/reviews/pending`: admin autenticado
- `POST /api/v1/reviews/:id/evidence`: cliente dono da review e review pendente
- `POST /api/v1/admin/reviews/:id/approve`: admin autenticado
- `POST /api/v1/admin/reviews/:id/request-more-info`: admin autenticado
- `POST /api/v1/admin/reviews/:id/reject`: admin autenticado

## Regras de negocio desta fase

- apenas cliente com lead do negocio e contato liberado pode avaliar aquele negocio
- uma review por lead elegivel
- review nasce pendente e nao e publica ate aprovacao manual
- apenas reviews aprovadas entram na reputacao publica do negocio
- pedido de mais informacoes devolve a review para ajuste do cliente sem publica-la
- aprovacao de review passa a influenciar o trust score do modulo 05

## Testes

- unitario de elegibilidade da review
- integracao da fila manual de moderacao
- componente de formulario e timeline da review
- E2E de review enviada e aprovada manualmente

## Estrategia de implementacao desta fase

- ampliar schema Prisma com review principal, evidencias textuais e fila de moderacao
- criar camada compartilhada `@platform/reviews` para elegibilidade, submissao, listagem publica e moderacao manual
- integrar reputacao aprovada ao perfil publico do negocio e ao trust scoring do modulo 05
- adicionar formulario inicial de review no detalhe do lead do cliente e lista publica no perfil do negocio
- reutilizar a area admin existente para moderar reviews pendentes na primeira fatia

## Implementado nesta fase

- schema Prisma ampliado com `ReviewStatus`, tabelas `reviews`, `review_evidence` e `review_moderation_queue`
- migration aplicada: `20260417175411_add_reviews_reputation`
- snapshot de trust ampliado com `reputationPoints`, `approvedReviewCount` e `averageRating`
- camada compartilhada `@platform/reviews` com elegibilidade por lead, submissao, evidencia, fila de moderacao e publicacao
- rotas reais de API para submissao de review, evidencias, fila admin e decisoes de moderacao
- pagina de detalhe do lead para cliente enviar review elegivel
- pagina admin de settings ampliada com fila de reviews pendentes e acoes de aprovar, pedir mais informacao e rejeitar
- perfil publico do negocio exibindo reviews aprovadas e resumo de reputacao
- recalculo de trust apos decisao de moderacao para refletir reputacao aprovada
- testes unitarios e de integracao cobrindo elegibilidade, fluxo de moderacao e reflexo no trust score

## Revisao de completude desta fase

- UI web: completa para a primeira fatia real de reviews e moderacao
- API: completa para a primeira fatia real de reviews e moderacao
- banco: completo para a primeira fatia real de reviews e moderacao
- app mobile: adiado com justificativa; sem implementacao mobile nesta fase
- componentes compartilhados: completo para esta fase com `@platform/reviews`
- estados de erro, loading e vazio: parcial-alta
- autorizacao e seguranca: completa para leitura publica, submissao do cliente elegivel e moderacao admin
- testes unitarios e integracao: completos para a primeira fatia
- testes de componente e E2E: pendentes aceitos
- documentacao e handoff: completos nesta entrega

## Pendencias aceitas

- item: endpoint e fluxo de `client-rating` (negocio avaliando cliente)
- impacto: medio
- prioridade: media

- item: upload binario real de evidencias (storage + antivirus + politicas)
- impacto: alto
- prioridade: alta

- item: trilha completa de moderacao com timeline detalhada e historico de reabertura
- impacto: medio
- prioridade: media

- item: testes E2E de ponta a ponta no web para envio e moderacao
- impacto: medio
- prioridade: media