# Modulo

- nome: 05-badge-trust-scoring
- status: pronto para abrir o modulo 06 com pendencias aceitas
- data: 2026-04-17

## Entregas realizadas

- front: badge visivel no discovery, categoria e perfil publico, pagina publica explicando o selo, status do selo no dashboard do negocio e controles admin basicos em settings
- back: endpoints reais para niveis de badge, score publico, status do negocio, recalculo, suspensao e restauracao
- app: impacto documentado; sem implementacao mobile nesta fase
- banco: Prisma + PostgreSQL ampliados com `badge_levels`, `trust_scores`, `badge_events` e `badge_penalties`, alem de snapshot no `business_search_index`
- testes: unitario de thresholds e score de resposta, integracoes reais de consulta publica, leitura autenticada e operacoes admin de trust

## Revisao final de completude

- UI web completa: sim para a primeira entrega real do modulo
- API completa: sim para a primeira entrega real do modulo
- banco completo: sim para a primeira entrega real do modulo
- app completo ou adiado com justificativa: adiado com justificativa
- testes minimos completos: sim
- documentacao completa: sim

## Endpoints entregues

- GET /api/v1/trust/badges
- GET /api/v1/businesses/:id/trust-score
- GET /api/v1/me/badge-status
- POST /api/v1/admin/trust/recalculate/:businessId
- POST /api/v1/admin/trust/suspend/:businessId
- POST /api/v1/admin/trust/restore/:businessId

## Entidades e tabelas

- badge_levels: catalogo de niveis de selo com threshold e ordem de exibicao
- trust_scores: snapshot consolidado do score, badge atual, status de suspensao e componentes do calculo
- badge_events: historico de recalculo, promocao, rebaixamento, suspensao e restauracao
- badge_penalties: penalidades administrativas simples para reduzir score ou bloquear selo
- business_search_index.trustScore e business_search_index.trustBadge: snapshot publico para discovery

## Componentes reutilizaveis criados

- `@platform/trust`: regras compartilhadas de thresholds, score, consulta publica, status do negocio e operacoes admin
- pagina `trust/badges`: base institucional do programa de confianca
- widgets de selo no discovery, categoria, perfil publico e dashboard do negocio

## Regras de negocio ativas

- apenas negocios publicados entram no programa de selo publico
- verificacao aprovada pesa fortemente no score inicial de confianca
- completude do perfil, servicos, portfolio e resposta a leads influenciam o score
- badge publico pode ser `none`, `bronze`, `silver` ou `gold`
- suspensao manual remove o selo publico ate restauracao explicita
- toda mudanca operacional de trust gera evento persistido

## Dependencias resolvidas

- necessidade de selo publico sem depender ainda de reviews: resolvida com score inicial baseado em verificacao, completude e leads
- integracao do selo com discovery e perfil publico: resolvida por snapshot no `business_search_index` e consulta no perfil
- operacao inicial de admin: resolvida com endpoints e formulario server-first em admin settings
- migration obrigatoria do modulo: resolvida com `20260417173748_add_badge_trust_scoring`

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

## Riscos remanescentes

- risco: o score atual ainda nao considera reviews moderados nem denuncias procedentes
- mitigacao: conectar o modulo 06 de reputacao e o modulo 11 de moderacao aos componentes do trust

- risco: penalidades existem no banco mas ainda nao possuem fluxo completo de gestao no web admin
- mitigacao: abrir a proxima fatia admin de trust quando a operacao manual pedir mais granularidade

- risco: a explicacao publica do selo ainda e objetiva e nao cobre todas as regras historicas do programa
- mitigacao: expandir conteudo institucional quando o produto estabilizar os pesos e a politica do selo

## O que o proximo modulo pode assumir como pronto

- existe selo publico inicial baseado em verificacao, completude e resposta a leads
- existe snapshot persistido do trust score pronto para enriquecer discovery e perfil publico
- existe dashboard do negocio com leitura do status do selo e pendencias objetivas
- existe operacao admin basica para recalcular, suspender e restaurar trust
- existe camada compartilhada pronta para receber reviews e reputacao como proxima fonte de score

## Leitura obrigatoria para o proximo modulo

- `blueprint-plataforma-local.md`
- `docs/01-foundation/construction-method.md`
- `docs/01-foundation/module-delivery-checklist.md`
- `docs/01-foundation/module-handoff-template.md`
- `docs/modules/06-reviews-reputation/README.md`
- `docs/handoffs/05-badge-trust-scoring-2026-04-17.md`