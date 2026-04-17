# Modulo 05 - Badge Trust Scoring

## Status

- pronto para handoff com pendencias aceitas

## Objetivo

Gerenciar selo, score, categorias Bronze/Prata/Ouro e regras de evolucao ou perda.

## Fora de escopo nesta primeira entrega real

- reputacao baseada em reviews publicados
- penalidades automaticas por denuncias e chargebacks
- renovacao anual automatizada do selo
- SLA operacional multi-janela e score historico por periodo
- pagina publica institucional completa explicando todo o programa de confianca

## Atores envolvidos

- negocio autenticado que acompanha sua situacao de confianca
- visitante publico que visualiza selo e score resumido no discovery e no perfil
- administrador que recalcula, suspende e restaura o selo

## Fluxos principais desta fase

- sistema calcula score de confianca inicial a partir de verificacao, completude do perfil e responsividade de leads
- negocio autenticado consulta seu status atual de badge e pendencias objetivas para evolucao
- visitante publico visualiza badge e score resumido no card e no perfil do negocio
- administrador recalcula score, suspende badge e restaura badge de um negocio

## Front

- badge no card e no perfil
- pagina explicando o selo
- status do selo no painel do negocio

## Back

- calculo de score
- promocao e rebaixamento de categoria
- bloqueio automatico ou manual
- trilha de auditoria do selo
- primeira versao real baseada em verificacao aprovada, completude do perfil publicado e resposta a leads

## App

- visualizacao de badge no perfil
- pendencias do selo para o negocio

## Banco

- trust_scores
- badge_levels
- badge_events
- badge_penalties

## Modelo de dados desta fase

- `badge_levels`: catalogo de niveis Bronze, Prata e Ouro com score minimo, label publica e ordem
- `trust_scores`: snapshot atual do score do negocio, badge atual, status de suspensao, motivos e componentes do calculo
- `badge_events`: historico de recalculo, promocao, rebaixamento, suspensao e restauracao
- `badge_penalties`: penalidades manuais simples aplicadas pelo admin para reduzir score ou suspender badge

## Endpoints

- GET /api/v1/trust/badges
- GET /api/v1/businesses/:id/trust-score
- GET /api/v1/me/badge-status
- POST /api/v1/admin/trust/recalculate/:businessId
- POST /api/v1/admin/trust/suspend/:businessId
- POST /api/v1/admin/trust/restore/:businessId

## Autenticacao e autorizacao por endpoint

- `GET /api/v1/trust/badges`: publico
- `GET /api/v1/businesses/:id/trust-score`: publico
- `GET /api/v1/me/badge-status`: negocio autenticado
- `POST /api/v1/admin/trust/recalculate/:businessId`: admin autenticado
- `POST /api/v1/admin/trust/suspend/:businessId`: admin autenticado
- `POST /api/v1/admin/trust/restore/:businessId`: admin autenticado

## Regras de negocio desta fase

- apenas negocios com perfil publicado entram no programa de badge publico
- verificacao aprovada aumenta fortemente o score de confianca
- completude do perfil, servicos, portfolio e resposta a leads influenciam o score inicial
- badge pode ser `none`, `bronze`, `silver` ou `gold` conforme thresholds configurados
- suspensao manual remove o badge publico ate restauracao explicita
- todo recalculo, promocao, rebaixamento, suspensao e restauracao gera evento auditavel

## Testes

- unitario de score e thresholds Bronze/Prata/Ouro
- integracao de recalculo e perda de selo
- componente de explicacao do selo
- E2E de rebaixamento apos evento procedente

## Estrategia de implementacao desta fase

- ampliar schema Prisma com niveis, snapshots e eventos de trust scoring
- criar camada compartilhada `@platform/trust` para score, thresholds, consulta publica, consulta do negocio e acoes admin
- sincronizar trust score com o indice publico de discovery e com o perfil publico do negocio
- adicionar badge no card de discovery, no perfil publico e no dashboard do negocio
- expor endpoints reais de consulta publica, consulta autenticada e operacao admin

## Implementado nesta fase

- schema Prisma ampliado com `badge_levels`, `trust_scores`, `badge_events` e `badge_penalties`
- migration aplicada: `20260417173748_add_badge_trust_scoring`
- pacote compartilhado `@platform/trust` com calculo de score, thresholds, consulta publica, status do negocio e operacoes admin
- sincronizacao do trust score com o indice publico de discovery e com o perfil publico do negocio
- endpoints reais para leitura publica dos niveis e score, leitura autenticada do negocio e operacoes admin de recalculo, suspensao e restauracao
- pagina publica `/trust/badges` com explicacao do programa de selo
- badge e trust score exibidos na home, na pagina de categoria e no perfil publico do negocio
- dashboard do negocio com status do selo, breakdown do score e pendencias objetivas
- area admin com operacoes manuais de trust para negocios publicados
- testes unitarios de thresholds e score de resposta e testes de integracao de consulta, suspensao e restauracao

## Revisao de completude desta fase

- UI web: completa para a primeira fatia real de selo e confianca
- API: completa para a primeira fatia real de selo e confianca
- banco: completo para a primeira fatia real de selo e confianca
- app mobile: adiado com justificativa; sem implementacao mobile nesta fase
- componentes compartilhados: completo para esta fase com `@platform/trust`
- estados de erro, loading e vazio: parcial-alta
- autorizacao e seguranca: completa para consulta publica, leitura do negocio e operacao admin entregues
- testes unitarios e integracao: completos para a primeira fatia
- testes de componente e E2E: pendentes aceitos
- documentacao e handoff: completos nesta entrega

## Pendencias aceitas

- item: conectar reputacao real de reviews e moderacao ao trust score
- impacto: alto
- prioridade: alta

- item: expor penalidades manuais completas e trilha de eventos no web admin
- impacto: medio
- prioridade: media

- item: adicionar testes de componente do web e E2E do badge publico e operacao admin
- impacto: medio
- prioridade: media

- item: evoluir regras de trust com janelas temporais, renovacao e score historico
- impacto: medio
- prioridade: media